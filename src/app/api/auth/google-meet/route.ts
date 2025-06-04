import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/google-meet/callback`;
};

// ✅ Google Meet用スコープ設定（Google Calendar + Meet API）
const GOOGLE_MEET_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',        // カレンダー読み取り
  'https://www.googleapis.com/auth/calendar.events.readonly', // イベント読み取り
  'https://www.googleapis.com/auth/userinfo.email',           // ユーザーメール
  'https://www.googleapis.com/auth/userinfo.profile',         // ユーザープロフィール
  'https://www.googleapis.com/auth/admin.directory.user.readonly', // ディレクトリユーザー（管理者権限）
  'https://www.googleapis.com/auth/admin.reports.audit.readonly'   // 監査ログ（管理者権限）
].join(' ');

export async function GET(request: NextRequest) {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('=== Google Meet OAuth 認証開始 ===');
    console.log('Client ID:', GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID : '未設定');
    console.log('Redirect URI:', redirectUri);
    console.log('Scopes:', GOOGLE_MEET_SCOPES);

    if (!GOOGLE_CLIENT_ID) {
      console.error('❌ GOOGLE_CLIENT_ID が設定されていません');
      return NextResponse.json(
        { error: 'Google設定が不完全です', details: 'GOOGLE_CLIENT_ID が設定されていません' },
        { status: 500 }
      );
    }

    if (!GOOGLE_CLIENT_SECRET) {
      console.error('❌ GOOGLE_CLIENT_SECRET が設定されていません');
      return NextResponse.json(
        { error: 'Google設定が不完全です', details: 'GOOGLE_CLIENT_SECRET が設定されていません' },
        { status: 500 }
      );
    }

    // ✅ セキュアなstate生成
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // ✅ Google OAuth URL構築
    const authUrl = new URL('https://accounts.google.com/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', GOOGLE_MEET_SCOPES);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline'); // リフレッシュトークン取得
    authUrl.searchParams.set('prompt', 'consent'); // 管理者同意を促進
    authUrl.searchParams.set('include_granted_scopes', 'true'); // 段階的権限
    
    console.log('✅ 生成されたGoogle Meet OAuth URL:', authUrl.toString());
    console.log('✅ Redirect URI確認:', authUrl.searchParams.get('redirect_uri'));
    console.log('✅ Scopes確認:', authUrl.searchParams.get('scope'));

    const response = NextResponse.redirect(authUrl.toString());
    
    // ✅ Cookie設定
    response.cookies.set('google_meet_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10分間有効
    });

    // ✅ Google Meet OAuth開始ログ
    console.log('✅ Google Meet OAuth認証開始完了');
    console.log('✅ State設定:', state);

    return response;

  } catch (error) {
    console.error('❌ Google Meet OAuth開始エラー:', error);
    
    // ✅ エラー時のリダイレクト
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const errorUrl = new URL('/integrations', baseUrl);
    errorUrl.searchParams.set('error', 'google_meet_oauth_failed');
    errorUrl.searchParams.set('message', 'Google Meet OAuth認証の開始に失敗しました');
    
    console.log('❌ エラーリダイレクト先:', errorUrl.toString());
    
    return NextResponse.redirect(errorUrl.toString());
  }
}