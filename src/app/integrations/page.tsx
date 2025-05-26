'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'project' | 'hr' | 'analytics' | 'security';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  icon: string;
  features: string[];
  setupComplexity: 'easy' | 'medium' | 'advanced';
  lastSync?: string;
  dataPoints?: number;
  settings?: {
    [key: string]: any;
  };
}

const IntegrationsPage = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    const fetchIntegrations = async () => {
      setIsLoading(true);
      
      // モックデータ
      const mockIntegrations: Integration[] = [
        {
          id: 'slack',
          name: 'Slack',
          description: 'チームコミュニケーションツールとの統合でリアルタイムな健全性監視',
          category: 'communication',
          status: 'connected',
          icon: '💬',
          features: ['メッセージ分析', 'アクティビティ監視', '自動アラート', 'チャンネル統計'],
          setupComplexity: 'easy',
          lastSync: '2025-05-26T12:00:00Z',
          dataPoints: 1250,
          settings: {
            channels: ['general', 'dev-team', 'design-team'],
            alertsEnabled: true,
            sentimentAnalysis: true
          }
        },
        {
          id: 'jira',
          name: 'Jira',
          description: 'プロジェクト管理ツールからワークロード分析',
          category: 'project',
          status: 'connected',
          icon: '📋',
          features: ['タスク負荷分析', 'バーンダウン監視', 'スプリント健全性', 'ブロッカー検知'],
          setupComplexity: 'medium',
          lastSync: '2025-05-26T11:30:00Z',
          dataPoints: 856,
          settings: {
            projects: ['PROJ-1', 'PROJ-2'],
            trackVelocity: true,
            burndownAlerts: true
          }
        },
        {
          id: 'github',
          name: 'GitHub',
          description: 'コード活動とコラボレーション分析',
          category: 'project',
          status: 'connected',
          icon: '💻',
          features: ['コミット分析', 'PR レビュー時間', 'コード品質監視', 'コラボレーション指標'],
          setupComplexity: 'easy',
          lastSync: '2025-05-26T12:15:00Z',
          dataPoints: 2100,
          settings: {
            repositories: ['main-app', 'api-service'],
            trackCodeReviews: true,
            qualityGates: true
          }
        },
        {
          id: 'google-workspace',
          name: 'Google Workspace',
          description: 'カレンダーとミーティング分析',
          category: 'communication',
          status: 'pending',
          icon: '📅',
          features: ['ミーティング時間分析', 'カレンダー負荷', '参加率監視', 'フォーカス時間計測'],
          setupComplexity: 'medium',
          settings: {
            trackMeetings: true,
            focusTimeAnalysis: true,
            participationTracking: false
          }
        },
        {
          id: 'bamboohr',
          name: 'BambooHR',
          description: 'HR データとの統合で包括的な従業員分析',
          category: 'hr',
          status: 'disconnected',
          icon: '👥',
          features: ['勤怠データ', '評価情報', '研修記録', '離職リスク分析'],
          setupComplexity: 'advanced',
          settings: {
            syncAttendance: false,
            performanceData: false,
            trainingRecords: false
          }
        },
        {
          id: 'datadog',
          name: 'Datadog',
          description: 'システム監視データとチーム健全性の相関分析',
          category: 'analytics',
          status: 'error',
          icon: '📊',
          features: ['システム負荷相関', 'インシデント影響分析', 'オンコール負荷', 'パフォーマンス監視'],
          setupComplexity: 'advanced',
          settings: {
            correlateIncidents: true,
            onCallTracking: true,
            performanceAlerts: false
          }
        },
        {
          id: 'okta',
          name: 'Okta',
          description: 'セキュリティとアクセス管理の統合',
          category: 'security',
          status: 'disconnected',
          icon: '🔐',
          features: ['ログイン分析', 'セキュリティイベント', 'アクセスパターン', 'リスク評価'],
          setupComplexity: 'advanced',
          settings: {
            loginAnalytics: false,
            securityEvents: false,
            riskAssessment: false
          }
        }
      ];

      setTimeout(() => {
        setIntegrations(mockIntegrations);
        setIsLoading(false);
      }, 500);
    };

    fetchIntegrations();
    return undefined;
  }, []);

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = categoryFilter === 'all' || integration.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || integration.status === statusFilter;
    return matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 border-green-200';
      case 'disconnected': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return '接続済み';
      case 'disconnected': return '未接続';
      case 'error': return 'エラー';
      case 'pending': return '設定中';
      default: return '不明';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'communication': return 'コミュニケーション';
      case 'project': return 'プロジェクト管理';
      case 'hr': return '人事';
      case 'analytics': return '分析';
      case 'security': return 'セキュリティ';
      default: return 'その他';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityText = (complexity: string) => {
    switch (complexity) {
      case 'easy': return '簡単';
      case 'medium': return '中級';
      case 'advanced': return '上級';
      default: return '不明';
    }
  };

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowSetupModal(true);
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(prev => 
      prev.map(int => 
        int.id === integrationId 
          ? { ...int, status: 'disconnected', lastSync: undefined, dataPoints: undefined }
          : int
      )
    );
  };

  const handleSetupComplete = () => {
    if (selectedIntegration) {
      setIntegrations(prev => 
        prev.map(int => 
          int.id === selectedIntegration.id 
            ? { ...int, status: 'connected', lastSync: new Date().toISOString(), dataPoints: 0 }
            : int
        )
      );
    }
    setShowSetupModal(false);
    setSelectedIntegration(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">統合設定</h1>
              <p className="text-gray-600 mt-1">外部ツールとの連携でより詳細な分析を実現</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              カスタム統合を作成
            </button>
          </div>

          {/* 統計サマリー */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">接続済み</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {integrations.filter(i => i.status === 'connected').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">利用可能</p>
                  <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">データポイント</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {integrations.reduce((sum, int) => sum + (int.dataPoints || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">要注意</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {integrations.filter(i => i.status === 'error').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* フィルター */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">すべて</option>
                  <option value="communication">コミュニケーション</option>
                  <option value="project">プロジェクト管理</option>
                  <option value="hr">人事</option>
                  <option value="analytics">分析</option>
                  <option value="security">セキュリティ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">すべて</option>
                  <option value="connected">接続済み</option>
                  <option value="disconnected">未接続</option>
                  <option value="error">エラー</option>
                  <option value="pending">設定中</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setStatusFilter('all');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  フィルターをリセット
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 統合一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <div key={integration.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{integration.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                      <span className="text-sm text-gray-500">{getCategoryText(integration.category)}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>
                    {getStatusText(integration.status)}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{integration.description}</p>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">設定難易度</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getComplexityColor(integration.setupComplexity)}`}>
                      {getComplexityText(integration.setupComplexity)}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">主な機能</h4>
                  <div className="flex flex-wrap gap-1">
                    {integration.features.slice(0, 2).map((feature, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                    {integration.features.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{integration.features.length - 2}
                      </span>
                    )}
                  </div>
                </div>

                {integration.status === 'connected' && integration.lastSync && (
                  <div className="mb-4 text-sm text-gray-600">
                    <div>最終同期: {new Date(integration.lastSync).toLocaleString('ja-JP')}</div>
                    {integration.dataPoints && (
                      <div>データポイント: {integration.dataPoints.toLocaleString()}</div>
                    )}
                  </div>
                   )}

                {integration.status === 'error' && (
                  <div className="mb-4 p-3 bg-red-50 rounded-lg">
                    <div className="text-sm text-red-800">
                      接続エラーが発生しています。設定を確認してください。
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
                <div className="flex justify-between items-center">
                  {integration.status === 'connected' ? (
                    <>
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        切断
                      </button>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        設定
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        詳細を見る
                      </button>
                      <button
                        onClick={() => handleConnect(integration)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        {integration.status === 'error' ? '再接続' : '接続'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">統合が見つかりません</h3>
            <p className="mt-1 text-sm text-gray-500">フィルター条件を変更してください。</p>
          </div>
        )}

        {/* セットアップモーダル */}
        {showSetupModal && selectedIntegration && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{selectedIntegration.icon}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedIntegration.name} の設定
                      </h3>
                      <p className="text-gray-600">{selectedIntegration.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSetupModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">利用可能な機能</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedIntegration.features.map((feature, index) => (
                        <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                          <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-blue-900">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">設定手順</h4>
                    <div className="space-y-3">
                      {selectedIntegration.id === 'slack' && (
                        <>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</div>
                            <div>
                              <p className="font-medium">Slack アプリをインストール</p>
                              <p className="text-sm text-gray-600">LinkSense アプリをワークスペースに追加します</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</div>
                            <div>
                              <p className="font-medium">チャンネルを選択</p>
                              <p className="text-sm text-gray-600">監視したいチャンネルを選択します</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</div>
                            <div>
                              <p className="font-medium">権限を設定</p>
                              <p className="text-sm text-gray-600">必要な読み取り権限を付与します</p>
                            </div>
                          </div>
                        </>
                      )}

                      {selectedIntegration.id === 'jira' && (
                        <>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</div>
                            <div>
                              <p className="font-medium">API トークンを生成</p>
                              <p className="text-sm text-gray-600">Jira 管理画面でAPI トークンを作成します</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</div>
                            <div>
                              <p className="font-medium">プロジェクトを選択</p>
                              <p className="text-sm text-gray-600">分析対象のプロジェクトを指定します</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</div>
                            <div>
                              <p className="font-medium">同期設定</p>
                              <p className="text-sm text-gray-600">データ同期の頻度を設定します</p>
                            </div>
                          </div>
                        </>
                      )}

                      {selectedIntegration.id === 'github' && (
                        <>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</div>
                            <div>
                              <p className="font-medium">GitHub App をインストール</p>
                              <p className="text-sm text-gray-600">組織またはリポジトリにアプリをインストールします</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</div>
                            <div>
                              <p className="font-medium">リポジトリを選択</p>
                              <p className="text-sm text-gray-600">監視対象のリポジトリを選択します</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</div>
                            <div>
                              <p className="font-medium">分析設定</p>
                              <p className="text-sm text-gray-600">コード品質とコラボレーション分析を設定します</p>
                            </div>
                          </div>
                        </>
                      )}

                      {/* その他の統合の設定手順 */}
                      {!['slack', 'jira', 'github'].includes(selectedIntegration.id) && (
                        <div className="text-center py-8">
                          <div className="text-6xl mb-4">🔧</div>
                          <p className="text-gray-600">詳細な設定手順は統合ガイドをご確認ください</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h5 className="font-medium text-yellow-800">注意事項</h5>
                        <p className="text-sm text-yellow-700 mt-1">
                          この統合により、{selectedIntegration.name} からデータを収集します。
                          プライバシーポリシーとデータ利用規約をご確認ください。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowSetupModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSetupComplete}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    接続を開始
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsPage;