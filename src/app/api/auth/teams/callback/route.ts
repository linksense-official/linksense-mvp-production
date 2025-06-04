import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Microsoft Teams OAuth認証コールバック処理
 * 
 * Microsoft Graph APIとの統合を処理し、認証情報を安全に保存します。
 * Teams会議・チャット分析機能との連携を提供。
 */

interface TeamsTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  refresh_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface TeamsUserInfo {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail?: string;
  companyName?: string;
  department?: string;
  jobTitle?: string;
  officeLocation?: string;
}

const TEAMS_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID; // Microsoft Teams は Azure AD を使用
const TEAMS_CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET;
const TEAMS_TENANT_ID = process.env.AZURE_AD_TENANT_ID;

// Redirect URI生成（統合ページ対応）
const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/teams/callback`;
};

export async function GET(request: NextRequest) {
  console.log('🔄 Microsoft Teams OAuth コールバック処理開始');
  
  try {
    // セッション確認
    const session = await getServerSession();
    if (!session?.user?.id) {
      console.error('❌ 未認証ユーザーのアクセス');
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    // URLパラメータ取得
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('📋 Teamsコールバックパラメータ:', { 
      code: code ? '取得済み' : '未取得', 
      state, 
      error,
      errorDescription 
    });

    // エラーハンドリング
    if (error) {
      console.error('❌ Microsoft Teams OAuth エラー:', error, errorDescription);
      const errorMessage = encodeURIComponent(`Teams認証エラー: ${errorDescription || error}`);
      return NextResponse.redirect(
        new URL(`/integrations?error=${errorMessage}`, request.url)
      );
    }

    if (!code) {
      console.error('❌ 認証コードが見つかりません');
      return NextResponse.redirect(
        new URL('/integrations?error=missing_code', request.url)
      );
    }

    if (!TEAMS_CLIENT_ID || !TEAMS_CLIENT_SECRET || !TEAMS_TENANT_ID) {
      console.error('❌ Microsoft Teams環境変数が設定されていません');
      return NextResponse.redirect(
        new URL('/integrations?error=config_missing', request.url)
      );
    }

    // アクセストークン取得
    console.log('🔑 Microsoft Teams アクセストークン取得開始');
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.access_token) {
      console.error('❌ Teamsアクセストークン取得失敗:', tokenResponse.error);
      return NextResponse.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      );
    }

    console.log('✅ Teamsアクセストークン取得成功');

    // ユーザー情報取得
    console.log('👤 Teams ユーザー情報取得開始');
    const userInfo = await getUserInfo(tokenResponse.access_token);
    
    if (!userInfo) {
      console.error('❌ Teamsユーザー情報取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=user_info_failed', request.url)
      );
    }

    console.log('✅ Teamsユーザー情報取得成功:', {
      displayName: userInfo.displayName,
      userPrincipalName: userInfo.userPrincipalName,
      companyName: userInfo.companyName
    });

    // データベース保存
    console.log('💾 Teams統合情報をデータベースに保存開始');
    
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: session.user.id,
          service: 'microsoft-teams'
        }
      },
      update: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: userInfo.companyName || 'unknown',
        teamName: userInfo.companyName || userInfo.userPrincipalName.split('@')[1] || 'Unknown Organization',
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        service: 'microsoft-teams',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: userInfo.companyName || 'unknown',
        teamName: userInfo.companyName || userInfo.userPrincipalName.split('@')[1] || 'Unknown Organization'
      }
    });

    console.log('✅ Teams統合情報保存完了');

    // 成功時のリダイレクト
    const successUrl = new URL('/integrations', request.url);
    successUrl.searchParams.set('success', 'teams_connected');
    successUrl.searchParams.set('service', 'Microsoft Teams');
    successUrl.searchParams.set('user', userInfo.displayName);
    successUrl.searchParams.set('organization', userInfo.companyName || 'Unknown Organization');

    console.log('🎉 Microsoft Teams OAuth認証完了 - 統合ページにリダイレクト');
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('❌ Microsoft Teams OAuth処理中にエラー:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Microsoft Teams統合処理中に予期しないエラーが発生しました';
    
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}

async function exchangeCodeForToken(code: string): Promise<TeamsTokenResponse> {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('🔄 Microsoft Graph Token exchange開始:', { redirectUri });
    
    // Microsoft Graph OAuth 2.0 エンドポイント
    const tokenUrl = `https://login.microsoftonline.com/${TEAMS_TENANT_ID}/oauth2/v2.0/token`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: TEAMS_CLIENT_ID!,
        client_secret: TEAMS_CLIENT_SECRET!,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'User.Read Team.ReadBasic.All Chat.Read OnlineMeetings.Read Presence.Read ChannelMessage.Read.All TeamMember.Read.All'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: TeamsTokenResponse = await response.json();
    
    console.log('📋 Microsoft Graph Token exchange レスポンス:', { 
      success: !!data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope,
      error: data.error,
      error_description: data.error_description
    });
    
    if (data.error) {
      console.error('❌ Microsoft Graph Token exchange エラー:', data.error, data.error_description);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Microsoft Graph Token exchange エラー:', error);
    return { 
      error: error instanceof Error ? error.message : 'token_exchange_failed' 
    };
  }
}

async function getUserInfo(accessToken: string): Promise<TeamsUserInfo | null> {
  try {
    console.log('🔄 Microsoft Graph ユーザー情報取得開始');
    
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const userInfo: TeamsUserInfo = await response.json();
    
    console.log('📋 Microsoft Graph ユーザー情報レスポンス:', {
      displayName: userInfo.displayName,
      userPrincipalName: userInfo.userPrincipalName,
      companyName: userInfo.companyName,
      department: userInfo.department,
      jobTitle: userInfo.jobTitle
    });
    
    return userInfo;
  } catch (error) {
    console.error('❌ Microsoft Graph ユーザー情報取得エラー:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  // POST メソッドでも同様の処理をサポート
  return GET(request);
}