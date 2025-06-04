import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// authOptionsは直接インポートできないため削除
import { prisma } from '@/lib/prisma';

/**
 * Zoom OAuth認証コールバック処理
 * 
 * Zoom APIとの統合を処理し、認証情報を安全に保存します。
 * エンタープライズビデオ会議・ウェビナー分析機能との連携を提供。
 */

interface ZoomTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface ZoomUserInfo {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  type: number;
  role_name: string;
  pmi: number;
  use_pmi: boolean;
  personal_meeting_url: string;
  timezone: string;
  verified: number;
  dept: string;
  created_at: string;
  last_login_time: string;
  last_client_version: string;
  pic_url: string;
  host_key: string;
  jid: string;
  group_ids: string[];
  im_group_ids: string[];
  account_id: string;
  language: string;
  phone_country: string;
  phone_number: string;
  status: string;
}

const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

// Redirect URI生成（統合ページ対応）
const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/zoom/callback`;
};

export async function GET(request: NextRequest) {
  console.log('🔄 Zoom OAuth コールバック処理開始');
  
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

    console.log('📋 Zoomコールバックパラメータ:', { 
      code: code ? '取得済み' : '未取得', 
      state, 
      error,
      errorDescription 
    });

    // エラーハンドリング
    if (error) {
      console.error('❌ Zoom OAuth エラー:', error, errorDescription);
      const errorMessage = encodeURIComponent(`Zoom認証エラー: ${errorDescription || error}`);
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

    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      console.error('❌ Zoom環境変数が設定されていません');
      return NextResponse.redirect(
        new URL('/integrations?error=config_missing', request.url)
      );
    }

    // State検証（セキュリティ強化）
    const storedState = request.cookies.get('zoom_oauth_state')?.value;
    if (state && (!storedState || storedState !== state)) {
      console.error('❌ State検証失敗:', { stored: storedState, received: state });
      return NextResponse.redirect(
        new URL('/integrations?error=state_verification_failed', request.url)
      );
    }

    // アクセストークン取得
    console.log('🔑 Zoom アクセストークン取得開始');
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.access_token) {
      console.error('❌ Zoomアクセストークン取得失敗:', tokenResponse.error);
      return NextResponse.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      );
    }

    console.log('✅ Zoomアクセストークン取得成功');

    // ユーザー情報取得
    console.log('👤 Zoom ユーザー情報取得開始');
    const userInfo = await fetchZoomUserInfo(tokenResponse.access_token);
    
    if (!userInfo) {
      console.error('❌ Zoomユーザー情報取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=user_info_failed', request.url)
      );
    }

    console.log('✅ Zoomユーザー情報取得成功:', {
      id: userInfo.id,
      display_name: userInfo.display_name,
      email: userInfo.email,
      account_id: userInfo.account_id,
      dept: userInfo.dept,
      role_name: userInfo.role_name
    });

    // データベース保存
    console.log('💾 Zoom統合情報をデータベースに保存開始');
    
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: session.user.id,
          service: 'zoom'
        }
      },
      update: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: userInfo.account_id,
        teamName: userInfo.dept || `${userInfo.display_name}'s Account`,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        service: 'zoom',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: userInfo.account_id,
        teamName: userInfo.dept || `${userInfo.display_name}'s Account`
      }
    });

    console.log('✅ Zoom統合情報保存完了');

    // 成功時のリダイレクト
    const successUrl = new URL('/integrations', request.url);
    successUrl.searchParams.set('success', 'zoom_connected');
    successUrl.searchParams.set('service', 'Zoom');
    successUrl.searchParams.set('user', userInfo.display_name || `${userInfo.first_name} ${userInfo.last_name}`);
    successUrl.searchParams.set('organization', userInfo.dept || 'Unknown Organization');

    // OAuth state cookie削除
    const response = NextResponse.redirect(successUrl);
    response.cookies.delete('zoom_oauth_state');
    response.cookies.delete('zoom_integration_start');
    response.cookies.delete('zoom_integration_data'); // 既存の一時的なCookie削除

    console.log('🎉 Zoom OAuth認証完了 - 統合ページにリダイレクト');
    return response;

  } catch (error) {
    console.error('❌ Zoom OAuth処理中にエラー:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Zoom統合処理中に予期しないエラーが発生しました';
    
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}

async function exchangeCodeForToken(code: string): Promise<ZoomTokenResponse> {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('🔄 Zoom Token exchange開始:', { redirectUri });
    
    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`
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

    const data: ZoomTokenResponse = await response.json();
    
    console.log('📋 Zoom Token exchange レスポンス:', { 
      success: !!data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope,
      error: data.error,
      error_description: data.error_description
    });
    
    if (data.error) {
      console.error('❌ Zoom Token exchange エラー:', data.error, data.error_description);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Zoom Token exchange エラー:', error);
    return { 
      error: error instanceof Error ? error.message : 'token_exchange_failed' 
    };
  }
}

async function fetchZoomUserInfo(accessToken: string): Promise<ZoomUserInfo | null> {
  try {
    console.log('🔄 Zoom ユーザー情報取得開始');
    
    const response = await fetch('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const userInfo: ZoomUserInfo = await response.json();
    
    console.log('📋 Zoom ユーザー情報レスポンス:', {
      id: userInfo.id,
      display_name: userInfo.display_name,
      email: userInfo.email,
      type: userInfo.type,
      role_name: userInfo.role_name,
      account_id: userInfo.account_id,
      dept: userInfo.dept,
      timezone: userInfo.timezone
    });
    
    return userInfo;
  } catch (error) {
    console.error('❌ Zoom ユーザー情報取得エラー:', error);
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
            service: 'zoom'
          }
        }
      });

      if (!integration || !integration.isActive) {
        return NextResponse.json({
          success: false,
          message: 'Zoom統合が見つかりません'
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
    console.error('❌ Zoom統合状況確認エラー:', error);
    
    return NextResponse.json(
      { 
        error: 'Zoom統合状況確認失敗',
        message: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}