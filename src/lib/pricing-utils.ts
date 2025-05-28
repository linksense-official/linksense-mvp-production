// src/lib/pricing-utils.ts - 完全再作成版
import type { StripePlan, PriceDisplay, PlanComparison } from '@/types/subscription';

/**
 * 価格を表示用にフォーマット
 */
export function formatPrice(plan: StripePlan, interval: 'monthly' | 'yearly'): PriceDisplay {
  if (plan.isFree) {
    return {
      amount: '無料',
      interval: '',
    };
  }

  const pricing = interval === 'yearly' && plan.pricing.yearly 
    ? plan.pricing.yearly 
    : plan.pricing.monthly;

  const amount = `¥${pricing.price.toLocaleString()}`;
  const intervalText = interval === 'yearly' ? '/年' : '/月';

  let monthlyEquivalent: string | undefined;
  let discount: string | undefined;
  let savings: string | undefined;

  if (interval === 'yearly' && plan.pricing.yearly) {
    const monthlyPrice = Math.round(plan.pricing.yearly.price / 12);
    monthlyEquivalent = `月割り ¥${monthlyPrice.toLocaleString()}`;

    if (plan.pricing.yearly.discount) {
      discount = `${plan.pricing.yearly.discount}% OFF`;
    }

    const yearlyTotal = plan.pricing.monthly.price * 12;
    const savingsAmount = yearlyTotal - plan.pricing.yearly.price;
    savings = `年間 ¥${savingsAmount.toLocaleString()} お得`;
  }

  return {
    amount,
    interval: intervalText,
    monthlyEquivalent,
    discount,
    savings
  };
}

/**
 * プランの比較データを生成
 */
export function generatePlanComparison(plan: StripePlan): PlanComparison | null {
  if (plan.isFree || !plan.pricing.yearly) {
    return null;
  }

  const monthlyPrice = plan.pricing.monthly.price;
  const yearlyPrice = plan.pricing.yearly.price;
  const yearlyTotal = monthlyPrice * 12;
  const savings = yearlyTotal - yearlyPrice;
  const discountPercentage = Math.round((savings / yearlyTotal) * 100);

  return {
    monthly: {
      price: monthlyPrice,
      yearlyTotal
    },
    yearly: {
      price: yearlyPrice,
      monthlyEquivalent: Math.round(yearlyPrice / 12),
      savings,
      discountPercentage
    }
  };
}

/**
 * 適切なpriceIdを取得
 */
export function getPriceId(plan: StripePlan, interval: 'monthly' | 'yearly'): string {
  if (plan.isFree) {
    return plan.pricing.monthly.priceId;
  }

  if (interval === 'yearly' && plan.pricing.yearly) {
    return plan.pricing.yearly.priceId;
  }

  return plan.pricing.monthly.priceId;
}

/**
 * 無料プランかどうかを判定
 */
export function isFreeplan(planId: string): boolean {
  return planId === 'starter' || planId === 'price_starter_free';
}

/**
 * 価格計算ヘルパー
 */
export function calculatePricing(plan: StripePlan): {
  monthly: number;
  yearly: number | null;
  savings: number | null;
  discountPercentage: number | null;
} {
  const monthly = plan.pricing.monthly.price;
  const yearly = plan.pricing.yearly?.price || null;
  
  if (!yearly) {
    return {
      monthly,
      yearly: null,
      savings: null,
      discountPercentage: null
    };
  }

  const yearlyTotal = monthly * 12;
  const savings = yearlyTotal - yearly;
  const discountPercentage = Math.round((savings / yearlyTotal) * 100);

  return {
    monthly,
    yearly,
    savings,
    discountPercentage
  };
}

/**
 * プランの機能制限チェック
 */
export function checkPlanLimits(planId: string, usage: {
  members: number;
  teams: number;
  storage: number;
}): {
  isWithinLimits: boolean;
  exceeded: string[];
} {
  const exceeded: string[] = [];
  
  switch (planId) {
    case 'starter':
      if (usage.members > 3) exceeded.push('メンバー数上限（3名）');
      if (usage.teams > 1) exceeded.push('チーム数上限（1チーム）');
      if (usage.storage > 1024) exceeded.push('ストレージ上限（1GB）');
      break;
    case 'professional':
      if (usage.members > 50) exceeded.push('メンバー数上限（50名）');
      if (usage.teams > 10) exceeded.push('チーム数上限（10チーム）');
      if (usage.storage > 10240) exceeded.push('ストレージ上限（10GB）');
      break;
    case 'enterprise':
      // 無制限
      break;
  }

  return {
    isWithinLimits: exceeded.length === 0,
    exceeded
  };
}