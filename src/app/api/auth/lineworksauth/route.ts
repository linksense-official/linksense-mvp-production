import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.LINE_WORKS_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/lineworksauth/callback`;
    
    console.log('🔵 LINE WORKS OAuth開始');
    console.log('🔵 Client ID:', clientId);
    console.log('🔵 Redirect URI:', redirectUri);
    
    if (!clientId) {
      return NextResponse.redirect(
        new URL('/integrations?error=client_id_missing', request.url)
      );
    }

    const state = Math.random().toString(36).substring(2, 15);

    // LINE WORKS OAuth認証URL生成
    const authUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);

    console.log('🔵 認証URL:', authUrl.toString());

    return NextResponse.redirect(authUrl.toString());

  } catch (error) {
    console.error('❌ エラー:', error);
    return NextResponse.redirect(
      new URL('/integrations?error=oauth_start_failed', request.url)
    );
  }
}