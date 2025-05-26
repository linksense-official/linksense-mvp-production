'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { UsageData, APIResponse } from '@/types/api';

interface UsageStats {
  currentPeriod: {
    links: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  limits: {
    links: number;
    clicks: number;
  };
  usage: {
    linksPercentage: number;
    clicksPercentage: number;
  };
}

const UsageTracker: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth(); // authState削除
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsageStats = async () => {
      if (!isAuthenticated || isLoading) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response: APIResponse<UsageStats> = await apiClient.get('/subscription/usage-stats');

        if (response.success && response.data) {
          setUsageStats(response.data);
        } else {
          const errorMessage = typeof response.error === 'string' 
            ? response.error 
            : '使用状況の取得に失敗しました';
          setError(errorMessage);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '使用状況の取得中にエラーが発生しました';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageStats();
  }, [isAuthenticated, isLoading]);

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

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">エラーが発生しました</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!usageStats) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <div className="text-gray-500">使用状況データがありません</div>
        </div>
      </div>
    );
  }

  const { currentPeriod, limits, usage } = usageStats;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
          今月の使用状況
        </h3>

        {/* 使用量メトリクス */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* リンク使用量 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">リンク作成数</span>
              <span className="text-sm text-gray-500">
                {currentPeriod.links} / {limits.links === -1 ? '無制限' : limits.links}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  usage.linksPercentage >= 90 ? 'bg-red-500' :
                  usage.linksPercentage >= 75 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(usage.linksPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {usage.linksPercentage.toFixed(1)}% 使用
            </div>
          </div>

          {/* クリック使用量 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">クリック数</span>
              <span className="text-sm text-gray-500">
                {currentPeriod.clicks} / {limits.clicks === -1 ? '無制限' : limits.clicks}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  usage.clicksPercentage >= 90 ? 'bg-red-500' :
                  usage.clicksPercentage >= 75 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(usage.clicksPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {usage.clicksPercentage.toFixed(1)}% 使用
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {currentPeriod.conversions}
            </div>
            <div className="text-sm text-gray-500">コンバージョン</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {currentPeriod.clicks > 0 ? ((currentPeriod.conversions / currentPeriod.clicks) * 100).toFixed(1) : '0'}%
            </div>
            <div className="text-sm text-gray-500">コンバージョン率</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ¥{currentPeriod.revenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">収益</div>
          </div>
        </div>

        {/* 警告メッセージ */}
        {(usage.linksPercentage >= 90 || usage.clicksPercentage >= 90) && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  使用量の上限に近づいています
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    プランの上限に近づいています。上限に達すると新しいリンクの作成やクリックの追跡ができなくなります。
                    より高いプランへのアップグレードをご検討ください。
                  </p>
                </div>
                <div className="mt-4">
                  <button className="bg-yellow-100 px-3 py-2 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-200">
                    プランをアップグレード
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* プラン情報 */}
        <div className="mt-6 bg-gray-50 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            現在のプラン: {user?.subscription?.plan || 'Free'}
          </h4>
          <div className="text-sm text-gray-600">
            {user?.subscription?.expiresAt && (
              <p>次回更新日: {new Date(user.subscription.expiresAt).toLocaleDateString('ja-JP')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageTracker;