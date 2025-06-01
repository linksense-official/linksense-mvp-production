// src/hooks/useSubscription.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { StripeSubscriptionState, StripePlan, BillingInterval } from '@/types/subscription';
import { pricingPlans } from '@/data/pricing-plans';

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
  
  // 重複実行防止のためのref
  const isInitializedRef = useRef(false);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);
  const lastUserIdRef = useRef<string | undefined>(undefined);

  const fetchSubscription = useCallback(async (): Promise<void> => {
    // 既に実行中の場合は待機
    if (fetchPromiseRef.current) {
      await fetchPromiseRef.current;
      return;
    }

    // 同じuserIdで既に初期化済みの場合はスキップ
    if (isInitializedRef.current && lastUserIdRef.current === userId) {
      return;
    }

    console.log('🔍 サブスクリプション情報取得開始:', { userId, initialized: isInitializedRef.current });

    fetchPromiseRef.current = (async () => {
      try {
        setIsLoading(true);
        setError(null);

        // ローカルストレージから基本情報を取得
        const localPlan: string | null = localStorage.getItem('currentPlan');
        const localInterval: BillingInterval = (localStorage.getItem('billingInterval') as BillingInterval) ?? 'monthly';
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
          // プランオブジェクトを取得
          const planId = data.subscription.planId ?? localPlan ?? 'starter';
          const plan = pricingPlans.find(p => p.id === planId) || pricingPlans[0];

          const subscriptionData: StripeSubscriptionState = {
            subscriptionId: data.subscription.subscriptionId,
            customerId: data.subscription.customerId,
            status: data.subscription.status === 'free' ? 'active' : data.subscription.status,
            currentPeriodStart: new Date(data.subscription.currentPeriodStart || Date.now()),
            currentPeriodEnd: new Date(data.subscription.currentPeriodEnd || Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: data.subscription.cancelAtPeriodEnd ?? false,
            trialStart: data.subscription.trialStart ? new Date(data.subscription.trialStart) : undefined,
            trialEnd: data.subscription.trialEnd ? new Date(data.subscription.trialEnd) : undefined,
            plan: plan,
            paymentMethod: data.subscription.paymentMethod,
            lastInvoice: data.subscription.lastInvoice,
            nextInvoice: data.subscription.nextInvoice
          };

          setSubscription(subscriptionData);
          
          // ローカルストレージを更新
          localStorage.setItem('currentPlan', plan.id);
          localStorage.setItem('billingInterval', plan.interval);
          if (subscriptionData.subscriptionId) {
            localStorage.setItem('subscriptionId', subscriptionData.subscriptionId);
          }
        } else {
          // デフォルト無料プラン
          const starterPlan = pricingPlans.find(p => p.id === 'starter') || pricingPlans[0];
          const defaultSubscription: StripeSubscriptionState = {
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
            plan: starterPlan
          };
          setSubscription(defaultSubscription);
        }

        // 初期化完了をマーク
        isInitializedRef.current = true;
        lastUserIdRef.current = userId;

      } catch (err: unknown) {
        console.error('❌ サブスクリプション取得エラー:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // エラー時はローカル情報で復旧を試行
        const localPlan: string | null = localStorage.getItem('currentPlan');
        if (localPlan) {
          const plan = pricingPlans.find(p => p.id === localPlan) || pricingPlans[0];
          const fallbackSubscription: StripeSubscriptionState = {
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
            plan: plan
          };
          setSubscription(fallbackSubscription);
          
          // エラー時も初期化完了をマーク
          isInitializedRef.current = true;
          lastUserIdRef.current = userId;
        }
      } finally {
        setIsLoading(false);
        fetchPromiseRef.current = null;
      }
    })();

    await fetchPromiseRef.current;
  }, [userId]);

  // 手動リフェッチ（初期化状態をリセット）
  const refetch = useCallback(async (): Promise<void> => {
    isInitializedRef.current = false;
    lastUserIdRef.current = undefined;
    await fetchSubscription();
  }, [fetchSubscription]);

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

    const allowedFeatures: string[] = planFeatures[subscription.plan.id] ?? planFeatures.starter;
    return allowedFeatures.includes(feature);
  }, [subscription]);

  // プランの価格で無料プランを判定
  const isFreePlan = subscription ? subscription.plan.price === 0 : false;
  const isPaidPlan = subscription ? subscription.plan.price > 0 : false;

  return {
    subscription,
    isLoading,
    error,
    refetch,
    isFreePlan,
    isPaidPlan,
    canAccess
  };
};