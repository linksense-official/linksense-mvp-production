// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

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

export async function POST(req: NextRequest) {
  // ✅ Stripe未初期化時のモック応答
  if (!stripe) {
    console.log('🔧 Development mode: Stripe not configured, returning webhook success');
    return NextResponse.json({ received: true, mode: 'development' });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('Stripe signature missing');
    return NextResponse.json(
      { error: 'Stripe signature missing' },
      { status: 400 }
    );
  }

  // ✅ Webhook secret の存在確認
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not found, accepting webhook without verification');
    return NextResponse.json({ received: true, verified: false });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    console.log('📨 Webhook受信:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`🔄 未処理のイベントタイプ: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook処理エラー:', error);
    return NextResponse.json(
      { error: 'Webhook処理に失敗しました' },
      { status: 500 }
    );
  }
}

// Webhook処理関数
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('✅ 決済完了:', session.id);
  console.log('💰 金額:', session.amount_total);
  console.log('👤 顧客:', session.customer);
  
  // 実際のアプリケーションでは、ここでユーザーのプラン情報をデータベースに保存
  // 今回はデモなのでログ出力のみ
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💳 支払い成功:', invoice.id);
  console.log('📅 期間:', new Date(invoice.period_start! * 1000), '-', new Date(invoice.period_end! * 1000));
  
  // 実際のアプリケーションでは、ここでユーザーの支払い履歴を更新
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ 支払い失敗:', invoice.id);
  console.log('👤 顧客:', invoice.customer);
  
  // 実際のアプリケーションでは、ここで顧客への通知処理を追加
  // 例：メール送信、アカウント一時停止など
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🆕 サブスクリプション作成:', subscription.id);
  console.log('📋 プラン:', subscription.items.data[0].price.id);
  console.log('👤 顧客:', subscription.customer);
  
  // 実際のアプリケーションでは、ここでユーザー権限を更新
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 サブスクリプション更新:', subscription.id);
  console.log('📊 ステータス:', subscription.status);
  
  // 実際のアプリケーションでは、ここでユーザー権限を更新
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🗑️ サブスクリプション削除:', subscription.id);
  
  // 実際のアプリケーションでは、ここでユーザー権限を削除
}