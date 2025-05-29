'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  planName: string;
  period: string;
  downloadUrl?: string;
}

export default function BillingHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // 認証チェック
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // モック請求履歴データ取得
  useEffect(() => {
    if (!user) return;

    const fetchBillingHistory = async () => {
      try {
        setLoading(true);
        
        // モックデータ
        const mockInvoices: Invoice[] = [
          {
            id: 'inv_001',
            date: '2025-05-01',
            amount: 2980,
            status: 'paid',
            planName: 'Professional',
            period: '2025年5月',
            downloadUrl: '#'
          },
          {
            id: 'inv_002',
            date: '2025-04-01',
            amount: 2980,
            status: 'paid',
            planName: 'Professional',
            period: '2025年4月',
            downloadUrl: '#'
          },
          {
            id: 'inv_003',
            date: '2025-03-01',
            amount: 2980,
            status: 'paid',
            planName: 'Professional',
            period: '2025年3月',
            downloadUrl: '#'
          }
        ];

        // API呼び出しシミュレーション
        await new Promise(resolve => setTimeout(resolve, 1000));
        setInvoices(mockInvoices);
        
      } catch (error) {
        console.error('請求履歴取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingHistory();
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

  const handleDownloadInvoice = (invoice: Invoice) => {
    console.log('📄 請求書ダウンロード:', invoice.id);
    alert(`請求書 ${invoice.id} をダウンロードします`);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      paid: { label: '支払済み', className: 'bg-green-100 text-green-800' },
      pending: { label: '保留中', className: 'bg-yellow-100 text-yellow-800' },
      failed: { label: '失敗', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">決済履歴</h1>
              <p className="mt-2 text-gray-600">
                過去の決済履歴と請求書をご確認いただけます
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

        {/* 請求履歴テーブル */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">請求履歴</h2>
          </div>
          
          {invoices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">請求履歴がありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      請求書ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日付
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      プラン
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      期間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      金額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.date).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.planName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ¥{invoice.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.status === 'paid' && (
                          <button
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            ダウンロード
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 決済情報 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">決済情報</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">次回決済日</h3>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">決済方法</h3>
              <p className="text-lg font-semibold text-gray-900">
                **** **** **** 1234 (Visa)
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button 
              onClick={() => alert('決済方法変更機能は実装予定です')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              決済方法を変更
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}