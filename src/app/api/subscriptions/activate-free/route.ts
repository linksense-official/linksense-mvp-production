// src/app/api/subscriptions/activate-free/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 無料プランアクティベート開始');
    
    const { planId } = await req.json();
    console.log('📋 受信データ:', { planId });

    // プランIDの検証
    if (!planId) {
      console.error('❌ プランIDが指定されていません');
      return NextResponse.json(
        { error: 'プランIDが必要です' },
        { status: 400 }
      );
    }

    // 無料プランかどうかの確認
    if (planId !== 'starter' && planId !== 'price_starter_free') {
      console.error('❌ 無効な無料プランID:', planId);
      return NextResponse.json(
        { error: '無効な無料プランIDです' },
        { status: 400 }
      );
    }

    // 無料プランの情報を生成
    const freeSubscription = {
      id: `free_${Date.now()}`,
      planId: 'starter',
      status: 'active',
      interval: 'monthly',
      isFree: true,
      startDate: new Date().toISOString(),
      features: [
        'チーム健全性基本分析',
        '最大3名まで',
        '月次レポート',
        'メール通知',
        'コミュニティサポート'
      ],
      limits: {
        members: 3,
        teams: 1,
        storage: 1024, // 1GB in MB
        reports: 'monthly'
      }
    };

    console.log('✅ 無料プラン情報生成完了:', freeSubscription);

    // 実際の本番環境では、ここでデータベースに保存
    // await saveSubscriptionToDatabase(freeSubscription);

    console.log('✅ 無料プランアクティベート完了');

    return NextResponse.json({
      success: true,
      subscription: freeSubscription,
      message: '無料プランが正常にアクティベートされました'
    });

  } catch (error) {
    console.error('❌ 無料プランアクティベートエラー:', error);
    
    return NextResponse.json(
      { 
        error: '無料プランのアクティベートに失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}