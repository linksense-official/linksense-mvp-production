import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Slack OAuth認証コールバック処理
 * 
 * Slack APIとの統合を処理し、認証情報を安全に保存します。
 * チームコミュニケーション分析機能との連携を提供。
 */

interface SlackTokenResponse {
  ok: boolean;
  access_token?: string;
  token_type?: string;
  scope?: string;
  bot_user_id?: string;
  app_id?: string;
  team?: {
    id: string;
    name: string;
  };
  enterprise?: {
    id: string;
    name: string;
  };
  authed_user?: {
    id: string;
    scope?: string;
    access_token?: string;
    token_type?: string;
  };
  error?: string;
  warning?: string;
}

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;

// Redirect URI生成（統合ページ対応）
const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/slack/callback`;
};

export async function GET(request: NextRequest) {
  console.log('🔄 Slack OAuth コールバック処理開始');
  
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

    console.log('📋 Slackコールバックパラメータ:', { 
      code: code ? '取得済み' : '未取得', 
      state, 
      error 
    });

    // エラーハンドリング
    if (error) {
      console.error('❌ Slack OAuth エラー:', error);
      const errorMessage = encodeURIComponent(`Slack認証エラー: ${error}`);
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

    if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET) {
      console.error('❌ Slack環境変数が設定されていません');
      return NextResponse.redirect(
        new URL('/integrations?error=config_missing', request.url)
      );
    }

    // アクセストークン取得
    console.log('🔑 Slack アクセストークン取得開始');
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.ok || !tokenResponse.access_token) {
      console.error('❌ Slackアクセストークン取得失敗:', tokenResponse.error);
      return NextResponse.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      );
    }

    console.log('✅ Slackアクセストークン取得成功');

    // チーム情報取得
    console.log('👥 Slackチーム情報取得開始');
    const teamInfo = await getSlackTeamInfo(tokenResponse.access_token);
    
    const teamId = tokenResponse.team?.id || teamInfo?.team?.id || 'unknown';
    const teamName = tokenResponse.team?.name || teamInfo?.team?.name || 'Unknown Team';

    console.log('✅ Slackチーム情報取得成功:', {
      teamId,
      teamName,
      botUserId: tokenResponse.bot_user_id
    });

    // データベース保存
    console.log('💾 Slack統合情報をデータベースに保存開始');
    
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: session.user.id,
          service: 'slack'
        }
      },
      update: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.authed_user?.access_token || null,
        isActive: true,
        teamId: teamId,
        teamName: teamName,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        service: 'slack',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.authed_user?.access_token || null,
        isActive: true,
        teamId: teamId,
        teamName: teamName
      }
    });

    console.log('✅ Slack統合情報保存完了');

    // 成功時のリダイレクト
    const successUrl = new URL('/integrations', request.url);
    successUrl.searchParams.set('success', 'slack_connected');
    successUrl.searchParams.set('service', 'Slack');
    successUrl.searchParams.set('team', teamName);

    console.log('🎉 Slack OAuth認証完了 - 統合ページにリダイレクト');
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('❌ Slack OAuth処理中にエラー:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Slack統合処理中に予期しないエラーが発生しました';
    
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}

async function exchangeCodeForToken(code: string): Promise<SlackTokenResponse> {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('🔄 Slack Token exchange開始:', { redirectUri });
    
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID!,
        client_secret: SLACK_CLIENT_SECRET!,
        code: code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: SlackTokenResponse = await response.json();
    
    console.log('📋 Slack Token exchange レスポンス:', { 
      ok: data.ok, 
      team: data.team?.name,
      error: data.error,
      hasAccessToken: !!data.access_token
    });
    
    return data;
  } catch (error) {
    console.error('❌ Slack Token exchange エラー:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'token_exchange_failed' 
    };
  }
}

async function getSlackTeamInfo(accessToken: string) {
  try {
    console.log('🔄 Slackチーム情報API呼び出し開始');
    
    const response = await fetch('https://slack.com/api/team.info', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📋 Slackチーム情報レスポンス:', {
      ok: data.ok,
      teamName: data.team?.name,
      error: data.error
    });
    
    return data;
  } catch (error) {
    console.error('❌ Slackチーム情報取得エラー:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  // POST メソッドでも同様の処理をサポート
  return GET(request);
}