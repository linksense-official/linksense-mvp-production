// src/app/api/auth/discord/route.ts
// LinkSense MVP - Discord OAuth認証開始エンドポイント（修正版）
// 正しいDiscord OAuth2スコープ対応

import { NextRequest, NextResponse } from 'next/server';

// ✅ Discord OAuth設定
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

// ✅ リダイレクトURI取得（環境対応）
const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://linksense-mvp.vercel.app/api/auth/discord/callback';
  }
  if (process.env.NGROK_URL) {
    return `${process.env.NGROK_URL}/api/auth/discord/callback`;
  }
  return 'http://localhost:3000/api/auth/discord/callback';
};

// ✅ Discord OAuth認証開始
export async function GET(request: NextRequest) {
  try {
    console.log('🎮 Discord OAuth認証開始...');

    // 環境変数チェック
    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      console.error('❌ Discord環境変数が設定されていません');
      return NextResponse.redirect(
        new URL('/integrations?error=discord_config_missing', request.url)
      );
    }

    // State生成（セキュリティ対策）
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);

    // ✅ 正しいDiscord OAuth2スコープ設定
    const scopes = [
      'identify',                    // ユーザー基本情報（必須）
      'email',                      // メールアドレス（推奨）
      'guilds',                     // サーバー一覧（コミュニティ分析用）
      'connections'                 // 外部アカウント連携情報（オプション）
    ].join('%20');

    // Discord OAuth URL構築
    const redirectUri = getRedirectUri();
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?` +
      `client_id=${DISCORD_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${scopes}&` +
      `state=${state}&` +
      `prompt=consent`; // 権限確認促進

    console.log('🔗 Discord認証URL構築完了:', {
      clientId: DISCORD_CLIENT_ID,
      redirectUri: redirectUri,
      scopes: scopes.split('%20'),
      state: state,
      note: 'OAuth2ユーザー権限のみ使用（Bot権限は別途必要）'
    });

    // State保存（Cookie）
    const response = NextResponse.redirect(discordAuthUrl);
    response.cookies.set('discord_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10分間有効
    });

    console.log('✅ Discord OAuth認証リダイレクト実行');
    return response;

  } catch (error) {
    console.error('❌ Discord OAuth認証開始エラー:', error);
    
    return NextResponse.redirect(
      new URL('/integrations?error=discord_auth_failed', request.url)
    );
  }
}

// ✅ POSTメソッドも対応
export async function POST(request: NextRequest) {
  return GET(request);
}