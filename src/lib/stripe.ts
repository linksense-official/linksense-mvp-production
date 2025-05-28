// src/lib/stripe.ts
import Stripe from 'stripe';

// Stripe インスタンスの作成（最新APIバージョンに更新）
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil', // 最新バージョンに更新
  typescript: true,
});

// Stripe公開可能キーの取得
export const getStripePublishableKey = (): string => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }
  return key;
};

// Webhookシークレットの取得
export const getStripeWebhookSecret = (): string => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  return secret;
};

// Stripe設定の検証
export const validateStripeConfig = (): boolean => {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!secretKey || !publishableKey) {
      console.error('❌ Stripe APIキーが設定されていません');
      return false;
    }

    // キーの形式チェック
    if (!secretKey.startsWith('sk_')) {
      console.error('❌ 無効なStripe秘密キー形式');
      return false;
    }

    if (!publishableKey.startsWith('pk_')) {
      console.error('❌ 無効なStripe公開可能キー形式');
      return false;
    }

    // テスト環境とプロダクション環境の整合性チェック
    const isSecretTest = secretKey.includes('test');
    const isPublishableTest = publishableKey.includes('test');
    
    if (isSecretTest !== isPublishableTest) {
      console.error('❌ Stripeキーの環境が一致しません（テスト/本番）');
      return false;
    }

    console.log('✅ Stripe設定検証完了', {
      environment: isSecretTest ? 'test' : 'live',
      secretKeyPrefix: secretKey.substring(0, 10) + '...',
      publishableKeyPrefix: publishableKey.substring(0, 10) + '...'
    });

    return true;
  } catch (error) {
    console.error('❌ Stripe設定検証エラー:', error);
    return false;
  }
};

// 価格フォーマット用ヘルパー
export const formatStripeAmount = (amount: number, currency: string = 'jpy'): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
};

// Stripe エラーハンドリング
export const handleStripeError = (error: any): string => {
  if (error?.type) {
    switch (error.type) {
      case 'StripeCardError':
        return 'カードが拒否されました。別のカードをお試しください。';
      case 'StripeRateLimitError':
        return 'リクエストが多すぎます。しばらく待ってからお試しください。';
      case 'StripeInvalidRequestError':
        return 'リクエストが無効です。入力内容をご確認ください。';
      case 'StripeAPIError':
        return 'Stripe APIでエラーが発生しました。';
      case 'StripeConnectionError':
        return 'ネットワークエラーが発生しました。';
      case 'StripeAuthenticationError':
        return '認証エラーが発生しました。';
      default:
        return error.message || '決済処理でエラーが発生しました。';
    }
  }
  return '予期しないエラーが発生しました。';
};

// Webhook検証用
export const constructWebhookEvent = (body: string, signature: string): Stripe.Event => {
  const webhookSecret = getStripeWebhookSecret();
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
};