'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { integrationManager } from '@/lib/integrations/integration-manager';
import SlackIntegration from '@/lib/integrations/slack-integration';
import TeamsIntegration from '@/lib/integrations/teams-integration';
import type { UserSettings, NotificationSettings, PrivacySettings } from '@/types/api';
import type { Integration as IntegrationType, AnalyticsMetrics } from '@/types/integrations';
import TeamsTestPanel from '@/components/TeamsTestPanel';
import {
  Settings,
  Bell,
  Shield,
  Globe,
  Link,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  BarChart3,
  Clock,
  Zap,
  Database,
  ExternalLink,
  Info,
  X,
  Trash2,
  Download,
  MessageSquare,
  Lock 
} from 'lucide-react';

// 統合ページで使用する型定義
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
  icon?: React.ReactNode;
  priority?: number;
}

// 設定ページの型定義
interface LocalUserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
  timezone: string;
}

// 統合ツールのデータ（日本語版）
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
  features: ['メッセージ頻度分析', '応答時間測定', 'チャンネル活動', '感情分析'],
  setupUrl: '/api/auth/slack',
  icon: <MessageSquare className="w-5 h-5" />,
  priority: 1
},
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Microsoft 365統合コミュニケーション分析',
    category: 'communication',
    market: 'global',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['会議参加分析', 'チャット活動分析', 'ファイル共有インサイト', 'Teams通話分析', 'チーム結束度測定'],
    setupUrl: '/api/auth/teams',
    icon: <Users className="w-5 h-5" />,
    priority: 2
  },

  // 日本市場特化
  {
    id: 'chatwork',
    name: 'ChatWork',
    description: '日本のビジネスチャットプラットフォーム分析',
    category: 'communication',
    market: 'japan',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['タスク管理統合', 'メッセージ分析', 'ファイル共有状況'],
    icon: <BarChart3 className="w-5 h-5" />,
    priority: 3
  },
   {
    id: 'line-works',
    name: 'LINE WORKS',
    description: 'LINEビジネスコミュニケーション分析',
    category: 'communication',
    market: 'japan',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['トーク分析', 'カレンダー統合', 'アドレス帳活用'],
    icon: <MessageSquare className="w-5 h-5" />,
    priority: 4
  },
  {
    id: 'cybozu-office',
    name: 'Cybozu Office',
    description: 'サイボウズグループウェア分析',
    category: 'communication',
    market: 'japan',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['スケジュール分析', 'ワークフロー効率', 'ファイル管理'],
    icon: <Database className="w-5 h-5" />,
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
    features: ['会議参加率', '発言時間', 'カメラ使用率', '会議満足度'],
    icon: <Zap className="w-5 h-5" />,
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
    features: ['会議時間分析', '参加者エンゲージメント', 'Googleカレンダー統合'],
    icon: <Globe className="w-5 h-5" />,
    priority: 7
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'ゲーミングとクリエイティブチーム分析',
    category: 'communication',
    market: 'global',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['ボイスチャット時間', 'サーバー活動', 'コミュニティ健全性'],
    icon: <Users className="w-5 h-5" />,
    priority: 8
  },

  // アメリカ市場特化
  {
    id: 'cisco-webex',
    name: 'Cisco Webex',
    description: 'エンタープライズビデオ会議分析',
    category: 'communication',
    market: 'us',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['会議品質分析', 'セキュリティ監視', 'エンタープライズ統合'],
    icon: <Shield className="w-5 h-5" />,
    priority: 9
  },
  {
    id: 'gotomeeting',
    name: 'GoToMeeting',
    description: 'ビジネスオンライン会議分析',
    category: 'communication',
    market: 'us',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['会議効率分析', '録画管理', 'レポート生成'],
    icon: <BarChart3 className="w-5 h-5" />,
    priority: 10
  },
  {
    id: 'ringcentral',
    name: 'RingCentral',
    description: 'クラウドコミュニケーションプラットフォーム分析',
    category: 'communication',
    market: 'us',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['通話分析', 'メッセージング', 'ビデオ会議統合'],
    icon: <Database className="w-5 h-5" />,
    priority: 11
  },
  {
    id: 'workplace-meta',
    name: 'Workplace from Meta',
    description: 'Metaエンタープライズソーシャルプラットフォーム分析',
    category: 'communication',
    market: 'us',
    isConnected: false,
    isConnecting: false,
    isSyncing: false,
    features: ['エンタープライズソーシャル分析', 'エンゲージメント測定', 'グループ活動'],
    icon: <Users className="w-5 h-5" />,
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
    icon: <Shield className="w-5 h-5" />,
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
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'security' | 'general' | 'integrations'>('notifications');

  // 統合ページ関連のstate
  const [integrationsState, setIntegrationsState] = useState<Integration[]>(integrations);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  // 統合サービス初期化用のuseEffect
  useEffect(() => {
    const initializeIntegrations = async () => {
      try {
        console.log('🚀 統合管理システムの初期化を開始...');
        console.log('integrationManager:', integrationManager);
        
        console.log('SlackIntegration クラス登録確認...');
        console.log('🔷 TeamsIntegration クラス登録確認...');
        
        // 統合サービス定義を統合管理システム用の形式に変換
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

        const initResult = await integrationManager.initialize(integrationConfigs);
        console.log('初期化結果:', initResult);
        
        console.log('初期化後の統合リスト:', integrationManager.integrations);
        console.log('Slack統合確認:', integrationManager.integrations.get('slack'));
        console.log('🔷 Teams統合確認:', integrationManager.integrations.get('microsoft-teams'));
        
        console.log('✅ 統合管理システムの初期化が完了しました');
      } catch (error) {
        console.error('❌ 統合管理システム初期化エラー:', error);
        console.error('エラー詳細:', error instanceof Error ? error.message : String(error));
      }
    };

    initializeIntegrations();
  }, []);

  // 統合管理システムからの状態更新
  useEffect(() => {
    const updateIntegrationStates = async () => {
      try {
        console.log('🔄 統合状態の更新を開始...');
        
        const registeredIntegrations = integrationManager.integrations;
        
        setIntegrationsState(prev => 
          prev.map(integration => {
            const registered = registeredIntegrations.get(integration.id);
            if (registered) {
              console.log(`📊 ${integration.name} ステータス:`, registered.status);
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

    updateIntegrationStates();
    const interval = setInterval(updateIntegrationStates, 10000);
    return () => clearInterval(interval);
  }, []);

  // URL パラメータからの成功・エラーメッセージ処理
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const errorMessage = urlParams.get('message');
    const teamName = urlParams.get('team');
    const userName = urlParams.get('user');
    const organization = urlParams.get('organization');

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
        text: `Slack (${teamName}) の統合が正常に完了しました！`
      });
      setActiveTab('integrations');
      
      window.history.replaceState({}, '', '/settings?tab=integrations');
    } 
    else if (success === 'teams_connected') {
      const displayName = userName || organization || '不明';
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
        text: `Microsoft Teams (${displayName}) の統合が正常に完了しました！`
      });
      setActiveTab('integrations');
      
      window.history.replaceState({}, '', '/settings?tab=integrations');
    }
    else if (error === 'slack_oauth_failed') {
      setMessage({
        type: 'error',
        text: errorMessage || 'Slack統合に失敗しました'
      });
      setActiveTab('integrations');
      
      window.history.replaceState({}, '', '/settings?tab=integrations');
    } else if (error === 'teams_oauth_failed') {
      setMessage({
        type: 'error',
        text: errorMessage || 'Microsoft Teams統合に失敗しました'
      });
      setActiveTab('integrations');
      
      window.history.replaceState({}, '', '/settings?tab=integrations');
    }

    const tab = urlParams.get('tab');
if (tab && ['notifications', 'privacy', 'security', 'integrations', 'general'].includes(tab)) {
  setActiveTab(tab as typeof activeTab);
}
  }, []);

  // 設定データの初期化
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

  // 統合ページ関連の関数
  const handleConnect = async (integrationId: string) => {
    const integration = integrationsState.find(i => i.id === integrationId);
    if (!integration) return;

    try {
      setIntegrationsState(prev => 
        prev.map(i => 
          i.id === integrationId 
            ? { ...i, isConnecting: true, errorMessage: undefined }
            : i
        )
      );

      if (integration.setupUrl) {
        if (integrationId === 'slack') {
          console.log('Slack OAuth フローを開始...');
          window.location.href = integration.setupUrl;
          return;
        }
        else if (integrationId === 'microsoft-teams') {
          console.log('🔷 Teams OAuth フローを開始...');
          window.location.href = integration.setupUrl;
          return;
        }
      }

      console.log(`${integration.name} 統合を開始...`);
      
      setTimeout(() => {
        const healthScore = Math.floor(Math.random() * 30) + 70;
        setIntegrationsState(prev => 
          prev.map(i => 
            i.id === integrationId 
              ? { ...i, isConnecting: false, isConnected: true, healthScore }
              : i
          )
        );
        
        setMessage({
          type: 'success',
          text: `${integration.name} の統合が正常に完了しました！`
        });
      }, 2000);

    } catch (error) {
      console.error(`${integration.name} 統合エラー:`, error);
      
      setIntegrationsState(prev => 
        prev.map(i => 
          i.id === integrationId 
            ? { 
                ...i, 
                isConnecting: false, 
                errorMessage: '統合に失敗しました' 
              }
            : i
        )
      );

      setMessage({
        type: 'error',
        text: `${integration.name} の統合に失敗しました`
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
      console.log(`${integration.name} の切断を開始...`);

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
          throw new Error('切断に失敗しました');
        }
      } 
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
          throw new Error('切断に失敗しました');
        }
      } 
      else {
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

  const handleSync = async (integrationId: string) => {
    const integration = integrationsState.find(i => i.id === integrationId);
    if (!integration) return;

    try {
      console.log(`🔄 実際の同期を開始: ${integration.name}`);
      
      setIntegrationsState(prev => 
        prev.map(i => 
          i.id === integrationId 
            ? { ...i, isSyncing: true, errorMessage: undefined }
            : i
        )
      );

      setMessage({ 
        type: 'success', 
        text: `${integration.name} のデータ同期を開始しています...` 
      });

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
            console.log('📊 分析データの取得に成功:', analytics);
          } else {
            const analyticsFromManager = await integrationManager.getAnalytics('slack');
            if (analyticsFromManager) {
              healthScore = analyticsFromManager.healthScore || 85;
              console.log('📊 統合マネージャーから分析データを取得:', analyticsFromManager);
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
            text: `${integration.name} のデータ同期が完了しました！健全性スコア: ${healthScore}/100、処理レコード数: ${recordsProcessed}` 
          });
          
        } else {
          throw new Error('同期に失敗しました');
        }
      }
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
            console.log('📊 Teams分析データの取得に成功:', analytics);
          } else {
            const analyticsFromManager = await integrationManager.getAnalytics('microsoft-teams');
            if (analyticsFromManager) {
              healthScore = analyticsFromManager.healthScore || 82;
              console.log('📊 統合マネージャーからTeams分析データを取得:', analyticsFromManager);
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
            text: `${integration.name} のデータ同期が完了しました！健全性スコア: ${healthScore}/100、処理レコード数: ${recordsProcessed}` 
          });
          
        } else {
          throw new Error('Teams同期に失敗しました');
        }
      }
      else {
        console.log(`🔄 モック同期: ${integration.name}`);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const healthScore = Math.floor(Math.random() * 30) + 70;
        const mockMetrics = {
          messageCount: Math.floor(Math.random() * 500) + 100,
          activeUsers: Math.floor(Math.random() * 20) + 5,
          averageResponseTime: Math.floor(Math.random() * 300) + 60,
          engagementRate: Math.random() * 0.4 + 0.6,
          burnoutRisk: Math.floor(Math.random() * 40) + 10,
          stressLevel: Math.floor(Math.random() * 50) + 20,
          workLifeBalance: Math.floor(Math.random() * 30) + 70,
          teamCohesion: Math.floor(Math.random() * 40) + 60
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

  // リアルタイム健全性スコア更新
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
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-900">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">設定</h1>
          </div>
          <p className="text-gray-600">
            チーム健全性分析ツールの設定と統合を管理
          </p>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-md border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
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

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {/* タブナビゲーション */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
  { id: 'notifications', name: '通知', icon: Bell },
  { id: 'privacy', name: 'プライバシー', icon: Shield },
  { id: 'security', name: 'セキュリティ', icon: Lock },
  { id: 'integrations', name: '統合', icon: Link },
  { id: 'general', name: '一般', icon: Globe },
].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 通知設定タブ */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">通知設定</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    チーム健全性インサイトに関する通知の受け取り方法を設定
                  </p>
                </div>

                <div className="space-y-4">
                  {/* メール通知 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bell className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">メール通知</h4>
                        <p className="text-sm text-gray-500">
                          重要なアラートと更新をメールで受信
                        </p>
                      </div>
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
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Zap className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">プッシュ通知</h4>
                        <p className="text-sm text-gray-500">
                          ブラウザでリアルタイム通知を受信
                        </p>
                      </div>
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
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">週次レポート</h4>
                        <p className="text-sm text-gray-500">
                          毎週チーム健全性サマリーレポートを受信
                        </p>
                      </div>
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
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">緊急アラート</h4>
                        <p className="text-sm text-gray-500">
                          バーンアウトリスクと重要な問題の即座の通知
                        </p>
                      </div>
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
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">チーム更新情報</h4>
                        <p className="text-sm text-gray-500">
                          チームメンバーの追加、削除、変更に関する通知
                        </p>
                      </div>
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">プライバシーとデータ設定</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    データの共有と管理方法を制御
                  </p>
                </div>

                <div className="space-y-4">
                  {/* 分析データの共有 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">分析データの共有</h4>
                        <p className="text-sm text-gray-500">
                          サービス改善のための匿名化された分析データの共有を許可
                        </p>
                      </div>
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
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">データの匿名化</h4>
                        <p className="text-sm text-gray-500">
                          レポートと分析で個人識別子を匿名化
                        </p>
                      </div>
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
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">データ保持設定</h4>
                        <p className="text-sm text-gray-500">
                          プランベースのデータ保持期間設定を有効化
                        </p>
                      </div>
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
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Download className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">データエクスポート</h4>
                        <p className="text-sm text-gray-500">
                          チーム健全性データのエクスポート機能を有効化
                        </p>
                      </div>
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
                  <div className="flex items-start space-x-3">
                    <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800 mb-2">データ削除</h4>
                      <p className="text-sm text-red-600 mb-4">
                        アカウントに関連するすべてのデータを完全に削除します。この操作は元に戻せません。
                      </p>
                      <button
                        type="button"
                        className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                        onClick={() => {
                          if (confirm('すべてのデータを削除してもよろしいですか？この操作は元に戻せません。')) {
                            alert('データ削除機能は開発中です');
                          }
                        }}
                      >
                        すべてのデータを削除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 統合設定タブ - 日本語版 */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">統合管理</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    チーム健全性分析のためのコミュニケーションプラットフォームを接続・管理（13サービス対応）
                  </p>
                </div>

                {/* Microsoft Teams 新機能案内バナー */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Microsoft Teams統合が利用可能になりました！</h4>
                      <p className="text-sm text-blue-600 mt-1">
                        Microsoft 365環境向けの高度なチーム健全性分析。会議参加、チャット活動、コラボレーションパターンを分析します。
                      </p>
                    </div>
                  </div>
                </div>

                {/* Teams統合テストパネル */}
                {process.env.NEXT_PUBLIC_TEAMS_DEBUG === 'true' && (
                  <TeamsTestPanel />
                )}

                {/* 統合ツール一覧 - 日本語版 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integrationsState
                    .sort((a, b) => (a.priority || 999) - (b.priority || 999))
                    .map((integration) => (
                    <div
                      key={integration.id}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        integration.isConnected
                          ? 'border-green-200 bg-green-50'
                          : integration.errorMessage
                          ? 'border-red-200 bg-red-50'
                          : integration.id === 'microsoft-teams'
                          ? 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {integration.icon}
                            <h4 className="font-medium text-gray-900">{integration.name}</h4>
                            {integration.id === 'microsoft-teams' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                新機能
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
                                <span className="font-medium">{integration.metrics.activeUsers} ユーザー</span>
                              </div>
                            </div>
                          )}
                          
                          {/* 最終同期時刻表示 */}
                          {integration.isConnected && integration.lastSync && (
                            <div className="mt-1 flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                最終同期: {new Date(integration.lastSync).toLocaleString()}
                              </span>
                            </div>
                          )}
                          
                          {/* エラーメッセージ表示 */}
                          {integration.errorMessage && (
                            <div className="mt-2 flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                              <span className="text-xs text-red-600">{integration.errorMessage}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1">
                          {integration.isConnected && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              接続済み
                            </span>
                          )}
                          {integration.isConnecting && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              接続中...
                            </span>
                          )}
                          {integration.isSyncing && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              同期中...
                            </span>
                          )}
                          {integration.errorMessage && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              エラー
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedIntegration(integration)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                        >
                          <Info className="w-3 h-3" />
                          <span>詳細を表示</span>
                        </button>
                        
                        <div className="flex space-x-2">
                          {integration.isConnected ? (
                            <React.Fragment>
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
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                     <span>同期中</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <RefreshCw className="w-3 h-3" />
                                    <span>同期</span>
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={() => handleDisconnect(integration.id)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors flex items-center space-x-1"
                              >
                                <X className="w-3 h-3" />
                                <span>切断</span>
                              </button>
                            </React.Fragment>
                          ) : (
                            <button
                              onClick={() => handleConnect(integration.id)}
                              disabled={integration.isConnecting}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                                integration.isConnecting
                                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                  : integration.id === 'microsoft-teams'
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-300'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {integration.isConnecting ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>接続中...</span>
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="w-3 h-3" />
                                  <span>接続</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 接続統計 - 日本語版 */}
                <div className="space-y-6">
                  {/* 基本統計 */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-blue-800 flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>接続ステータス（13サービス対応）</span>
                      </h4>
                      <button
                        onClick={async () => {
                          console.log('🔄 グローバル同期を開始...');
                          setMessage({ type: 'success', text: '接続されているすべてのサービスの同期を開始しています...' });
                          
                          const connectedIntegrations = integrationsState.filter(i => i.isConnected);
                          
                          for (const integration of connectedIntegrations) {
                            await handleSync(integration.id);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                          }
                          
                          setMessage({ 
                            type: 'success', 
                            text: `グローバル同期が完了しました（${connectedIntegrations.length} サービス）` 
                          });
                        }}
                        disabled={integrationsState.some(i => i.isSyncing)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                          integrationsState.some(i => i.isSyncing)
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {integrationsState.some(i => i.isSyncing) ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>同期中...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3" />
                            <span>全て同期</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-600">総サービス数:</span>
                        <span className="font-medium">{integrationsState.length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-blue-600">接続済み:</span>
                        <span className="font-medium">{integrationsState.filter(i => i.isConnected).length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 text-yellow-600" />
                        <span className="text-blue-600">同期中:</span>
                        <span className="font-medium">{integrationsState.filter(i => i.isSyncing).length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-blue-600">エラー:</span>
                        <span className="font-medium">{integrationsState.filter(i => i.errorMessage).length}</span>
                      </div>
                    </div>
                    
                    {/* 平均健全性スコア */}
                    {integrationsState.some(i => i.isConnected && i.healthScore !== undefined) && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-600 flex items-center space-x-2">
                            <BarChart3 className="w-4 h-4" />
                            <span>平均健全性スコア:</span>
                          </span>
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
                                  'bg-red-100 text-red-800'
                                }`}>
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
                        <h4 className="text-sm font-medium text-green-800 flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>最近の同期履歴</span>
                        </h4>
                        <span className="text-xs text-green-600 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>{integrationsState.filter(i => i.isConnected).length} サービス接続済み</span>
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
                                  {integration.icon}
                                  <span className="text-sm font-medium text-green-700">{integration.name}</span>
                                  {integration.id === 'microsoft-teams' && (
                                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      新機能
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
                                <span className="text-xs text-green-600 flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
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
                                </span>
                                
                                {/* 同期状態インジケーター */}
                                {integration.isSyncing && (
                                  <div className="flex items-center space-x-1">
                                    <RefreshCw className="w-3 h-3 animate-spin text-yellow-600" />
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
                      <h4 className="text-sm font-medium text-purple-800 mb-4 flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>統合メトリクス概要</span>
                      </h4>
                      
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
                                <div className="flex items-center space-x-2 mb-1">
                                  <MessageSquare className="w-4 h-4 text-purple-600" />
                                  <div className="text-xs text-purple-600">総メッセージ数</div>
                                </div>
                                <div className="text-lg font-semibold text-purple-800">{totalMessages.toLocaleString()}</div>
                              </div>
                              <div className="bg-white p-3 rounded border border-purple-100">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Users className="w-4 h-4 text-purple-600" />
                                  <div className="text-xs text-purple-600">総アクティブユーザー</div>
                                </div>
                                <div className="text-lg font-semibold text-purple-800">{totalActiveUsers} ユーザー</div>
                              </div>
                              <div className="bg-white p-3 rounded border border-purple-100">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Zap className="w-4 h-4 text-purple-600" />
                                  <div className="text-xs text-purple-600">平均エンゲージメント</div>
                                </div>
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

           {/* セキュリティ設定タブ */}
{activeTab === 'security' && (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">セキュリティ設定</h3>
      <p className="text-sm text-gray-600 mb-6">
        アカウントのセキュリティを強化するための設定
      </p>
    </div>

    {/* セキュリティダッシュボードリンク */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-medium text-blue-900 mb-2">セキュリティダッシュボード</h4>
          <p className="text-sm text-blue-700 mb-4">
            ログイン履歴、異常検知、セキュリティアラートを監視・管理します。
          </p>
          
          <button
            onClick={() => window.open('/security', '_blank')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Shield className="w-4 h-4 mr-2" />
            セキュリティダッシュボードを開く
          </button>
        </div>
      </div>
    </div>

    {/* 2要素認証設定 */}
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-medium text-green-900 mb-2">2要素認証</h4>
          <p className="text-sm text-green-700 mb-4">
            パスワードに加えて認証アプリのコードを使用することで、アカウントのセキュリティを大幅に向上させます。
          </p>
          
          <button
            onClick={() => window.open('/settings/2fa', '_blank')}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            <Lock className="w-4 h-4 mr-2" />
            2要素認証を設定
          </button>
        </div>
      </div>
    </div>

    {/* パスワードリセット */}
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-yellow-600" />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-medium text-yellow-900 mb-2">パスワード管理</h4>
          <p className="text-sm text-yellow-700 mb-4">
            パスワードの変更やリセットを安全に行います。
          </p>
          
          <button
            onClick={() => window.open('/reset-password', '_blank')}
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            パスワードをリセット
          </button>
        </div>
      </div>
    </div>
  </div>
)}

            {/* 一般設定タブ */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">一般設定</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    アプリケーションの表示と動作設定を構成
                  </p>
                </div>

                <div className="space-y-6">
                  {/* テーマ設定 */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <Globe className="w-4 h-4" />
                      <span>テーマ</span>
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => handleGeneralChange('theme', e.target.value)}
                      className="mt-1 w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="light">ライトテーマ</option>
                      <option value="dark">ダークテーマ</option>
                      <option value="system">システム設定に従う</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      お好みのアプリケーションテーマを選択
                    </p>
                  </div>

                  {/* 言語設定 */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <Globe className="w-4 h-4" />
                      <span>言語</span>
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleGeneralChange('language', e.target.value)}
                      className="mt-1 w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="ja">日本語 (Japanese)</option>
                      <option value="en">English</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      お好みのアプリケーション言語を選択
                    </p>
                  </div>

                  {/* タイムゾーン設定 */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4" />
                      <span>タイムゾーン</span>
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleGeneralChange('timezone', e.target.value)}
                      className="mt-1 w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      レポートと通知のタイムスタンプに使用されるタイムゾーン
                    </p>
                  </div>
                </div>

                {/* アカウント情報 */}
                <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>アカウント情報</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ユーザーID:</span>
                      <span className="text-sm font-medium text-gray-900">{user?.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">メールアドレス:</span>
                      <span className="text-sm font-medium text-gray-900">{user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">役割:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {user?.role === 'admin' ? '管理者' : 
                            user?.role === 'manager' ? 'マネージャー' : 'メンバー'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">部署:</span>
                      <span className="text-sm font-medium text-gray-900">{user?.department || '未設定'}</span>
                    </div>
                    <div className="flex justify-between items-center">
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
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
                <span>{saving ? '保存中...' : '設定を保存'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 統合詳細モーダル */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {selectedIntegration.icon}
                <h3 className="text-lg font-medium text-gray-900">{selectedIntegration.name}</h3>
                {selectedIntegration.id === 'microsoft-teams' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    新機能
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">{selectedIntegration.description}</p>
              
              {selectedIntegration.id === 'microsoft-teams' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-1 flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>Microsoft Teams統合機能</span>
                  </h4>
                  <p className="text-xs text-blue-700">
                    Microsoft 365環境向けに最適化された分析機能。
                  </p>
                </div>
              )}
              
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">接続ステータス</h4>
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
                
                {selectedIntegration.isConnected && selectedIntegration.lastSync && (
                  <div className="mt-1 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      最終同期: {selectedIntegration.lastSync.toLocaleString('ja-JP')}
                    </span>
                  </div>
                )}
                
                {selectedIntegration.errorMessage && (
                  <div className="mt-2 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-600">
                      {selectedIntegration.errorMessage}
                    </span>
                  </div>
                )}
              </div>

              {selectedIntegration.isConnected && selectedIntegration.metrics && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">詳細メトリクス</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">メッセージ</div>
                      <div className="font-medium">{selectedIntegration.metrics.messageCount || 0}</div>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">アクティブユーザー</div>
                      <div className="font-medium">{selectedIntegration.metrics.activeUsers || 0} ユーザー</div>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">エンゲージメント率</div>
                      <div className="font-medium">{Math.round((selectedIntegration.metrics.engagementRate || 0) * 100)}%</div>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">応答時間</div>
                      <div className="font-medium">{Math.round((selectedIntegration.metrics.averageResponseTime || 0) / 60)}分</div>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">バーンアウトリスク</div>
                      <div className={`font-medium ${
                        (selectedIntegration.metrics.burnoutRisk || 0) > 70 ? 'text-red-600' :
                        (selectedIntegration.metrics.burnoutRisk || 0) > 40 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {selectedIntegration.metrics.burnoutRisk || 0}%
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">ワークライフバランス</div>
                      <div className={`font-medium ${
                        (selectedIntegration.metrics.workLifeBalance || 0) > 70 ? 'text-green-600' :
                        (selectedIntegration.metrics.workLifeBalance || 0) > 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {selectedIntegration.metrics.workLifeBalance || 0}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">分析機能</h4>
                <ul className="space-y-1">
                  {selectedIntegration.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {feature}
                      {selectedIntegration.id === 'microsoft-teams' && 
                       (feature.includes('会議参加') || feature.includes('Teams通話') || feature.includes('チーム結束度')) && (
                        <span className="ml-2 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          強化済み
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 space-x-2">
                {selectedIntegration.isConnected ? (
                  <>
                    <button
                      onClick={async () => {
                        await handleSync(selectedIntegration.id);
                        setSelectedIntegration(null);
                      }}
                      disabled={selectedIntegration.isSyncing}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                        selectedIntegration.isSyncing
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {selectedIntegration.isSyncing ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>同期中</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          <span>同期</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        handleDisconnect(selectedIntegration.id);
                        setSelectedIntegration(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-1"
                    >
                      <X className="w-3 h-3" />
                      <span>切断</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      handleConnect(selectedIntegration.id);
                      setSelectedIntegration(null);
                    }}
                    disabled={selectedIntegration.isConnecting}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                      selectedIntegration.isConnecting
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : selectedIntegration.id === 'microsoft-teams'
                        ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {selectedIntegration.isConnecting ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>接続中...</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3 h-3" />
                        <span>接続</span>
                      </>
                    )}
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