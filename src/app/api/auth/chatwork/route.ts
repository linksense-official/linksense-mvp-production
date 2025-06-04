import { NextRequest, NextResponse } from 'next/server';

const CHATWORK_CLIENT_ID = process.env.CHATWORK_CLIENT_ID;
const CHATWORK_CLIENT_SECRET = process.env.CHATWORK_CLIENT_SECRET;

const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/chatwork/callback`;
};

// ✅ ChatWork OAuth スコープ設定
const CHATWORK_SCOPES = [
  'users.profile.me:read',
  'rooms.all:read',
  'rooms.messages:read',
  'rooms.members:read',
  'rooms.tasks:read'
].join('%20');

export async function GET(request: NextRequest) {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('=== ChatWork OAuth 認証開始 ===');
    console.log('Client ID:', CHATWORK_CLIENT_ID ? CHATWORK_CLIENT_ID : '未設定');
    console.log('Redirect URI:', redirectUri);
    console.log('Scopes:', CHATWORK_SCOPES);

    if (!CHATWORK_CLIENT_ID) {
      console.error('❌ CHATWORK_CLIENT_ID が設定されていません');
      return NextResponse.json(
        { error: 'ChatWork設定が不完全です', details: 'CHATWORK_CLIENT_ID が設定されていません' },
        { status: 500 }
      );
    }

    if (!CHATWORK_CLIENT_SECRET) {
      console.error('❌ CHATWORK_CLIENT_SECRET が設定されていません');
      return NextResponse.json(
        { error: 'ChatWork設定が不完全です', details: 'CHATWORK_CLIENT_SECRET が設定されていません' },
        { status: 500 }
      );
    }

    // ✅ セキュアなstate生成
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // ✅ ChatWork OAuth URL構築
    const authUrl = new URL('https://oauth.chatwork.com/authorize');
    authUrl.searchParams.set('client_id', CHATWORK_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', CHATWORK_SCOPES);
    authUrl.searchParams.set('state', state);
    
    console.log('✅ 生成されたChatWork OAuth URL:', authUrl.toString());
    console.log('✅ Redirect URI確認:', authUrl.searchParams.get('redirect_uri'));
    console.log('✅ Scopes確認:', authUrl.searchParams.get('scope'));

    const response = NextResponse.redirect(authUrl.toString());
    
    // ✅ Cookie設定
    response.cookies.set('chatwork_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10分間有効
    });

    // ✅ ChatWork OAuth開始ログ
    console.log('✅ ChatWork OAuth認証開始完了');
    console.log('✅ State設定:', state);

    return response;

  } catch (error) {
    console.error('❌ ChatWork OAuth開始エラー:', error);
    
    // ✅ エラー時のリダイレクト
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const errorUrl = new URL('/integrations', baseUrl);
    errorUrl.searchParams.set('error', 'chatwork_oauth_failed');
    errorUrl.searchParams.set('message', 'ChatWork OAuth認証の開始に失敗しました');
    
    console.log('❌ エラーリダイレクト先:', errorUrl.toString());
    
    return NextResponse.redirect(errorUrl.toString());
  }
}