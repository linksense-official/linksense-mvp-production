// src/app/api/auth/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';

const TEAMS_CLIENT_ID = process.env.TEAMS_CLIENT_ID;
const TEAMS_CLIENT_SECRET = process.env.TEAMS_CLIENT_SECRET;

// ✅ Teams用Redirect URI設定（Slack実装パターンを踏襲）
const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/teams/callback`;
};

// ✅ Microsoft Graph API用スコープ設定
const TEAMS_SCOPES = [
  'User.Read',                    // ユーザー基本情報
  'Team.ReadBasic.All',          // チーム基本情報
  'Chat.Read',                   // チャット読み取り
  'OnlineMeetings.Read',         // 会議情報読み取り
  'Presence.Read',               // プレゼンス情報
  'ChannelMessage.Read.All',     // チャンネルメッセージ読み取り
  'TeamMember.Read.All'          // チームメンバー情報
].join(' ');

export async function GET(request: NextRequest) {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('=== Microsoft Teams OAuth 認証開始 ===');
    console.log('Client ID:', TEAMS_CLIENT_ID ? TEAMS_CLIENT_ID : '未設定');
    console.log('Redirect URI:', redirectUri);
    console.log('Scopes:', TEAMS_SCOPES);

    if (!TEAMS_CLIENT_ID) {
      console.error('❌ TEAMS_CLIENT_ID が設定されていません');
      return NextResponse.json(
        { error: 'Teams設定が不完全です', details: 'TEAMS_CLIENT_ID が設定されていません' },
        { status: 500 }
      );
    }

    if (!TEAMS_CLIENT_SECRET) {
      console.error('❌ TEAMS_CLIENT_SECRET が設定されていません');
      return NextResponse.json(
        { error: 'Teams設定が不完全です', details: 'TEAMS_CLIENT_SECRET が設定されていません' },
        { status: 500 }
      );
    }

    // ✅ セキュアなstate生成（Slack実装パターンを踏襲）
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // ✅ Microsoft Graph OAuth URL構築
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', TEAMS_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('scope', TEAMS_SCOPES);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'consent'); // 管理者同意を促進
    
    console.log('✅ 生成されたMicrosoft Graph OAuth URL:', authUrl.toString());
    console.log('✅ Redirect URI確認:', authUrl.searchParams.get('redirect_uri'));
    console.log('✅ Scopes確認:', authUrl.searchParams.get('scope'));

    const response = NextResponse.redirect(authUrl.toString());
    
    // ✅ Cookie設定（Slack実装パターンを踏襲）
    response.cookies.set('teams_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10分間有効
    });

    // ✅ Teams OAuth開始ログ
    console.log('✅ Teams OAuth認証開始完了');
    console.log('✅ State設定:', state);

    return response;

  } catch (error) {
    console.error('❌ Microsoft Teams OAuth開始エラー:', error);
    
    // ✅ エラー時のリダイレクト（Slack実装パターンを踏襲）
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const errorUrl = new URL('/integrations', baseUrl);
    errorUrl.searchParams.set('error', 'teams_oauth_failed');
    errorUrl.searchParams.set('message', 'Teams OAuth認証の開始に失敗しました');
    
    console.log('❌ エラーリダイレクト先:', errorUrl.toString());
    
    return NextResponse.redirect(errorUrl.toString());
  }
}