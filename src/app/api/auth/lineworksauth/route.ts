import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔵 LINE WORKS OAuth開始 - リクエストURL:', request.url);
  
  try {
    const clientId = process.env.LINE_WORKS_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/lineworksauth/callback`;
    
    console.log('🔵 環境変数確認:', { 
      clientId: clientId ? `設定済み(${clientId.substring(0, 5)}...)` : '未設定', 
      redirectUri,
      nextAuthUrl: process.env.NEXTAUTH_URL
    });
    
    if (!clientId) {
      console.error('❌ CLIENT_ID が未設定');
      return NextResponse.redirect(
        new URL('/integrations?error=line_works_client_id_missing', request.url)
      );
    }

    // セキュアなstate生成
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log('🔵 State生成:', state);

    // LINE WORKS OAuth認証URL生成
    const authUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    // authUrl.searchParams.append('scope', 'user.read'); // この行をコメントアウト
    authUrl.searchParams.append('state', state);

    console.log('🔵 LINE WORKS認証URL生成完了:', authUrl.toString());

    // stateをCookieに保存
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('line_works_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10分間有効
    });

    console.log('🔵 Cookie設定完了、リダイレクト実行');
    return response;

  } catch (error) {
    console.error('❌ LINE WORKS OAuth開始エラー:', error);
    return NextResponse.redirect(
      new URL('/integrations?error=line_works_oauth_start_failed', request.url)
    );
  }
}