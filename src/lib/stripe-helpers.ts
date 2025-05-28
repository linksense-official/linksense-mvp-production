// src/lib/stripe-helpers.ts
import type Stripe from 'stripe';

/**
 * Stripe Subscriptionから期間情報を安全に取得
 */
export interface SubscriptionPeriod {
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export const getSubscriptionPeriod = (subscription: Stripe.Subscription): SubscriptionPeriod => {
  // Stripe APIの実際のレスポンスからプロパティを取得
  const subscriptionData = subscription as any;
  
  return {
    currentPeriodStart: subscriptionData.current_period_start ?? 0,
    currentPeriodEnd: subscriptionData.current_period_end ?? 0,
    cancelAtPeriodEnd: subscriptionData.cancel_at_period_end ?? false
  };
};

/**
 * Stripe Subscriptionから価格情報を安全に取得
 */
export interface SubscriptionPrice {
  priceId: string;
  amount: number;
  currency: string;
  interval: string;
}

export const getSubscriptionPrice = (subscription: Stripe.Subscription): SubscriptionPrice => {
  const firstItem = subscription.items.data[0];
  
  return {
    priceId: firstItem?.price.id ?? '',
    amount: firstItem?.price.unit_amount ?? 0,
    currency: firstItem?.price.currency ?? 'jpy',
    interval: firstItem?.price.recurring?.interval ?? 'monthly'
  };
};

/**
 * Stripe Customerから顧客情報を安全に取得
 */
export interface CustomerInfo {
  id: string;
  email: string | null;
}

export const getCustomerInfo = (customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): CustomerInfo => {
  if (!customer) {
    return { id: '', email: null };
  }
  
  if (typeof customer === 'string') {
    return { id: customer, email: null };
  }
  
  if ('email' in customer) {
    return { 
      id: customer.id, 
      email: (customer as Stripe.Customer).email 
    };
  }
  
  return { id: customer.id, email: null };
};

/**
 * プランIDを価格IDから判定
 */
export const determinePlanId = (priceId: string): string => {
  if (priceId.includes('professional')) {
    return 'professional';
  } else if (priceId.includes('enterprise')) {
    return 'enterprise';
  } else if (priceId.includes('starter')) {
    return 'starter';
  }
  return 'unknown';
};