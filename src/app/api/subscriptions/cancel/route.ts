// src/app/api/subscriptions/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

interface CancelRequest {
  subscriptionId: string;
  immediate?: boolean;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log('🚀 サブスクリプションキャンセル開始');
    
    const body: CancelRequest = await req.json();
    const { subscriptionId, immediate = false } = body;
    
    console.log('📋 受信データ:', { subscriptionId, immediate });

    if (!subscriptionId) {
      console.error('❌ サブスクリプションIDが指定されていません');
      return NextResponse.json(
        { error: 'サブスクリプションIDが必要です' },
        { status: 400 }
      );
    }

    console.log('🔍 サブスクリプション取得中:', subscriptionId);
    
    // 現在のサブスクリプション情報を取得
    const currentSubscription: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('✅ 現在のサブスクリプション状態:', currentSubscription.status);

    let canceledSubscription: Stripe.Subscription;

    if (immediate) {
      // 即座にキャンセル
      console.log('⚡ 即座にキャンセル実行');
      canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
    } else {
      // 期間終了時にキャンセル
      console.log('📅 期間終了時にキャンセル設定');
      canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    }

    // 期間の安全な取得（型アサーションを使用）
    const currentPeriodEnd: number = (canceledSubscription as any).current_period_end;
    const cancelAtPeriodEnd: boolean = (canceledSubscription as any).cancel_at_period_end ?? false;

    console.log('✅ キャンセル処理完了:', {
      id: canceledSubscription.id,
      status: canceledSubscription.status,
      cancel_at_period_end: cancelAtPeriodEnd,
      current_period_end: currentPeriodEnd
    });

    const result = {
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancelAtPeriodEnd,
        currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
        canceledAt: immediate ? new Date().toISOString() : null,
        accessUntil: new Date(currentPeriodEnd * 1000).toISOString()
      },
      message: immediate 
        ? 'サブスクリプションが即座にキャンセルされました'
        : `サブスクリプションは${new Date(currentPeriodEnd * 1000).toLocaleDateString('ja-JP')}まで利用可能です`
    };

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('❌ サブスクリプションキャンセルエラー:', error);
    
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as { type: string; message: string };
      if (stripeError.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          { 
            error: 'サブスクリプションが見つかりません',
            details: stripeError.message
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'サブスクリプションのキャンセルに失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}