'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { APIResponse } from '@/types/api';

interface PaymentFormProps {
  planId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface PaymentData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  cardholderName: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ planId, onSuccess, onCancel }) => {
  const { user, isAuthenticated } = useAuth(); // authState削除
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    cardholderName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
    
    // エラーをクリア
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!paymentData.cardNumber.replace(/\s/g, '') || paymentData.cardNumber.replace(/\s/g, '').length < 13) {
      setError('有効なカード番号を入力してください');
      return false;
    }
    if (!paymentData.expiryMonth || !paymentData.expiryYear) {
      setError('有効期限を選択してください');
      return false;
    }
    if (!paymentData.cvc || paymentData.cvc.length < 3) {
      setError('有効なCVCを入力してください');
      return false;
    }
    if (!paymentData.cardholderName.trim()) {
      setError('カード名義人を入力してください');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 実際の決済処理（Stripe等との連携）
      const response: APIResponse = await apiClient.post('/payment/process', {
        planId,
        paymentMethod: {
          type: 'card',
          card: {
            number: paymentData.cardNumber.replace(/\s/g, ''),
            expMonth: parseInt(paymentData.expiryMonth),
            expYear: parseInt(paymentData.expiryYear),
            cvc: paymentData.cvc,
          },
          billingDetails: {
            name: paymentData.cardholderName,
            email: user?.email,
          },
        },
      });

      if (response.success) {
        onSuccess?.();
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : '決済処理に失敗しました';
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '決済処理中にエラーが発生しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // カード番号のフォーマット
  const formatCardNumber = (value: string) => {
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

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setPaymentData(prev => ({ ...prev, cardNumber: formatted }));
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          お支払い情報
        </h3>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* カード名義人 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カード名義人
            </label>
            <input
              type="text"
              name="cardholderName"
              value={paymentData.cardholderName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="YAMADA TARO"
              required
            />
          </div>

          {/* カード番号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カード番号
            </label>
            <input
              type="text"
              name="cardNumber"
              value={paymentData.cardNumber}
              onChange={handleCardNumberChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
          </div>

          {/* 有効期限とCVC */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                月
              </label>
              <select
                name="expiryMonth"
                value={paymentData.expiryMonth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">月</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                    {String(i + 1).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年
              </label>
              <select
                name="expiryYear"
                value={paymentData.expiryYear}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">年</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVC
              </label>
              <input
                type="text"
                name="cvc"
                value={paymentData.cvc}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>

          {/* セキュリティ情報 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  セキュアな決済
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    お客様の決済情報は SSL暗号化により保護されています。
                    カード情報は当社のサーバーに保存されません。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex space-x-3 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
            )}
            <button
                type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '処理中...' : '決済を実行'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;