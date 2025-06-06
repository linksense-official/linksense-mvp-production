import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

// Prismaクライアント初期化
const prisma = new PrismaClient();

/**
 * LINE WORKS OAuth認証コールバック処理（修正版）
 * 
 * LINE WORKS APIとの統合を処理し、認証情報を安全に保存します。
 * LINEスタイルビジネスコミュニケーション分析機能との連携を提供。
 */

interface LineWorksTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface LineWorksUserInfo {
  userId: string;
  displayName: string;
  email: string;
  mobile?: string;
  telephone?: string;
  department?: string;
  position?: string;
  domainId: string;
  locale?: string;
  timezone?: string;
  employeeNumber?: string;
  statusMessage?: string;
  avatarUrl?: string;
}

interface LineWorksOrgInfo {
  domainId: string;
  domainName: string;
  companyName: string;
  countryCode?: string;
  language?: string;
  timezone?: string;
  contractType?: string;
  userCount?: number;
}

const LINE_WORKS_CLIENT_ID = process.env.LINE_WORKS_CLIENT_ID;
const LINE_WORKS_CLIENT_SECRET = process.env.LINE_WORKS_CLIENT_SECRET;

// Redirect URI生成（統合ページ対応）
const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/line-works/callback`;
};

export async function GET(request: NextRequest) {
  console.log('🔄 LINE WORKS OAuth コールバック処理開始');
  
  try {
    // セッション確認（修正版）
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('❌ 未認証ユーザーのアクセス');
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    // ユーザー情報をデータベースから取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.error('❌ ユーザーがデータベースに存在しません');
      return NextResponse.redirect(new URL('/login?error=user_not_found', request.url));
    }

    // URLパラメータ取得
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('📋 LINE WORKSコールバックパラメータ:', { 
      code: code ? '取得済み' : '未取得', 
      state, 
      error,
      errorDescription 
    });

    // エラーハンドリング
    if (error) {
      console.error('❌ LINE WORKS OAuth エラー:', error, errorDescription);
      const errorMessage = encodeURIComponent(`LINE WORKS認証エラー: ${errorDescription || error}`);
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

    if (!LINE_WORKS_CLIENT_ID || !LINE_WORKS_CLIENT_SECRET) {
      console.error('❌ LINE WORKS環境変数が設定されていません');
      return NextResponse.redirect(
        new URL('/integrations?error=config_missing', request.url)
      );
    }

    // State検証（セキュリティ強化）
    const storedState = request.cookies.get('line_works_oauth_state')?.value;
    if (state && (!storedState || storedState !== state)) {
      console.error('❌ State検証失敗:', { stored: storedState, received: state });
      return NextResponse.redirect(
        new URL('/integrations?error=state_verification_failed', request.url)
      );
    }

    // アクセストークン取得
    console.log('🔑 LINE WORKS アクセストークン取得開始');
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.access_token) {
      console.error('❌ LINE WORKSアクセストークン取得失敗:', tokenResponse.error);
      return NextResponse.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      );
    }

    console.log('✅ LINE WORKSアクセストークン取得成功');

     // ユーザー情報取得（修正版）
    console.log('👤 LINE WORKS ユーザー情報取得開始');
    const userInfo = await getUserInfo(tokenResponse.access_token);
    
    if (!userInfo) {
      console.error('❌ LINE WORKSユーザー情報取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=user_info_failed&message=' + encodeURIComponent('LINE WORKSユーザー情報の取得に失敗しました。スコープ設定を確認してください。'), request.url)
      );
    }

    // 組織情報取得
    console.log('🏢 LINE WORKS 組織情報取得開始');
    const orgInfo = await getOrganizationInfo(tokenResponse.access_token);

    console.log('✅ LINE WORKSユーザー・組織情報取得成功:', {
      displayName: userInfo.displayName,
      userId: userInfo.userId,
      department: userInfo.department,
      domainName: orgInfo?.domainName,
      companyName: orgInfo?.companyName
    });

      // データベース保存（修正版）
       console.log('💾 LINE WORKS統合情報をデータベースに保存開始');
    
    // 安全な型変換
    const teamId = orgInfo?.domainId || userInfo.domainId;
    const safeTeamId = teamId ? String(teamId) : null;
    const teamName = orgInfo?.companyName || orgInfo?.domainName || userInfo.displayName || 'LINE WORKS Organization';
    
    console.log('📋 保存データ確認:', {
      userId: user.id,
      service: 'line-works',
      teamId: safeTeamId,
      teamName: teamName,
      hasAccessToken: !!tokenResponse.access_token
    });
    
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: user.id,
          service: 'line-works'
        }
      },
      update: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: safeTeamId, // 安全に変換されたteamId
        teamName: teamName,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        service: 'line-works',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: safeTeamId, // 安全に変換されたteamId
        teamName: teamName,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ LINE WORKS統合情報保存完了');

    // 成功時のリダイレクト（ダッシュボードに統合）
    const successUrl = new URL('/dashboard', request.url);
    successUrl.searchParams.set('success', 'true');
    successUrl.searchParams.set('service', 'line-works');
    successUrl.searchParams.set('user', userInfo.displayName || userInfo.userId);
    successUrl.searchParams.set('organization', orgInfo?.companyName || orgInfo?.domainName || 'Unknown Organization');

    // OAuth state cookie削除
    const response = NextResponse.redirect(successUrl);
    response.cookies.delete('line_works_oauth_state');

    console.log('🎉 LINE WORKS OAuth認証完了 - ダッシュボードにリダイレクト');
    return response;

  } catch (error) {
    console.error('❌ LINE WORKS OAuth処理中にエラー:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'LINE WORKS統合処理中に予期しないエラーが発生しました';
    
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}

async function exchangeCodeForToken(code: string): Promise<LineWorksTokenResponse> {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('🔄 LINE WORKS Token exchange開始:', { redirectUri });
    
    const response = await fetch('https://auth.worksmobile.com/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: LINE_WORKS_CLIENT_ID!,
        client_secret: LINE_WORKS_CLIENT_SECRET!,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ LINE WORKS Token exchange HTTP エラー:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: LineWorksTokenResponse = await response.json();
    
    console.log('📋 LINE WORKS Token exchange レスポンス:', { 
      success: !!data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope,
      error: data.error,
      error_description: data.error_description
    });
    
    if (data.error) {
      console.error('❌ LINE WORKS Token exchange エラー:', data.error, data.error_description);
    }
    
    return data;
  } catch (error) {
    console.error('❌ LINE WORKS Token exchange エラー:', error);
    return { 
      error: error instanceof Error ? error.message : 'token_exchange_failed' 
    };
  }
}

async function getUserInfo(accessToken: string): Promise<LineWorksUserInfo | null> {
  try {
    console.log('🔄 LINE WORKS ユーザー情報取得開始');
    
    const response = await fetch('https://www.worksapis.com/v1.0/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ LINE WORKS ユーザー情報取得 HTTP エラー:', response.status, errorText);
      
      // より詳細なエラー情報
      if (response.status === 401) {
        throw new Error('認証エラー: アクセストークンが無効または期限切れです');
      } else if (response.status === 403) {
        throw new Error('権限エラー: user:read スコープが不足している可能性があります');
      } else if (response.status === 404) {
        throw new Error('APIエンドポイントが見つかりません');
      } else {
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
    }

    const userInfo: LineWorksUserInfo = await response.json();
    
    // 必須フィールドの検証
    if (!userInfo.userId || !userInfo.domainId) {
      throw new Error('ユーザー情報の必須フィールド（userId, domainId）が不足しています');
    }
    
    console.log('📋 LINE WORKS ユーザー情報レスポンス:', {
      userId: userInfo.userId,
      displayName: userInfo.displayName,
      email: userInfo.email,
      department: userInfo.department,
      position: userInfo.position,
      domainId: userInfo.domainId
    });
    
    return userInfo;
  } catch (error) {
    console.error('❌ LINE WORKS ユーザー情報取得エラー:', error);
    return null; // ✅ 修正: nullを返して上位で処理
  }
}

async function getOrganizationInfo(accessToken: string): Promise<LineWorksOrgInfo | null> {
  try {
    console.log('🔄 LINE WORKS 組織情報取得開始');
    
    const response = await fetch('https://www.worksapis.com/v1.0/domains/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('⚠️ LINE WORKS 組織情報取得失敗（権限不足の可能性）:', response.status);
      return null; // 組織情報が取得できなくても統合は継続
    }

    const orgInfo: LineWorksOrgInfo = await response.json();
    
    console.log('📋 LINE WORKS 組織情報レスポンス:', {
      domainId: orgInfo.domainId,
      domainName: orgInfo.domainName,
      companyName: orgInfo.companyName,
      userCount: orgInfo.userCount
    });
    
    return orgInfo;
  } catch (error) {
    console.warn('⚠️ LINE WORKS 組織情報取得エラー（統合は継続）:', error);
    return null; // エラーが発生しても統合は継続
  }
}

export async function POST(request: NextRequest) {
  // POST メソッドでも同様の処理をサポート
  return GET(request);
}