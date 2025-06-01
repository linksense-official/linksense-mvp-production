import { NextRequest, NextResponse } from 'next/server';

const LINE_WORKS_CLIENT_ID = process.env.LINE_WORKS_CLIENT_ID;
const LINE_WORKS_CLIENT_SECRET = process.env.LINE_WORKS_CLIENT_SECRET;

const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://linksense-mvp.vercel.app/api/auth/line-works/callback';
  }
  
  if (process.env.NGROK_URL) {
    return `${process.env.NGROK_URL}/api/auth/line-works/callback`;
  }
  
  return 'http://localhost:3000/api/auth/line-works/callback';
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('=== LINE WORKS OAuth コールバック ===');
    console.log('Code:', code ? '取得済み' : '未取得');
    console.log('State:', state);
    console.log('Error:', error);
    console.log('Error Description:', errorDescription);

    // ✅ OAuth エラーハンドリング
    if (error) {
      console.error('❌ LINE WORKS OAuth エラー:', error, errorDescription);
      const errorMessage = errorDescription || error;
      return redirectToIntegrations('line_works_oauth_failed', `LINE WORKS認証エラー: ${errorMessage}`);
    }

    if (!code) {
      console.error('❌ LINE WORKS認証コードが取得できませんでした');
      return redirectToIntegrations('line_works_oauth_failed', 'LINE WORKS認証コードが不足しています');
    }

    // ✅ State検証（セキュリティ向上）
    const storedState = request.cookies.get('line_works_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('❌ State検証失敗:', { stored: storedState, received: state });
      return redirectToIntegrations('line_works_oauth_failed', 'セキュリティ検証に失敗しました');
    }

    // ✅ LINE WORKS アクセストークン取得
    console.log('🔄 LINE WORKS アクセストークン取得開始...');
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.access_token) {
      console.error('❌ LINE WORKS アクセストークン取得失敗:', tokenResponse.error || 'Unknown error');
      return redirectToIntegrations('line_works_oauth_failed', 'LINE WORKSアクセストークンの取得に失敗しました');
    }

    // ✅ ユーザー情報取得
    console.log('🔄 LINE WORKS ユーザー情報取得開始...');
    const userInfo = await getUserInfo(tokenResponse.access_token);
    
    if (!userInfo) {
      console.error('❌ LINE WORKS ユーザー情報取得失敗');
      return redirectToIntegrations('line_works_oauth_failed', 'LINE WORKSユーザー情報の取得に失敗しました');
    }

    // ✅ 組織情報取得
    console.log('🔄 LINE WORKS 組織情報取得開始...');
    const orgInfo = await getOrganizationInfo(tokenResponse.access_token);

    console.log('✅ LINE WORKS統合成功:', userInfo.displayName || userInfo.userId);

    // ✅ 統合マネージャーに登録
    await registerIntegration(tokenResponse, userInfo, orgInfo);

    // ✅ 成功時のリダイレクト
    const baseUrl = process.env.NGROK_URL || request.nextUrl.origin;
    const successUrl = new URL('/integrations', baseUrl);
    successUrl.searchParams.set('success', 'line_works_connected');
    successUrl.searchParams.set('user', userInfo.displayName || userInfo.userId || 'Unknown');
    successUrl.searchParams.set('organization', orgInfo?.domainName || 'Unknown Organization');

    const response = NextResponse.redirect(successUrl.toString());
    
    // ✅ OAuth state cookie削除
    response.cookies.delete('line_works_oauth_state');
    
    // ✅ アクセストークンを安全に保存
    response.cookies.set(`line_works_access_token`, tokenResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenResponse.expires_in || 3600 // 1時間
    });

    // ✅ リフレッシュトークンも保存（長期間有効）
    if (tokenResponse.refresh_token) {
      response.cookies.set(`line_works_refresh_token`, tokenResponse.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30日間
      });
    }
    
    console.log('✅ LINE WORKS OAuth認証完了、リダイレクト:', successUrl.toString());
    
    return response;

  } catch (error) {
    console.error('❌ LINE WORKS OAuth コールバック処理エラー:', error);
    return redirectToIntegrations('line_works_oauth_failed', 'LINE WORKSコールバック処理でエラーが発生しました');
  }
}

// ✅ LINE WORKS トークン交換処理
async function exchangeCodeForToken(code: string) {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('LINE WORKS Token exchange用 Redirect URI:', redirectUri);
    
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

    const data = await response.json();
    
    console.log('LINE WORKS Token exchange response:', { 
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
    return { error: 'token_exchange_failed' };
  }
}

// ✅ LINE WORKS ユーザー情報取得
async function getUserInfo(accessToken: string) {
  try {
    console.log('🔄 LINE WORKS ユーザー情報取得開始...');
    
    const response = await fetch('https://www.worksapis.com/v1.0/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ LINE WORKS API エラー:', response.status, response.statusText);
      return null;
    }

    const userInfo = await response.json();
    
    console.log('✅ LINE WORKS ユーザー情報取得成功:', {
      userId: userInfo.userId,
      displayName: userInfo.displayName,
      email: userInfo.email,
      department: userInfo.department
    });
    
    return userInfo;
  } catch (error) {
    console.error('❌ LINE WORKS ユーザー情報取得エラー:', error);
    return null;
  }
}

// ✅ LINE WORKS 組織情報取得
async function getOrganizationInfo(accessToken: string) {
  try {
    console.log('🔄 LINE WORKS 組織情報取得開始...');
    
    const response = await fetch('https://www.worksapis.com/v1.0/domains/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ LINE WORKS 組織API エラー:', response.status, response.statusText);
      return null;
    }

    const orgInfo = await response.json();
    
    console.log('✅ LINE WORKS 組織情報取得成功:', {
      domainId: orgInfo.domainId,
      domainName: orgInfo.domainName,
      companyName: orgInfo.companyName
    });
    
    return orgInfo;
  } catch (error) {
    console.error('❌ LINE WORKS 組織情報取得エラー:', error);
    return null;
  }
}

// ✅ 統合マネージャーに登録
async function registerIntegration(tokenResponse: any, userInfo: any, orgInfo: any) {
  try {
    console.log('🔄 LINE WORKS統合をマネージャーに登録中...');
    
    // 統合マネージャーに登録するためのデータ準備
    const integrationData = {
      id: 'line-works',
      name: 'LINE WORKS',
      status: 'connected' as const,
      credentials: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        clientId: LINE_WORKS_CLIENT_ID,
        clientSecret: LINE_WORKS_CLIENT_SECRET,
        expiresAt: new Date(Date.now() + (tokenResponse.expires_in * 1000))
      },
      lastSync: new Date(),
      healthScore: 85,
      isEnabled: true,
      settings: {
        enableNotifications: true,
        syncInterval: 60
      },
      userInfo: {
        userId: userInfo.userId,
        displayName: userInfo.displayName,
        email: userInfo.email
      },
      organizationInfo: orgInfo
    };

    // LocalStorageに保存（実際の実装では、統合マネージャーのAPIを使用）
    if (typeof window !== 'undefined') {
      localStorage.setItem('line_works_integration', JSON.stringify(integrationData));
    }

    console.log('✅ LINE WORKS統合マネージャー登録完了');
  } catch (error) {
    console.error('❌ LINE WORKS統合マネージャー登録エラー:', error);
  }
}

// ✅ エラー時リダイレクト処理
function redirectToIntegrations(error: string, message: string) {
  const baseUrl = process.env.NGROK_URL || 'http://localhost:3000';
  const errorUrl = new URL('/integrations', baseUrl);
  errorUrl.searchParams.set('error', error);
  errorUrl.searchParams.set('message', message);
  
  console.log('❌ LINE WORKS OAuth エラーリダイレクト:', errorUrl.toString());
  
  return NextResponse.redirect(errorUrl.toString());
}