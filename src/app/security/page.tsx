'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SessionManager from '@/components/security/SessionManager';

interface SecurityAlert {
  type: 'suspicious_login' | 'new_device' | 'unusual_location' | 'multiple_failures';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  details?: any;
}

interface LoginHistoryEntry {
  id: string;
  ipAddress: string;
  userAgent: string | null;
  success: boolean;
  reason: string | null;
  createdAt: string;
  location: string;
  device: string;
  browser: string;
}

interface SecurityData {
  alerts: SecurityAlert[];
  securityScore: number;
  summary: {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueIPs: number;
  };
}

const SecurityPage: React.FC = () => {
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'alerts' | 'sessions'>('overview');
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // 認証チェック
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // セキュリティデータの取得
  useEffect(() => {
    if (isAuthenticated) {
      fetchSecurityData();
      fetchLoginHistory();
    }
  }, [isAuthenticated]);

  const fetchSecurityData = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/security-check');
      if (response.ok) {
        const data = await response.json();
        setSecurityData(data);
      } else {
        setError('セキュリティデータの取得に失敗しました');
      }
    } catch (err) {
      setError('セキュリティデータの取得中にエラーが発生しました');
    }
  };

  const fetchLoginHistory = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/login-history?limit=20');
      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data.history);
      } else {
        setError('ログイン履歴の取得に失敗しました');
      }
    } catch (err) {
      setError('ログイン履歴の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const clearLoginHistory = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/login-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear-history' })
      });

      if (response.ok) {
        await fetchLoginHistory();
        alert('ログイン履歴をクリアしました');
      } else {
        alert('ログイン履歴のクリアに失敗しました');
      }
    } catch (err) {
      alert('エラーが発生しました');
    }
  };

  const acknowledgeAlerts = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/security-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'acknowledge-alerts' })
      });

      if (response.ok) {
        await fetchSecurityData();
        alert('アラートを確認しました');
      }
    } catch (err) {
      alert('エラーが発生しました');
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">セキュリティデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">セキュリティダッシュボード</h1>
          <p className="mt-2 text-gray-600">アカウントのセキュリティ状況を監視・管理します</p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">エラー</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* タブナビゲーション */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              概要
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              セッション管理
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ログイン履歴
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              セキュリティアラート
            </button>
          </nav>
        </div>

        {/* 概要タブ */}
        {activeTab === 'overview' && securityData && (
          <div className="space-y-6">
            {/* セキュリティスコア */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">セキュリティスコア</h2>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className={`text-4xl font-bold ${getScoreColor(securityData.securityScore)}`}>
                    {securityData.securityScore}
                  </div>
                  <div className="text-sm text-gray-500">100点満点</div>
                </div>
                <div className="w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={getScoreColor(securityData.securityScore)}
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${securityData.securityScore}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* 統計情報 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-gray-900">{securityData.summary.totalLogins}</div>
                <div className="text-sm text-gray-500">総ログイン数（24時間）</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-green-600">{securityData.summary.successfulLogins}</div>
                <div className="text-sm text-gray-500">成功ログイン</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-red-600">{securityData.summary.failedLogins}</div>
                <div className="text-sm text-gray-500">失敗ログイン</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-blue-600">{securityData.summary.uniqueIPs}</div>
                <div className="text-sm text-gray-500">ユニークIP数</div>
              </div>
            </div>

            {/* 最近のアラート */}
            {securityData.alerts.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">最近のセキュリティアラート</h2>
                <div className="space-y-3">
                  {securityData.alerts.slice(0, 3).map((alert, index) => (
                    <div key={index} className={`p-3 rounded-md border ${getSeverityColor(alert.severity)}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm opacity-75">
                            {new Date(alert.timestamp).toLocaleString('ja-JP')}
                          </div>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded">
                          {alert.severity === 'high' ? '高' : alert.severity === 'medium' ? '中' : '低'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {securityData.alerts.length > 3 && (
                  <button
                    onClick={() => setActiveTab('alerts')}
                    className="mt-3 text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    すべてのアラートを表示 →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* セッション管理タブ */}
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-lg shadow p-6">
            <SessionManager />
          </div>
        )}

        {/* ログイン履歴タブ */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">ログイン履歴</h2>
              <button
                onClick={clearLoginHistory}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-500 border border-red-300 rounded-md hover:bg-red-50"
              >
                履歴をクリア
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      結果
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IPアドレス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      場所
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      デバイス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ブラウザ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loginHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.success ? '成功' : '失敗'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.device}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.browser}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loginHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  ログイン履歴がありません
                </div>
              )}
            </div>
          </div>
        )}

        {/* セキュリティアラートタブ */}
        {activeTab === 'alerts' && securityData && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">セキュリティアラート</h2>
              {securityData.alerts.length > 0 && (
                <button
                  onClick={acknowledgeAlerts}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  すべて確認済みにする
                </button>
              )}
            </div>
            <div className="p-6">
              {securityData.alerts.length > 0 ? (
                <div className="space-y-4">
                  {securityData.alerts.map((alert, index) => (
                    <div key={index} className={`p-4 rounded-md border ${getSeverityColor(alert.severity)}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="font-medium">{alert.message}</div>
                            <span className="ml-2 text-xs font-medium px-2 py-1 rounded">
                              {alert.severity === 'high' ? '高リスク' : alert.severity === 'medium' ? '中リスク' : '低リスク'}
                            </span>
                          </div>
                          <div className="text-sm opacity-75 mt-1">
                            {new Date(alert.timestamp).toLocaleString('ja-JP')}
                          </div>
                          {alert.details && (
                            <div className="text-sm opacity-75 mt-2">
                              詳細: {JSON.stringify(alert.details)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">セキュリティアラートなし</h3>
                  <p className="mt-1 text-sm text-gray-500">現在、セキュリティに関する問題は検出されていません。</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 戻るボタン */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            ← ダッシュボードに戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;