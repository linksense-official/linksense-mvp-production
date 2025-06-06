import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔄 LINE WORKS OAuth 認証開始 - 新パス版');
  
  try {
    const clientId = process.env.LINE_WORKS_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/lineworks/callback`;
    
    console.log('LINE WORKS OAuth開始:', { clientId: clientId ? '設定済み' : '未設定', redirectUri });
    
    if (!clientId) {
      return NextResponse.redirect(
        new URL('/integrations?error=line_works_client_id_missing', request.url)
      );
    }

    const state = Math.random().toString(36).substring(2, 15);

    const authUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'user.read user.profile.read user.email.read');
    authUrl.searchParams.set('state', state);

    console.log('LINE WORKS認証URL生成完了:', authUrl.toString());

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('line_works_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600
    });

    return response;

  } catch (error) {
    console.error('LINE WORKS OAuth開始エラー:', error);
    return NextResponse.redirect(
      new URL('/integrations?error=line_works_oauth_start_failed', request.url)
    );
  }
}
