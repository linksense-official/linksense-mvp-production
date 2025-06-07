// src/app/api/auth/slack/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;

// ✅ 修正: シンプルなRedirect URI設定
const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://linksense-mvp.vercel.app/api/auth/slack/callback';
  }
  
  // ✅ 開発環境では ngrok URL のみ使用
  if (process.env.NGROK_URL) {
    return `${process.env.NGROK_URL}/api/auth/slack/callback`;
  }
  
  // ✅ フォールバック（使用されない）
  return 'http://localhost:3000/api/auth/slack/callback';
};

const SLACK_SCOPES = [
  'users:read',
  'users:read.email',
  'team:read'
].join(',');

export async function GET(request: NextRequest) {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('=== Slack OAuth 認証開始 ===');
    console.log('Client ID:', SLACK_CLIENT_ID ? SLACK_CLIENT_ID : '未設定');
    console.log('Redirect URI:', redirectUri);
    console.log('Scopes:', SLACK_SCOPES);

    if (!SLACK_CLIENT_ID) {
      console.error('❌ SLACK_CLIENT_ID が設定されていません');
      return NextResponse.json(
        { error: 'Slack設定が不完全です', details: 'SLACK_CLIENT_ID が設定されていません' },
        { status: 500 }
      );
    }

    // ✅ シンプルなstate生成
    const state = Math.random().toString(36).substring(2, 15);
    
    // ✅ OAuth URL構築
    const authUrl = new URL('https://slack.com/oauth/v2/authorize');
    authUrl.searchParams.set('client_id', SLACK_CLIENT_ID);
    authUrl.searchParams.set('scope', SLACK_SCOPES);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    
    console.log('✅ 生成されたOAuth URL:', authUrl.toString());
    console.log('✅ Redirect URI確認:', authUrl.searchParams.get('redirect_uri'));

    const response = NextResponse.redirect(authUrl.toString());
    
    // ✅ Cookie設定
    response.cookies.set('slack_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600
    });

    return response;

  } catch (error) {
    console.error('❌ Slack OAuth開始エラー:', error);
    
    // ✅ エラー時のリダイレクト
    const baseUrl = process.env.NGROK_URL || 'http://localhost:3000';
    const errorUrl = new URL('/settings', baseUrl);
    errorUrl.searchParams.set('tab', 'integrations');
    errorUrl.searchParams.set('error', 'slack_oauth_failed');
    errorUrl.searchParams.set('message', 'OAuth認証の開始に失敗しました');
    
    return NextResponse.redirect(errorUrl.toString());
  }
}