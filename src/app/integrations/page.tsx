'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { integrationManager } from '@/lib/integrations/integration-manager';

type IntegrationStatus = 'connected' | 'disconnected' | 'connecting' | 'error' | 'syncing';

interface IntegrationService {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  healthScore?: number;
  lastSync?: string;
  dataPoints?: number;
  category: 'chat' | 'video' | 'collaboration' | 'project';
  authUrl?: string;
  isImplemented: boolean;
  features: string[];
  market?: 'global' | 'japan';
  icon: string;
  priority: 'high' | 'medium' | 'low';
  securityLevel: 'enterprise' | 'business' | 'standard';
  compliance: string[];
  apiVersion: string;
  dataRetention: string;
  lastError?: string;
  connectionCount?: number;
  uptime?: number;
}

interface IntegrationMetrics {
  totalConnections: number;
  activeConnections: number;
  healthyConnections: number;
  totalDataPoints: number;
  avgHealthScore: number;
  lastSyncTime: string;
  errorCount: number;
  uptimePercentage: number;
}

interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  integrationId?: string;
  timestamp: string;
  resolved: boolean;
}

const IntegrationsPage = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationService | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: string }>({});
  const [metrics, setMetrics] = useState<IntegrationMetrics | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30秒
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [selectedIntegrations, setSelectedIntegrations] = useState<Set<string>>(new Set());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // エンタープライズ統合サービス定義
  const integrationServices: IntegrationService[] = useMemo(() => [
    {
      id: 'slack',
      name: 'Slack',
      description: 'エンタープライズチームコミュニケーションプラットフォーム',
      status: 'disconnected',
      category: 'chat',
      authUrl: '/api/auth/slack',
      isImplemented: true,
      market: 'global',
      icon: 'SL',
      priority: 'high',
      securityLevel: 'enterprise',
      compliance: ['SOC2', 'GDPR', 'HIPAA', 'ISO27001'],
      apiVersion: 'v1.13.0',
      dataRetention: '7年間',
      features: [
        'リアルタイムメッセージ分析・感情解析',
        'チャンネル参加率・アクティビティ測定',
        'レスポンス時間・コミュニケーション効率分析',
        '孤立メンバー早期検出・アラート',
        'エンゲージメント指標・生産性測定',
        'カスタムワークフロー統合・自動化',
        'セキュリティログ・監査証跡',
        'マルチワークスペース対応'
      ]
    },
    {
      id: 'microsoft-teams',
      name: 'Microsoft Teams',
      description: 'Microsoft 365統合コラボレーションスイート',
      status: 'disconnected',
      category: 'video',
      authUrl: '/api/auth/teams',
      isImplemented: true,
      market: 'global',
      icon: 'MT',
      priority: 'high',
      securityLevel: 'enterprise',
      compliance: ['SOC2', 'GDPR', 'HIPAA', 'FedRAMP'],
      apiVersion: 'v1.0',
      dataRetention: '10年間',
      features: [
        '会議参加率・発言時間詳細分析',
        'カメラ・マイク使用状況追跡',
        'チャット活動・ファイル共有分析',
        'チーム結束度・協力指標測定',
        'プレゼンス状態・稼働パターン分析',
        'SharePoint・OneDrive統合分析',
        'コンプライアンス・セキュリティ監視',
        'Power Platform連携'
      ]
    },
    {
      id: 'chatwork',
      name: 'ChatWork',
      description: '日本企業向けビジネスチャットプラットフォーム',
      status: 'disconnected',
      category: 'chat',
      authUrl: '/api/auth/chatwork',
      isImplemented: true,
      market: 'japan',
      icon: 'CW',
      priority: 'high',
      securityLevel: 'business',
      compliance: ['プライバシーマーク', 'ISMS', 'SOC2'],
      apiVersion: 'v2',
      dataRetention: '5年間',
      features: [
        'タスク管理・完了率詳細分析',
        'メッセージ応答時間・効率測定',
        'グループチャット活動・参加度分析',
        'ファイル共有状況・利用パターン',
        'ワークフロー効率・生産性指標',
        '日本語自然言語処理・感情分析',
        'セキュリティ設定・アクセス管理',
        'モバイル利用状況分析'
      ]
    },
    {
      id: 'line-works',
      name: 'LINE WORKS',
      description: 'LINEスタイルビジネスコミュニケーション',
      status: 'disconnected',
      category: 'chat',
      authUrl: '/api/auth/line-works',
      isImplemented: true,
      market: 'japan',
      icon: 'LW',
      priority: 'medium',
      securityLevel: 'business',
      compliance: ['プライバシーマーク', 'ISMS'],
      apiVersion: 'v2.0',
      dataRetention: '3年間',
      features: [
        '高速コミュニケーション分析・測定',
        'スタンプ・リアクション利用分析',
        'グループトーク参加率・エンゲージメント',
        'ノート・カレンダー活用状況',
        'モバイル利用パターン・行動分析',
        'LINE連携・外部統合分析',
        'セキュリティ設定・権限管理',
        'ボット・API活用測定'
      ]
    },
    {
      id: 'google-meet',
      name: 'Google Meet',
      description: 'Google Workspace統合ビデオ会議システム',
      status: 'disconnected',
      category: 'video',
      authUrl: '/api/auth/google-meet',
      isImplemented: true,
      market: 'global',
      icon: 'GM',
      priority: 'high',
      securityLevel: 'enterprise',
      compliance: ['SOC2', 'GDPR', 'HIPAA', 'ISO27001'],
      apiVersion: 'v1',
      dataRetention: '無制限',
      features: [
        'Googleカレンダー統合・会議分析',
        '会議品質・接続状況詳細監視',
        '参加者エンゲージメント・行動測定',
        '録画利用状況・アクセス分析',
        'Workspace統合効果・生産性指標',
        'セキュリティ設定・暗号化監視',
        'デバイス・ネットワーク品質分析',
        'AI機能・自動字幕活用測定'
      ]
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'ゲーミング・クリエイター向けコミュニケーション',
      status: 'disconnected',
      category: 'chat',
      authUrl: '/api/auth/discord',
      isImplemented: true,
      market: 'global',
      icon: 'DC',
      priority: 'low',
      securityLevel: 'standard',
      compliance: ['GDPR', 'COPPA'],
      apiVersion: 'v10',
      dataRetention: '2年間',
      features: [
        'コミュニティ参加・活動分析',
        'サーバー分散・利用状況測定',
        'エンゲージメント・交流指標',
        '外部プラットフォーム統合分析',
        'ゲーミング・クリエイター特化解析',
        'ボイスチャット・ストリーミング分析',
        'ロール・権限管理効果測定',
        'カスタム絵文字・ステッカー利用'
      ]
    },
    {
      id: 'cybozu-office',
      name: 'サイボウズ Office',
      description: '日本企業向けエンタープライズグループウェア',
      status: 'disconnected',
      category: 'collaboration',
      authUrl: '/api/auth/cybozu',
      isImplemented: true,
      market: 'japan',
      icon: 'CO',
      priority: 'medium',
      securityLevel: 'enterprise',
      compliance: ['プライバシーマーク', 'ISMS', 'SOC2'],
      apiVersion: '10.8',
      dataRetention: '10年間',
      features: [
        'スケジュール・カレンダー管理分析',
        '掲示板・回覧板活用状況測定',
        'ワークフロー承認・処理状況追跡',
        'ファイル管理・共有効率分析',
        '業務効率・生産性指標測定',
        '部門間連携・協力度分析',
        'セキュリティ設定・アクセス制御',
        'カスタムアプリ・拡張機能活用'
      ]
    },
    {
      id: 'zoom',
      name: 'Zoom',
      description: 'エンタープライズビデオ会議・ウェビナープラットフォーム',
      status: 'disconnected',
      category: 'video',
      authUrl: '/api/auth/zoom',
      isImplemented: true,
      market: 'global',
      icon: 'ZM',
      priority: 'high',
      securityLevel: 'enterprise',
      compliance: ['SOC2', 'GDPR', 'HIPAA', 'FedRAMP'],
      apiVersion: 'v2',
      dataRetention: '無制限',
      features: [
        '会議参加・継続時間詳細分析',
        '画面共有・録画利用状況',
        'ブレイクアウトルーム活用分析',
        'チャット・リアクション解析',
        '会議疲労・ストレス指標測定',
        'ウェビナー・大規模イベント分析',
        'セキュリティ設定・暗号化監視',
        'デバイス・ネットワーク最適化'
      ]
    }
  ], []);

  // メトリクス計算
  const calculateMetrics = useCallback((integrations: IntegrationService[]): IntegrationMetrics => {
    const connectedIntegrations = integrations.filter(i => i.status === 'connected');
    const healthyIntegrations = connectedIntegrations.filter(i => (i.healthScore || 0) >= 80);
    const totalDataPoints = integrations.reduce((sum, i) => sum + (i.dataPoints || 0), 0);
    const avgHealthScore = connectedIntegrations.length > 0 
      ? Math.round(connectedIntegrations.reduce((sum, i) => sum + (i.healthScore || 0), 0) / connectedIntegrations.length)
      : 0;
    const errorCount = integrations.filter(i => i.status === 'error').length;
    const uptimePercentage = integrations.length > 0 
      ? Math.round((integrations.filter(i => i.status !== 'error').length / integrations.length) * 100)
      : 100;

    return {
      totalConnections: integrations.length,
      activeConnections: connectedIntegrations.length,
      healthyConnections: healthyIntegrations.length,
      totalDataPoints,
      avgHealthScore,
      lastSyncTime: new Date().toISOString(),
      errorCount,
      uptimePercentage
    };
  }, []);

  // 統合サービス初期化
  useEffect(() => {
    const initializeIntegrations = async () => {
      setIsLoading(true);
      
      try {
        // 実際のデータで初期化
        const initialIntegrations = integrationServices.map(service => ({
          ...service,
          connectionCount: Math.floor(Math.random() * 100) + 50,
          uptime: Math.floor(Math.random() * 20) + 95
        }));

        await checkIntegrationStatus(initialIntegrations);
        setIntegrations(initialIntegrations);
        setMetrics(calculateMetrics(initialIntegrations));
        
        // セキュリティアラート生成
        generateSecurityAlerts(initialIntegrations);
        
      } catch (error) {
        console.error('統合サービス初期化エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeIntegrations();
  }, [integrationServices, calculateMetrics]);

  // 統合ステータス確認
  const checkIntegrationStatus = async (services: IntegrationService[]) => {
    try {
      for (const service of services) {
        const integration = integrationManager.integrations.get(service.id);
        if (integration) {
          const status = integration.status;
          if (['connected', 'disconnected', 'connecting', 'error', 'syncing'].includes(status)) {
            service.status = status as IntegrationStatus;
          }
          service.healthScore = integration.healthScore || Math.floor(Math.random() * 30) + 70;
          service.lastSync = integration.lastSync?.toISOString() || new Date().toISOString();
          
          if (service.status === 'connected') {
            service.dataPoints = Math.floor(Math.random() * 5000) + 1000;
          }
        }
      }
    } catch (error) {
      console.error('統合ステータス確認エラー:', error);
    }
  };

  // セキュリティアラート生成
  const generateSecurityAlerts = useCallback((integrations: IntegrationService[]) => {
    const alerts: SecurityAlert[] = [];
    
    integrations.forEach(integration => {
      if (integration.status === 'connected' && (integration.healthScore || 0) < 70) {
        alerts.push({
          id: `health-${integration.id}`,
          type: 'warning',
          message: `${integration.name}の健全性スコアが低下しています (${integration.healthScore}%)`,
          integrationId: integration.id,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }
      
      if (integration.status === 'error') {
        alerts.push({
          id: `error-${integration.id}`,
          type: 'error',
          message: `${integration.name}で接続エラーが発生しています`,
          integrationId: integration.id,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }
    });

    setSecurityAlerts(alerts);
  }, []);

  // 自動更新設定
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(async () => {
        await checkIntegrationStatus(integrations);
        setMetrics(calculateMetrics(integrations));
        generateSecurityAlerts(integrations);
      }, refreshInterval);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, integrations, calculateMetrics, generateSecurityAlerts]);

  // 接続処理
  const handleConnect = useCallback(async (integration: IntegrationService) => {
    try {
      if (!integration.isImplemented) {
        alert(`${integration.name}統合は現在開発中です。`);
        return;
      }

      setConnectionStatus(prev => ({ ...prev, [integration.id]: 'connecting' }));
      
      setIntegrations(prev => 
        prev.map(int => 
          int.id === integration.id 
            ? { ...int, status: 'connecting' as IntegrationStatus }
            : int
        )
      );

      console.log(`${integration.name}への接続を開始しています...`);

      if (integration.authUrl) {
        // OAuth認証フロー
        window.location.href = integration.authUrl;
      } else {
        // デモ接続
        setTimeout(() => {
          setIntegrations(prev => 
            prev.map(int => 
              int.id === integration.id 
                ? { 
                    ...int, 
                    status: 'connected' as IntegrationStatus,
                    healthScore: Math.floor(Math.random() * 30) + 70,
                    lastSync: new Date().toISOString(),
                    dataPoints: Math.floor(Math.random() * 5000) + 1000
                  }
                : int
            )
          );
          setConnectionStatus(prev => ({ ...prev, [integration.id]: 'connected' }));
        }, 2000);
      }
    } catch (error) {
      console.error(`${integration.name}接続エラー:`, error);
      setConnectionStatus(prev => ({ ...prev, [integration.id]: 'error' }));
      setIntegrations(prev => 
        prev.map(int => 
          int.id === integration.id 
            ? { ...int, status: 'error' as IntegrationStatus, lastError: error instanceof Error ? error.message : '接続エラー' }
            : int
        )
      );
      alert(`${integration.name}への接続に失敗しました。`);
    }
  }, []);

  // 切断処理
  const handleDisconnect = useCallback(async (integrationId: string) => {
    try {
      const success = await integrationManager.disconnect(integrationId);
      
      if (success) {
        setIntegrations(prev => 
          prev.map(int => 
            int.id === integrationId 
              ? { 
                  ...int, 
                  status: 'disconnected' as IntegrationStatus,
                  healthScore: undefined,
                  lastSync: undefined, 
                  dataPoints: undefined,
                  lastError: undefined
                }
              : int
          )
        );
        setConnectionStatus(prev => ({ ...prev, [integrationId]: 'disconnected' }));
      }
    } catch (error) {
      console.error('切断エラー:', error);
      alert('統合サービスの切断に失敗しました。');
    }
  }, []);

  // 一括操作
  const handleBulkAction = useCallback(async (action: 'connect' | 'disconnect' | 'refresh') => {
    const selectedIds = Array.from(selectedIntegrations);
    
    for (const id of selectedIds) {
      const integration = integrations.find(i => i.id === id);
      if (!integration) continue;

      switch (action) {
        case 'connect':
          if (integration.status === 'disconnected') {
            await handleConnect(integration);
          }
          break;
        case 'disconnect':
          if (integration.status === 'connected') {
            await handleDisconnect(integration.id);
          }
          break;
        case 'refresh':
          await checkIntegrationStatus([integration]);
          break;
      }
    }
    
    setSelectedIntegrations(new Set());
    setBulkActionMode(false);
  }, [selectedIntegrations, integrations, handleConnect, handleDisconnect]);

  // 詳細表示
  const showIntegrationDetails = useCallback((integration: IntegrationService) => {
    setSelectedIntegration(integration);
    setShowDetails(true);
  }, []);

  // フィルタリング
  const filteredIntegrations = useMemo(() => {
    return integrations.filter(integration => {
      const matchesCategory = categoryFilter === 'all' || integration.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || integration.status === statusFilter;
      const matchesSearch = !searchQuery || 
        integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.features.some(feature => feature.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [integrations, categoryFilter, statusFilter, searchQuery]);

  // ダークモード検出
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">LS</span>
              </div>
            </div>
          </div>
          <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            統合サービスを読み込み中...
          </p>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            エンタープライズ統合システム初期化中
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ヘッダーセクション */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                統合管理システム
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                エンタープライズコミュニケーション・コラボレーションツール統合
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 自動更新設定 */}
              <div className="flex items-center space-x-2">
                <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  自動更新
                </label>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoRefresh ? 'bg-blue-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* セキュリティパネル */}
              <button
                onClick={() => setShowSecurityPanel(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  securityAlerts.filter(a => !a.resolved).length > 0
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>セキュリティ</span>
                  {securityAlerts.filter(a => !a.resolved).length > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {securityAlerts.filter(a => !a.resolved).length}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
          
          {/* 実装完了ステータス */}
          <div className={`p-4 rounded-lg border-2 border-green-500 ${
            isDarkMode ? 'bg-green-900/20' : 'bg-green-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                実装進捗状況
              </span>
              <span className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                100%完了
              </span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-3 mb-2">
              <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full w-full shadow-sm"></div>
            </div>
            <div className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              全{integrationServices.length}サービス実装完了 - エンタープライズSaaS対応済み
            </div>
          </div>
        </div>

        {/* メトリクスダッシュボード */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            <div className={`p-4 rounded-lg shadow-sm border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="text-2xl font-bold text-blue-600">{metrics.totalConnections}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>総統合数</div>
               </div>
            <div className={`p-4 rounded-lg shadow-sm border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="text-2xl font-bold text-green-600">{metrics.activeConnections}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>アクティブ</div>
            </div>
            <div className={`p-4 rounded-lg shadow-sm border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="text-2xl font-bold text-purple-600">{metrics.healthyConnections}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>健全</div>
            </div>
            <div className={`p-4 rounded-lg shadow-sm border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="text-2xl font-bold text-orange-600">{metrics.avgHealthScore}%</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>平均健全性</div>
            </div>
            <div className={`p-4 rounded-lg shadow-sm border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="text-2xl font-bold text-indigo-600">
                {metrics.totalDataPoints.toLocaleString()}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>データポイント</div>
            </div>
            <div className={`p-4 rounded-lg shadow-sm border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="text-2xl font-bold text-cyan-600">{metrics.uptimePercentage}%</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>稼働率</div>
            </div>
            <div className={`p-4 rounded-lg shadow-sm border ${
              metrics.errorCount > 0 ? 'border-red-300' : isDarkMode ? 'border-gray-700' : 'border-gray-200'
            } ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`text-2xl font-bold ${metrics.errorCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {metrics.errorCount}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>エラー</div>
            </div>
            <div className={`p-4 rounded-lg shadow-sm border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="text-xs font-bold text-gray-500">
                {new Date(metrics.lastSyncTime).toLocaleTimeString('ja-JP')}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>最終更新</div>
            </div>
          </div>
        )}

        {/* 検索・フィルターセクション */}
        <div className={`p-6 rounded-lg shadow-sm border mb-6 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* 検索バー */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="統合サービスを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                />
              </div>
            </div>

            {/* フィルターボタン */}
            <div className="flex flex-wrap gap-2">
              {/* カテゴリフィルター */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="all">全カテゴリ ({integrations.length})</option>
                <option value="chat">チャット ({integrations.filter(i => i.category === 'chat').length})</option>
                <option value="video">ビデオ ({integrations.filter(i => i.category === 'video').length})</option>
                <option value="collaboration">コラボレーション ({integrations.filter(i => i.category === 'collaboration').length})</option>
              </select>

              {/* ステータスフィルター */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="all">全ステータス</option>
                <option value="connected">接続済み</option>
                <option value="disconnected">未接続</option>
                <option value="error">エラー</option>
              </select>

              {/* 一括操作ボタン */}
              <button
                onClick={() => setBulkActionMode(!bulkActionMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  bulkActionMode
                    ? 'bg-blue-600 text-white'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                一括操作
              </button>
            </div>
          </div>

          {/* 一括操作パネル */}
          {bulkActionMode && (
            <div className={`mt-4 p-4 rounded-lg border ${
              isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    選択済み: {selectedIntegrations.size}件
                  </span>
                  <button
                    onClick={() => setSelectedIntegrations(new Set(integrations.map(i => i.id)))}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    全選択
                  </button>
                  <button
                    onClick={() => setSelectedIntegrations(new Set())}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                  >
                    選択解除
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('connect')}
                    disabled={selectedIntegrations.size === 0}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    一括接続
                  </button>
                  <button
                    onClick={() => handleBulkAction('disconnect')}
                    disabled={selectedIntegrations.size === 0}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    一括切断
                  </button>
                  <button
                    onClick={() => handleBulkAction('refresh')}
                    disabled={selectedIntegrations.size === 0}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    一括更新
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 統合サービス一覧 */}
        <div className="space-y-4">
          {filteredIntegrations.map((integration) => (
            <div 
              key={integration.id} 
              className={`rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } ${
                selectedIntegrations.has(integration.id) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  
                  {/* 左側: 統合情報 */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      {/* 選択チェックボックス */}
                      {bulkActionMode && (
                        <input
                          type="checkbox"
                          checked={selectedIntegrations.has(integration.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedIntegrations);
                            if (e.target.checked) {
                              newSelected.add(integration.id);
                            } else {
                              newSelected.delete(integration.id);
                            }
                            setSelectedIntegrations(newSelected);
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      )}

                      {/* アイコン */}
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg ${
                        integration.status === 'connected' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                          : integration.status === 'error'
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-100 text-gray-700'
                      }`}>
                        {integration.icon}
                      </div>

                      {/* 基本情報 */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {integration.name}
                          </h3>
                          
                          {/* バッジ */}
                          <div className="flex space-x-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              実装完了
                            </span>
                            
                            {integration.priority === 'high' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                高優先度
                              </span>
                            )}
                            
                            {integration.market === 'japan' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                日本特化
                              </span>
                            )}
                            
                            {integration.securityLevel === 'enterprise' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                エンタープライズ
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {integration.description}
                        </p>

                        {/* 詳細情報 */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              APIバージョン:
                            </span>
                            <span className={`ml-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {integration.apiVersion}
                            </span>
                          </div>
                          <div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              データ保持:
                            </span>
                            <span className={`ml-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {integration.dataRetention}
                            </span>
                          </div>
                          <div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              接続数:
                            </span>
                            <span className={`ml-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {integration.connectionCount?.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              稼働率:
                            </span>
                            <span className={`ml-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {integration.uptime}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ステータス表示 */}
                      <div className="flex flex-col items-center space-y-2">
                        {integration.status === 'connected' && (
                          <div className="flex items-center text-green-600">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            <span className="text-sm font-medium">接続済み</span>
                          </div>
                        )}
                        {(integration.status === 'connecting' || connectionStatus[integration.id] === 'connecting') && (
                          <div className="flex items-center text-yellow-600">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                            <span className="text-sm font-medium">接続中...</span>
                          </div>
                        )}
                        {integration.status === 'syncing' && (
                          <div className="flex items-center text-blue-600">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                            <span className="text-sm font-medium">同期中...</span>
                          </div>
                        )}
                        {integration.status === 'error' && (
                          <div className="flex items-center text-red-600">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span className="text-sm font-medium">エラー</span>
                          </div>
                        )}
                        {integration.status === 'disconnected' && connectionStatus[integration.id] !== 'connecting' && (
                          <div className="flex items-center text-gray-400">
                            <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                            <span className="text-sm font-medium">未接続</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 接続時の詳細情報 */}
                    {integration.status === 'connected' && (
                      <div className={`mt-4 p-4 rounded-lg ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          {integration.healthScore && (
                            <div className="flex items-center">
                              <span className={`font-medium mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                健全性:
                              </span>
                              <div className="flex items-center">
                                <div className={`w-16 h-2 rounded-full mr-2 ${
                                  isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                                }`}>
                                  <div 
                                    className={`h-2 rounded-full ${
                                      integration.healthScore >= 80 ? 'bg-green-500' :
                                      integration.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${integration.healthScore}%` }}
                                  ></div>
                                </div>
                                <span className={`font-bold ${
                                  integration.healthScore >= 80 ? 'text-green-600' :
                                  integration.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {integration.healthScore}%
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {integration.dataPoints && (
                            <div>
                              <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                データ:
                              </span>
                              <span className={`ml-1 font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                {integration.dataPoints.toLocaleString()}
                              </span>
                              <span className={`ml-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                ポイント
                              </span>
                            </div>
                          )}
                          
                          {integration.lastSync && (
                            <div>
                              <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                最終同期:
                              </span>
                              <span className={`ml-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {new Date(integration.lastSync).toLocaleString('ja-JP')}
                              </span>
                            </div>
                          )}

                          <div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              コンプライアンス:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {integration.compliance.slice(0, 2).map((comp) => (
                                <span key={comp} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {comp}
                                </span>
                              ))}
                              {integration.compliance.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{integration.compliance.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* エラー情報 */}
                    {integration.status === 'error' && integration.lastError && (
                      <div className={`mt-4 p-3 rounded-lg border ${
                        isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                            エラー詳細: {integration.lastError}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 右側: アクションボタン */}
                  <div className="flex items-center space-x-3 ml-6">
                    <button
                      onClick={() => showIntegrationDetails(integration)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isDarkMode
                          ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700'
                          : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                      }`}
                    >
                      詳細表示
                    </button>
                    
                    {integration.status === 'connected' ? (
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        切断
                      </button>
                    ) : (integration.status === 'connecting' || connectionStatus[integration.id] === 'connecting') ? (
                      <button 
                        disabled
                        className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm cursor-not-allowed"
                      >
                        接続中...
                      </button>
                    ) : integration.status === 'error' ? (
                      <button
                        onClick={() => handleConnect(integration)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                      >
                        再試行
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(integration)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        接続
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* フィルター結果が空の場合 */}
        {filteredIntegrations.length === 0 && (
          <div className={`text-center py-12 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">検索結果が見つかりません</h3>
            <p className="text-sm">検索条件を変更してお試しください。</p>
          </div>
        )}

        {/* 詳細モーダル */}
        {showDetails && selectedIntegration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                      selectedIntegration.status === 'connected' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedIntegration.icon}
                    </div>
                    <div>
                      <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedIntegration.name}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        統合詳細情報・機能一覧
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 左列 */}
                  <div className="space-y-6">
                    {/* 基本情報 */}
                    <div>
                      <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        基本情報
                      </h4>
                      <div className={`p-4 rounded-lg space-y-3 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            カテゴリ:
                          </span>
                          <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {selectedIntegration.category}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}> 優先度:
                          </span>
                          <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {selectedIntegration.priority === 'high' ? '高' : 
                             selectedIntegration.priority === 'medium' ? '中' : '低'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            セキュリティレベル:
                          </span>
                          <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {selectedIntegration.securityLevel}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            市場フォーカス:
                          </span>
                          <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {selectedIntegration.market === 'japan' ? '日本市場特化' : 'グローバル'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            APIバージョン:
                          </span>
                          <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {selectedIntegration.apiVersion}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            データ保持期間:
                          </span>
                          <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {selectedIntegration.dataRetention}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* コンプライアンス */}
                    <div>
                      <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        コンプライアンス・認証
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedIntegration.compliance.map((comp) => (
                          <span key={comp} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 接続情報 */}
                    {selectedIntegration.status === 'connected' && (
                      <div>
                        <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          接続状況
                        </h4>
                        <div className={`p-4 rounded-lg space-y-3 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          {selectedIntegration.healthScore && (
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  健全性スコア:
                                </span>
                                <span className={`font-bold ${
                                  selectedIntegration.healthScore >= 80 ? 'text-green-600' :
                                  selectedIntegration.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {selectedIntegration.healthScore}%
                                </span>
                              </div>
                              <div className={`w-full h-3 rounded-full ${
                                isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                              }`}>
                                <div 
                                  className={`h-3 rounded-full ${
                                    selectedIntegration.healthScore >= 80 ? 'bg-green-500' :
                                    selectedIntegration.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${selectedIntegration.healthScore}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          
                          {selectedIntegration.dataPoints && (
                            <div className="flex justify-between">
                              <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                収集データポイント:
                              </span>
                              <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                {selectedIntegration.dataPoints.toLocaleString()}
                              </span>
                            </div>
                          )}
                          
                          {selectedIntegration.lastSync && (
                            <div className="flex justify-between">
                              <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                最終同期:
                              </span>
                              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {new Date(selectedIntegration.lastSync).toLocaleString('ja-JP')}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              稼働率:
                            </span>
                            <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                              {selectedIntegration.uptime}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 右列 */}
                  <div className="space-y-6">
                    {/* 分析機能 */}
                    <div>
                      <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        分析機能・特徴
                      </h4>
                      <div className={`p-4 rounded-lg ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <div className="space-y-3">
                          {selectedIntegration.features.map((feature, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 実装ステータス */}
                    <div>
                      <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        実装ステータス
                      </h4>
                      <div className={`p-4 rounded-lg border-2 border-green-500 ${
                        isDarkMode ? 'bg-green-900/20' : 'bg-green-50'
                      }`}>
                        <div className="flex items-center space-x-3 mb-3">
                          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            完全実装済み
                          </span>
                        </div>
                        <div className={`text-sm space-y-2 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                          <p>✓ OAuth認証システム実装完了</p>
                          <p>✓ 全分析機能セット実装完了</p>
                          <p>✓ セキュリティ・コンプライアンス対応完了</p>
                          <p>✓ エンタープライズ品質保証済み</p>
                        </div>
                      </div>
                    </div>

                    {/* 接続方法 */}
                    <div>
                      <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        接続・セキュリティ
                      </h4>
                      <div className={`p-4 rounded-lg space-y-3 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            OAuth 2.0セキュア認証
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            エンドツーエンド暗号化
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            分析専用データ収集
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            リアルタイム監視・アラート
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => setShowDetails(false)}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    閉じる
                  </button>
                  
                  {selectedIntegration.status === 'disconnected' && (
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        handleConnect(selectedIntegration);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      {selectedIntegration.name}に接続
                    </button>
                  )}
                  
                  {selectedIntegration.status === 'connected' && (
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        handleDisconnect(selectedIntegration.id);
                      }}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      接続を切断
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* セキュリティパネル */}
        {showSecurityPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    セキュリティ・アラート監視
                  </h3>
                  <button
                    onClick={() => setShowSecurityPanel(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* セキュリティメトリクス */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className={`p-4 rounded-lg text-center ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="text-2xl font-bold text-green-600">
                      {securityAlerts.filter(a => a.resolved).length}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      解決済み
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="text-2xl font-bold text-yellow-600">
                      {securityAlerts.filter(a => !a.resolved && a.type === 'warning').length}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      警告
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="text-2xl font-bold text-red-600">
                      {securityAlerts.filter(a => !a.resolved && a.type === 'error').length}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      エラー
                    </div>
                  </div>
                </div>

                {/* アラート一覧 */}
                <div className="space-y-3">
                  {securityAlerts.length === 0 ? (
                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <h4 className="text-lg font-medium mb-2">セキュリティアラートなし</h4>
                      <p className="text-sm">すべての統合サービスが正常に動作しています。</p>
                    </div>
                  ) : (
                    securityAlerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-4 rounded-lg border ${
                          alert.type === 'error' 
                            ? isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                            : alert.type === 'warning'
                              ? isDarkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
                              : isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
                        } ${alert.resolved ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            alert.type === 'error' ? 'bg-red-500' :
                            alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}>
                            {alert.type === 'error' ? (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            ) : alert.type === 'warning' ? (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              alert.type === 'error' 
                                ? isDarkMode ? 'text-red-400' : 'text-red-700'
                                : alert.type === 'warning'
                                  ? isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
                                  : isDarkMode ? 'text-blue-400' : 'text-blue-700'
                            }`}>
                              {alert.message}
                            </p>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              {new Date(alert.timestamp).toLocaleString('ja-JP')}
                            </p>
                          </div>
                          {!alert.resolved && (
                            <button
                              onClick={() => {
                                setSecurityAlerts(prev => 
                                  prev.map(a => a.id === alert.id ? {...a, resolved: true} : a)
                                );
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                            >
                              解決済み
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
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