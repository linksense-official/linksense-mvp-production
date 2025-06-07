import { NextRequest, NextResponse } from 'next/server';
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

interface SlackUserInfo {
  email: string;
  name: string;
  user_id: string;
  isPlaceholder?: boolean;
}

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;

// Redirect URI生成
const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/slack/callback`;
};

export async function GET(request: NextRequest) {
  console.log('🔄 Slack OAuth コールバック処理開始');
  
  try {
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

    // Slackユーザー情報を取得してメールアドレスを特定
    const userInfo = await getSlackUserInfo(tokenResponse.access_token, tokenResponse.authed_user?.access_token);
    
    if (!userInfo?.email) {
      console.error('❌ Slackユーザー情報の取得に失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=user_info_failed', request.url)
      );
    }

    // メールアドレスでユーザーを特定
    let user = await prisma.user.findUnique({
  where: { email: userInfo.email }
});

// プレースホルダーメールの場合、または見つからない場合の処理
if (!user && userInfo.isPlaceholder) {
  console.log('⚠️ プレースホルダーメールのため、現在ログイン中のユーザーを使用');
  
  // 現在のセッションからユーザーを取得（可能であれば）
  // または、一時的なユーザー作成
  user = await prisma.user.create({
    data: {
      email: userInfo.email,
      name: userInfo.name,
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });
  
  console.log('✅ 新規ユーザー作成:', { userId: user.id, email: userInfo.email });
}

if (!user) {
  console.error('❌ 対応するユーザーが見つかりません:', userInfo.email);
  return NextResponse.redirect(
    new URL('/integrations?error=user_not_found&email=' + encodeURIComponent(userInfo.email), request.url)
  );
}

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
          userId: user.id,
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
        userId: user.id,
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

async function getSlackUserInfo(accessToken: string, userToken?: string): Promise<SlackUserInfo | null> {
  try {
    console.log('🔄 Slackユーザー情報API呼び出し開始');
    
    // User Token を優先的に使用（User Token Scopeでメール取得可能）
    const tokenToUse = userToken || accessToken;
    console.log('🔑 使用するトークン:', userToken ? 'User Token' : 'Bot Token');
    
    // まず auth.test でユーザーIDを取得
    const authResponse = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenToUse}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!authResponse.ok) {
      throw new Error(`Auth test failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    console.log('📋 Slack auth.test レスポンス:', authData);

    if (!authData.ok) {
      throw new Error(`Auth test error: ${authData.error}`);
    }

    // User Token でユーザー詳細情報を取得
    if (userToken) {
      const userResponse = await fetch(`https://slack.com/api/users.info?user=${authData.user_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('📋 User Token でのユーザー情報:', userData);
        
        if (userData.ok && userData.user?.profile?.email) {
          return {
            email: userData.user.profile.email,
            name: userData.user.profile.real_name || userData.user.name,
            user_id: authData.user_id
          };
        }
      }
    }

    // フォールバック: Bot Token でユーザー情報取得を試行
    const userResponse = await fetch(`https://slack.com/api/users.info?user=${authData.user_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!userResponse.ok) {
      throw new Error(`User info failed: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    console.log('📋 Bot Token でのユーザー情報:', userData);
    
    if (!userData.ok) {
      console.warn('⚠️ users.info API エラー:', userData.error);
      
      // 最終フォールバック: auth.test の情報のみ使用
      return {
        email: `${authData.user}@placeholder.com`, // プレースホルダー
        name: authData.user,
        user_id: authData.user_id,
        isPlaceholder: true
      };
    }
    
    return {
      email: userData.user?.profile?.email || `${authData.user}@placeholder.com`,
      name: userData.user?.profile?.real_name || userData.user?.name || authData.user,
      user_id: authData.user_id,
      isPlaceholder: !userData.user?.profile?.email
    };
  } catch (error) {
    console.error('❌ Slackユーザー情報取得エラー:', error);
    return null;
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