import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔍 DEBUG - 環境変数確認');
  console.log('🔍 CLIENT_ID:', process.env.LINE_WORKS_CLIENT_ID);
  console.log('🔍 CLIENT_SECRET:', process.env.LINE_WORKS_CLIENT_SECRET ? '設定済み' : '未設定');
  console.log('🔍 NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  
  const clientId = process.env.LINE_WORKS_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/lineworksauth/callback`;
  
  // 実際に生成されるURLを確認
  const authUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize');
  authUrl.searchParams.append('client_id', clientId!);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('state', 'test-state');
  
  console.log('🔍 生成URL:', authUrl.toString());
  
  // 一時的にエラーページに飛ばして確認
  return NextResponse.redirect(
    new URL(`/integrations?debug=true&clientId=${encodeURIComponent(clientId || 'MISSING')}&redirectUri=${encodeURIComponent(redirectUri)}`, request.url)
  );
}