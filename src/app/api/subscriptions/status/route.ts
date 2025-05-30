// src/app/api/subscriptions/status/route.ts - 修正版
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { 
  getSubscriptionPeriod, 
  getSubscriptionPrice, 
  getCustomerInfo, 
  determinePlanId 
} from '@/lib/stripe-helpers';

// ✅ Stripe初期化を直接実行（環境変数チェック付き）
const initializeStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn('STRIPE_SECRET_KEY not found, Stripe functionality will be mocked');
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-05-28.basil',
  });
};

const stripe = initializeStripe();

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    console.log('🚀 サブスクリプション状態取得開始');
    
    const { searchParams } = new URL(req.url);
    const subscriptionId: string | null = searchParams.get('subscription_id');
    const userId: string = searchParams.get('user_id') ?? 'demo-user';

    console.log('📋 受信パラメータ:', { subscriptionId, userId });

    // 無料プランの場合（subscriptionIdがない）
    if (!subscriptionId) {
      console.log('💰 無料プランユーザーの状態を返します');
      
      const freeStatus = {
        planId: 'starter',
        status: 'free',
        interval: 'monthly',
        isFree: true,
        isActive: true,
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
          storage: 1024,
          reports: 'monthly'
        },
        usage: {
          members: 0,
          teams: 0,
          storage: 0
        }
      };

      return NextResponse.json({
        success: true,
        subscription: freeStatus
      });
    }

    // ✅ Stripe未初期化時のモック応答
    if (!stripe) {
      console.log('🔧 Development mode: Stripe not configured, returning mock subscription status');
      
      const mockStatus = {
        subscriptionId: subscriptionId,
        planId: 'professional',
        priceId: 'price_mock_professional',
        status: 'active',
        interval: 'monthly',
        amount: 2000,
        currency: 'jpy',
        isFree: false,
        isActive: true,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        customer: {
          id: 'mock_customer',
          email: 'demo@example.com',
          name: 'Demo User'
        },
        features: [
          'チーム健全性詳細分析',
          '最大50名まで',
          'リアルタイム監視',
          'カスタムダッシュボード',
          'API連携',
          '週次レポート',
          '優先サポート'
        ],
        limits: {
          members: 50,
          teams: 10,
          storage: 10240,
          reports: 'weekly'
        }
      };

      return NextResponse.json({
        success: true,
        subscription: mockStatus
      });
    }

    // Stripeからサブスクリプション情報を取得
    console.log('🔍 Stripeサブスクリプション取得中:', subscriptionId);
    
    const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'customer', 'items.data.price']
    });

    // ヘルパー関数を使用して安全にデータを取得
    const period = getSubscriptionPeriod(subscription);
    const price = getSubscriptionPrice(subscription);
    const customer = getCustomerInfo(subscription.customer);
    const planId = determinePlanId(price.priceId);

    console.log('✅ Stripeサブスクリプション取得完了:', {
      id: subscription.id,
      status: subscription.status,
      current_period_start: period.currentPeriodStart,
      current_period_end: period.currentPeriodEnd
    });

    const subscriptionStatus = {
      subscriptionId: subscription.id,
      planId,
      priceId: price.priceId,
      status: subscription.status,
      interval: price.interval,
      amount: price.amount / 100, // セントから円に変換
      currency: price.currency,
      isFree: false,
      isActive: subscription.status === 'active',
      currentPeriodStart: new Date(period.currentPeriodStart * 1000).toISOString(),
      currentPeriodEnd: new Date(period.currentPeriodEnd * 1000).toISOString(),
      cancelAtPeriodEnd: period.cancelAtPeriodEnd,
      customer,
      features: planId === 'professional' ? [
        'チーム健全性詳細分析',
        '最大50名まで',
        'リアルタイム監視',
        'カスタムダッシュボード',
        'API連携',
        '週次レポート',
        '優先サポート'
      ] : planId === 'enterprise' ? [
        '無制限ユーザー',
        'AI予測分析',
        'カスタムインテグレーション',
        '専任サポート',
        'オンプレミス対応',
        'SLA保証',
        '日次レポート'
      ] : [],
      limits: planId === 'professional' ? {
        members: 50,
        teams: 10,
        storage: 10240, // 10GB
        reports: 'weekly'
      } : planId === 'enterprise' ? {
        members: -1, // unlimited
        teams: -1,
        storage: -1,
        reports: 'daily'
      } : {
        members: 3,
        teams: 1,
        storage: 1024,
        reports: 'monthly'
      }
    };

    console.log('✅ サブスクリプション状態生成完了');

    return NextResponse.json({
      success: true,
      subscription: subscriptionStatus
    });

  } catch (error: unknown) {
    console.error('❌ サブスクリプション状態取得エラー:', error);
    
    // Stripeエラーの場合の詳細処理
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
        error: 'サブスクリプション状態の取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}