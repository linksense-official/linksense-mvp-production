'use client';

import React, { useState } from 'react';
import { HEALTH_ANALYSIS_PLANS } from '@/types/api';

interface PaymentFormProps {
  planId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ planId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');

  const plan = HEALTH_ANALYSIS_PLANS[planId];

  if (!plan) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">プラン情報が見つかりません</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // モック決済処理（実際の実装では決済プロバイダーのAPIを使用）
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒の遅延でAPI呼び出しをシミュレート
      onSuccess();
    } catch (error) {
      console.error('決済エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    // カード番号を4桁ずつスペースで区切る
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    // MM/YY形式にフォーマット
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">決済情報</h3>
        <p className="text-sm text-gray-600 mt-1">
          {plan.displayName}の決済手続きを行います
        </p>
      </div>

      <div className="px-6 py-4">
        {/* プラン情報 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-900">{plan.displayName}</span>
            <span className="text-xl font-bold text-blue-600">
              ¥{plan.price.toLocaleString()}/月
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
          <div className="text-xs text-gray-500">
            <p>• 14日間無料トライアル</p>
            <p>• いつでもキャンセル可能</p>
            <p>• 初回請求: {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')}</p>
          </div>
        </div>

        {/* 決済フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* カード番号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カード番号
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={19}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 有効期限 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                有効期限
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                placeholder="MM/YY"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={5}
                required
              />
            </div>

            {/* CVV */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={4}
                required
              />
            </div>
          </div>

          {/* カード名義人 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カード名義人
            </label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="TARO YAMADA"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* 請求先メールアドレス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              請求先メールアドレス
            </label>
            <input
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="billing@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* セキュリティ情報 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-600">
                SSL暗号化により安全に保護されています
              </span>
            </div>
          </div>

          {/* 利用規約同意 */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              <a href="#" className="text-blue-600 hover:underline">利用規約</a>
              および
              <a href="#" className="text-blue-600 hover:underline">プライバシーポリシー</a>
              に同意します
            </label>
          </div>

          {/* ボタン */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-md text-white font-medium transition-colors ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
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
                `¥${plan.price.toLocaleString()}/月で開始`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;