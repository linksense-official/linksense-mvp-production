// src/hooks/useSubscription.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StripeSubscriptionState } from '@/types/subscription';

interface UseSubscriptionReturn {
  subscription: StripeSubscriptionState | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isFreePlan: boolean;
  isPaidPlan: boolean;
  canAccess: (feature: string) => boolean;
}

export const useSubscription = (userId?: string): UseSubscriptionReturn => {
  const [subscription, setSubscription] = useState<StripeSubscriptionState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // ローカルストレージから基本情報を取得
      const localPlan: string | null = localStorage.getItem('currentPlan');
      const localInterval: 'monthly' | 'yearly' = (localStorage.getItem('billingInterval') as 'monthly' | 'yearly') ?? 'monthly';
      const localSubscriptionId: string | null = localStorage.getItem('subscriptionId');

      console.log('🔍 ローカル情報確認:', { localPlan, localInterval, localSubscriptionId });

      // APIから最新状態を取得
      const params = new URLSearchParams();
      if (localSubscriptionId) {
        params.append('subscription_id', localSubscriptionId);
      }
      if (userId) {
        params.append('user_id', userId);
      }

      const response: Response = await fetch(`/api/subscriptions/status?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('サブスクリプション情報の取得に失敗しました');
      }

      const data: { success: boolean; subscription: any } = await response.json();
      console.log('✅ サブスクリプション情報取得:', data);

      if (data.success && data.subscription) {
        const subscriptionData: StripeSubscriptionState = {
          subscriptionId: data.subscription.subscriptionId,
          planId: data.subscription.planId ?? localPlan ?? 'starter',
          interval: data.subscription.interval ?? localInterval,
          status: data.subscription.status ?? 'free',
          currentPeriodStart: data.subscription.currentPeriodStart,
          currentPeriodEnd: data.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: data.subscription.cancelAtPeriodEnd ?? false,
          isActive: data.subscription.isActive !== undefined ? data.subscription.isActive : true,
          isFree: data.subscription.isFree !== undefined ? data.subscription.isFree : localPlan === 'starter'
        };

        setSubscription(subscriptionData);
        
        // ローカルストレージを更新
        localStorage.setItem('currentPlan', subscriptionData.planId);
        localStorage.setItem('billingInterval', subscriptionData.interval);
        if (subscriptionData.subscriptionId) {
          localStorage.setItem('subscriptionId', subscriptionData.subscriptionId);
        }
      } else {
        // デフォルト無料プラン
        const defaultSubscription: StripeSubscriptionState = {
          planId: 'starter',
          interval: 'monthly',
          status: 'free',
          isActive: true,
          isFree: true
        };
        setSubscription(defaultSubscription);
      }

    } catch (err: unknown) {
      console.error('❌ サブスクリプション取得エラー:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // エラー時はローカル情報で復旧を試行
      const localPlan: string | null = localStorage.getItem('currentPlan');
      if (localPlan) {
        const fallbackSubscription: StripeSubscriptionState = {
          planId: localPlan,
          interval: (localStorage.getItem('billingInterval') as 'monthly' | 'yearly') ?? 'monthly',
          status: localPlan === 'starter' ? 'free' : 'active',
          isActive: true,
          isFree: localPlan === 'starter'
        };
        setSubscription(fallbackSubscription);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect((): void => {
    fetchSubscription();
  }, [fetchSubscription]);

  // 機能アクセス権限チェック
  const canAccess = useCallback((feature: string): boolean => {
    if (!subscription) return false;

    const planFeatures: Record<string, string[]> = {
      starter: [
        'basic_analysis',
        'monthly_reports',
        'email_notifications',
        'community_support'
      ],
      professional: [
        'basic_analysis',
        'detailed_analysis',
        'realtime_monitoring',
        'custom_dashboard',
        'api_integration',
        'weekly_reports',
        'priority_support',
        'monthly_reports',
        'email_notifications'
      ],
      enterprise: [
        'basic_analysis',
        'detailed_analysis',
        'realtime_monitoring',
        'custom_dashboard',
        'api_integration',
        'ai_prediction',
        'custom_integration',
        'dedicated_support',
        'onpremise',
        'sla_guarantee',
        'daily_reports',
        'weekly_reports',
        'monthly_reports',
        'email_notifications'
      ]
    };

    const allowedFeatures: string[] = planFeatures[subscription.planId] ?? planFeatures.starter;
    return allowedFeatures.includes(feature);
  }, [subscription]);

  return {
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription,
    isFreePlan: subscription?.isFree ?? false,
    isPaidPlan: subscription ? !subscription.isFree : false,
    canAccess
  };
};