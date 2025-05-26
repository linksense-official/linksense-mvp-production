'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { APIResponse } from '@/types/api';

interface CancelSubscriptionProps {
  onCancel?: () => void;
}

const CancelSubscription: React.FC<CancelSubscriptionProps> = ({ onCancel }) => {
  const { user, isAuthenticated, updateUser } = useAuth(); // authState削除
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const handleCancel = async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: APIResponse = await apiClient.post('/subscription/cancel', {
        reason: reason.trim() || '理由なし',
      });

      if (response.success) {
        // ユーザー情報を更新
        if (user.subscription) {
          updateUser({
            ...user,
            subscription: {
              ...user.subscription,
              status: 'cancelled',
            },
          });
        }

        setIsOpen(false);
        onCancel?.();
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : 'サブスクリプションのキャンセルに失敗しました';
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'キャンセル処理中にエラーが発生しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 無料プランまたは既にキャンセル済みの場合は表示しない
  if (!user?.subscription || user.subscription.plan === 'free' || user.subscription.status === 'cancelled') {
    return null;
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            サブスクリプションのキャンセル
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            サブスクリプションをキャンセルすると、次回の請求日以降にサービスが停止されます。
            現在の請求期間中は引き続きサービスをご利用いただけます。
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            サブスクリプションをキャンセル
          </button>
        </div>
      </div>

      {/* モーダル */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  サブスクリプションのキャンセル
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  キャンセルの理由をお聞かせください（任意）:
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="キャンセルの理由..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      ご注意ください
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        キャンセル後は、プレミアム機能にアクセスできなくなります。
                        現在の請求期間（{user?.subscription?.expiresAt ? new Date(user.subscription.expiresAt).toLocaleDateString('ja-JP') : '不明'}まで）は引き続きご利用いただけます。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  戻る
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'キャンセル中...' : 'キャンセル実行'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CancelSubscription;