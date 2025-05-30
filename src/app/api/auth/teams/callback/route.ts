// src/app/api/auth/teams/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

const TEAMS_CLIENT_ID = process.env.TEAMS_CLIENT_ID;
const TEAMS_CLIENT_SECRET = process.env.TEAMS_CLIENT_SECRET;

// ✅ Teams用Redirect URI関数（Slack実装パターンを踏襲）
const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://linksense-mvp.vercel.app/api/auth/teams/callback';
  }
  
  if (process.env.NGROK_URL) {
    return `${process.env.NGROK_URL}/api/auth/teams/callback`;
  }
  
  return 'http://localhost:3000/api/auth/teams/callback';
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('=== Microsoft Teams OAuth コールバック ===');
    console.log('Code:', code ? '取得済み' : '未取得');
    console.log('State:', state);
    console.log('Error:', error);
    console.log('Error Description:', errorDescription);

    // ✅ OAuth エラーハンドリング
    if (error) {
      console.error('❌ Microsoft Teams OAuth エラー:', error, errorDescription);
      const errorMessage = errorDescription || error;
      return redirectToSettings('teams_oauth_failed', `Teams認証エラー: ${errorMessage}`);
    }

    if (!code) {
      console.error('❌ Teams認証コードが取得できませんでした');
      return redirectToSettings('teams_oauth_failed', 'Teams認証コードが不足しています');
    }

    // ✅ State検証（セキュリティ向上）
    const storedState = request.cookies.get('teams_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('❌ State検証失敗:', { stored: storedState, received: state });
      return redirectToSettings('teams_oauth_failed', 'セキュリティ検証に失敗しました');
    }

    // ✅ Microsoft Graph アクセストークン取得
    console.log('🔄 Microsoft Graph アクセストークン取得開始...');
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.access_token) {
      console.error('❌ Teams アクセストークン取得失敗:', tokenResponse.error || 'Unknown error');
      return redirectToSettings('teams_oauth_failed', 'Teamsアクセストークンの取得に失敗しました');
    }

    // ✅ ユーザー情報取得
    console.log('🔄 Teams ユーザー情報取得開始...');
    const userInfo = await getUserInfo(tokenResponse.access_token);
    
    if (!userInfo) {
      console.error('❌ Teams ユーザー情報取得失敗');
      return redirectToSettings('teams_oauth_failed', 'Teamsユーザー情報の取得に失敗しました');
    }

    console.log('✅ Microsoft Teams統合成功:', userInfo.displayName || userInfo.userPrincipalName);

    // ✅ 成功時のリダイレクト（Slack実装パターンを踏襲）
    const baseUrl = process.env.NGROK_URL || request.nextUrl.origin;
    const successUrl = new URL('/settings', baseUrl);
    successUrl.searchParams.set('tab', 'integrations');
    successUrl.searchParams.set('success', 'teams_connected');
    successUrl.searchParams.set('user', userInfo.displayName || userInfo.userPrincipalName || 'Unknown');
    successUrl.searchParams.set('organization', userInfo.companyName || 'Unknown Organization');

    const response = NextResponse.redirect(successUrl.toString());
    
    // ✅ OAuth state cookie削除
    response.cookies.delete('teams_oauth_state');
    
    console.log('✅ Teams OAuth認証完了、リダイレクト:', successUrl.toString());
    
    return response;

  } catch (error) {
    console.error('❌ Microsoft Teams OAuth コールバック処理エラー:', error);
    return redirectToSettings('teams_oauth_failed', 'Teamsコールバック処理でエラーが発生しました');
  }
}

// ✅ Microsoft Graph トークン交換処理
async function exchangeCodeForToken(code: string) {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('Microsoft Graph Token exchange用 Redirect URI:', redirectUri);
    
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: TEAMS_CLIENT_ID!,
        client_secret: TEAMS_CLIENT_SECRET!,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'User.Read Team.ReadBasic.All Chat.Read OnlineMeetings.Read Presence.Read ChannelMessage.Read.All TeamMember.Read.All'
      })
    });

    const data = await response.json();
    
    console.log('Microsoft Graph Token exchange response:', { 
      success: !!data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope,
      error: data.error,
      error_description: data.error_description
    });
    
    if (data.error) {
      console.error('❌ Microsoft Graph Token exchange エラー:', data.error, data.error_description);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Microsoft Graph Token exchange エラー:', error);
    return { error: 'token_exchange_failed' };
  }
}

// ✅ Microsoft Graph ユーザー情報取得
async function getUserInfo(accessToken: string) {
  try {
    console.log('🔄 Microsoft Graph ユーザー情報取得開始...');
    
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Microsoft Graph API エラー:', response.status, response.statusText);
      return null;
    }

    const userInfo = await response.json();
    
    console.log('✅ Microsoft Graph ユーザー情報取得成功:', {
      displayName: userInfo.displayName,
      userPrincipalName: userInfo.userPrincipalName,
      companyName: userInfo.companyName,
      id: userInfo.id
    });
    
    return userInfo;
  } catch (error) {
    console.error('❌ Microsoft Graph ユーザー情報取得エラー:', error);
    return null;
  }
}

// ✅ エラー時リダイレクト処理（Slack実装パターンを踏襲）
function redirectToSettings(error: string, message: string) {
  const baseUrl = process.env.NGROK_URL || 'http://localhost:3000';
  const errorUrl = new URL('/settings', baseUrl);
  errorUrl.searchParams.set('tab', 'integrations');
  errorUrl.searchParams.set('error', error);
  errorUrl.searchParams.set('message', message);
  
  console.log('❌ Teams OAuth エラーリダイレクト:', errorUrl.toString());
  
  return NextResponse.redirect(errorUrl.toString());
}