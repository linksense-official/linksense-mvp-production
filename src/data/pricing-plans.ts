// src/data/pricing-plans.ts
import { StripePlan, BillingInterval } from '@/types/subscription';

export const billingIntervalConfig = [
  {
    type: 'monthly' as BillingInterval,
    label: '月額',
    description: '毎月の支払い'
  },
  {
    type: 'yearly' as BillingInterval,
    label: '年額',
    description: '年間一括支払い（割引あり）'
  }
];

export const pricingPlans: StripePlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: '小規模チーム向けの基本機能',
    price: 0,
    interval: 'monthly',
    currency: 'JPY',
    status: 'active',
    features: [
      'チームメンバー 3名まで',
      '基本的な健全性分析',
      'メール通知',
      '月次レポート'
    ],
    limits: {
      teams: 1,
      members: 3,
      storage: 1,
      apiCalls: 1000,
      messageAnalysis: 100
    },
    stripeProductId: 'prod_starter',
    stripePriceId: 'price_starter_monthly'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: '成長企業向けの高度な分析機能',
    price: 2980,
    interval: 'monthly',
    currency: 'JPY',
    status: 'active',
    features: [
      'チームメンバー 50名まで',
      '高度な健全性分析',
      'リアルタイム通知',
      'カスタムダッシュボード',
      '週次・月次レポート',
      'API アクセス'
    ],
    limits: {
      teams: 5,
      members: 50,
      storage: 10,
      apiCalls: 10000,
      messageAnalysis: 5000
    },
    isRecommended: true,
    yearlyDiscount: 0.17,
    stripeProductId: 'prod_professional',
    stripePriceId: 'price_professional_monthly'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: '大企業向けのエンタープライズ機能',
    price: 9800,
    interval: 'monthly',
    currency: 'JPY',
    status: 'active',
    features: [
      '無制限チームメンバー',
      'AI駆動の予測分析',
      '24/7 サポート',
      'カスタム統合',
      'シングルサインオン (SSO)',
      '高度なセキュリティ',
      '専任カスタマーサクセス'
    ],
    limits: {
      teams: -1,
      members: -1,
      storage: -1,
      apiCalls: -1,
      messageAnalysis: -1
    },
    yearlyDiscount: 0.15,
    stripeProductId: 'prod_enterprise',
    stripePriceId: 'price_enterprise_monthly'
  }
];

export const isFreeplan = (plan: StripePlan): boolean => {
  return plan.price === 0;
};

export const isRecommendedPlan = (plan: StripePlan): boolean => {
  return plan.isRecommended === true;
};

export const billingIntervals = billingIntervalConfig.map(config => config.type);