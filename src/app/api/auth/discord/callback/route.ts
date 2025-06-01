// src/app/api/auth/discord/callback/route.ts
// LinkSense MVP - Discord OAuth認証コールバックエンドポイント
// ゲーミング・クリエイター特化Discord統合認証完了処理

import { NextRequest, NextResponse } from 'next/server';

// ✅ Discord OAuth設定
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

// ✅ リダイレクトURI取得（認証開始と同じ）
const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://linksense-mvp.vercel.app/api/auth/discord/callback';
  }
  if (process.env.NGROK_URL) {
    return `${process.env.NGROK_URL}/api/auth/discord/callback`;
  }
  return 'http://localhost:3000/api/auth/discord/callback';
};

// ✅ Discord OAuth認証コールバック処理
export async function GET(request: NextRequest) {
  try {
    console.log('🎮 Discord OAuth認証コールバック開始...');

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // エラーチェック
    if (error) {
      console.error('❌ Discord認証エラー:', error);
      return NextResponse.redirect(
        new URL(`/integrations?error=discord_${error}`, request.url)
      );
    }

    if (!code || !state) {
      console.error('❌ Discord認証パラメータ不足:', { code: !!code, state: !!state });
      return NextResponse.redirect(
        new URL('/integrations?error=discord_invalid_params', request.url)
      );
    }

    // State検証
    const storedState = request.cookies.get('discord_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('❌ Discord State検証失敗:', { stored: storedState, received: state });
      return NextResponse.redirect(
        new URL('/integrations?error=discord_state_mismatch', request.url)
      );
    }

    console.log('✅ Discord認証パラメータ検証完了');

    // アクセストークン取得
    const tokenData = await exchangeCodeForToken(code);
    if (!tokenData) {
      console.error('❌ Discord トークン交換失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=discord_token_failed', request.url)
      );
    }

    console.log('✅ Discord アクセストークン取得成功');

    // ユーザー情報取得
    const userInfo = await fetchDiscordUserInfo(tokenData.access_token);
    if (!userInfo) {
      console.error('❌ Discord ユーザー情報取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=discord_user_failed', request.url)
      );
    }

    // サーバー情報取得
    const guildInfo = await fetchDiscordGuilds(tokenData.access_token);
    
    console.log('✅ Discord ユーザー・サーバー情報取得完了:', {
      username: userInfo.username,
      discriminator: userInfo.discriminator,
      guilds: guildInfo?.length || 0
    });

    // 統合マネージャーに登録
    await registerDiscordIntegration({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
      userInfo,
      guildInfo: guildInfo?.[0] // 最初のサーバーを使用
    });

    console.log('✅ Discord統合登録完了');

    // State Cookie削除
    const response = NextResponse.redirect(
      new URL('/integrations?success=discord_connected', request.url)
    );
    response.cookies.delete('discord_oauth_state');

    return response;

  } catch (error) {
    console.error('❌ Discord OAuth認証コールバックエラー:', error);
    
    // State Cookie削除
    const response = NextResponse.redirect(
      new URL('/integrations?error=discord_callback_failed', request.url)
    );
    response.cookies.delete('discord_oauth_state');
    
    return response;
  }
}

// ✅ アクセストークン取得
async function exchangeCodeForToken(code: string) {
  try {
    console.log('🔄 Discord トークン交換開始...');

    const redirectUri = getRedirectUri();
    
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Discord トークン交換HTTP エラー:', response.status, errorText);
      return null;
    }

    const tokenData = await response.json();

    if (tokenData.error) {
      console.error('❌ Discord トークン交換API エラー:', tokenData.error);
      return null;
    }

    console.log('✅ Discord トークン交換成功');
    return tokenData;

  } catch (error) {
    console.error('❌ Discord トークン交換例外:', error);
    return null;
  }
}

// ✅ ユーザー情報取得
async function fetchDiscordUserInfo(accessToken: string) {
  try {
    console.log('👤 Discord ユーザー情報取得開始...');

    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('❌ Discord ユーザー情報取得エラー:', response.status);
      return null;
    }

    const userInfo = await response.json();
    console.log('✅ Discord ユーザー情報取得成功:', userInfo.username);
    
    return userInfo;

  } catch (error) {
    console.error('❌ Discord ユーザー情報取得例外:', error);
    return null;
  }
}

// ✅ サーバー情報取得
async function fetchDiscordGuilds(accessToken: string) {
  try {
    console.log('🏰 Discord サーバー情報取得開始...');

    const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('❌ Discord サーバー情報取得エラー:', response.status);
      return null;
    }

    const guilds = await response.json();
    console.log('✅ Discord サーバー情報取得成功:', guilds.length, '件');
    
    return guilds;

  } catch (error) {
    console.error('❌ Discord サーバー情報取得例外:', error);
    return null;
  }
}

// ✅ 統合マネージャーに登録
async function registerDiscordIntegration(data: {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  userInfo: any;
  guildInfo?: any;
}) {
  try {
    console.log('📝 Discord統合マネージャー登録開始...');

    // 統合マネージャーの取得（グローバル状態から）
    if (typeof window !== 'undefined') {
      const integrationManager = (window as any).integrationManager;
      
      if (integrationManager) {
        const credentials = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
          guildId: data.guildInfo?.id,
          clientId: DISCORD_CLIENT_ID
        };

        // Discord統合に接続
        const success = await integrationManager.connect('discord', credentials);
        
        if (success) {
          console.log('✅ Discord統合マネージャー登録成功');
          
          // ローカルストレージにも保存
          localStorage.setItem(`discord_access_token`, data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem(`discord_refresh_token`, data.refreshToken);
          }
          localStorage.setItem(`discord_user_info`, JSON.stringify(data.userInfo));
          if (data.guildInfo) {
            localStorage.setItem(`discord_guild_info`, JSON.stringify(data.guildInfo));
          }
          
        } else {
          console.error('❌ Discord統合マネージャー登録失敗');
        }
      } else {
        console.log('⚠️ 統合マネージャーが利用できません - ローカル保存のみ実行');
        
        // ローカルストレージに保存
        localStorage.setItem(`discord_access_token`, data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem(`discord_refresh_token`, data.refreshToken);
        }
        localStorage.setItem(`discord_user_info`, JSON.stringify(data.userInfo));
        if (data.guildInfo) {
          localStorage.setItem(`discord_guild_info`, JSON.stringify(data.guildInfo));
        }
      }
    }

  } catch (error) {
    console.error('❌ Discord統合マネージャー登録エラー:', error);
  }
}

// ✅ POSTメソッドも対応
export async function POST(request: NextRequest) {
  return GET(request);
}