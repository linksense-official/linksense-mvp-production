'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import mockApi from '@/lib/mockApi';
import { SubscriptionPlan, APIResponse } from '@/types/api';
import PaymentForm from './PaymentForm';
import CancelSubscription from './CancelSubscription';
import { HEALTH_ANALYSIS_PLANS } from '@/types/api';

// PlanCardコンポーネントをインライン定義
const PlanCard: React.FC<{
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  onSelectPlan: (planId: string) => void;
}> = ({ plan, isCurrentPlan, onSelectPlan }) => {
  return (
    <div className={`relative bg-white rounded-lg shadow-lg p-6 border-2 transition-all duration-200 hover:shadow-xl ${
      plan.popular ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
    } ${isCurrentPlan ? 'ring-2 ring-green-500 border-green-500' : ''}`}>
      
      {/* 人気バッジ */}
      {plan.popular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            人気
          </span>
        </div>
      )}

      {/* 現在のプランバッジ */}
      {isCurrentPlan && (
        <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
            現在のプラン
          </span>
        </div>
      )}
      
      {/* ヘッダー */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2 text-gray-900">{plan.displayName}</h3>
        <p className="text-gray-600 text-sm mb-4 min-h-[2.5rem]">{plan.description}</p>
        <div className="text-3xl font-bold text-gray-900">
          {plan.price === 0 ? (
            <span className="text-green-600">無料</span>
          ) : (
            <>
              <span className="text-blue-600">¥{plan.price.toLocaleString()}</span>
              <span className="text-sm font-normal text-gray-500">/月</span>
            </>
          )}
        </div>
      </div>

      {/* アクションボタン */}
      <button
        onClick={() => onSelectPlan(plan.id)}
        disabled={isCurrentPlan}
        className={`w-full py-3 px-4 rounded-md font-medium transition-all duration-200 ${
          isCurrentPlan
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200'
            : plan.popular
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            : 'bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'
        }`}
      >
        {isCurrentPlan ? '現在のプラン' : 'プランを選択'}
      </button>

      {/* 無料トライアル表示 */}
      {!isCurrentPlan && plan.price > 0 && (
        <p className="text-xs text-gray-500 text-center mt-2">
          14日間無料トライアル
        </p>
      )}
    </div>
  );
};

interface SubscriptionManagerProps {
  onPlanChange?: (plan: SubscriptionPlan) => void;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ onPlanChange }) => {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'current' | 'cancel'>('current');

  // プラン情報の取得
  useEffect(() => {
    const fetchPlans = async () => {
      if (!isAuthenticated || isLoading) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // HEALTH_ANALYSIS_PLANSを直接使用
        const plansArray = Object.values(HEALTH_ANALYSIS_PLANS);
        setPlans(plansArray);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'プラン情報の取得中にエラーが発生しました';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [isAuthenticated, isLoading]);

  // プラン選択処理
  const handlePlanSelect = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      if (plan.price === 0) {
        // 無料プランの場合は即座に適用
        handlePaymentSuccess();
      } else {
        setShowPaymentForm(true);
      }
    }
  };

  // 決済成功処理
  const handlePaymentSuccess = () => {
    if (selectedPlan && user) {
      // ユーザー情報を更新
      const updatedUser = {
        ...user,
        subscription: {
          id: `sub-${Date.now()}`,
          plan: selectedPlan.name as 'free' | 'basic' | 'premium' | 'enterprise',
          status: 'active' as const,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日後
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          features: Object.entries(selectedPlan.features)
            .filter(([_, enabled]) => enabled)
            .map(([feature, _]) => feature),
          limits: selectedPlan.limits,
        },
      };

      updateUser(updatedUser);
      onPlanChange?.(selectedPlan);
      setShowPaymentForm(false);
      setSelectedPlan(null);
      setActiveTab('current');
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    setShowPaymentForm(false);
    setSelectedPlan(null);
  };

  // サブスクリプションキャンセル成功処理
  const handleSubscriptionCancel = () => {
    if (user) {
      const updatedUser = {
        ...user,
        subscription: {
          ...user.subscription!,
          status: 'cancelled' as const,
          updatedAt: new Date().toISOString(),
        },
      };
      updateUser(updatedUser);
    }
    setActiveTab('current');
  };

  // 現在のプラン情報を取得
  const getCurrentPlan = () => {
    if (!user?.subscription) {
      return HEALTH_ANALYSIS_PLANS.free;
    }
    return HEALTH_ANALYSIS_PLANS[user.subscription.plan] || HEALTH_ANALYSIS_PLANS.free;
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  return (
    <div className="space-y-6">
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'current', name: '現在のプラン', icon: '📊' },
            { id: 'plans', name: 'プラン変更', icon: '⚡' },
            { id: 'cancel', name: 'キャンセル', icon: '❌' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラー</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* 現在のプランタブ */}
      {activeTab === 'current' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                現在のサブスクリプション
              </h3>
              <p className="text-gray-600">
                チーム健全性分析ツールのご利用状況
              </p>
            </div>
            
            <div className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
              <div className="text-center mb-6">
                <h4 className="text-2xl font-bold text-gray-900 mb-1">
                  {currentPlan.displayName}
                </h4>
                <p className="text-gray-600 text-sm mb-4">{currentPlan.description}</p>
                <div className="text-3xl font-bold text-blue-600">
                  {currentPlan.price === 0 ? '無料' : `¥${currentPlan.price.toLocaleString()}/月`}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                  <span className="text-sm text-gray-600">ステータス</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    user?.subscription?.status === 'active' ? 'bg-green-100 text-green-800' :
                    user?.subscription?.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.subscription?.status === 'active' ? '有効' :
                     user?.subscription?.status === 'cancelled' ? 'キャンセル済み' :
                     user?.subscription?.status === 'inactive' ? '無効' : '無料'}
                  </span>
                </div>
                
                {user?.subscription?.expiresAt && (
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="text-sm text-gray-600">次回更新日</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(user.subscription.expiresAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                  <span className="text-sm text-gray-600">チームメンバー制限</span>
                  <span className="text-sm font-medium text-gray-900">
                    {currentPlan.limits.teamMembers === -1 ? '無制限' : `${currentPlan.limits.teamMembers}人`}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">月次レポート</span>
                  <span className="text-sm font-medium text-gray-900">
                    {currentPlan.limits.reports === -1 ? '無制限' : `${currentPlan.limits.reports}回`}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setActiveTab('plans')}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  プランを変更
                </button>
                {user?.subscription?.plan !== 'free' && user?.subscription?.status === 'active' && (
                  <button
                    onClick={() => setActiveTab('cancel')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                  >
                    キャンセル
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* プラン変更タブ */}
      {activeTab === 'plans' && (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              プランを選択
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              チームの規模とニーズに最適なプランをお選びください。
              すべてのプランで14日間の無料トライアルをご利用いただけます。
            </p>
          </div>

          {showPaymentForm && selectedPlan ? (
            <div className="max-w-md mx-auto">
              <PaymentForm
                planId={selectedPlan.id}
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={user?.subscription?.plan === plan.name}
                  onSelectPlan={handlePlanSelect}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* キャンセルタブ */}
      {activeTab === 'cancel' && (
        <CancelSubscription onCancel={handleSubscriptionCancel} />
      )}
    </div>
  );
};

export default SubscriptionManager;