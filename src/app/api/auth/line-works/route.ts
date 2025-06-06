import { NextRequest, NextResponse } from 'next/server';

const LINE_WORKS_CLIENT_ID = process.env.LINE_WORKS_CLIENT_ID;
const LINE_WORKS_CLIENT_SECRET = process.env.LINE_WORKS_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  console.log('🔄 LINE WORKS OAuth 認証開始 - 強制再作成版');
  
  try {
    if (!LINE_WORKS_CLIENT_ID || !LINE_WORKS_CLIENT_SECRET) {
      console.error('❌ LINE WORKS環境変数が設定されていません');
      return NextResponse.redirect(
        new URL('/integrations?error=line_works_config_missing', request.url)
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/line-works/callback`;
    const state = Math.random().toString(36).substring(2, 15);
    
    console.log('LINE WORKS OAuth開始:', { redirectUri });
    
    // LINE WORKS OAuth URL構築
    const authUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', LINE_WORKS_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'user.read user.profile.read user.email.read');
    authUrl.searchParams.set('state', state);
    
    console.log('✅ LINE WORKS認証URL:', authUrl.toString());
    
    const response = NextResponse.redirect(authUrl.toString());
    
    response.cookies.set('line_works_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('❌ LINE WORKS OAuth開始エラー:', error);
    return NextResponse.redirect(
      new URL('/integrations?error=line_works_oauth_start_failed', request.url)
    );
  }
}