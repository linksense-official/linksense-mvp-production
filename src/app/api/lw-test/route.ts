import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔄 LINE WORKS TEST - 認証開始確認');
  
  const clientId = process.env.LINE_WORKS_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/lw-test/callback`;
  
  if (!clientId) {
    return NextResponse.json({ error: 'Client ID not found' });
  }

  const state = Math.random().toString(36).substring(2, 15);
  const authUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'user.read');
  authUrl.searchParams.set('state', state);

  console.log('✅ 認証URL生成:', authUrl.toString());

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('line_works_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600
  });

  return response;
}