'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
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
            現在のプランの確認と変更ができます
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 現在のプラン情報 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">現在のプラン</h2>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg mb-6">
                <div>
                  <h3 className="text-lg font-medium text-green-900">Starter</h3>
                  <p className="text-green-700">基本的なチーム健全性分析</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">無料</p>
                </div>
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  現在のプラン
                </div>
              </div>

              {/* 現在のプランの機能一覧 */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">利用可能な機能</h4>
                <ul className="space-y-2">
                  {[
                    '基本的な健全性分析',
                    '週次レポート',
                    '基本アラート',
                    'データ保持 3ヶ月',
                    '基本ダッシュボード',
                    'コミュニティサポート'
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
                  onClick={handleChangePlan}
                  disabled={actionLoading === 'change'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{actionLoading === 'change' ? '処理中...' : 'プランをアップグレード'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* プラン変更オプション */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">プラン変更</h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50">
                  <h3 className="font-medium text-gray-900">Starter</h3>
                  <p className="text-sm text-gray-600 mb-2">基本的な機能</p>
                  <p className="font-bold text-gray-900 mb-3">無料</p>
                  <span className="w-full bg-green-500 text-white py-2 px-4 rounded-md text-center block">
                    現在のプラン
                  </span>
                </div>

                <div className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <h3 className="font-medium text-gray-900">Professional</h3>
                  <p className="text-sm text-gray-600 mb-2">チーム健全性の包括的分析</p>
                  <p className="font-bold text-gray-900 mb-3">¥2,980/月</p>
                  <button 
                    onClick={() => handlePlanChange('professional')}
                    disabled={actionLoading === 'professional'}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === 'professional' ? '処理中...' : 'アップグレード'}
                  </button>
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
              <p className="text-lg font-semibold text-gray-900">starter</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">ステータス</h3>
              <p className="text-lg font-semibold text-green-600">active</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">開始日</h3>
              <p className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('ja-JP')}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">プランタイプ</h3>
              <p className="text-lg font-semibold text-gray-900">無料プラン</p>
            </div>
          </div>
        </div>

        {/* プラン比較セクション */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">プラン比較</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    機能
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Starter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Professional
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    健全性分析
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    基本
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    高度
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    エンタープライズ
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    レポート頻度
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    週次
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    日次
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    リアルタイム
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    データ保持期間
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    3ヶ月
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    1年
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    無制限
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    サポート
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    コミュニティ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    優先サポート
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    専任サポート
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}