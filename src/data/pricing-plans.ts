// src/data/pricing-plans.ts - StripePlanの構造を既存 pricing-utils.ts に合わせる
import { StripePlan, BillingInterval } from '@/types/subscription';

export const billingIntervals: BillingInterval[] = [
  {
    type: 'monthly',
    label: '月額',
    description: '毎月の支払い'
  },
  {
    type: 'yearly',
    label: '年額',
    description: '年間一括支払い（割引あり）'
  }
];

export const pricingPlans: StripePlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: '小規模チーム向けの基本機能',
    pricing: {
      monthly: { price: 0, priceId: 'price_starter_monthly' },
      yearly: { price: 0, priceId: 'price_starter_yearly' }
    },
    currency: 'JPY',
    features: [
      'チームメンバー 3名まで',
      '基本的な健全性分析',
      'メール通知',
      '月次レポート'
    ],
    isFree: true // 既存 pricing-utils.ts の isFreeplan に対応
  },
  {
    id: 'professional',
    name: 'Professional',
    description: '成長企業向けの高度な分析機能',
    pricing: {
      monthly: { price: 2980, priceId: 'price_professional_monthly' },
      yearly: { price: 29800, priceId: 'price_professional_yearly', discount: 17 }
    },
    currency: 'JPY',
    features: [
      'チームメンバー 50名まで',
      '高度な健全性分析',
      'リアルタイム通知',
      'カスタムダッシュボード',
      '週次・月次レポート',
      'API アクセス'
    ],
    recommended: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: '大企業向けのエンタープライズ機能',
    pricing: {
      monthly: { price: 9800, priceId: 'price_enterprise_monthly' },
      yearly: { price: 99800, priceId: 'price_enterprise_yearly', discount: 15 }
    },
    currency: 'JPY',
    features: [
      '無制限チームメンバー',
      'AI駆動の予測分析',
      '24/7 サポート',
      'カスタム統合',
      'シングルサインオン (SSO)',
      '高度なセキュリティ',
      '専任カスタマーサクセス'
    ]
  }
];