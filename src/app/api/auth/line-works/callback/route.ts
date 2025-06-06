import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔄 LINE WORKS コールバック処理開始（簡素版）');
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('📋 コールバックパラメータ:', { 
      code: code ? '取得済み' : '未取得', 
      error,
      state: state ? '取得済み' : '未取得'
    });

    // エラーハンドリング
    if (error) {
      console.error('❌ LINE WORKS OAuth エラー:', error);
      return NextResponse.redirect(
        new URL(`/integrations?error=${encodeURIComponent('LINE WORKS認証エラー: ' + error)}`, request.url)
      );
    }

    if (!code) {
      console.error('❌ 認証コードが見つかりません');
      return NextResponse.redirect(
        new URL('/integrations?error=missing_code', request.url)
      );
    }

    // 成功時は統合ページにリダイレクト（データベース保存は後で実装）
    console.log('✅ LINE WORKS認証成功 - 統合ページにリダイレクト');
    return NextResponse.redirect(
      new URL('/integrations?success=true&service=line-works&message=' + encodeURIComponent('LINE WORKS認証は成功しましたが、統合情報の保存は後で実装します'), request.url)
    );

  } catch (error) {
    console.error('❌ LINE WORKS コールバック処理エラー:', error);
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent('コールバック処理エラー')}`, request.url)
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}