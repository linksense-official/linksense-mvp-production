import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.LINE_WORKS_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/lineworksfinal/callback`;
    
    console.log('LINE WORKS OAuth開始 (ChatWork方式):', { clientId: clientId ? '設定済み' : '未設定', redirectUri });
    
    if (!clientId) {
      return NextResponse.redirect(
        new URL('/integrations?error=line_works_client_id_missing', request.url)
      );
    }

    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const authUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'user.read');
    authUrl.searchParams.append('state', state);

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