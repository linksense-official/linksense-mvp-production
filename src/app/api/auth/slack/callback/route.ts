// src/app/api/auth/slack/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;

// ✅ 同じRedirect URI関数
const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://linksense-mvp.vercel.app/api/auth/slack/callback';
  }
  
  if (process.env.NGROK_URL) {
    return `${process.env.NGROK_URL}/api/auth/slack/callback`;
  }
  
  return 'http://localhost:3000/api/auth/slack/callback';
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('=== Slack OAuth コールバック ===');
    console.log('Code:', code ? '取得済み' : '未取得');
    console.log('State:', state);
    console.log('Error:', error);

    if (error) {
      console.error('❌ Slack OAuth エラー:', error);
      return redirectToSettings('slack_oauth_failed', `認証エラー: ${error}`);
    }

    if (!code) {
      console.error('❌ 認証コードが取得できませんでした');
      return redirectToSettings('slack_oauth_failed', '認証コードが不足しています');
    }

    // ✅ アクセストークン取得
    console.log('🔄 Slackアクセストークン取得開始...');
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.ok) {
      console.error('❌ アクセストークン取得失敗:', tokenResponse.error);
      return redirectToSettings('slack_oauth_failed', 'アクセストークンの取得に失敗しました');
    }

    console.log('✅ Slack統合成功:', tokenResponse.team?.name);

    // ✅ 成功時のリダイレクト
    const baseUrl = process.env.NGROK_URL || request.nextUrl.origin;
    const successUrl = new URL('/settings', baseUrl);
    successUrl.searchParams.set('tab', 'integrations');
    successUrl.searchParams.set('success', 'slack_connected');
    successUrl.searchParams.set('team', tokenResponse.team?.name || 'Unknown');

    const response = NextResponse.redirect(successUrl.toString());
    response.cookies.delete('slack_oauth_state');
    
    return response;

  } catch (error) {
    console.error('❌ Slack OAuth コールバック処理エラー:', error);
    return redirectToSettings('slack_oauth_failed', 'コールバック処理でエラーが発生しました');
  }
}

async function exchangeCodeForToken(code: string) {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('Token exchange用 Redirect URI:', redirectUri);
    
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

    const data = await response.json();
    console.log('Token exchange response:', { 
      ok: data.ok, 
      team: data.team?.name,
      error: data.error 
    });
    
    return data;
  } catch (error) {
    console.error('Token exchange エラー:', error);
    return { ok: false, error: 'token_exchange_failed' };
  }
}

function redirectToSettings(error: string, message: string) {
  const baseUrl = process.env.NGROK_URL || 'http://localhost:3000';
  const errorUrl = new URL('/settings', baseUrl);
  errorUrl.searchParams.set('tab', 'integrations');
  errorUrl.searchParams.set('error', error);
  errorUrl.searchParams.set('message', message);
  return NextResponse.redirect(errorUrl.toString());
}