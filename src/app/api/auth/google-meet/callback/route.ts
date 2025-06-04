import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Google Meet OAuth認証コールバック処理
 * 
 * Google APIs (Calendar, Meet) との統合を処理し、認証情報を安全に保存します。
 * Google Workspace統合ビデオ会議システム分析機能との連携を提供。
 */

interface GoogleTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  hd?: string; // Hosted domain (Google Workspace)
}

interface GoogleWorkspaceInfo {
  domain?: string;
  userCount?: number;
  isWorkspace: boolean;
}

interface GoogleCalendarInfo {
  calendars: any[];
  recentEvents: any[];
  meetEvents: any[];
  meetEventCount: number;
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Redirect URI生成（統合ページ対応）
const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/google-meet/callback`;
};

export async function GET(request: NextRequest) {
  console.log('🔄 Google Meet OAuth コールバック処理開始');
  
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

    console.log('📋 Google Meetコールバックパラメータ:', { 
      code: code ? '取得済み' : '未取得', 
      state, 
      error,
      errorDescription 
    });

    // エラーハンドリング
    if (error) {
      console.error('❌ Google Meet OAuth エラー:', error, errorDescription);
      const errorMessage = encodeURIComponent(`Google Meet認証エラー: ${errorDescription || error}`);
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

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('❌ Google Meet環境変数が設定されていません');
      return NextResponse.redirect(
        new URL('/integrations?error=config_missing', request.url)
      );
    }

    // State検証（セキュリティ強化）
    const storedState = request.cookies.get('google_meet_oauth_state')?.value;
    if (state && (!storedState || storedState !== state)) {
      console.error('❌ State検証失敗:', { stored: storedState, received: state });
      return NextResponse.redirect(
        new URL('/integrations?error=state_verification_failed', request.url)
      );
    }

    // アクセストークン取得
    console.log('🔑 Google Meet アクセストークン取得開始');
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.access_token) {
      console.error('❌ Google Meetアクセストークン取得失敗:', tokenResponse.error);
      return NextResponse.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      );
    }

    console.log('✅ Google Meetアクセストークン取得成功');

    // ユーザー情報取得
    console.log('👤 Google Meet ユーザー情報取得開始');
    const userInfo = await getUserInfo(tokenResponse.access_token);
    
    if (!userInfo) {
      console.error('❌ Google Meetユーザー情報取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=user_info_failed', request.url)
      );
    }

    // Google Workspace情報取得
    console.log('🏢 Google Workspace情報取得開始');
    const workspaceInfo = await getWorkspaceInfo(tokenResponse.access_token, userInfo);

    // カレンダー情報取得（会議データのため）
    console.log('📅 Google Calendar情報取得開始');
    const calendarInfo = await getCalendarInfo(tokenResponse.access_token);

    console.log('✅ Google Meet統合情報取得成功:', {
      name: userInfo.name,
      email: userInfo.email,
      domain: workspaceInfo.domain,
      isWorkspace: workspaceInfo.isWorkspace,
      meetEventCount: calendarInfo?.meetEventCount || 0
    });

    // データベース保存
    console.log('💾 Google Meet統合情報をデータベースに保存開始');
    
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: session.user.id,
          service: 'google-meet'
        }
      },
      update: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: workspaceInfo.domain || userInfo.email.split('@')[1],
        teamName: workspaceInfo.domain ? `${workspaceInfo.domain} Workspace` : 'Google Account',
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        service: 'google-meet',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: workspaceInfo.domain || userInfo.email.split('@')[1],
        teamName: workspaceInfo.domain ? `${workspaceInfo.domain} Workspace` : 'Google Account'
      }
    });

    console.log('✅ Google Meet統合情報保存完了');

    // 成功時のリダイレクト
    const successUrl = new URL('/integrations', request.url);
    successUrl.searchParams.set('success', 'google_meet_connected');
    successUrl.searchParams.set('service', 'Google Meet');
    successUrl.searchParams.set('user', userInfo.name);
    successUrl.searchParams.set('organization', workspaceInfo.domain || 'Google Account');

    // OAuth state cookie削除
    const response = NextResponse.redirect(successUrl);
    response.cookies.delete('google_meet_oauth_state');

    console.log('🎉 Google Meet OAuth認証完了 - 統合ページにリダイレクト');
    return response;

  } catch (error) {
    console.error('❌ Google Meet OAuth処理中にエラー:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Google Meet統合処理中に予期しないエラーが発生しました';
    
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}

async function exchangeCodeForToken(code: string): Promise<GoogleTokenResponse> {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('🔄 Google Meet Token exchange開始:', { redirectUri });
    
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: GoogleTokenResponse = await response.json();
    
    console.log('📋 Google Meet Token exchange レスポンス:', { 
      success: !!data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope,
      has_refresh_token: !!data.refresh_token,
      error: data.error,
      error_description: data.error_description
    });
    
    if (data.error) {
      console.error('❌ Google Meet Token exchange エラー:', data.error, data.error_description);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Google Meet Token exchange エラー:', error);
    return { 
      error: error instanceof Error ? error.message : 'token_exchange_failed' 
    };
  }
}

async function getUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    console.log('🔄 Google Meet ユーザー情報取得開始');
    
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const userInfo: GoogleUserInfo = await response.json();
    
    console.log('📋 Google Meet ユーザー情報レスポンス:', {
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      verified_email: userInfo.verified_email,
      hd: userInfo.hd, // Hosted domain
      locale: userInfo.locale
    });
    
    return userInfo;
  } catch (error) {
    console.error('❌ Google Meet ユーザー情報取得エラー:', error);
    return null;
  }
}

async function getWorkspaceInfo(accessToken: string, userInfo: GoogleUserInfo): Promise<GoogleWorkspaceInfo> {
  try {
    console.log('🔄 Google Workspace情報取得開始');
    
    // ホストドメイン（hd）が存在する場合はGoogle Workspace
    if (userInfo.hd) {
      console.log('✅ Google Workspace検出:', userInfo.hd);
      return {
        domain: userInfo.hd,
        isWorkspace: true,
        userCount: undefined // 管理者権限なしでは取得不可
      };
    }

    // 個人Googleアカウントの場合
    const emailDomain = userInfo.email.split('@')[1];
    console.log('📋 個人Googleアカウント検出:', emailDomain);
    
    return {
      domain: emailDomain === 'gmail.com' ? undefined : emailDomain,
      isWorkspace: false,
      userCount: 1
    };
  } catch (error) {
    console.error('❌ Google Workspace情報取得エラー:', error);
    return {
      isWorkspace: false,
      userCount: 1
    };
  }
}

async function getCalendarInfo(accessToken: string): Promise<GoogleCalendarInfo | null> {
  try {
    console.log('🔄 Google Calendar情報取得開始');
    
    // カレンダー一覧取得
    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!calendarResponse.ok) {
      console.warn('⚠️ Google Calendar一覧取得失敗（権限不足の可能性）:', calendarResponse.status);
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
      console.warn('⚠️ Google Calendar イベント取得失敗（権限不足の可能性）:', eventsResponse.status);
      return {
        calendars: calendarData.items || [],
        recentEvents: [],
        meetEvents: [],
        meetEventCount: 0
      };
    }

    const eventsData = await eventsResponse.json();
    
    // Meet会議を抽出
    const meetEvents = eventsData.items?.filter((event: any) => 
      event.hangoutLink || 
      event.conferenceData?.conferenceSolution?.name === 'Google Meet' ||
      event.description?.includes('meet.google.com')
    ) || [];

    console.log('📋 Google Calendar情報取得成功:', {
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
    console.warn('⚠️ Google Calendar情報取得エラー（統合は継続）:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // セッション確認
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'get_integration_data') {
      // データベースから統合情報を取得
      const integration = await prisma.integration.findUnique({
        where: {
          userId_service: {
            userId: session.user.id,
            service: 'google-meet'
          }
        }
      });

      if (!integration || !integration.isActive) {
        return NextResponse.json({
          success: false,
          message: 'Google Meet統合が見つかりません'
        });
      }

      // 機密情報を除外して返却
      const safeData = {
        service: integration.service,
        teamId: integration.teamId,
        teamName: integration.teamName,
        isActive: integration.isActive,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
        status: 'connected'
      };

      return NextResponse.json({
        success: true,
        data: safeData
      });
    }

    return NextResponse.json(
      { error: '無効なアクション' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Google Meet統合状況確認エラー:', error);
    
    return NextResponse.json(
      { 
        error: 'Google Meet統合状況確認失敗',
        message: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}