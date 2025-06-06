import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔄 LINE WORKS コールバック処理開始');
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('📋 コールバックパラメータ:', { 
      code: code ? `${code.substring(0, 10)}...` : '未取得', 
      error,
      state: state ? `${state.substring(0, 10)}...` : '未取得',
      fullUrl: request.url
    });

    if (error) {
      console.error('❌ LINE WORKS OAuth エラー:', error);
      const errorUrl = `${process.env.NEXTAUTH_URL}/integrations?error=${encodeURIComponent('LINE WORKS認証エラー: ' + error)}`;
      return NextResponse.redirect(errorUrl, 302);
    }

    if (!code) {
      console.error('❌ 認証コードが見つかりません');
      const errorUrl = `${process.env.NEXTAUTH_URL}/integrations?error=missing_code`;
      return NextResponse.redirect(errorUrl, 302);
    }

    // 成功時のリダイレクト
    console.log('✅ LINE WORKS認証成功 - 統合ページにリダイレクト');
    const successUrl = `${process.env.NEXTAUTH_URL}/integrations?success=true&service=line-works&code=${encodeURIComponent(code.substring(0, 10))}`;
    return NextResponse.redirect(successUrl, 302);

  } catch (error) {
    console.error('❌ LINE WORKS コールバック処理エラー:', error);
    const errorUrl = `${process.env.NEXTAUTH_URL}/integrations?error=${encodeURIComponent('コールバック処理エラー')}`;
    return NextResponse.redirect(errorUrl, 302);
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}