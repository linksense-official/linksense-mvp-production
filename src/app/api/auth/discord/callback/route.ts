import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Discord OAuth認証コールバック処理
 * 
 * Discord APIとの統合を処理し、認証情報を安全に保存します。
 * ゲーミング・クリエイター向けコミュニケーション分析機能との連携を提供。
 */

interface DiscordTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface DiscordUserInfo {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string | null;
  accent_color?: number | null;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

interface DiscordGuildInfo {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

// Redirect URI生成（統合ページ対応）
const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/discord/callback`;
};

export async function GET(request: NextRequest) {
  console.log('🔄 Discord OAuth コールバック処理開始');
  
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

    console.log('📋 Discordコールバックパラメータ:', { 
      code: code ? '取得済み' : '未取得', 
      state, 
      error 
    });

    // エラーハンドリング
    if (error) {
      console.error('❌ Discord OAuth エラー:', error);
      const errorMessage = encodeURIComponent(`Discord認証エラー: ${error}`);
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

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      console.error('❌ Discord環境変数が設定されていません');
      return NextResponse.redirect(
        new URL('/integrations?error=config_missing', request.url)
      );
    }

    // State検証（セキュリティ強化）
    const storedState = request.cookies.get('discord_oauth_state')?.value;
    if (state && (!storedState || storedState !== state)) {
      console.error('❌ State検証失敗:', { stored: storedState, received: state });
      return NextResponse.redirect(
        new URL('/integrations?error=state_verification_failed', request.url)
      );
    }

    // アクセストークン取得
    console.log('🔑 Discord アクセストークン取得開始');
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.access_token) {
      console.error('❌ Discordアクセストークン取得失敗:', tokenResponse.error);
      return NextResponse.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      );
    }

    console.log('✅ Discordアクセストークン取得成功');

    // ユーザー情報取得
    console.log('👤 Discord ユーザー情報取得開始');
    const userInfo = await fetchDiscordUserInfo(tokenResponse.access_token);
    
    if (!userInfo) {
      console.error('❌ Discordユーザー情報取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=user_info_failed', request.url)
      );
    }

    // サーバー情報取得
    console.log('🏰 Discord サーバー情報取得開始');
    const guildInfo = await fetchDiscordGuilds(tokenResponse.access_token);

    console.log('✅ Discord統合情報取得成功:', {
      username: userInfo.username,
      discriminator: userInfo.discriminator,
      global_name: userInfo.global_name,
      guilds: guildInfo?.length || 0
    });

    // データベース保存
    console.log('💾 Discord統合情報をデータベースに保存開始');
    
    // 主要サーバーを選択（オーナーのサーバーまたは最初のサーバー）
    const primaryGuild = guildInfo?.find(guild => guild.owner) || guildInfo?.[0];
    
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: session.user.id,
          service: 'discord'
        }
      },
      update: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: primaryGuild?.id || userInfo.id,
        teamName: primaryGuild?.name || `${userInfo.username}'s Discord`,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        service: 'discord',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: primaryGuild?.id || userInfo.id,
        teamName: primaryGuild?.name || `${userInfo.username}'s Discord`
      }
    });

    console.log('✅ Discord統合情報保存完了');

    // 成功時のリダイレクト
    const successUrl = new URL('/integrations', request.url);
    successUrl.searchParams.set('success', 'discord_connected');
    successUrl.searchParams.set('service', 'Discord');
    successUrl.searchParams.set('user', userInfo.global_name || userInfo.username);
    successUrl.searchParams.set('organization', primaryGuild?.name || 'Discord Community');

    // OAuth state cookie削除
    const response = NextResponse.redirect(successUrl);
    response.cookies.delete('discord_oauth_state');

    console.log('🎉 Discord OAuth認証完了 - 統合ページにリダイレクト');
    return response;

  } catch (error) {
    console.error('❌ Discord OAuth処理中にエラー:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Discord統合処理中に予期しないエラーが発生しました';
    
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}

async function exchangeCodeForToken(code: string): Promise<DiscordTokenResponse> {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('🔄 Discord Token exchange開始:', { redirectUri });
    
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
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data: DiscordTokenResponse = await response.json();
    
    console.log('📋 Discord Token exchange レスポンス:', { 
      success: !!data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope,
      has_refresh_token: !!data.refresh_token,
      error: data.error,
      error_description: data.error_description
    });
    
    if (data.error) {
      console.error('❌ Discord Token exchange エラー:', data.error, data.error_description);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Discord Token exchange エラー:', error);
    return { 
      error: error instanceof Error ? error.message : 'token_exchange_failed' 
    };
  }
}

async function fetchDiscordUserInfo(accessToken: string): Promise<DiscordUserInfo | null> {
  try {
    console.log('🔄 Discord ユーザー情報取得開始');
    
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const userInfo: DiscordUserInfo = await response.json();
    
    console.log('📋 Discord ユーザー情報レスポンス:', {
      id: userInfo.id,
      username: userInfo.username,
      discriminator: userInfo.discriminator,
      global_name: userInfo.global_name,
      verified: userInfo.verified,
      locale: userInfo.locale
    });
    
    return userInfo;
  } catch (error) {
    console.error('❌ Discord ユーザー情報取得エラー:', error);
    return null;
  }
}

async function fetchDiscordGuilds(accessToken: string): Promise<DiscordGuildInfo[] | null> {
  try {
    console.log('🔄 Discord サーバー情報取得開始');
    
    const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.warn('⚠️ Discord サーバー情報取得失敗（権限不足の可能性）:', response.status);
      return null; // サーバー情報が取得できなくても統合は継続
    }

    const guilds: DiscordGuildInfo[] = await response.json();
    
    console.log('📋 Discord サーバー情報レスポンス:', {
      guildCount: guilds.length,
      ownedGuilds: guilds.filter(guild => guild.owner).length,
      totalMembers: guilds.reduce((sum, guild) => sum + (guild.approximate_member_count || 0), 0)
    });
    
    return guilds;
  } catch (error) {
    console.warn('⚠️ Discord サーバー情報取得エラー（統合は継続）:', error);
    return null; // エラーが発生しても統合は継続
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
            service: 'discord'
          }
        }
      });

      if (!integration || !integration.isActive) {
        return NextResponse.json({
          success: false,
          message: 'Discord統合が見つかりません'
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
    console.error('❌ Discord統合状況確認エラー:', error);
    
    return NextResponse.json(
      { 
        error: 'Discord統合状況確認失敗',
        message: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}