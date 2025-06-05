import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// PKCE用のコードチャレンジ生成
function generateCodeChallenge() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.CHATWORK_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/chatwork/callback`;
    
    console.log('ChatWork OAuth開始 (PKCE対応):', { clientId: clientId ? '設定済み' : '未設定', redirectUri });
    
    if (!clientId) {
      return NextResponse.redirect(
        new URL('/integrations?error=chatwork_client_id_missing', request.url)
      );
    }

    // PKCEコードチャレンジ生成
    const { codeVerifier, codeChallenge } = generateCodeChallenge();
    
    // セキュアなstate生成
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // ChatWork OAuth認証URL生成（PKCE対応）
    const authUrl = new URL('https://www.chatwork.com/packages/oauth2/login.php');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'users.profile.me:read rooms.all:read');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    console.log('ChatWork認証URL生成完了 (PKCE):', authUrl.toString());

    // stateとcodeVerifierをCookieに保存
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('chatwork_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10分間有効
    });
    response.cookies.set('chatwork_code_verifier', codeVerifier, {
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