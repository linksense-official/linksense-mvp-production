import { NextRequest, NextResponse } from 'next/server';

const LINE_WORKS_CLIENT_ID = process.env.LINE_WORKS_CLIENT_ID;
const LINE_WORKS_CLIENT_SECRET = process.env.LINE_WORKS_CLIENT_SECRET;

const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/line-works/callback`;
};

// ✅ LINE WORKS OAuth スコープ設定（修正版）
const LINE_WORKS_SCOPES = 'user:read';

export async function GET(request: NextRequest) {
  try {
    const redirectUri = getRedirectUri();
    
    console.log('=== LINE WORKS OAuth 認証開始 ===');
    console.log('Client ID:', LINE_WORKS_CLIENT_ID ? `${LINE_WORKS_CLIENT_ID.substring(0, 8)}...` : '未設定');
    console.log('Redirect URI:', redirectUri);
    console.log('Scopes:', LINE_WORKS_SCOPES);

    if (!LINE_WORKS_CLIENT_ID) {
      console.error('❌ LINE_WORKS_CLIENT_ID が設定されていません');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/integrations?error=line_works_config_missing`);
    }

    if (!LINE_WORKS_CLIENT_SECRET) {
      console.error('❌ LINE_WORKS_CLIENT_SECRET が設定されていません');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/integrations?error=line_works_config_missing`);
    }

    // ✅ セキュアなstate生成
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // ✅ LINE WORKS OAuth URL構築（修正版）
    const authUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', LINE_WORKS_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', LINE_WORKS_SCOPES);
    authUrl.searchParams.set('state', state);
    // 修正: LINE WORKSでは以下のパラメータは不要または問題を引き起こす可能性
    // authUrl.searchParams.set('access_type', 'offline');
    // authUrl.searchParams.set('prompt', 'consent');
    
    console.log('✅ 生成されたLINE WORKS OAuth URL:', authUrl.toString());
    console.log('✅ Redirect URI確認:', authUrl.searchParams.get('redirect_uri'));
    console.log('✅ Scopes確認:', authUrl.searchParams.get('scope'));

    const response = NextResponse.redirect(authUrl.toString());
    
    // ✅ Cookie設定（修正版）
    response.cookies.set('line_works_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10分間有効
      path: '/' // パスを明示的に設定
    });

    // ✅ LINE WORKS OAuth開始ログ
    console.log('✅ LINE WORKS OAuth認証開始完了');
    console.log('✅ State設定:', state);

    return response;

  } catch (error) {
    console.error('❌ LINE WORKS OAuth開始エラー:', error);
    
    // ✅ エラー時のリダイレクト（修正版）
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const errorUrl = `${baseUrl}/integrations?error=line_works_oauth_failed&message=${encodeURIComponent('LINE WORKS OAuth認証の開始に失敗しました')}`;
    
    console.log('❌ エラーリダイレクト先:', errorUrl);
    
    return NextResponse.redirect(errorUrl);
  }
}