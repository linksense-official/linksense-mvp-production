import { NextRequest, NextResponse } from 'next/server';

const LINE_WORKS_CLIENT_ID = process.env.LINE_WORKS_CLIENT_ID;
const LINE_WORKS_CLIENT_SECRET = process.env.LINE_WORKS_CLIENT_SECRET;

const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/line-works/callback`;
};

// ✅ 最適化されたスコープ設定
const LINE_WORKS_SCOPES = 'user.read user.profile.read user.email.read';

// セキュアなstate生成関数
const generateSecureState = () => {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export async function GET(request: NextRequest) {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('=== LINE WORKS OAuth 認証開始 ===');
    console.log('Client ID:', LINE_WORKS_CLIENT_ID ? `${LINE_WORKS_CLIENT_ID.substring(0, 8)}...` : '未設定');
    console.log('Redirect URI:', redirectUri);
    console.log('Scopes:', LINE_WORKS_SCOPES);

    if (!LINE_WORKS_CLIENT_ID || !LINE_WORKS_CLIENT_SECRET) {
      console.error('❌ LINE WORKS環境変数が設定されていません');
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${baseUrl}/integrations?error=line_works_config_missing`);
    }

    // セキュアなstate生成
    const state = generateSecureState();
    
    // LINE WORKS OAuth URL構築
    const authUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize');
    const params = {
      client_id: LINE_WORKS_CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: LINE_WORKS_SCOPES,
      state: state,
    };

    // パラメータを設定
    Object.entries(params).forEach(([key, value]) => {
      authUrl.searchParams.set(key, value);
    });
    
    console.log('✅ 生成されたLINE WORKS OAuth URL:', authUrl.toString());
    console.log('✅ スコープ確認:', authUrl.searchParams.get('scope'));

    // レスポンス作成
    const response = NextResponse.redirect(authUrl.toString());
    
    // セキュアなCookie設定
    response.cookies.set('line_works_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10分間有効
      path: '/'
    });

    console.log('✅ LINE WORKS OAuth認証開始完了');

    return response;

  } catch (error) {
    console.error('❌ LINE WORKS OAuth開始エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const errorUrl = `${baseUrl}/integrations?error=line_works_oauth_failed&message=${encodeURIComponent('LINE WORKS OAuth認証の開始に失敗しました: ' + errorMessage)}`;
    
    return NextResponse.redirect(errorUrl);
  }
}