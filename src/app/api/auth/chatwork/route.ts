import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.CHATWORK_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/chatwork/callback`;
    
    console.log('ChatWork OAuth開始:', { clientId: clientId ? '設定済み' : '未設定', redirectUri });
    
    if (!clientId) {
      return NextResponse.redirect(
        new URL('/integrations?error=chatwork_client_id_missing', request.url)
      );
    }

    // セキュアなstate生成
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // ChatWork OAuth認証URL生成
    const authUrl = new URL('https://oauth.chatwork.com/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'users.profile.me:read rooms.all:read');
    authUrl.searchParams.append('state', state);

    console.log('ChatWork認証URL生成完了:', authUrl.toString());

    // stateをCookieに保存
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('chatwork_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10分間有効
    });

    return response;

  } catch (error) {
    console.error('ChatWork OAuth開始エラー:', error);
    return NextResponse.redirect(
      new URL('/integrations?error=chatwork_oauth_start_failed', request.url)
    );
  }
}