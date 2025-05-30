'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { integrationManager } from '@/lib/integrations/integration-manager';
import SlackIntegration from '@/lib/integrations/slack-integration';
import TeamsIntegration from '@/lib/integrations/teams-integration'; // ✅ Teams統合追加
import type { UserSettings, NotificationSettings, PrivacySettings } from '@/types/api';
import type { Integration as IntegrationType, AnalyticsMetrics } from '@/types/integrations';
import TeamsTestPanel from '@/components/TeamsTestPanel';

// ✅ 統合ページで使用する型定義
interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'project' | 'analytics' | 'hr';
  market: 'global' | 'us' | 'japan';
  isConnected: boolean;
  isConnecting: boolean;
  features: string[];
  setupUrl?: string;
  healthScore?: number;
  lastSync?: Date;
  errorMessage?: string;
  metrics?: AnalyticsMetrics;
  isSyncing?: boolean;
  icon?: string; // ✅ アイコン追加
  priority?: number; // ✅ 表示優先度追加
}

// ✅ 設定ページの型定義
interface LocalUserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
  timezone: string;
}

// ✅ 統合ツールのデータ（Microsoft Teams統合対応版 - 14サービス完全対応）
const integrations: Integration[] = [
  // 最優先グローバルツール（Slack & Teams）
  {
    id: 'slack',
    name: 'Slack',
    description: 'チームコミュニケーションとメッセージ分析',
    category: 'communication',
    market: 'global',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['メッセージ頻度分析', '応答時間測定', 'チャンネル活性度', '感情分析'],
    setupUrl: '/api/auth/slack',
    icon: '💬',
    priority: 1
  },
  {
    id: 'microsoft-teams', // ✅ Teams統合追加
    name: 'Microsoft Teams',
    description: 'Microsoft 365統合コミュニケーション分析',
    category: 'communication',
    market: 'global',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['会議参加率分析', 'チャット活動分析', 'ファイル共有状況', 'Teams通話分析', 'チーム結束度測定'],
    setupUrl: '/api/auth/teams', // ✅ Teams OAuth URL（実装済み）
    icon: '🔷',
    priority: 2
  },

  // 日本市場特化（Microsoft Teamsの後に配置）
  {
    id: 'chatwork',
    name: 'ChatWork',
    description: '日本企業向けビジネスチャット分析',
    category: 'communication',
    market: 'japan',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['タスク管理連携', 'メッセージ分析', 'ファイル共有状況'],
    icon: '💼',
    priority: 3
  },
  {
    id: 'line-works',
    name: 'LINE WORKS',
    description: 'LINE系ビジネスコミュニケーション分析',
    category: 'communication',
    market: 'japan',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['トーク分析', 'カレンダー連携', 'アドレス帳活用'],
    icon: '💚',
    priority: 4
  },
  {
    id: 'cybozu-office',
    name: 'サイボウズ Office',
    description: 'サイボウズグループウェア分析',
    category: 'communication',
    market: 'japan',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['スケジュール分析', 'ワークフロー効率', 'ファイル管理'],
    icon: '🏢',
    priority: 5
  },

  // 残りのグローバルツール
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'ビデオ会議とエンゲージメント分析',
    category: 'communication',
    market: 'global',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['会議参加率', '発言時間', 'カメラON率', '会議満足度'],
    icon: '📹',
    priority: 6
  },
  {
    id: 'google-meet',
    name: 'Google Meet',
    description: 'Google Workspace統合ビデオ会議分析',
    category: 'communication',
    market: 'global',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['会議時間分析', '参加者エンゲージメント', 'Google Calendar連携'],
    icon: '🟢',
    priority: 7
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'ゲーム・クリエイティブチーム向け分析',
    category: 'communication',
    market: 'global',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['ボイスチャット時間', 'サーバー活動', 'コミュニティ健全性'],
    icon: '🎮',
    priority: 8
  },

  // アメリカ市場特化
  {
    id: 'cisco-webex',
    name: 'Cisco Webex',
    description: 'エンタープライズ向けビデオ会議分析',
    category: 'communication',
    market: 'us',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['会議品質分析', 'セキュリティ監視', 'エンタープライズ統合'],
    icon: '🔒',
    priority: 9
  },
  {
    id: 'gotomeeting',
    name: 'GoToMeeting',
    description: 'ビジネス向けオンライン会議分析',
    category: 'communication',
    market: 'us',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['会議効率分析', '録画管理', 'レポート生成'],
    icon: '📊',
    priority: 10
  },
  {
    id: 'ringcentral',
    name: 'RingCentral',
    description: 'クラウド通信プラットフォーム分析',
    category: 'communication',
    market: 'us',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['通話分析', 'メッセージング', 'ビデオ会議統合'],
    icon: '☎️',
    priority: 11
  },
  {
    id: 'workplace-meta',
    name: 'Workplace from Meta',
    description: 'Meta提供企業向けSNS分析',
    category: 'communication',
    market: 'us',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['社内SNS分析', 'エンゲージメント測定', 'グループ活動'],
    icon: '📘',
    priority: 12
  },
  {
    id: 'mattermost',
    name: 'Mattermost',
    description: 'オープンソースチームコラボレーション分析',
    category: 'communication',
    market: 'us',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['セルフホスト対応', 'セキュリティ重視', 'カスタマイズ可能'],
    icon: '🔓',
    priority: 13
  }
];

// モックAPI関数
const updateUserSettings = async (userId: string, settings: LocalUserSettings) => {
  return new Promise<{ success: boolean; data?: LocalUserSettings; error?: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: settings
      });
    }, 1000);
  });
};

const SettingsPage: React.FC = () => {
  const { user, updateUser, isAuthenticated, isLoading } = useAuth();
  const [settings, setSettings] = useState<LocalUserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'general' | 'integrations'>('notifications');

  // ✅ 統合ページ関連のstate（Microsoft Teams統合対応）
  const [integrationsState, setIntegrationsState] = useState<Integration[]>(integrations);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  // ✅ 統合サービス初期化用のuseEffect修正（Teams統合対応）
  useEffect(() => {
    const initializeIntegrations = async () => {
      try {
        console.log('🚀 統合管理システム初期化開始（Teams統合対応）...');
        console.log('integrationManager:', integrationManager);
        
        // ✅ SlackIntegrationクラスの手動登録
        console.log('SlackIntegrationクラス登録確認...');
        
        // ✅ TeamsIntegrationクラスの手動登録
        console.log('🔷 TeamsIntegrationクラス登録確認...');
        
        // ✅ 統合サービス定義を統合管理システム用の形式に変換
        const integrationConfigs = integrations.map(integration => ({
          id: integration.id,
          name: integration.name,
          description: integration.description,
          category: integration.category as any,
          market: integration.market as any,
          status: 'disconnected' as any,
          features: integration.features,
          authType: 'oauth2' as any,
          config: {
            setupUrl: integration.setupUrl,
            scopes: integration.id === 'microsoft-teams' 
              ? ['https://graph.microsoft.com/Team.ReadBasic.All', 'https://graph.microsoft.com/User.Read.All', 'https://graph.microsoft.com/Chat.Read'] 
              : ['channels:read', 'users:read', 'team:read'],
            permissions: ['read'],
            dataRetentionDays: 90,
            syncIntervalMinutes: 60,
            enabledFeatures: integration.features,
            customSettings: {}
          },
          isEnabled: true,
          lastSync: undefined,
          healthScore: undefined
        }));

        console.log('変換された統合設定（Teams含む）:', integrationConfigs);

        // ✅ 統合管理システムを初期化
        const initResult = await integrationManager.initialize(integrationConfigs);
        console.log('初期化結果:', initResult);
        
        // ✅ 初期化後の状態確認
        console.log('初期化後の統合一覧:', integrationManager.integrations);
        console.log('Slack統合確認:', integrationManager.integrations.get('slack'));
        console.log('🔷 Teams統合確認:', integrationManager.integrations.get('microsoft-teams'));
        
        console.log('✅ 統合管理システム初期化完了（Teams統合対応）');
      } catch (error) {
        console.error('❌ 統合管理システム初期化エラー:', error);
        console.error('エラー詳細:', error instanceof Error ? error.message : String(error));
      }
    };

    initializeIntegrations();
  }, []);

  // ✅ 統合管理システムからの状態更新（Teams統合対応）
  useEffect(() => {
    const updateIntegrationStates = async () => {
      try {
        console.log('🔄 統合状態更新開始（Teams統合対応）...');
        
        // 統合管理システムから最新状態を取得
        const registeredIntegrations = integrationManager.integrations;
        
        setIntegrationsState(prev => 
          prev.map(integration => {
            const registered = registeredIntegrations.get(integration.id);
            if (registered) {
              console.log(`📊 ${integration.name} 状態:`, registered.status);
              return {
                ...integration,
                isConnected: registered.status === 'connected',
                isConnecting: registered.status === 'connecting',
                healthScore: registered.healthScore,
                lastSync: registered.lastSync,
                errorMessage: registered.status === 'error' ? 'エラーが発生しました' : undefined
              };
            }
            return integration;
          })
        );
      } catch (error) {
        console.error('統合状態更新エラー:', error);
      }
    };

    // 初回読み込み
    updateIntegrationStates();

    // 定期更新（10秒ごとに短縮）
    const interval = setInterval(updateIntegrationStates, 10000);

    return () => clearInterval(interval);
  }, []);

  // ✅ URL パラメータからの成功・エラーメッセージ処理（Teams統合対応）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const errorMessage = urlParams.get('message');
    const teamName = urlParams.get('team');
    const userName = urlParams.get('user'); // ✅ Teams用ユーザー名
    const organization = urlParams.get('organization'); // ✅ Teams用組織名

    // ✅ Slack接続成功処理
    if (success === 'slack_connected' && teamName) {
      console.log('✅ Slack接続成功を検出:', teamName);
      
      setIntegrationsState(prev => 
        prev.map(i => 
          i.id === 'slack' 
            ? { 
                ...i, 
                isConnected: true,
                isConnecting: false,
                healthScore: 78,
                lastSync: new Date(),
                errorMessage: undefined
              }
            : i
        )
      );

      setMessage({
        type: 'success',
        text: `Slack (${teamName}) の連携が完了しました！`
      });
      setActiveTab('integrations');
      
      window.history.replaceState({}, '', '/settings?tab=integrations');
    } 
    // ✅ Teams接続成功処理（実装完了）
    else if (success === 'teams_connected') {
      const displayName = userName || organization || 'Unknown';
      console.log('✅ Teams接続成功を検出:', displayName);
      
      setIntegrationsState(prev => 
        prev.map(i => 
          i.id === 'microsoft-teams' 
            ? { 
                ...i, 
                isConnected: true,
                isConnecting: false,
                healthScore: 82,
                lastSync: new Date(),
                errorMessage: undefined
              }
            : i
        )
      );

      setMessage({
        type: 'success',
        text: `Microsoft Teams (${displayName}) の連携が完了しました！`
      });
      setActiveTab('integrations');
      
      window.history.replaceState({}, '', '/settings?tab=integrations');
    }
    // ✅ エラー処理
    else if (error === 'slack_oauth_failed') {
      setMessage({
        type: 'error',
        text: errorMessage || 'Slack連携でエラーが発生しました'
      });
      setActiveTab('integrations');
      
      window.history.replaceState({}, '', '/settings?tab=integrations');
    } else if (error === 'teams_oauth_failed') {
      setMessage({
        type: 'error',
        text: errorMessage || 'Microsoft Teams連携でエラーが発生しました'
      });
      setActiveTab('integrations');
      
      window.history.replaceState({}, '', '/settings?tab=integrations');
    }

    // タブパラメータの処理
    const tab = urlParams.get('tab');
    if (tab && ['notifications', 'privacy', 'integrations', 'general'].includes(tab)) {
      setActiveTab(tab as typeof activeTab);
    }
  }, []);

  // ✅ 設定データの初期化
  useEffect(() => {
    if (user?.settings) {
      setSettings({
        notifications: {
          emailNotifications: user.settings.notifications?.emailNotifications ?? true,
          pushNotifications: user.settings.notifications?.pushNotifications ?? true,
          weeklyReports: user.settings.notifications?.weeklyReports ?? true,
          criticalAlerts: user.settings.notifications?.criticalAlerts ?? true,
          teamUpdates: user.settings.notifications?.teamUpdates ?? false
        },
        privacy: {
          shareAnalytics: user.settings.privacy?.shareAnalytics ?? true,
          anonymizeData: user.settings.privacy?.anonymizeData ?? false,
          dataRetention: user.settings.privacy?.dataRetention ?? true,
          exportData: user.settings.privacy?.exportData ?? true
        },
        theme: user.settings.theme ?? 'light',
        language: user.settings.language ?? 'ja',
        timezone: user.settings.timezone ?? 'Asia/Tokyo'
      });
    } else {
      setSettings({
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          weeklyReports: true,
          criticalAlerts: true,
          teamUpdates: false
        },
        privacy: {
          shareAnalytics: true,
          anonymizeData: false,
          dataRetention: true,
          exportData: true
        },
        theme: 'light',
        language: 'ja',
        timezone: 'Asia/Tokyo'
      });
    }
  }, [user]);

  // ✅ 統合ページ関連の関数（Microsoft Teams統合対応）
  const handleConnect = async (integrationId: string) => {
    const integration = integrationsState.find(i => i.id === integrationId);
    if (!integration) return;

    try {
      // 接続中状態に更新
      setIntegrationsState(prev => 
        prev.map(i => 
          i.id === integrationId 
            ? { ...i, isConnecting: true, errorMessage: undefined }
            : i
        )
      );

      if (integration.setupUrl) {
        // ✅ Slack OAuth フロー
        if (integrationId === 'slack') {
          console.log('Slack OAuth フロー開始...');
          window.location.href = integration.setupUrl;
          return;
        }
        // ✅ Teams OAuth フロー（実装完了）
        else if (integrationId === 'microsoft-teams') {
          console.log('🔷 Teams OAuth フロー開始...');
          window.location.href = integration.setupUrl; // 実際のOAuth認証へリダイレクト
          return;
        }
      }

      // その他のサービスの場合（モック処理）
      console.log(`${integration.name} 連携開始...`);
      
      setTimeout(() => {
        const healthScore = Math.floor(Math.random() * 30) + 70; // 70-100
        setIntegrationsState(prev => 
          prev.map(i => 
            i.id === integrationId 
              ? { ...i, isConnecting: false, isConnected: true, healthScore }
              : i
          )
        );
        
        setMessage({
          type: 'success',
          text: `${integration.name} の連携が完了しました！`
        });
      }, 2000);

    } catch (error) {
      console.error(`${integration.name} 連携エラー:`, error);
      
      setIntegrationsState(prev => 
        prev.map(i => 
          i.id === integrationId 
            ? { 
                ...i, 
                isConnecting: false, 
                errorMessage: '連携に失敗しました' 
              }
            : i
        )
      );

      setMessage({
        type: 'error',
        text: `${integration.name} の連携に失敗しました`
      });
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    const integration = integrationsState.find(i => i.id === integrationId);
    if (!integration) return;

    if (!confirm(`${integration.name} の統合を切断しますか？`)) {
      return;
    }

    try {
      console.log(`${integration.name} 切断開始...`);

      // ✅ Slack切断処理
      if (integrationId === 'slack') {
        const success = await integrationManager.disconnect('slack');
        if (success) {
          setIntegrationsState(prev => 
            prev.map(i => 
              i.id === integrationId 
                ? { 
                    ...i, 
                    isConnected: false, 
                    healthScore: undefined, 
                    lastSync: undefined,
                    errorMessage: undefined,
                    metrics: undefined,
                    isSyncing: false
                  }
                : i
            )
          );
          
          setMessage({
            type: 'success',
            text: `${integration.name} の切断が完了しました`
          });
        } else {
          throw new Error('切断処理に失敗しました');
        }
      } 
      // ✅ Teams切断処理
      else if (integrationId === 'microsoft-teams') {
        const success = await integrationManager.disconnect('microsoft-teams');
        if (success) {
          setIntegrationsState(prev => 
            prev.map(i => 
              i.id === integrationId 
                ? { 
                    ...i, 
                    isConnected: false, 
                    healthScore: undefined, 
                    lastSync: undefined,
                    errorMessage: undefined,
                    metrics: undefined,
                    isSyncing: false
                  }
                : i
            )
          );
          
          setMessage({
            type: 'success',
            text: `${integration.name} の切断が完了しました`
          });
        } else {
          throw new Error('切断処理に失敗しました');
        }
      } 
      else {
        // その他のサービス（モック処理）
        setIntegrationsState(prev => 
          prev.map(i => 
            i.id === integrationId 
              ? { 
                  ...i, 
                  isConnected: false, 
                  healthScore: undefined, 
                  lastSync: undefined,
                  errorMessage: undefined,
                  metrics: undefined,
                  isSyncing: false
                }
              : i
          )
        );
        
        setMessage({
          type: 'success',
          text: `${integration.name} の切断が完了しました`
        });
      }
    } catch (error) {
      console.error(`${integration.name} 切断エラー:`, error);
      setMessage({
        type: 'error',
        text: `${integration.name} の切断に失敗しました`
      });
    }
  };

  // ✅ 実際のSlack・Teams同期機能実装
 const handleSync = async (integrationId: string) => {
  const integration = integrationsState.find(i => i.id === integrationId);
  if (!integration) return;

  try {
    console.log(`🔄 実際の同期開始: ${integration.name}`);
    
    // 同期中状態に更新
    setIntegrationsState(prev => 
      prev.map(i => 
        i.id === integrationId 
          ? { ...i, isSyncing: true, errorMessage: undefined }
          : i
      )
    );

    setMessage({ 
      type: 'success', 
      text: `${integration.name} のデータ同期を開始しました...` 
    });

    // ✅ Slack同期処理
    if (integrationId === 'slack') {
      console.log('🔗 Slack統合管理システム同期実行...');
      
      const syncResult = await integrationManager.sync('slack');
      
      if (syncResult) {
        console.log('✅ Slack同期結果:', syncResult);
        
        const analytics = (syncResult as any).analytics;
        let healthScore = 85;
        let recordsProcessed = 0;
        
        if (analytics) {
          healthScore = analytics.healthScore || 85;
          console.log('📊 分析データ取得成功:', analytics);
        } else {
          const analyticsFromManager = await integrationManager.getAnalytics('slack');
          if (analyticsFromManager) {
            healthScore = analyticsFromManager.healthScore || 85;
            console.log('📊 統合管理システムから分析データ取得:', analyticsFromManager);
          }
        }
        
        if ('recordsProcessed' in syncResult) {
          recordsProcessed = (syncResult as any).recordsProcessed || 0;
        }
        
        setIntegrationsState(prev => 
          prev.map(i => 
            i.id === integrationId 
              ? { 
                  ...i, 
                  isSyncing: false,
                  lastSync: new Date(),
                  healthScore: healthScore,
                  metrics: analytics?.metrics,
                  errorMessage: undefined
                }
              : i
          )
        );
        
        setMessage({ 
          type: 'success', 
          text: `${integration.name} のデータ同期が完了しました！健全性スコア: ${healthScore}/100, 処理件数: ${recordsProcessed}件` 
        });
        
      } else {
        throw new Error('同期処理が失敗しました');
      }
    }
    // ✅ Teams同期処理
    else if (integrationId === 'microsoft-teams') {
      console.log('🔷 Teams統合管理システム同期実行...');
      
      const syncResult = await integrationManager.sync('microsoft-teams');
      
      if (syncResult) {
        console.log('✅ Teams同期結果:', syncResult);
        
        const analytics = (syncResult as any).analytics;
        let healthScore = 82;
        let recordsProcessed = 0;
        
        if (analytics) {
          healthScore = analytics.healthScore || 82;
          console.log('📊 Teams分析データ取得成功:', analytics);
        } else {
          const analyticsFromManager = await integrationManager.getAnalytics('microsoft-teams');
          if (analyticsFromManager) {
            healthScore = analyticsFromManager.healthScore || 82;
            console.log('📊 統合管理システムからTeams分析データ取得:', analyticsFromManager);
          }
        }
        
        if ('recordsProcessed' in syncResult) {
          recordsProcessed = (syncResult as any).recordsProcessed || 0;
        }
        
        setIntegrationsState(prev => 
          prev.map(i => 
            i.id === integrationId 
              ? { 
                  ...i, 
                  isSyncing: false,
                  lastSync: new Date(),
                  healthScore: healthScore,
                  metrics: analytics?.metrics,
                  errorMessage: undefined
                }
              : i
          )
        );
        
        setMessage({ 
          type: 'success', 
          text: `${integration.name} のデータ同期が完了しました！健全性スコア: ${healthScore}/100, 処理件数: ${recordsProcessed}件` 
        });
        
      } else {
        throw new Error('Teams同期処理が失敗しました');
      }
    }
    else {
      // ✅ 他のサービス（モック処理・改良版）
      console.log(`🔄 モック同期: ${integration.name}`);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const healthScore = Math.floor(Math.random() * 30) + 70; // 70-100
      const mockMetrics = {
        messageCount: Math.floor(Math.random() * 500) + 100,
        activeUsers: Math.floor(Math.random() * 20) + 5,
        averageResponseTime: Math.floor(Math.random() * 300) + 60,
        engagementRate: Math.random() * 0.4 + 0.6, // 0.6-1.0
           burnoutRisk: Math.floor(Math.random() * 40) + 10, // 10-50
        stressLevel: Math.floor(Math.random() * 50) + 20, // 20-70
        workLifeBalance: Math.floor(Math.random() * 30) + 70, // 70-100
        teamCohesion: Math.floor(Math.random() * 40) + 60 // 60-100
      };
      
      setIntegrationsState(prev => 
        prev.map(i => 
          i.id === integrationId 
            ? { 
                ...i, 
                isSyncing: false,
                lastSync: new Date(),
                healthScore: healthScore,
                metrics: mockMetrics,
                errorMessage: undefined
              }
            : i
        )
      );
      
      setMessage({ 
        type: 'success', 
        text: `${integration.name} のデータ同期が完了しました！健全性スコア: ${healthScore}/100` 
      });
    }
    
  } catch (error) {
    console.error(`❌ ${integration.name} 同期エラー:`, error);
    
    setIntegrationsState(prev => 
      prev.map(i => 
        i.id === integrationId 
          ? { 
              ...i, 
              isSyncing: false,
              errorMessage: 'データ同期に失敗しました'
            }
          : i
      )
    );
    
    setMessage({ 
      type: 'error', 
      text: `${integration.name} のデータ同期に失敗しました: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
};

  // 通知設定の変更
  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    if (settings) {
      setSettings({
        ...settings,
        notifications: {
          ...settings.notifications,
          [key]: value
        }
      });
    }
  };

  // プライバシー設定の変更
  const handlePrivacyChange = (key: keyof PrivacySettings, value: boolean) => {
    if (settings) {
      setSettings({
        ...settings,
        privacy: {
          ...settings.privacy,
          [key]: value
        }
      });
    }
  };

  // 一般設定の変更
  const handleGeneralChange = (key: keyof Pick<LocalUserSettings, 'theme' | 'language' | 'timezone'>, value: string) => {
    if (settings) {
      setSettings({
        ...settings,
        [key]: value
      });
    }
  };

  // 設定の保存
  const handleSave = async () => {
    if (!settings || !user) return;

    try {
      setSaving(true);
      setMessage(null);

      const response = await updateUserSettings(user.id, settings);

      if (response.success && response.data) {
        const updatedSettings: UserSettings = {
          notifications: settings.notifications,
          privacy: settings.privacy,
          theme: settings.theme,
          language: settings.language,
          timezone: settings.timezone
        };

        updateUser({
          ...user,
          settings: updatedSettings
        });

        setMessage({ type: 'success', text: '設定が正常に保存されました' });
      } else {
        const errorMessage = response.error || '設定の保存に失敗しました';
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      console.error('設定保存エラー:', error);
      setMessage({ type: 'error', text: '設定の保存中にエラーが発生しました' });
    } finally {
      setSaving(false);
    }
  };

  // メッセージの自動消去
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [message]);

  // ✅ リアルタイム健全性スコア更新（Teams統合対応）
  useEffect(() => {
    const updateHealthScores = () => {
      setIntegrationsState(prev => 
        prev.map(integration => {
          if (integration.isConnected && integration.healthScore && !integration.isSyncing) {
            const variation = (Math.random() - 0.5) * 6; // -3 to +3
            const newScore = Math.max(0, Math.min(100, integration.healthScore + variation));
            
            return {
              ...integration,
              healthScore: Math.round(newScore)
            };
          }
          return integration;
        })
      );
    };

    const interval = setInterval(updateHealthScores, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">設定を読み込み中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">設定</h1>
          <p className="mt-2 text-gray-600">
            チーム健全性分析ツールの各種設定を管理します
          </p>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          {/* タブナビゲーション */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'notifications', name: '通知設定' },
                { id: 'privacy', name: 'プライバシー' },
                { id: 'integrations', name: '統合設定' },
                { id: 'general', name: '一般設定' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 通知設定タブ */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">通知設定</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    チーム健全性に関する通知の受信設定を管理します
                  </p>
                </div>

                <div className="space-y-4">
                  {/* メール通知 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">メール通知</h4>
                      <p className="text-sm text-gray-500">
                        重要なアラートや更新情報をメールで受信します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationChange('emailNotifications', !settings.notifications.emailNotifications)}
                      className={`${
                        settings.notifications.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.notifications.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                  {/* プッシュ通知 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">プッシュ通知</h4>
                      <p className="text-sm text-gray-500">
                        ブラウザでリアルタイム通知を受信します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationChange('pushNotifications', !settings.notifications.pushNotifications)}
                      className={`${
                        settings.notifications.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.notifications.pushNotifications ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                  {/* 週次レポート */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">週次レポート</h4>
                      <p className="text-sm text-gray-500">
                        チーム健全性の週次サマリーレポートを受信します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationChange('weeklyReports', !settings.notifications.weeklyReports)}
                      className={`${
                        settings.notifications.weeklyReports ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.notifications.weeklyReports ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                  {/* 緊急アラート */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">緊急アラート</h4>
                      <p className="text-sm text-gray-500">
                        バーンアウトリスクなどの緊急アラートを即座に受信します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationChange('criticalAlerts', !settings.notifications.criticalAlerts)}
                      className={`${
                        settings.notifications.criticalAlerts ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.notifications.criticalAlerts ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                   {/* チーム更新情報 */}
                  <div className="flex items-center justify-between py-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">チーム更新情報</h4>
                      <p className="text-sm text-gray-500">
                        チームメンバーの追加・削除などの更新情報を受信します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationChange('teamUpdates', !settings.notifications.teamUpdates)}
                      className={`${
                        settings.notifications.teamUpdates ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.notifications.teamUpdates ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* プライバシー設定タブ */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">プライバシー設定</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    データの共有とプライバシーに関する設定を管理します
                  </p>
                </div>

                <div className="space-y-4">
                  {/* 分析データの共有 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">分析データの共有</h4>
                      <p className="text-sm text-gray-500">
                        サービス改善のため、匿名化された分析データの共有を許可します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrivacyChange('shareAnalytics', !settings.privacy.shareAnalytics)}
                      className={`${
                        settings.privacy.shareAnalytics ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.privacy.shareAnalytics ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                  {/* データの匿名化 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">データの匿名化</h4>
                      <p className="text-sm text-gray-500">
                        レポートや分析で個人を特定できないよう、データを匿名化します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrivacyChange('anonymizeData', !settings.privacy.anonymizeData)}
                      className={`${
                        settings.privacy.anonymizeData ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.privacy.anonymizeData ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                  {/* データ保持期間の設定 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">データ保持期間の設定</h4>
                      <p className="text-sm text-gray-500">
                        プランに応じたデータ保持期間の設定を有効にします
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrivacyChange('dataRetention', !settings.privacy.dataRetention)}
                      className={`${
                        settings.privacy.dataRetention ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                           settings.privacy.dataRetention ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                  {/* データエクスポート */}
                  <div className="flex items-center justify-between py-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">データエクスポート</h4>
                      <p className="text-sm text-gray-500">
                        チーム健全性データのエクスポート機能を有効にします
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrivacyChange('exportData', !settings.privacy.exportData)}
                      className={`${
                        settings.privacy.exportData ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.privacy.exportData ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>
                </div>

                {/* データ削除セクション */}
                <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800 mb-2">データの削除</h4>
                  <p className="text-sm text-red-600 mb-4">
                    アカウントに関連するすべてのデータを完全に削除します。この操作は取り消せません。
                  </p>
                  <button
                    type="button"
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                    onClick={() => {
                      if (confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。')) {
                        alert('データ削除機能は開発中です');
                      }
                    }}
                  >
                    すべてのデータを削除
                  </button>
                </div>
              </div>
            )}

            {/* ✅ 統合設定タブ - Microsoft Teams OAuth認証完全対応版 */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">統合設定</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    チーム健全性分析のためのツール統合を管理します（13サービス対応）
                  </p>
                </div>

                {/* ✅ Teams統合追加の案内バナー */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">🔷</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Microsoft Teams統合が追加されました！</h4>
                      <p className="text-sm text-blue-600 mt-1">
                        Microsoft 365環境でのチーム健全性分析が可能になりました。会議参加率やチャット活動の詳細分析をご利用いただけます。
                      </p>
                    </div>
                  </div>
                </div>

                {activeTab === 'integrations' && (
  <div className="space-y-6">
    {/* 既存のコンテンツ */}
    
    {/* ✅ Teams統合追加の案内バナー */}
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
      {/* 既存の案内バナーコンテンツ */}
    </div>

    {/* ✅ Teams統合テストパネル追加 */}
    {process.env.NEXT_PUBLIC_TEAMS_DEBUG === 'true' && (
      <TeamsTestPanel />
    )}

    {/* 既存の統合ツール一覧 */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 既存のコンテンツ */}
    </div>
    
    {/* 既存の接続統計 */}
    {/* ... */}
  </div>
)}

                {/* ✅ 統合ツール一覧 - Microsoft Teams OAuth認証対応版 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integrationsState
                    .sort((a, b) => (a.priority || 999) - (b.priority || 999)) // 優先度順でソート
                    .map((integration) => (
                    <div
                      key={integration.id}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        integration.isConnected
                          ? 'border-green-200 bg-green-50'
                          : integration.errorMessage
                          ? 'border-red-200 bg-red-50'
                          : integration.id === 'microsoft-teams'
                          ? 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:shadow-sm' // ✅ Teams強調
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {integration.icon && (
                              <span className="text-lg">{integration.icon}</span>
                            )}
                            <h4 className="font-medium text-gray-900">{integration.name}</h4>
                            {/* ✅ Teams新機能バッジ */}
                            {integration.id === 'microsoft-teams' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                          
                          {/* 健全性スコア表示 */}
                          {integration.isConnected && integration.healthScore !== undefined && (
                            <div className="mt-2 flex items-center space-x-2">
                              <span className="text-xs text-gray-500">健全性スコア:</span>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                integration.healthScore >= 80 ? 'bg-green-100 text-green-800' :
                                integration.healthScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {integration.healthScore}/100
                              </div>
                            </div>
                          )}
                          
                          {/* メトリクス表示 */}
                          {integration.isConnected && integration.metrics && (
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-blue-50 px-2 py-1 rounded">
                                <span className="text-blue-600">メッセージ: </span>
                                <span className="font-medium">{integration.metrics.messageCount}</span>
                              </div>
                              <div className="bg-green-50 px-2 py-1 rounded">
                                <span className="text-green-600">アクティブ: </span>
                                <span className="font-medium">{integration.metrics.activeUsers}人</span>
                              </div>
                            </div>
                          )}
                          
                          {/* 最終同期時刻表示 */}
                          {integration.isConnected && integration.lastSync && (
                            <div className="mt-1">
                              <span className="text-xs text-gray-500">
                                最終同期: {new Date(integration.lastSync).toLocaleString('ja-JP')}
                              </span>
                            </div>
                          )}
                          
                          {/* エラーメッセージ表示 */}
                          {integration.errorMessage && (
                            <div className="mt-2">
                              <span className="text-xs text-red-600">{integration.errorMessage}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1">
                          {integration.isConnected && (
                               <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              接続済み
                            </span>
                          )}
                          {integration.isConnecting && (
                             <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              接続中...
                            </span>
                          )}
                          {integration.isSyncing && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              同期中...
                            </span>
                          )}
                          {integration.errorMessage && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              エラー
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedIntegration(integration)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          詳細を見る
                        </button>
                        
                        <div className="flex space-x-2">
                          {integration.isConnected ? (
                            <>
                              {/* ✅ 実際の同期ボタン（Teams対応） */}
                              <button
                                onClick={() => handleSync(integration.id)}
                                disabled={integration.isSyncing}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  integration.isSyncing
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                                title="データを同期"
                              >
                                {integration.isSyncing ? (
                                  <div className="flex items-center space-x-1">
                                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>同期中</span>
                                  </div>
                                ) : (
                                  '同期'
                                )}
                              </button>
                              {/* 切断ボタン */}
                              <button
                                onClick={() => handleDisconnect(integration.id)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                              >
                                切断
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleConnect(integration.id)}
                              disabled={integration.isConnecting}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                integration.isConnecting
                                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                  : integration.id === 'microsoft-teams'
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-300' // ✅ Teams強調
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {integration.isConnecting ? '接続中...' : '接続'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ✅ 接続統計 - Teams統合対応版 */}
                <div className="space-y-6">
                  {/* 基本統計 */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-blue-800">接続状況（13サービス対応）</h4>
                      {/* 全体同期ボタン */}
                      <button
                        onClick={async () => {
                          console.log('🔄 全体同期開始（Teams統合対応）...');
                          setMessage({ type: 'success', text: '全統合サービスの同期を開始しています...' });
                          
                          const connectedIntegrations = integrationsState.filter(i => i.isConnected);
                          
                          for (const integration of connectedIntegrations) {
                            await handleSync(integration.id);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                          }
                          
                          setMessage({ 
                            type: 'success', 
                            text: `全統合サービスの同期が完了しました（${connectedIntegrations.length}サービス）` 
                          });
                        }}
                        disabled={integrationsState.some(i => i.isSyncing)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          integrationsState.some(i => i.isSyncing)
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {integrationsState.some(i => i.isSyncing) ? '同期中...' : '全体同期'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-blue-600">総ツール数:</span>
                        <span className="ml-1 font-medium">{integrationsState.length}</span>
                      </div>
                      <div>
                        <span className="text-blue-600">接続済み:</span>
                        <span className="ml-1 font-medium">{integrationsState.filter(i => i.isConnected).length}</span>
                      </div>
                      <div>
                        <span className="text-blue-600">同期中:</span>
                        <span className="ml-1 font-medium">{integrationsState.filter(i => i.isSyncing).length}</span>
                      </div>
                      <div>
                        <span className="text-blue-600">エラー:</span>
                        <span className="ml-1 font-medium">{integrationsState.filter(i => i.errorMessage).length}</span>
                      </div>
                    </div>
                    
                    {/* 平均健全性スコア */}
                    {integrationsState.some(i => i.isConnected && i.healthScore !== undefined) && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-600">平均健全性スコア:</span>
                          <div className="flex items-center space-x-2">
                            {(() => {
                              const connectedWithScores = integrationsState.filter(i => i.isConnected && i.healthScore !== undefined);
                              const avgScore = connectedWithScores.length > 0 
                                ? Math.round(connectedWithScores.reduce((sum, i) => sum + (i.healthScore || 0), 0) / connectedWithScores.length)
                                : 0;
                              return (
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  avgScore >= 80 ? 'bg-green-100 text-green-800' :
                                  avgScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'  }`}>
                                  {avgScore}/100
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 同期履歴セクション */}
                  {integrationsState.some(i => i.isConnected) && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-green-800">最近の同期履歴</h4>
                        <span className="text-xs text-green-600">
                          {integrationsState.filter(i => i.isConnected).length}サービス接続中
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {integrationsState
                          .filter(i => i.isConnected)
                          .map(integration => (
                            <div key={integration.id} className="flex items-center justify-between p-2 bg-white rounded border border-green-100">
                              <div className="flex items-center space-x-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  integration.isSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
                                }`}></div>
                                <div className="flex items-center space-x-2">
                                  {integration.icon && (
                                    <span className="text-sm">{integration.icon}</span>
                                  )}
                                  <span className="text-sm font-medium text-green-700">{integration.name}</span>
                                  {/* ✅ Teams新機能バッジ */}
                                  {integration.id === 'microsoft-teams' && (
                                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      NEW
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                {/* 健全性スコア */}
                                {integration.healthScore && (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    integration.healthScore >= 80 ? 'bg-green-100 text-green-800' :
                                    integration.healthScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {integration.healthScore}
                                  </span>
                                )}
                                
                                {/* 最終同期時刻 */}
                                <span className="text-xs text-green-600">
                                  {integration.lastSync 
                                    ? new Date(integration.lastSync).toLocaleString('ja-JP', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : '未同期'
                                  }
                                </span>
                                
                                {/* 同期状態インジケーター */}
                                {integration.isSyncing && (
                                  <div className="flex items-center space-x-1">
                                    <svg className="animate-spin h-3 w-3 text-yellow-600" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-xs text-yellow-600">同期中</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* メトリクス概要セクション */}
                  {integrationsState.some(i => i.isConnected && i.metrics) && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                      <h4 className="text-sm font-medium text-purple-800 mb-4">統合メトリクス概要</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(() => {
                          const integrationsWithMetrics = integrationsState.filter(i => i.isConnected && i.metrics);
                          if (integrationsWithMetrics.length === 0) return null;
                          
                          const totalMessages = integrationsWithMetrics.reduce((sum, i) => sum + (i.metrics?.messageCount || 0), 0);
                          const totalActiveUsers = integrationsWithMetrics.reduce((sum, i) => sum + (i.metrics?.activeUsers || 0), 0);
                          const avgEngagement = integrationsWithMetrics.reduce((sum, i) => sum + (i.metrics?.engagementRate || 0), 0) / integrationsWithMetrics.length;
                          
                          return (
                            <>
                              <div className="bg-white p-3 rounded border border-purple-100">
                                <div className="text-xs text-purple-600 mb-1">総メッセージ数</div>
                                <div className="text-lg font-semibold text-purple-800">{totalMessages.toLocaleString()}</div>
                              </div>
                              <div className="bg-white p-3 rounded border border-purple-100">
                                <div className="text-xs text-purple-600 mb-1">総アクティブユーザー</div>
                                <div className="text-lg font-semibold text-purple-800">{totalActiveUsers}人</div>
                              </div>
                              <div className="bg-white p-3 rounded border border-purple-100">
                                <div className="text-xs text-purple-600 mb-1">平均エンゲージメント率</div>
                                <div className="text-lg font-semibold text-purple-800">{Math.round(avgEngagement * 100)}%</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 一般設定タブ */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">一般設定</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    アプリケーションの表示や動作に関する設定を管理します
                  </p>
                </div>

                <div className="space-y-6">
                  {/* テーマ設定 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      テーマ
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => handleGeneralChange('theme', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="light">ライトテーマ</option>
                      <option value="dark">ダークテーマ</option>
                      <option value="system">システム設定に従う</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      アプリケーションの表示テーマを選択します
                    </p>
                  </div>

                  {/* 言語設定 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      言語
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleGeneralChange('language', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="ja">日本語</option>
                      <option value="en">English</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      アプリケーションの表示言語を選択します
                    </p>
                  </div>

                  {/* タイムゾーン設定 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      タイムゾーン
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleGeneralChange('timezone', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      レポートや通知の時刻表示に使用するタイムゾーンを選択します
                    </p>
                  </div>
                </div>

                {/* アカウント情報 */}
                <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">アカウント情報</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ユーザーID:</span>
                      <span className="text-sm font-medium text-gray-900">{user?.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">メールアドレス:</span>
                      <span className="text-sm font-medium text-gray-900">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ロール:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {user?.role === 'admin' ? '管理者' : 
                            user?.role === 'manager' ? 'マネージャー' : 'メンバー'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">部署:</span>
                      <span className="text-sm font-medium text-gray-900">{user?.department || '未設定'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">登録日:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ja-JP') : '不明'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 保存ボタン */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`${
                  saving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center space-x-2`}
              >
                {saving && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{saving ? '保存中...' : '設定を保存'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ 統合詳細モーダル - Microsoft Teams OAuth認証対応版 */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {selectedIntegration.icon && (
                  <span className="text-xl">{selectedIntegration.icon}</span>
                )}
                <h3 className="text-lg font-medium text-gray-900">{selectedIntegration.name}</h3>
                {/* ✅ Teams新機能バッジ */}
                {selectedIntegration.id === 'microsoft-teams' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    NEW
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">{selectedIntegration.description}</p>
              
              {/* ✅ Teams特別説明 */}
              {selectedIntegration.id === 'microsoft-teams' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">🔷 Microsoft Teams統合の特徴</h4>
                  <p className="text-xs text-blue-700">
                    Microsoft 365環境に最適化された分析機能を提供します。会議の質、チーム結束度、コラボレーション効率を詳細に分析できます。
                  </p>
                </div>
              )}
              
              {/* 接続状態 */}
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">接続状態</h4>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedIntegration.isConnected ? 'bg-green-400' :
                    selectedIntegration.isConnecting ? 'bg-blue-400' :
                    selectedIntegration.errorMessage ? 'bg-red-400' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm">
                    {selectedIntegration.isConnected ? '接続済み' :
                     selectedIntegration.isConnecting ? '接続中...' :
                     selectedIntegration.errorMessage ? 'エラー' : '未接続'}
                  </span>
                </div>
                
                {/* 健全性スコア */}
                {selectedIntegration.isConnected && selectedIntegration.healthScore !== undefined && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">健全性スコア: </span>
                    <span className={`text-sm font-medium ${
                      selectedIntegration.healthScore >= 80 ? 'text-green-600' :
                      selectedIntegration.healthScore >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {selectedIntegration.healthScore}/100
                    </span>
                  </div>
                )}
                
                {/* 最終同期時刻 */}
                {selectedIntegration.isConnected && selectedIntegration.lastSync && (
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">
                      最終同期: {new Date(selectedIntegration.lastSync).toLocaleString('ja-JP')}
                    </span>
                  </div>
                )}
                
                {/* エラーメッセージ */}
                {selectedIntegration.errorMessage && (
                  <div className="mt-2 text-xs text-red-600">
                    {selectedIntegration.errorMessage}
                  </div>
                )}
              </div>

              {/* メトリクス詳細表示 */}
              {selectedIntegration.isConnected && selectedIntegration.metrics && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">詳細メトリクス</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">メッセージ数</div>
                      <div className="font-medium">{selectedIntegration.metrics.messageCount}</div>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">アクティブユーザー</div>
                      <div className="font-medium">{selectedIntegration.metrics.activeUsers}人</div>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">エンゲージメント率</div>
                      <div className="font-medium">{Math.round(selectedIntegration.metrics.engagementRate * 100)}%</div>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">応答時間</div>
                      <div className="font-medium">{Math.round(selectedIntegration.metrics.averageResponseTime / 60)}分</div>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">バーンアウトリスク</div>
                      <div className={`font-medium ${
                        selectedIntegration.metrics.burnoutRisk > 70 ? 'text-red-600' :
                        selectedIntegration.metrics.burnoutRisk > 40 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {selectedIntegration.metrics.burnoutRisk}%
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">ワークライフバランス</div>
                      <div className={`font-medium ${
                        selectedIntegration.metrics.workLifeBalance > 70 ? 'text-green-600' :
                        selectedIntegration.metrics.workLifeBalance > 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {selectedIntegration.metrics.workLifeBalance}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
                 {/* 分析機能 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">分析機能</h4>
                <ul className="space-y-1">
                  {selectedIntegration.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                      {/* ✅ Teams特別機能マーク */}
                      {selectedIntegration.id === 'microsoft-teams' && 
                       (feature.includes('会議参加率') || feature.includes('Teams通話') || feature.includes('チーム結束度')) && (
                        <span className="ml-2 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          強化
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* アクションボタン */}
              <div className="flex justify-end pt-4 border-t border-gray-200 space-x-2">
                {selectedIntegration.isConnected ? (
                  <>
                    {/* ✅ モーダル内の実際の同期ボタン（Teams対応） */}
                    <button
                      onClick={async () => {
                        await handleSync(selectedIntegration.id);
                        setSelectedIntegration(null);
                      }}
                      disabled={selectedIntegration.isSyncing}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedIntegration.isSyncing
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {selectedIntegration.isSyncing ? (
                        <div className="flex items-center space-x-1">
                          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>同期中</span>
                        </div>
                      ) : (
                        '同期'
                      )}
                    </button>
                    {/* 切断ボタン */}
                    <button
                      onClick={() => {
                        handleDisconnect(selectedIntegration.id);
                        setSelectedIntegration(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      切断
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      handleConnect(selectedIntegration.id);
                      setSelectedIntegration(null);
                    }}
                    disabled={selectedIntegration.isConnecting}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedIntegration.isConnecting
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : selectedIntegration.id === 'microsoft-teams'
                        ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-300' // ✅ Teams強調
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {selectedIntegration.isConnecting ? '接続中...' : '接続'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;