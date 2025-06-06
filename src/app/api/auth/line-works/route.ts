import { NextRequest, NextResponse } from 'next/server';

const LINE_WORKS_CLIENT_ID = process.env.LINE_WORKS_CLIENT_ID;
const LINE_WORKS_CLIENT_SECRET = process.env.LINE_WORKS_CLIENT_SECRET;

const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/line-works/callback`;
};

const LINE_WORKS_SCOPES = 'user.read user.profile.read user.email.read';

const generateSecureState = () => {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export async function GET(request: NextRequest) {
  console.log('🔄 LINE WORKS OAuth 認証開始');
  
  try {
    const redirectUri = getRedirectUri();
    
    console.log('📋 環境変数確認:', {
      clientId: LINE_WORKS_CLIENT_ID ? '設定済み' : '未設定',
      clientSecret: LINE_WORKS_CLIENT_SECRET ? '設定済み' : '未設定',
      redirectUri,
      baseUrl: process.env.NEXTAUTH_URL
    });

    if (!LINE_WORKS_CLIENT_ID || !LINE_WORKS_CLIENT_SECRET) {
      console.error('❌ LINE WORKS環境変数が設定されていません');
      const errorUrl = `${process.env.NEXTAUTH_URL}/integrations?error=line_works_config_missing`;
      return NextResponse.redirect(errorUrl);
    }

    const state = generateSecureState();
    
    // LINE WORKS OAuth URL構築
    const authUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', LINE_WORKS_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', LINE_WORKS_SCOPES);
    authUrl.searchParams.set('state', state);
    
    console.log('✅ LINE WORKS OAuth URL生成完了:', authUrl.toString());
    
    // 修正: NextResponse.redirect の使い方を明示的に
    const response = NextResponse.redirect(authUrl.toString(), 302); // 明示的に302を指定
    
    // セキュアなCookie設定
    response.cookies.set('line_works_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/'
    });

    console.log('✅ LINE WORKS認証画面にリダイレクト実行');
    return response;

  } catch (error) {
    console.error('❌ LINE WORKS OAuth開始エラー:', error);
    const errorUrl = `${process.env.NEXTAUTH_URL}/integrations?error=line_works_oauth_failed`;
    return NextResponse.redirect(errorUrl, 302);
  }
}