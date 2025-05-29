'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface UsageData {
  metric: string;
  current: number;
  limit: number;
  unit: string;
  percentage: number;
  description: string;
}

export default function UsagePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);

  // 認証チェック
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // 使用量データ取得
  useEffect(() => {
    if (!user) return;

    const fetchUsageData = async () => {
      try {
        setLoading(true);
        
        // モック使用量データ
        const mockUsage: UsageData[] = [
          {
            metric: 'チームメンバー',
            current: 12,
            limit: 50,
            unit: '人',
            percentage: 0,
            description: 'アクティブなチームメンバー数'
          },
          {
            metric: 'ストレージ',
            current: 2.4,
            limit: 10,
            unit: 'GB',
            percentage: 0,
            description: '分析データとレポートの保存容量'
          },
          {
            metric: 'API呼び出し',
            current: 3450,
            limit: 10000,
            unit: '回/月',
            percentage: 0,
            description: '外部統合APIの月間呼び出し回数'
          },
          {
            metric: 'レポート生成',
            current: 28,
            limit: 100,
            unit: '回/月',
            percentage: 0,
            description: 'カスタムレポートの月間生成回数'
          }
        ];

        // パーセンテージ計算
        mockUsage.forEach(item => {
          if (item.limit === -1) {
            item.percentage = 0; // 無制限の場合
          } else {
            item.percentage = Math.min((item.current / item.limit) * 100, 100);
          }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        setUsageData(mockUsage);
        
      } catch (error) {
        console.error('使用量データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, [user]);

  // ローディング状態
  if (isLoading || loading) {
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

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUsageTextColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">使用量</h1>
              <p className="mt-2 text-gray-600">
                現在のプランの使用状況と制限をご確認いただけます
              </p>
            </div>
            <button 
              onClick={() => router.push('/subscription')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              サブスクリプション管理に戻る
            </button>
          </div>
        </div>

        {/* 現在のプラン情報 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">現在のプラン</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-blue-900">Professional</h3>
              <p className="text-gray-600">チーム健全性の包括的分析</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">¥2,980/月</p>
              <p className="text-sm text-gray-500">
                次回更新: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
        </div>

        {/* 使用量メトリクス */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {usageData.map((usage, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{usage.metric}</h3>
                <span className={`text-sm font-medium ${getUsageTextColor(usage.percentage)}`}>
                  {usage.limit === -1 ? '無制限' : `${usage.percentage.toFixed(1)}%`}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{usage.current} {usage.unit}</span>
                  <span>{usage.limit === -1 ? '無制限' : `${usage.limit} ${usage.unit}`}</span>
                </div>
                
                {usage.limit !== -1 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(usage.percentage)}`}
                      style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500">{usage.description}</p>

              {usage.percentage >= 80 && usage.limit !== -1 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>注意:</strong> 使用量が制限に近づいています。プランのアップグレードをご検討ください。
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* アラートとアクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 使用量アラート */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">使用量アラート</h2>
            
            <div className="space-y-3">
              {usageData.filter(u => u.percentage >= 70 && u.limit !== -1).length > 0 ? (
                usageData
                  .filter(u => u.percentage >= 70 && u.limit !== -1)
                  .map((usage, index) => (
                    <div key={index} className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <svg className="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          {usage.metric}が{usage.percentage.toFixed(1)}%使用されています
                        </p>
                        <p className="text-xs text-yellow-600">
                          制限: {usage.limit} {usage.unit}
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-green-800">
                    すべての使用量が正常範囲内です
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* アクション */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">アクション</h2>
            
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/pricing')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                プランをアップグレード
              </button>

              <button 
                onClick={() => alert('使用量レポートのダウンロード機能は実装予定です')}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                使用量レポートをダウンロード
              </button>

              <button 
                onClick={() => alert('使用量アラート設定機能は実装予定です')}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                使用量アラートを設定
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}