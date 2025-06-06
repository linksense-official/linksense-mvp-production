import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🚨🚨🚨 LINE WORKS 認証開始ファイルが実行されました！');
  console.log('🔍 リクエストURL:', request.url);
  console.log('🔍 環境変数確認:', {
    clientId: process.env.LINE_WORKS_CLIENT_ID ? '設定済み' : '未設定',
    nextAuthUrl: process.env.NEXTAUTH_URL
  });
  
  // 一時的に強制的にエラーを発生させて確認
  return NextResponse.redirect(
    new URL('/integrations?error=debug_test&message=認証ファイルが実行されました', request.url)
  );
}