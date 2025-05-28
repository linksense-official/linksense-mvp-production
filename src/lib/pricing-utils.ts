// src/lib/pricing-utils.ts
import type { StripePlan, PriceDisplay, BillingInterval } from '@/types/subscription';

export function formatPrice(plan: StripePlan, interval: BillingInterval): PriceDisplay {
  if (plan.price === 0) {
    return {
      amount: 0,
      currency: plan.currency,
      interval: interval,
      formatted: '無料'
    };
  }

  let price = plan.price;
  
  if (interval === 'yearly' && plan.yearlyDiscount) {
    const yearlyPrice = plan.price * 12;
    price = Math.round(yearlyPrice * (1 - plan.yearlyDiscount));
  }

  const formatted = `¥${price.toLocaleString()}${interval === 'yearly' ? '/年' : '/月'}`;

  const result: PriceDisplay = {
    amount: price,
    currency: plan.currency,
    interval: interval,
    formatted: formatted
  };

  if (interval === 'yearly' && plan.yearlyDiscount) {
    const yearlyTotal = plan.price * 12;
    const savings = yearlyTotal - price;
    const discountPercentage = Math.round(plan.yearlyDiscount * 100);

    result.originalAmount = yearlyTotal;
    result.discountPercentage = discountPercentage;
  }

  return result;
}

export function generatePlanComparison(plan: StripePlan) {
  if (plan.price === 0 || !plan.yearlyDiscount) {
    return null;
  }

  const monthlyPrice = plan.price;
  const yearlyTotal = monthlyPrice * 12;
  const yearlyPrice = Math.round(yearlyTotal * (1 - plan.yearlyDiscount));
  const savings = yearlyTotal - yearlyPrice;
  const discountPercentage = Math.round(plan.yearlyDiscount * 100);

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

export function getPriceId(plan: StripePlan, interval: BillingInterval): string {
  if (plan.price === 0) {
    return plan.stripePriceId || `price_${plan.id}_free`;
  }

  if (interval === 'yearly' && plan.yearlyDiscount) {
    return plan.stripePriceId?.replace('_monthly', '_yearly') || `price_${plan.id}_yearly`;
  }

  return plan.stripePriceId || `price_${plan.id}_monthly`;
}

export function isFreeplan(plan: StripePlan | string): boolean {
  if (typeof plan === 'string') {
    return plan === 'starter' || plan === 'price_starter_free';
  }
  return plan.price === 0;
}

export function isRecommendedPlan(plan: StripePlan): boolean {
  return plan.isRecommended === true;
}