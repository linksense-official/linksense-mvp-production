import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔄 ChatWork コールバック処理開始（テスト版）');
  console.log('Request URL:', request.url);
  
  try {
    // URLパラメータ取得
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('📋 ChatWorkコールバックパラメータ:', { 
      code: code ? '取得済み' : '未取得', 
      state, 
      error 
    });

    // 成功時のリダイレクト（一時的）
    console.log('✅ ChatWork コールバック受信確認 - 統合ページにリダイレクト');
    return NextResponse.redirect(
      new URL(`/integrations?debug=chatwork_callback&code=${code ? 'received' : 'missing'}&error=${error || 'none'}`, request.url)
    );

  } catch (error) {
    console.error('❌ ChatWork コールバック処理中にエラー:', error);
    return NextResponse.redirect(
      new URL('/integrations?debug=callback_error', request.url)
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}