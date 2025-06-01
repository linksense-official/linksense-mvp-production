import { NextRequest, NextResponse } from 'next/server';

const CHATWORK_CLIENT_ID = process.env.CHATWORK_CLIENT_ID;
const CHATWORK_CLIENT_SECRET = process.env.CHATWORK_CLIENT_SECRET;

const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://linksense-mvp.vercel.app/api/auth/chatwork/callback';
  }
  
  if (process.env.NGROK_URL) {
    return `${process.env.NGROK_URL}/api/auth/chatwork/callback`;
  }
  
  return 'http://localhost:3000/api/auth/chatwork/callback';
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('=== ChatWork OAuth コールバック ===');

    if (error) {
      console.error('❌ ChatWork OAuth エラー:', error);
      return redirectToIntegrations('chatwork_oauth_failed', `ChatWork認証エラー: ${error}`);
    }

    if (!code) {
      console.error('❌ ChatWork認証コードが不足');
      return redirectToIntegrations('chatwork_oauth_failed', 'ChatWork認証コードが不足しています');
    }

    const storedState = request.cookies.get('chatwork_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('❌ State検証失敗');
      return redirectToIntegrations('chatwork_oauth_failed', 'セキュリティ検証に失敗しました');
    }

    console.log('🔄 ChatWork アクセストークン取得開始...');
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.access_token) {
      console.error('❌ ChatWork アクセストークン取得失敗');
      return redirectToIntegrations('chatwork_oauth_failed', 'ChatWorkアクセストークンの取得に失敗しました');
    }

    console.log('🔄 ChatWork ユーザー情報取得開始...');
    const userInfo = await getUserInfo(tokenResponse.access_token);
    
    if (!userInfo) {
      console.error('❌ ChatWork ユーザー情報取得失敗');
      return redirectToIntegrations('chatwork_oauth_failed', 'ChatWorkユーザー情報の取得に失敗しました');
    }

    console.log('✅ ChatWork統合成功:', userInfo.name);

    // ✅ 成功時のリダイレクト処理
    const baseUrl = process.env.NGROK_URL || request.nextUrl.origin;
    const successUrl = new URL('/integrations', baseUrl);
    successUrl.searchParams.set('success', 'chatwork_connected');
    successUrl.searchParams.set('user', userInfo.name || 'Unknown');
    successUrl.searchParams.set('organization', userInfo.organization_name || 'Unknown Organization');

    const response = NextResponse.redirect(successUrl.toString());
    
    // ✅ OAuth state cookie削除
    response.cookies.delete('chatwork_oauth_state');
    
    // ✅ アクセストークンを安全に保存（例：暗号化してCookieまたはデータベースに保存）
    response.cookies.set(`chatwork_access_token`, tokenResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenResponse.expires_in || 3600 // 1時間
    });

    console.log('✅ ChatWork OAuth認証完了、リダイレクト:', successUrl.toString());
    
    return response;

  } catch (error) {
    console.error('❌ ChatWork OAuth コールバック処理エラー:', error);
    return redirectToIntegrations('chatwork_oauth_failed', 'ChatWorkコールバック処理でエラーが発生しました');
  }
}

// ✅ ChatWork トークン交換処理
async function exchangeCodeForToken(code: string) {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('ChatWork Token exchange用 Redirect URI:', redirectUri);
    
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

    const data = await response.json();
    
    console.log('ChatWork Token exchange response:', { 
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
    return { error: 'token_exchange_failed' };
  }
}

// ✅ ChatWork ユーザー情報取得
async function getUserInfo(accessToken: string) {
  try {
    console.log('🔄 ChatWork ユーザー情報取得開始...');
    
    const response = await fetch('https://api.chatwork.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ ChatWork API エラー:', response.status, response.statusText);
      return null;
    }

    const userInfo = await response.json();
    
    console.log('✅ ChatWork ユーザー情報取得成功:', {
      name: userInfo.name,
      account_id: userInfo.account_id,
      organization_name: userInfo.organization_name,
      department: userInfo.department
    });
    
    return userInfo;
  } catch (error) {
    console.error('❌ ChatWork ユーザー情報取得エラー:', error);
    return null;
  }
}

// ✅ エラー時リダイレクト処理
function redirectToIntegrations(error: string, message: string) {
  const baseUrl = process.env.NGROK_URL || 'http://localhost:3000';
  const errorUrl = new URL('/integrations', baseUrl);
  errorUrl.searchParams.set('error', error);
  errorUrl.searchParams.set('message', message);
  
  console.log('❌ ChatWork OAuth エラーリダイレクト:', errorUrl.toString());
  
  return NextResponse.redirect(errorUrl.toString());
}