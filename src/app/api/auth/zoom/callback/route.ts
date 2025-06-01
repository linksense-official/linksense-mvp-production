// src/app/api/auth/zoom/callback/route.ts
// LinkSense MVP - Zoom OAuth認証コールバックエンドポイント
// Phase 8.0-6-9 Zoom統合実装 - 完全版

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ✅ Zoom OAuth設定
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_REDIRECT_URI = process.env.ZOOM_REDIRECT_URI || 'http://localhost:3000/api/auth/zoom/callback';

// ✅ Zoom API設定
const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

/**
 * Zoom OAuth認証コールバック処理
 * GET /api/auth/zoom/callback
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Zoom OAuth認証コールバック開始...');

    // ✅ URLパラメータ取得
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('コールバックパラメータ:', {
      code: code ? code.substring(0, 10) + '...' : null,
      state: state ? state.substring(0, 8) + '...' : null,
      error,
      errorDescription
    });

    // ✅ エラー処理
    if (error) {
      console.error('Zoom OAuth認証エラー:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/integrations?error=zoom_auth_failed&message=${encodeURIComponent(errorDescription || error)}`
      );
    }

    // ✅ 必須パラメータ検証
    if (!code || !state) {
      console.error('必須パラメータが不足しています');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/integrations?error=zoom_auth_failed&message=${encodeURIComponent('認証パラメータが不足しています')}`
      );
    }

    // ✅ State検証（CSRF対策）
    const cookieStore = await cookies();
    const storedState = cookieStore.get('zoom_oauth_state')?.value;

    if (!storedState || storedState !== state) {
      console.error('State検証失敗:', { stored: storedState, received: state });
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/integrations?error=zoom_auth_failed&message=${encodeURIComponent('認証状態が無効です')}`
      );
    }

    // ✅ 環境変数検証
    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      console.error('Zoom OAuth設定が不完全です');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/integrations?error=zoom_config_error&message=${encodeURIComponent('Zoom設定が不完全です')}`
      );
    }

    // ✅ アクセストークン取得
    const tokenData = await exchangeCodeForToken(code);
    if (!tokenData) {
      console.error('アクセストークン取得失敗');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/integrations?error=zoom_token_failed&message=${encodeURIComponent('アクセストークンの取得に失敗しました')}`
      );
    }

    // ✅ ユーザー情報取得
    const userInfo = await fetchZoomUserInfo(tokenData.access_token);
    if (!userInfo) {
      console.error('ユーザー情報取得失敗');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/integrations?error=zoom_user_failed&message=${encodeURIComponent('ユーザー情報の取得に失敗しました')}`
      );
    }

    // ✅ 統合情報保存
    const integrationData = {
      service: 'zoom',
      userId: userInfo.id,
      email: userInfo.email,
      displayName: userInfo.display_name || userInfo.first_name + ' ' + userInfo.last_name,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      scope: tokenData.scope,
      accountId: userInfo.account_id,
      connectedAt: new Date(),
      status: 'connected'
    };

    console.log('Zoom統合情報:', {
      service: integrationData.service,
      userId: integrationData.userId,
      email: integrationData.email,
      displayName: integrationData.displayName,
      accountId: integrationData.accountId,
      scope: integrationData.scope
    });

    // ✅ 統合データ保存Cookie設定
    cookieStore.set('zoom_integration_data', JSON.stringify(integrationData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1時間
      path: '/'
    });

    // ✅ 一時的なCookie削除
    cookieStore.delete('zoom_oauth_state');
    cookieStore.delete('zoom_integration_start');

    console.log('Zoom OAuth認証コールバック成功');

    // ✅ 統合設定ページにリダイレクト（成功）
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/integrations?success=zoom_connected&service=zoom&user=${encodeURIComponent(integrationData.displayName)}`
    );

  } catch (error) {
    console.error('Zoom OAuth認証コールバックエラー:', error);
    
    // ✅ Cookie削除（エラー時）
    try {
      const cookieStore = await cookies();
      cookieStore.delete('zoom_oauth_state');
      cookieStore.delete('zoom_integration_start');
    } catch (cookieError) {
      console.error('Cookie削除エラー:', cookieError);
    }

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/integrations?error=zoom_auth_failed&message=${encodeURIComponent('認証処理中にエラーが発生しました')}`
    );
  }
}

/**
 * 認証コードをアクセストークンに交換
 */
async function exchangeCodeForToken(code: string): Promise<any> {
  try {
    console.log('Zoomアクセストークン取得開始...');

    const tokenResponse = await fetch(ZOOM_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: ZOOM_REDIRECT_URI
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Zoomトークン取得エラー:', tokenData);
      return null;
    }

    console.log('Zoomアクセストークン取得成功:', {
      access_token: tokenData.access_token ? tokenData.access_token.substring(0, 10) + '...' : null,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      token_type: tokenData.token_type
    });

    return tokenData;
  } catch (error) {
    console.error('Zoomトークン交換エラー:', error);
    return null;
  }
}

/**
 * Zoomユーザー情報取得
 */
async function fetchZoomUserInfo(accessToken: string): Promise<any> {
  try {
    console.log('Zoomユーザー情報取得開始...');

    const userResponse = await fetch(`${ZOOM_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error('Zoomユーザー情報取得エラー:', userData);
      return null;
    }

    console.log('Zoomユーザー情報取得成功:', {
      id: userData.id,
      email: userData.email,
      display_name: userData.display_name,
      account_id: userData.account_id,
      type: userData.type,
      status: userData.status
    });

    return userData;
  } catch (error) {
    console.error('Zoomユーザー情報取得エラー:', error);
    return null;
  }
}

/**
 * Zoom統合状況確認
 * POST /api/auth/zoom/callback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'get_integration_data') {
      // ✅ 統合データ取得
      const cookieStore = await cookies();
      const integrationData = cookieStore.get('zoom_integration_data')?.value;

      if (!integrationData) {
        return NextResponse.json({
          success: false,
          message: 'Zoom統合データが見つかりません'
        });
      }

      try {
        const data = JSON.parse(integrationData);
        
        // ✅ 機密情報を除外して返却
        const safeData = {
          service: data.service,
          userId: data.userId,
          email: data.email,
          displayName: data.displayName,
          accountId: data.accountId,
          scope: data.scope,
          connectedAt: data.connectedAt,
          status: data.status
        };

        return NextResponse.json({
          success: true,
          data: safeData
        });
      } catch (parseError) {
        console.error('Zoom統合データパースエラー:', parseError);
        return NextResponse.json({
          success: false,
          message: '統合データの形式が無効です'
        });
      }
    }

    return NextResponse.json(
      { error: '無効なアクション' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Zoom統合状況確認エラー:', error);
    
    return NextResponse.json(
      { 
        error: 'Zoom統合状況確認失敗',
        message: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}