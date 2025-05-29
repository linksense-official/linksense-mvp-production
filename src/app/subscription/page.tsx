'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { subscription, isLoading: subLoading } = useSubscription(user?.id);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // ローディング状態
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 認証されていない場合
  if (!isAuthenticated || !user) {
    return null;
  }

  // プラン変更ハンドラー（確実に動作する版）
  const handlePlanChange = async (targetPlanId: string) => {
    try {
      setActionLoading(targetPlanId);
      console.log('🔄 プラン変更開始:', targetPlanId);
      
      // 確実にページ遷移（window.locationを使用）
      window.location.href = `/pricing?plan=${targetPlanId}&action=change`;
      
    } catch (error) {
      console.error('❌ プラン変更エラー:', error);
      alert('プラン変更でエラーが発生しました。');
    } finally {
      setActionLoading(null);
    }
  };

  // 決済履歴ページ遷移
  const handleBillingHistory = () => {
  setActionLoading('billing');
  console.log('💳 決済履歴ページ遷移');
  
  // 決済履歴ページに遷移
  window.location.href = '/subscription/billing-history';
};

  // 使用量ページ遷移
 const handleUsageDetails = () => {
  setActionLoading('usage');
  console.log('📊 使用量ページ遷移');
  
  // 使用量ページに遷移
  window.location.href = '/subscription/usage';
};

  // プラン変更ページ遷移
  const handleChangePlan = () => {
    setActionLoading('change');
    console.log('🔄 プラン変更ページ遷移');
    
    // プラン選択ページ（pricing）に遷移
    window.location.href = '/pricing';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">サブスクリプション管理</h1>
          <p className="mt-2 text-gray-600">
            現在のプランの確認と変更、決済履歴の管理ができます
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 現在のプラン情報 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">現在のプラン</h2>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-6">
                <div>
                  <h3 className="text-lg font-medium text-blue-900">Professional</h3>
                  <p className="text-blue-700">チーム健全性の包括的分析</p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">¥2,980/月</p>
                </div>
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  人気プラン
                </div>
              </div>

              {/* 現在のプランの機能一覧 */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">利用可能な機能</h4>
                <ul className="space-y-2">
                  {[
                    '高度な健全性分析',
                    'リアルタイム分析',
                    '日次レポート',
                    'カスタムアラート',
                    'データ保持 1年',
                    '高度なダッシュボード',
                    'チーム比較分析',
                    'API アクセス',
                    '優先サポート'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={handleBillingHistory}
                  disabled={actionLoading === 'billing'}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === 'billing' ? '処理中...' : '決済履歴'}
                </button>

                <button 
                  onClick={handleUsageDetails}
                  disabled={actionLoading === 'usage'}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === 'usage' ? '処理中...' : '使用量確認'}
                </button>

                <button 
                  onClick={handleChangePlan}
                  disabled={actionLoading === 'change'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === 'change' ? '処理中...' : 'プランを変更'}
                </button>
              </div>
            </div>
          </div>

          {/* プラン変更オプション */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">プラン変更</h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
                  <h3 className="font-medium text-gray-900">Starter</h3>
                  <p className="text-sm text-gray-600 mb-2">基本的な機能</p>
                  <p className="font-bold text-gray-900 mb-3">無料</p>
                  <button 
                    onClick={() => handlePlanChange('starter')}
                    disabled={actionLoading === 'starter'}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === 'starter' ? '処理中...' : 'ダウングレード'}
                  </button>
                </div>

                <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50">
                  <h3 className="font-medium text-gray-900">Professional</h3>
                  <p className="text-sm text-gray-600 mb-2">チーム健全性の包括的分析</p>
                  <p className="font-bold text-gray-900 mb-3">¥2,980/月</p>
                  <span className="w-full bg-blue-500 text-white py-2 px-4 rounded-md text-center block">
                    現在のプラン
                  </span>
                </div>

                <div className="p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
                  <h3 className="font-medium text-gray-900">Enterprise</h3>
                  <p className="text-sm text-gray-600 mb-2">大規模組織向け</p>
                  <p className="font-bold text-gray-900 mb-3">¥9,800/月</p>
                  <button 
                    onClick={() => handlePlanChange('enterprise')}
                    disabled={actionLoading === 'enterprise'}
                    className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === 'enterprise' ? '処理中...' : 'アップグレード'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* サブスクリプション詳細情報 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">サブスクリプション詳細</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">プランID</h3>
              <p className="text-lg font-semibold text-gray-900">professional</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">ステータス</h3>
              <p className="text-lg font-semibold text-green-600">active</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">次回更新日</h3>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">自動更新</h3>
              <p className="text-lg font-semibold text-gray-900">有効</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}