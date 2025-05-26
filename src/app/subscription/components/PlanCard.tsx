'use client';

import React from 'react';
import { SubscriptionPlan } from '@/types/api';

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  onSelectPlan: (planId: string) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, isCurrentPlan, onSelectPlan }) => {
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

      {/* 制限情報 */}
      <div className="space-y-3 mb-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">プラン制限</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">チームメンバー</span>
            <span className="text-sm font-medium text-gray-900">
              {plan.limits.teamMembers === -1 ? '無制限' : `${plan.limits.teamMembers}人`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">月次レポート</span>
            <span className="text-sm font-medium text-gray-900">
              {plan.limits.reports === -1 ? '無制限' : `${plan.limits.reports}回`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">ストレージ</span>
            <span className="text-sm font-medium text-gray-900">
              {plan.limits.storage === -1 ? '無制限' : `${plan.limits.storage}MB`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">月間アラート</span>
            <span className="text-sm font-medium text-gray-900">
              {plan.limits.alertsPerMonth === -1 ? '無制限' : `${plan.limits.alertsPerMonth}回`}
            </span>
          </div>
        </div>
      </div>

      {/* 機能一覧 */}
      <div className="space-y-2 mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">主な機能</h4>
        <div className="space-y-2">
          {plan.features.basicDashboard && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              基本ダッシュボード
            </div>
          )}
          {plan.features.advancedAnalytics && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              詳細分析
            </div>
          )}
          {plan.features.predictiveAnalysis && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              予測分析
            </div>
          )}
          {plan.features.customDashboard && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              カスタムダッシュボード
            </div>
          )}
            {plan.features.apiAccess && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              API連携
            </div>
          )}
          {plan.features.ssoIntegration && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              SSO連携
            </div>
          )}
          {plan.features.prioritySupport && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              優先サポート
            </div>
          )}
          {plan.features.customReports && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              カスタムレポート
            </div>
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

export default PlanCard;