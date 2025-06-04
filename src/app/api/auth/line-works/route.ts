import { NextRequest, NextResponse } from 'next/server';

const LINE_WORKS_CLIENT_ID = process.env.LINE_WORKS_CLIENT_ID;
const LINE_WORKS_CLIENT_SECRET = process.env.LINE_WORKS_CLIENT_SECRET;

const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/line-works/callback`;
};

// ✅ LINE WORKS OAuth スコープ設定
const LINE_WORKS_SCOPES = [
  'user:read',           // ユーザー情報読み取り
  'group:read',          // グループ情報読み取り
  'message:read',        // メッセージ読み取り
  'calendar:read',       // カレンダー読み取り
  'drive:read',          // ドライブ読み取り
  'directory:read'       // ディレクトリ読み取り
].join(' ');

export async function GET(request: NextRequest) {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('=== LINE WORKS OAuth 認証開始 ===');
    console.log('Client ID:', LINE_WORKS_CLIENT_ID ? LINE_WORKS_CLIENT_ID : '未設定');
    console.log('Redirect URI:', redirectUri);
    console.log('Scopes:', LINE_WORKS_SCOPES);

    if (!LINE_WORKS_CLIENT_ID) {
      console.error('❌ LINE_WORKS_CLIENT_ID が設定されていません');
      return NextResponse.json(
        { error: 'LINE WORKS設定が不完全です', details: 'LINE_WORKS_CLIENT_ID が設定されていません' },
        { status: 500 }
      );
    }

    if (!LINE_WORKS_CLIENT_SECRET) {
      console.error('❌ LINE_WORKS_CLIENT_SECRET が設定されていません');
      return NextResponse.json(
        { error: 'LINE WORKS設定が不完全です', details: 'LINE_WORKS_CLIENT_SECRET が設定されていません' },
        { status: 500 }
      );
    }

    // ✅ セキュアなstate生成
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // ✅ LINE WORKS OAuth URL構築
    const authUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', LINE_WORKS_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', LINE_WORKS_SCOPES);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline'); // リフレッシュトークン取得
    authUrl.searchParams.set('prompt', 'consent'); // 管理者同意を促進
    
    console.log('✅ 生成されたLINE WORKS OAuth URL:', authUrl.toString());
    console.log('✅ Redirect URI確認:', authUrl.searchParams.get('redirect_uri'));
    console.log('✅ Scopes確認:', authUrl.searchParams.get('scope'));

    const response = NextResponse.redirect(authUrl.toString());
    
    // ✅ Cookie設定
    response.cookies.set('line_works_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10分間有効
    });

    // ✅ LINE WORKS OAuth開始ログ
    console.log('✅ LINE WORKS OAuth認証開始完了');
    console.log('✅ State設定:', state);

    return response;

  } catch (error) {
    console.error('❌ LINE WORKS OAuth開始エラー:', error);
    
    // ✅ エラー時のリダイレクト
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const errorUrl = new URL('/integrations', baseUrl);
    errorUrl.searchParams.set('error', 'line_works_oauth_failed');
    errorUrl.searchParams.set('message', 'LINE WORKS OAuth認証の開始に失敗しました');
    
    console.log('❌ エラーリダイレクト先:', errorUrl.toString());
    
    return NextResponse.redirect(errorUrl.toString());
  }
}