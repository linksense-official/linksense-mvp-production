import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://linksense-mvp.vercel.app/api/auth/google-meet/callback';
  }
  
  if (process.env.NGROK_URL) {
    return `${process.env.NGROK_URL}/api/auth/google-meet/callback`;
  }
  
  return 'http://localhost:3000/api/auth/google-meet/callback';
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('=== Google Meet OAuth コールバック ===');
    console.log('Code:', code ? '取得済み' : '未取得');
    console.log('State:', state);
    console.log('Error:', error);
    console.log('Error Description:', errorDescription);

    // ✅ OAuth エラーハンドリング
    if (error) {
      console.error('❌ Google Meet OAuth エラー:', error, errorDescription);
      const errorMessage = errorDescription || error;
      return redirectToIntegrations('google_meet_oauth_failed', `Google Meet認証エラー: ${errorMessage}`);
    }

    if (!code) {
      console.error('❌ Google Meet認証コードが取得できませんでした');
      return redirectToIntegrations('google_meet_oauth_failed', 'Google Meet認証コードが不足しています');
    }

    // ✅ State検証（セキュリティ向上）
    const storedState = request.cookies.get('google_meet_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('❌ State検証失敗:', { stored: storedState, received: state });
      return redirectToIntegrations('google_meet_oauth_failed', 'セキュリティ検証に失敗しました');
    }

    // ✅ Google アクセストークン取得
    console.log('🔄 Google Meet アクセストークン取得開始...');
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.access_token) {
      console.error('❌ Google Meet アクセストークン取得失敗:', tokenResponse.error || 'Unknown error');
      return redirectToIntegrations('google_meet_oauth_failed', 'Google Meetアクセストークンの取得に失敗しました');
    }

    // ✅ ユーザー情報取得
    console.log('🔄 Google Meet ユーザー情報取得開始...');
    const userInfo = await getUserInfo(tokenResponse.access_token);
    
    if (!userInfo) {
      console.error('❌ Google Meet ユーザー情報取得失敗');
      return redirectToIntegrations('google_meet_oauth_failed', 'Google Meetユーザー情報の取得に失敗しました');
    }

    // ✅ Google Workspace情報取得
    console.log('🔄 Google Workspace情報取得開始...');
    const workspaceInfo = await getWorkspaceInfo(tokenResponse.access_token);

    // ✅ カレンダー情報取得（会議データのため）
    console.log('🔄 Google Calendar情報取得開始...');
    const calendarInfo = await getCalendarInfo(tokenResponse.access_token);

    console.log('✅ Google Meet統合成功:', userInfo.name || userInfo.email);

    // ✅ 統合マネージャーに登録
    await registerIntegration(tokenResponse, userInfo, workspaceInfo, calendarInfo);

    // ✅ 成功時のリダイレクト
    const baseUrl = process.env.NGROK_URL || request.nextUrl.origin;
    const successUrl = new URL('/integrations', baseUrl);
    successUrl.searchParams.set('success', 'google_meet_connected');
    successUrl.searchParams.set('user', userInfo.name || userInfo.email || 'Unknown');
    successUrl.searchParams.set('organization', workspaceInfo?.domain || 'Google Workspace');

    const response = NextResponse.redirect(successUrl.toString());
    
    // ✅ OAuth state cookie削除
    response.cookies.delete('google_meet_oauth_state');
    
    // ✅ アクセストークンを安全に保存
    response.cookies.set(`google_meet_access_token`, tokenResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenResponse.expires_in || 3600 // 1時間
    });

    // ✅ リフレッシュトークンも保存（長期間有効）
    if (tokenResponse.refresh_token) {
      response.cookies.set(`google_meet_refresh_token`, tokenResponse.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 90 * 24 * 60 * 60 // 90日間
      });
    }
    
    console.log('✅ Google Meet OAuth認証完了、リダイレクト:', successUrl.toString());
    
    return response;

  } catch (error) {
    console.error('❌ Google Meet OAuth コールバック処理エラー:', error);
    return redirectToIntegrations('google_meet_oauth_failed', 'Google Meetコールバック処理でエラーが発生しました');
  }
}

// ✅ Google トークン交換処理
async function exchangeCodeForToken(code: string) {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('Google Meet Token exchange用 Redirect URI:', redirectUri);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const data = await response.json();
    
    console.log('Google Meet Token exchange response:', { 
      success: !!data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope,
      refresh_token: !!data.refresh_token,
      error: data.error,
      error_description: data.error_description
    });
    
    if (data.error) {
      console.error('❌ Google Meet Token exchange エラー:', data.error, data.error_description);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Google Meet Token exchange エラー:', error);
    return { error: 'token_exchange_failed' };
  }
}

// ✅ Google ユーザー情報取得
async function getUserInfo(accessToken: string) {
  try {
    console.log('🔄 Google Meet ユーザー情報取得開始...');
    
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Google API エラー:', response.status, response.statusText);
      return null;
    }

    const userInfo = await response.json();
    
    console.log('✅ Google Meet ユーザー情報取得成功:', {
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
      verified_email: userInfo.verified_email
    });
    
    return userInfo;
  } catch (error) {
    console.error('❌ Google Meet ユーザー情報取得エラー:', error);
    return null;
  }
}

// ✅ Google Workspace情報取得
async function getWorkspaceInfo(accessToken: string) {
  try {
    console.log('🔄 Google Workspace情報取得開始...');
    
    // Google Admin SDK Directory APIを使用してドメイン情報を取得
    const response = await fetch('https://admin.googleapis.com/admin/directory/v1/users?domain=*&maxResults=1', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log('⚠️ Google Workspace情報取得失敗（管理者権限なし）:', response.status);
      return null;
    }

    const data = await response.json();
    const domain = data.users?.[0]?.primaryEmail?.split('@')[1];
    
    console.log('✅ Google Workspace情報取得成功:', {
      domain: domain,
      userCount: data.users?.length || 0
    });
    
    return {
      domain: domain,
      userCount: data.users?.length || 0
    };
  } catch (error) {
    console.error('❌ Google Workspace情報取得エラー:', error);
    return null;
  }
}

// ✅ Google Calendar情報取得（Meet会議データのため）
async function getCalendarInfo(accessToken: string) {
  try {
    console.log('🔄 Google Calendar情報取得開始...');
    
    // カレンダー一覧取得
    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!calendarResponse.ok) {
      console.error('❌ Google Calendar API エラー:', calendarResponse.status);
      return null;
    }

    const calendarData = await calendarResponse.json();
    
    // 直近のイベント取得（Meet会議を含む）
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${oneWeekAgo.toISOString()}&` +
      `timeMax=${now.toISOString()}&` +
      `maxResults=100&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!eventsResponse.ok) {
      console.error('❌ Google Calendar Events API エラー:', eventsResponse.status);
      return null;
    }

    const eventsData = await eventsResponse.json();
    
    // Meet会議を抽出
    const meetEvents = eventsData.items?.filter((event: any) => 
      event.hangoutLink || 
      event.conferenceData?.conferenceSolution?.name === 'Google Meet' ||
      event.description?.includes('meet.google.com')
    ) || [];

    console.log('✅ Google Calendar情報取得成功:', {
      calendarCount: calendarData.items?.length || 0,
      totalEvents: eventsData.items?.length || 0,
      meetEvents: meetEvents.length
    });
    
    return {
      calendars: calendarData.items || [],
      recentEvents: eventsData.items || [],
      meetEvents: meetEvents,
      meetEventCount: meetEvents.length
    };
  } catch (error) {
    console.error('❌ Google Calendar情報取得エラー:', error);
    return null;
  }
}

// ✅ 統合マネージャーに登録
async function registerIntegration(tokenResponse: any, userInfo: any, workspaceInfo: any, calendarInfo: any) {
  try {
    console.log('🔄 Google Meet統合をマネージャーに登録中...');
    
    // 統合マネージャーに登録するためのデータ準備
    const integrationData = {
      id: 'google-meet',
      name: 'Google Meet',
      status: 'connected' as const,
      credentials: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        expiresAt: new Date(Date.now() + (tokenResponse.expires_in * 1000))
      },
      lastSync: new Date(),
      healthScore: 84,
      isEnabled: true,
      settings: {
        enableNotifications: true,
        syncInterval: 60
      },
      userInfo: {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture
      },
      workspaceInfo: workspaceInfo,
      calendarInfo: {
        meetEventCount: calendarInfo?.meetEventCount || 0,
        calendarCount: calendarInfo?.calendars?.length || 0,
        recentEventCount: calendarInfo?.recentEvents?.length || 0
      }
    };

    // LocalStorageに保存（実際の実装では、統合マネージャーのAPIを使用）
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_meet_integration', JSON.stringify(integrationData));
    }

    console.log('✅ Google Meet統合マネージャー登録完了');
  } catch (error) {
    console.error('❌ Google Meet統合マネージャー登録エラー:', error);
  }
}

// ✅ エラー時リダイレクト処理
function redirectToIntegrations(error: string, message: string) {
  const baseUrl = process.env.NGROK_URL || 'http://localhost:3000';
  const errorUrl = new URL('/integrations', baseUrl);
  errorUrl.searchParams.set('error', error);
  errorUrl.searchParams.set('message', message);
  
  console.log('❌ Google Meet OAuth エラーリダイレクト:', errorUrl.toString());
  
  return NextResponse.redirect(errorUrl.toString());
}