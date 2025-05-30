// src/app/api/subscriptions/create/route.ts - 修正版
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { isFreeplan } from '@/lib/pricing-utils';

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
  try {
    console.log('🚀 決済セッション作成開始');
    
    // ✅ Stripe未初期化時のモック応答
    if (!stripe) {
      console.log('🔧 Development mode: Stripe not configured, returning mock response');
      const body = await req.json();
      const { priceId, customerEmail, customerName } = body;
      
      return NextResponse.json({ 
        success: true,
        url: '/subscription/success?session_id=mock_session_dev',
        sessionId: 'mock_session_dev_' + Date.now(),
        customerId: 'mock_customer_dev',
        planId: 'professional',
        interval: 'monthly',
        metadata: {
          priceId,
          customerEmail,
          customerName
        }
      });
    }
    
    const body = await req.json();
    console.log('📋 受信データ（生データ）:', body);

    // フロントエンドからの新しい形式に対応
    const { 
      priceId, 
      customerEmail, 
      customerName,
      // 従来の形式もサポート（後方互換性）
      planId: legacyPlanId,
      interval: legacyInterval,
      successUrl: legacySuccessUrl,
      cancelUrl: legacyCancelUrl
    } = body;

    console.log('🔍 パラメータ解析結果:', {
      priceId,
      customerEmail,
      customerName,
      legacyPlanId,
      legacyInterval,
      legacySuccessUrl,
      legacyCancelUrl
    });

    // 新しい形式の必須パラメータチェック
    if (!priceId) {
      console.error('❌ priceId が不足しています');
      return NextResponse.json(
        { error: 'priceId が必要です' },
        { status: 400 }
      );
    }

    if (!customerEmail) {
      console.error('❌ customerEmail が不足しています');
      return NextResponse.json(
        { error: 'customerEmail が必要です' },
        { status: 400 }
      );
    }

    if (!customerName) {
      console.error('❌ customerName が不足しています');
      return NextResponse.json(
        { error: 'customerName が必要です' },
        { status: 400 }
      );
    }

    // 価格IDからプラン情報を推定
    let planId = 'unknown';
    let interval = 'monthly';
    
    if (priceId.includes('professional')) {
      planId = 'professional';
    } else if (priceId.includes('enterprise')) {
      planId = 'enterprise';
    } else {
      // 実際の価格IDから判定
      if (priceId === 'price_1RTaJCKlf7AhzzPJdCSh5Qck') {
        planId = 'professional';
        interval = 'monthly';
      } else if (priceId === 'price_1RTaJVKlf7AhzzPJzGyJyjgi') {
        planId = 'enterprise';
        interval = 'monthly';
      }
    }

    console.log('🎯 推定プラン情報:', { planId, interval });

    // 無料プランの場合はエラー
    if (isFreeplan(planId)) {
      console.log('⚠️ 無料プランが指定されました');
      return NextResponse.json(
        { error: '無料プランは決済不要です' },
        { status: 400 }
      );
    }

    console.log('🔑 Stripe APIキー確認:', process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...');

    // 顧客を作成または取得
    console.log('👤 顧客作成中...');
    let customer;
    
    try {
      // 既存の顧客を検索
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('✅ 既存顧客を使用:', customer.id);
      } else {
        // 新しい顧客を作成
        customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          metadata: {
            planId,
            interval,
            source: 'linksense-mvp'
          }
        });
        console.log('✅ 新規顧客作成完了:', customer.id);
      }
    } catch (customerError) {
      console.error('❌ 顧客作成エラー:', customerError);
      return NextResponse.json(
        { error: '顧客情報の処理に失敗しました' },
        { status: 500 }
      );
    }

    // 価格の存在確認
    console.log('💰 価格確認中:', priceId);
    try {
      const price = await stripe.prices.retrieve(priceId);
      console.log('✅ 価格確認完了:', {
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval
      });

      // 間隔の整合性チェック
      if (price.recurring?.interval && price.recurring.interval !== interval) {
        console.warn('⚠️ 価格の間隔を調整:', {
          priceInterval: price.recurring.interval,
          adjustedInterval: price.recurring.interval
        });
        interval = price.recurring.interval;
      }
    } catch (priceError) {
      console.error('❌ 価格が見つかりません:', priceError);
      return NextResponse.json(
        { 
          error: `価格ID '${priceId}' が見つかりません。Stripeダッシュボードで正しい価格IDを確認してください。`,
          details: priceError instanceof Error ? priceError.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // URLを動的に生成
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = legacySuccessUrl || `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = legacyCancelUrl || `${baseUrl}/subscription`;

    console.log('🔗 リダイレクトURL:', { successUrl, cancelUrl });

    // Checkout セッションを作成
    console.log('🛒 Checkoutセッション作成中...');
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: 'demo-user', // 実際の実装ではJWTから取得
        userEmail: customerEmail,
        planId,
        interval,
        source: 'linksense-mvp'
      },
      subscription_data: {
        metadata: {
          planId,
          interval,
          userEmail: customerEmail,
          source: 'linksense-mvp'
        }
      },
      // 請求先情報の収集
      billing_address_collection: 'required',
      // 税金計算（日本の場合）
      automatic_tax: {
        enabled: true,
      },
      // カスタマーポータルの設定
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      // 支払い方法の設定
      payment_method_configuration: undefined, // デフォルト設定を使用
      // セッションの有効期限
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30分後
    });

    console.log('✅ Checkoutセッション作成完了:', {
      id: checkoutSession.id,
      url: checkoutSession.url,
      customer: checkoutSession.customer,
      mode: checkoutSession.mode,
      amount_total: checkoutSession.amount_total,
      currency: checkoutSession.currency
    });

    return NextResponse.json({ 
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      customerId: customer.id,
      planId,
      interval,
      metadata: {
        priceId,
        customerEmail,
        customerName
      }
    });

  } catch (error) {
    console.error('❌ Stripe checkout session creation failed:', error);
    
    // エラーの詳細をログ出力
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('エラースタック:', error.stack);
    }

    // Stripeエラーの場合は詳細情報を含める
    let errorMessage = '決済セッションの作成に失敗しました';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';

    if (error && typeof error === 'object' && 'type' in error) {
      // Stripe specific error
      const stripeError = error as any;
      errorMessage = `Stripeエラー: ${stripeError.type}`;
      errorDetails = stripeError.message || errorDetails;
      
      console.error('🔍 Stripeエラー詳細:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        param: stripeError.param
      });
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// OPTIONS メソッドのサポート（CORS対応）
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}