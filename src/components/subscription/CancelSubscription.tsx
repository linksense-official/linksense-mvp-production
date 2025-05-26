'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { HEALTH_ANALYSIS_PLANS } from '@/types/api';

interface CancelSubscriptionProps {
  onCancel: () => void;
}

const CancelSubscription: React.FC<CancelSubscriptionProps> = ({ onCancel }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const currentPlan = user?.subscription?.plan ? HEALTH_ANALYSIS_PLANS[user.subscription.plan] : null;

  if (!user?.subscription || user.subscription.plan === 'free' || user.subscription.status === 'cancelled') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">キャンセル可能なサブスクリプションがありません</h3>
          <p className="mt-1 text-sm text-gray-500">
            現在、アクティブな有料プランがありません。
          </p>
        </div>
      </div>
    );
  }

  const handleCancelSubscription = async () => {
    if (!confirmCancel) {
      alert('キャンセルの確認にチェックを入れてください。');
      return;
    }

    setLoading(true);
    try {
      // モックAPI呼び出し（実際の実装では決済プロバイダーのAPIを使用）
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ユーザー情報を更新（キャンセル済みに変更）
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

      onCancel();
    } catch (error) {
      console.error('キャンセル処理エラー:', error);
      alert('キャンセル処理中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 警告メッセージ */}
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              サブスクリプションのキャンセル
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                サブスクリプションをキャンセルすると、以下の影響があります：
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>現在の請求期間（{user?.subscription?.expiresAt ? new Date(user.subscription.expiresAt).toLocaleDateString('ja-JP') : '不明'}まで）は引き続きご利用いただけます</li>
                <li>期間終了後は無料プランに自動的に変更されます</li>
                <li>高度な分析機能やカスタムダッシュボードが利用できなくなります</li>
                <li>データの保存期間が制限されます</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 現在のプラン情報 */}
      {currentPlan && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">現在のプラン</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{currentPlan.displayName}</h4>
              <p className="text-sm text-gray-600 mb-3">{currentPlan.description}</p>
              <div className="text-2xl font-bold text-gray-900">
                ¥{currentPlan.price.toLocaleString()}/月
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-2">利用可能な機能</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {Object.entries(currentPlan.features).map(([feature, enabled]) => {
                  if (!enabled) return null;
                  
                  const featureNames: Record<string, string> = {
                    basicDashboard: '基本ダッシュボード',
                    advancedAnalytics: '詳細分析',
                    predictiveAnalysis: '予測分析',
                    customDashboard: 'カスタムダッシュボード',
                    apiAccess: 'API連携',
                    ssoIntegration: 'SSO連携',
                    prioritySupport: '優先サポート',
                    customReports: 'カスタムレポート',
                  };

                  return (
                    <li key={feature} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {featureNames[feature] || feature}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* キャンセル理由 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">キャンセル理由（任意）</h3>
        <div className="space-y-3">
          {[
            'コストが高すぎる',
            '必要な機能が不足している',
            '使用頻度が低い',
            '他のサービスに移行する',
            'チーム構成が変わった',
            'その他'
          ].map((reason) => (
            <label key={reason} className="flex items-center">
              <input
                type="radio"
                name="cancelReason"
                value={reason}
                checked={cancelReason === reason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">{reason}</span>
            </label>
          ))}
        </div>
      </div>

      {/* フィードバック */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">改善のためのフィードバック（任意）</h3>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="サービス改善のため、ご意見をお聞かせください..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 確認チェックボックス */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="confirmCancel"
            checked={confirmCancel}
            onChange={(e) => setConfirmCancel(e.target.checked)}
            className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="confirmCancel" className="text-sm text-gray-700">
            上記の内容を理解し、サブスクリプションをキャンセルすることに同意します。
            現在の請求期間終了後に無料プランに変更されることを承諾します。
          </label>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={handleCancelSubscription}
          disabled={loading || !confirmCancel}
          className={`flex-1 px-6 py-3 rounded-md font-medium transition-colors ${
            loading || !confirmCancel
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>処理中...</span>
            </div>
          ) : (
            'サブスクリプションをキャンセル'
          )}
        </button>
      </div>

      {/* 代替案の提案 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">キャンセルの前にご検討ください</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-blue-900">プランの変更</h4>
              <p className="text-sm text-blue-700">
                より低価格なベーシックプランへの変更も可能です
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-blue-900">一時停止</h4>
              <p className="text-sm text-blue-700">
                最大3ヶ月間の一時停止オプションをご利用いただけます
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-blue-900">サポートへの相談</h4>
              <p className="text-sm text-blue-700">
                ご不明な点やご要望について、専門スタッフがサポートいたします
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            onClick={() => alert('サポートチームへの連絡機能は開発中です')}
          >
            サポートに相談する
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelSubscription;