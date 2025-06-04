// src/app/api/auth/zoom/route.ts
// LinkSense MVP - Zoom OAuth認証開始エンドポイント
// Phase 8.0-6-9 Zoom統合実装 - TypeScriptエラー修正版

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// ✅ Zoom OAuth設定
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_REDIRECT_URI = process.env.ZOOM_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/zoom/callback`;

// ✅ 必要なスコープ（Zoom特化）
const ZOOM_SCOPES = [
  'meeting:read',           // 会議情報読み取り
  'webinar:read',          // ウェビナー情報読み取り
  'recording:read',        // 録画情報読み取り
  'report:read',           // レポート読み取り
  'user:read',             // ユーザー情報読み取り
  'account:read',          // アカウント情報読み取り
  'dashboard:read'         // ダッシュボード読み取り
].join(' ');

/**
 * Zoom OAuth認証開始
 * GET /api/auth/zoom
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Zoom OAuth認証開始...');

    // ✅ 環境変数検証
    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      console.error('Zoom OAuth設定が不完全です');
      return NextResponse.json(
        { 
          error: 'Zoom OAuth設定エラー',
          message: 'ZOOM_CLIENT_IDまたはZOOM_CLIENT_SECRETが設定されていません'
        },
        { status: 500 }
      );
    }

    // ✅ State生成（CSRF対策）
    const state = crypto.randomBytes(32).toString('hex');
    
    // ✅ リダイレクトURL構築
    const redirectUri = encodeURIComponent(ZOOM_REDIRECT_URI);
    
    // ✅ Zoom OAuth URL構築
    const zoomAuthUrl = `https://zoom.us/oauth/authorize?` +
      `client_id=${ZOOM_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${encodeURIComponent(ZOOM_SCOPES)}&` +
      `state=${state}`;

    console.log('Zoom OAuth URL生成:', {
      clientId: ZOOM_CLIENT_ID,
      redirectUri: ZOOM_REDIRECT_URI,
      scopes: ZOOM_SCOPES,
      state: state.substring(0, 8) + '...'
    });

    // ✅ State保存（セキュリティ）- await追加
    const cookieStore = await cookies();
    cookieStore.set('zoom_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10分
      path: '/'
    });

    // ✅ 統合情報保存 - await追加
    cookieStore.set('zoom_integration_start', Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/'
    });

    console.log('Zoom OAuth認証開始成功 - リダイレクト実行');

    // ✅ Zoom認証ページにリダイレクト
    return NextResponse.redirect(zoomAuthUrl);

  } catch (error) {
    console.error('Zoom OAuth認証開始エラー:', error);
    
    return NextResponse.json(
      { 
        error: 'Zoom OAuth認証開始失敗',
        message: error instanceof Error ? error.message : '不明なエラーが発生しました'
      },
      { status: 500 }
    );
  }
}

/**
 * Zoom OAuth認証状況確認
 * POST /api/auth/zoom
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'check_status') {
      // ✅ 認証状況確認 - await追加
      const cookieStore = await cookies();
      const startTime = cookieStore.get('zoom_integration_start')?.value;
      
      if (!startTime) {
        return NextResponse.json({
          status: 'not_started',
          message: 'Zoom認証が開始されていません'
        });
      }

      const elapsed = Date.now() - parseInt(startTime);
      if (elapsed > 600000) { // 10分超過
        return NextResponse.json({
          status: 'expired',
          message: 'Zoom認証がタイムアウトしました'
        });
      }

      return NextResponse.json({
        status: 'in_progress',
        message: 'Zoom認証処理中です',
        elapsed: Math.round(elapsed / 1000)
      });
    }

    return NextResponse.json(
      { error: '無効なアクション' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Zoom OAuth状況確認エラー:', error);
    
    return NextResponse.json(
      { 
        error: 'Zoom OAuth状況確認失敗',
        message: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

/**
 * Zoom OAuth認証キャンセル
 * DELETE /api/auth/zoom
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('Zoom OAuth認証キャンセル...');

    // ✅ Cookie削除 - await追加
    const cookieStore = await cookies();
    cookieStore.delete('zoom_oauth_state');
    cookieStore.delete('zoom_integration_start');

    console.log('Zoom OAuth認証キャンセル完了');

    return NextResponse.json({
      success: true,
      message: 'Zoom OAuth認証がキャンセルされました'
    });

  } catch (error) {
    console.error('Zoom OAuth認証キャンセルエラー:', error);
    
    return NextResponse.json(
      { 
        error: 'Zoom OAuth認証キャンセル失敗',
        message: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}