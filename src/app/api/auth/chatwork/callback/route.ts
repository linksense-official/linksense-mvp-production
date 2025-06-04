import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// authOptionsは直接インポートできないため削除
import { prisma } from '@/lib/prisma';

/**
 * ChatWork OAuth認証コールバック処理
 * 
 * ChatWork APIとの統合を処理し、認証情報を安全に保存します。
 * 日本企業向けビジネスチャット分析機能との連携を提供。
 */

interface ChatWorkTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface ChatWorkUserInfo {
  account_id: number;
  room_id: number;
  name: string;
  chatwork_id: string;
  organization_id: number;
  organization_name: string;
  department: string;
  title: string;
  url: string;
  introduction: string;
  mail: string;
  tel_organization: string;
  tel_extension: string;
  tel_mobile: string;
  skype: string;
  facebook: string;
  twitter: string;
  avatar_image_url: string;
  login_mail: string;
}

const CHATWORK_CLIENT_ID = process.env.CHATWORK_CLIENT_ID;
const CHATWORK_CLIENT_SECRET = process.env.CHATWORK_CLIENT_SECRET;

// Redirect URI生成（統合ページ対応）
const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/chatwork/callback`;
};

export async function GET(request: NextRequest) {
  console.log('🔄 ChatWork OAuth コールバック処理開始');
  
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

    console.log('📋 ChatWorkコールバックパラメータ:', { 
      code: code ? '取得済み' : '未取得', 
      state, 
      error 
    });

    // エラーハンドリング
    if (error) {
      console.error('❌ ChatWork OAuth エラー:', error);
      const errorMessage = encodeURIComponent(`ChatWork認証エラー: ${error}`);
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

    if (!CHATWORK_CLIENT_ID || !CHATWORK_CLIENT_SECRET) {
      console.error('❌ ChatWork環境変数が設定されていません');
      return NextResponse.redirect(
        new URL('/integrations?error=config_missing', request.url)
      );
    }

    // State検証（セキュリティ強化）
    const storedState = request.cookies.get('chatwork_oauth_state')?.value;
    if (state && (!storedState || storedState !== state)) {
      console.error('❌ State検証失敗:', { stored: storedState, received: state });
      return NextResponse.redirect(
        new URL('/integrations?error=state_verification_failed', request.url)
      );
    }

    // アクセストークン取得
    console.log('🔑 ChatWork アクセストークン取得開始');
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.access_token) {
      console.error('❌ ChatWorkアクセストークン取得失敗:', tokenResponse.error);
      return NextResponse.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      );
    }

    console.log('✅ ChatWorkアクセストークン取得成功');

    // ユーザー情報取得
    console.log('👤 ChatWork ユーザー情報取得開始');
    const userInfo = await getUserInfo(tokenResponse.access_token);
    
    if (!userInfo) {
      console.error('❌ ChatWorkユーザー情報取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=user_info_failed', request.url)
      );
    }

    console.log('✅ ChatWorkユーザー情報取得成功:', {
      name: userInfo.name,
      chatwork_id: userInfo.chatwork_id,
      organization_name: userInfo.organization_name,
      department: userInfo.department
    });

    // データベース保存
    console.log('💾 ChatWork統合情報をデータベースに保存開始');
    
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: session.user.id,
          service: 'chatwork'
        }
      },
      update: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: userInfo.organization_id.toString(),
        teamName: userInfo.organization_name || 'Unknown Organization',
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        service: 'chatwork',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: userInfo.organization_id.toString(),
        teamName: userInfo.organization_name || 'Unknown Organization'
      }
    });

    console.log('✅ ChatWork統合情報保存完了');

    // 成功時のリダイレクト
    const successUrl = new URL('/integrations', request.url);
    successUrl.searchParams.set('success', 'chatwork_connected');
    successUrl.searchParams.set('service', 'ChatWork');
    successUrl.searchParams.set('user', userInfo.name);
    successUrl.searchParams.set('organization', userInfo.organization_name);

    // OAuth state cookie削除
    const response = NextResponse.redirect(successUrl);
    response.cookies.delete('chatwork_oauth_state');

    console.log('🎉 ChatWork OAuth認証完了 - 統合ページにリダイレクト');
    return response;

  } catch (error) {
    console.error('❌ ChatWork OAuth処理中にエラー:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'ChatWork統合処理中に予期しないエラーが発生しました';
    
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}

async function exchangeCodeForToken(code: string): Promise<ChatWorkTokenResponse> {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('🔄 ChatWork Token exchange開始:', { redirectUri });
    
    const response = await fetch('https://oauth.chatwork.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CHATWORK_CLIENT_ID}:${CHATWORK_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ChatWorkTokenResponse = await response.json();
    
    console.log('📋 ChatWork Token exchange レスポンス:', { 
      success: !!data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope,
      error: data.error,
      error_description: data.error_description
    });
    
    if (data.error) {
      console.error('❌ ChatWork Token exchange エラー:', data.error, data.error_description);
    }
    
    return data;
  } catch (error) {
    console.error('❌ ChatWork Token exchange エラー:', error);
    return { 
      error: error instanceof Error ? error.message : 'token_exchange_failed' 
    };
  }
}

async function getUserInfo(accessToken: string): Promise<ChatWorkUserInfo | null> {
  try {
    console.log('🔄 ChatWork ユーザー情報取得開始');
    
    const response = await fetch('https://api.chatwork.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const userInfo: ChatWorkUserInfo = await response.json();
    
    console.log('📋 ChatWork ユーザー情報レスポンス:', {
      name: userInfo.name,
      account_id: userInfo.account_id,
      chatwork_id: userInfo.chatwork_id,
      organization_name: userInfo.organization_name,
      department: userInfo.department,
      title: userInfo.title
    });
    
    return userInfo;
  } catch (error) {
    console.error('❌ ChatWork ユーザー情報取得エラー:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  // POST メソッドでも同様の処理をサポート
  return GET(request);
}