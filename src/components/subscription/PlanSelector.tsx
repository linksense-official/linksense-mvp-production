'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import type { SubscriptionPlan } from '../../types/subscription';
interface PlanSelectorProps {
  currentPlan: SubscriptionPlan | null;
  onPlanSelect: (plan: SubscriptionPlan) => Promise<void>;
  loading?: boolean;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  currentPlan,
  onPlanSelect,
  loading = false
}) => {
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAvailablePlans();
  }, [billingCycle]);

  const loadAvailablePlans = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/subscription/plans?interval=${billingCycle}`);
      if (response.ok) {
        const data = await response.json();
        setAvailablePlans(data.plans);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    if (plan.id === currentPlan?.id) return;
    
    setSelectedPlan(plan);
    try {
      await onPlanSelect(plan);
    } catch (error) {
      console.error('Plan selection failed:', error);
    } finally {
      setSelectedPlan(null);
    }
  };

  const getPlanBadge = (plan: SubscriptionPlan) => {
    if (plan.id === currentPlan?.id) {
      return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">現在のプラン</span>;
    }
    if (plan.isPopular) {
      return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">人気</span>;
    }
    if (plan.isRecommended) {
      return <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">おすすめ</span>;
    }
    return null;
  };

  const getYearlySavings = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly' && plan.yearlyDiscount) {
      return Math.round(plan.yearlyDiscount * 100);
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">プランを読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 請求サイクル選択 */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            月額払い
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            年額払い
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 rounded">
              20%OFF
            </span>
          </button>
        </div>
      </div>

      {/* プラン一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availablePlans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan?.id;
          const isSelected = selectedPlan?.id === plan.id;
          const yearlySavings = getYearlySavings(plan);

          return (
            <div
              key={plan.id}
              className={`
                relative bg-white rounded-lg border-2 p-6 cursor-pointer transition-all
                ${isCurrentPlan 
                  ? 'border-green-500 bg-green-50' 
                  : plan.isRecommended
                  ? 'border-purple-500 shadow-lg'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }
                ${isSelected ? 'opacity-50' : ''}
              `}
              onClick={() => !isCurrentPlan && !isSelected && handlePlanSelect(plan)}
            >
              {/* プランバッジ */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                {getPlanBadge(plan)}
              </div>

              {/* 価格 */}
              <div className="mb-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">
                    ¥{plan.price.toLocaleString()}
                  </span>
                  <span className="text-gray-600 ml-1">
                    /{billingCycle === 'monthly' ? '月' : '年'}
                  </span>
                </div>
                {yearlySavings > 0 && (
                  <div className="text-sm text-green-600 font-medium">
                    月額換算 ¥{Math.round(plan.price / 12).toLocaleString()} (年間{yearlySavings}%割引)
                  </div>
                )}
              </div>

              {/* プラン説明 */}
              <p className="text-gray-600 mb-6">{plan.description}</p>

              {/* 機能一覧 */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-3 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* 制限情報 */}
              {plan.limits && (
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">利用制限</h4>
                  <ul className="space-y-1">
                    {plan.limits.teams && (
                      <li className="text-sm text-gray-600">
                        チーム数: {plan.limits.teams === -1 ? '無制限' : `${plan.limits.teams}個`}
                      </li>
                    )}
                    {plan.limits.members && (
                      <li className="text-sm text-gray-600">
                        メンバー数: {plan.limits.members === -1 ? '無制限' : `${plan.limits.members}人`}
                      </li>
                    )}
                    {plan.limits.storage && (
                      <li className="text-sm text-gray-600">
                        ストレージ: {plan.limits.storage === -1 ? '無制限' : `${plan.limits.storage}GB`}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* アクションボタン */}
              <button
                disabled={isCurrentPlan || isSelected || loading}
                className={`
                  w-full py-3 px-4 rounded-lg font-medium transition-colors
                  ${isCurrentPlan
                    ? 'bg-green-100 text-green-800 cursor-not-allowed'
                    : plan.isRecommended
                    ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                  }
                `}
              >
                {isSelected ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    変更中...
                  </div>
                ) : isCurrentPlan ? (
                  '現在のプラン'
                ) : (
                  `${plan.name}に変更`
                )}
              </button>

              {/* 人気・おすすめプランのリボン */}
              {plan.isRecommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    おすすめ
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* プラン比較表 */}
      <Card title="プラン比較表">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  機能
                </th>
                {availablePlans.map((plan) => (
                  <th key={plan.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  チーム数
                </td>
                {availablePlans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {plan.limits?.teams === -1 ? '無制限' : plan.limits?.teams || '1'}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  メンバー数
                </td>
                {availablePlans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {plan.limits?.members === -1 ? '無制限' : plan.limits?.members || '5'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ストレージ
                </td>
                {availablePlans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {plan.limits?.storage === -1 ? '無制限' : `${plan.limits?.storage || 1}GB`}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  AI分析
                </td>
                {availablePlans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {plan.features.includes('AI分析') ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  API アクセス
                </td>
                {availablePlans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {plan.features.includes('API アクセス') ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};