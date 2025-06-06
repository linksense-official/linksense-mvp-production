'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
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

// 言語コンテキスト
interface LanguageContextType {
  language: 'ja' | 'en';
  setLanguage: (lang: 'ja' | 'en') => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

// 翻訳辞書
const translations = {
  ja: {
    // ヘッダー
    'settings': '設定',
    'settings.description': 'チーム健全性分析ツールの設定と統合を管理',
    
    // タブ
    'tab.notifications': '通知',
    'tab.privacy': 'プライバシー',
    'tab.security': 'セキュリティ',
    'tab.integrations': '統合',
    'tab.general': '一般',
    
    // 通知設定
    'notifications.title': '通知設定',
    'notifications.description': 'チーム健全性インサイトに関する通知の受け取り方法を設定',
    'notifications.email': 'メール通知',
    'notifications.email.description': '重要なアラートと更新をメールで受信',
    'notifications.push': 'プッシュ通知',
    'notifications.push.description': 'ブラウザでリアルタイム通知を受信',
    'notifications.weekly': '週次レポート',
    'notifications.weekly.description': '毎週チーム健全性サマリーレポートを受信',
    'notifications.critical': '緊急アラート',
    'notifications.critical.description': 'バーンアウトリスクと重要な問題の即座の通知',
    'notifications.team': 'チーム更新情報',
    'notifications.team.description': 'チームメンバーの追加、削除、変更に関する通知',
    
    // プライバシー設定
    'privacy.title': 'プライバシーとデータ設定',
    'privacy.description': 'データの共有と管理方法を制御',
    'privacy.share': '分析データの共有',
    'privacy.share.description': 'サービス改善のための匿名化された分析データの共有を許可',
    'privacy.anonymize': 'データの匿名化',
    'privacy.anonymize.description': 'レポートと分析で個人識別子を匿名化',
    'privacy.retention': 'データ保持設定',
    'privacy.retention.description': 'プランベースのデータ保持期間設定を有効化',
    'privacy.export': 'データエクスポート',
    'privacy.export.description': 'チーム健全性データのエクスポート機能を有効化',
    'privacy.delete': 'データ削除',
    'privacy.delete.description': 'アカウントに関連するすべてのデータを完全に削除します。この操作は元に戻せません。',
    'privacy.delete.button': 'すべてのデータを削除',
    'privacy.delete.confirm': 'すべてのデータを削除してもよろしいですか？この操作は元に戻せません。',
    
    // セキュリティ設定
    'security.title': 'セキュリティ設定',
    'security.description': 'アカウントのセキュリティを強化するための設定',
    'security.dashboard': 'セキュリティダッシュボード',
    'security.dashboard.description': 'ログイン履歴、異常検知、セキュリティアラートを監視・管理します。',
    'security.dashboard.button': 'セキュリティダッシュボードを開く',
    'security.2fa': '2要素認証',
    'security.2fa.description': 'パスワードに加えて認証アプリのコードを使用することで、アカウントのセキュリティを大幅に向上させます。',
    'security.2fa.button': '2要素認証を設定',
    'security.password': 'パスワード管理',
    'security.password.description': 'パスワードの変更やリセットを安全に行います。',
    'security.password.button': 'パスワードをリセット',
    
    // 統合設定
    'integrations.title': '統合管理',
    'integrations.description': 'チーム健全性分析のためのコミュニケーションプラットフォームを接続・管理（7サービス対応）',
    'integrations.teams.banner': 'Microsoft Teams統合が利用可能になりました！',
    'integrations.teams.banner.description': 'Microsoft 365環境向けの高度なチーム健全性分析。会議参加、チャット活動、コラボレーションパターンを分析します。',
    'integrations.new': '新機能',
    'integrations.connected': '接続済み',
    'integrations.connecting': '接続中...',
    'integrations.syncing': '同期中...',
    'integrations.error': 'エラー',
    'integrations.connect': '接続',
    'integrations.disconnect': '切断',
    'integrations.sync': '同期',
    'integrations.details': '詳細を表示',
    'integrations.health': '健全性スコア',
    'integrations.lastSync': '最終同期',
    'integrations.syncAll': '全て同期',
    'integrations.totalServices': '総サービス数',
    'integrations.avgHealth': '平均健全性スコア',
    'integrations.recentSync': '最近の同期履歴',
    'integrations.metricsOverview': '統合メトリクス概要',
    'integrations.totalMessages': '総メッセージ数',
    'integrations.totalUsers': '総アクティブユーザー',
    'integrations.avgEngagement': '平均エンゲージメント',
    
    // 一般設定
    'general.title': '一般設定',
    'general.description': 'アプリケーションの表示と動作設定を構成',
    'general.theme': 'テーマ',
    'general.theme.light': 'ライトテーマ',
    'general.theme.dark': 'ダークテーマ',
    'general.theme.system': 'システム設定に従う',
    'general.theme.description': 'お好みのアプリケーションテーマを選択',
    'general.language': '言語',
    'general.language.description': 'お好みのアプリケーション言語を選択',
    'general.timezone': 'タイムゾーン',
    'general.timezone.description': 'レポートと通知のタイムスタンプに使用されるタイムゾーン',
    'general.account': 'アカウント情報',
    'general.account.userId': 'ユーザーID',
    'general.account.email': 'メールアドレス',
    'general.account.role': '役割',
    'general.account.department': '部署',
    'general.account.registered': '登録日',
    'general.account.member': 'メンバー',
    'general.account.notSet': '未設定',
    
    // ボタン・アクション
    'button.save': '設定を保存',
    'button.saving': '保存中...',
    'button.close': '閉じる',
    'button.retry': '再試行',
    'button.cancel': 'キャンセル',
    
    // メッセージ
    'message.saved': '設定が正常に保存されました',
    'message.error': '設定の保存に失敗しました',
    'message.loading': '読み込み中...',
    'message.loadingSettings': '設定を読み込み中...',
    'message.connected': 'の統合が正常に完了しました！',
    'message.disconnected': 'の切断が完了しました',
    'message.syncStarted': 'のデータ同期を開始しています...',
    'message.syncCompleted': 'のデータ同期が完了しました！健全性スコア',
    'message.syncFailed': 'のデータ同期に失敗しました',
    'message.globalSync': 'グローバル同期が完了しました',
    'message.connectFailed': 'の統合に失敗しました',
    'message.disconnectConfirm': 'の統合を切断しますか？',
    
    // 統合サービス説明
    'integration.slack.description': 'チームコミュニケーションとメッセージ分析',
    'integration.teams.description': 'Microsoft 365統合コミュニケーション分析',
    'integration.chatwork.description': '日本のビジネスチャットプラットフォーム分析',
    'integration.lineworks.description': 'LINEビジネスコミュニケーション分析',
    'integration.cybozu.description': 'サイボウズグループウェア分析',
    'integration.zoom.description': 'ビデオ会議とエンゲージメント分析',
    'integration.googlemeet.description': 'Google Workspace統合ビデオ会議分析',
    'integration.discord.description': 'ゲーミングとクリエイティブチーム分析',
  },
  en: {
    // Header
    'settings': 'Settings',
    'settings.description': 'Manage team health analysis tool settings and integrations',
    
    // Tabs
    'tab.notifications': 'Notifications',
    'tab.privacy': 'Privacy',
    'tab.security': 'Security',
    'tab.integrations': 'Integrations',
    'tab.general': 'General',
    
    // Notification Settings
    'notifications.title': 'Notification Settings',
    'notifications.description': 'Configure how you receive notifications about team health insights',
    'notifications.email': 'Email Notifications',
    'notifications.email.description': 'Receive important alerts and updates via email',
    'notifications.push': 'Push Notifications',
    'notifications.push.description': 'Receive real-time notifications in your browser',
    'notifications.weekly': 'Weekly Reports',
    'notifications.weekly.description': 'Receive weekly team health summary reports',
    'notifications.critical': 'Critical Alerts',
    'notifications.critical.description': 'Immediate notifications for burnout risks and critical issues',
    'notifications.team': 'Team Updates',
    'notifications.team.description': 'Notifications about team member additions, removals, and changes',
    
    // Privacy Settings
    'privacy.title': 'Privacy and Data Settings',
    'privacy.description': 'Control how your data is shared and managed',
    'privacy.share': 'Share Analytics Data',
    'privacy.share.description': 'Allow sharing of anonymized analytics data for service improvement',
    'privacy.anonymize': 'Anonymize Data',
    'privacy.anonymize.description': 'Anonymize personal identifiers in reports and analytics',
    'privacy.retention': 'Data Retention Settings',
    'privacy.retention.description': 'Enable plan-based data retention period settings',
    'privacy.export': 'Data Export',
    'privacy.export.description': 'Enable team health data export functionality',
    'privacy.delete': 'Data Deletion',
    'privacy.delete.description': 'Permanently delete all data associated with your account. This action cannot be undone.',
    'privacy.delete.button': 'Delete All Data',
    'privacy.delete.confirm': 'Are you sure you want to delete all data? This action cannot be undone.',
    
    // Security Settings
    'security.title': 'Security Settings',
    'security.description': 'Settings to enhance your account security',
    'security.dashboard': 'Security Dashboard',
    'security.dashboard.description': 'Monitor and manage login history, anomaly detection, and security alerts.',
    'security.dashboard.button': 'Open Security Dashboard',
    'security.2fa': 'Two-Factor Authentication',
    'security.2fa.description': 'Significantly improve account security by using authentication app codes in addition to your password.',
    'security.2fa.button': 'Set Up 2FA',
    'security.password': 'Password Management',
    'security.password.description': 'Safely change or reset your password.',
    'security.password.button': 'Reset Password',
    
    // Integration Settings
    'integrations.title': 'Integration Management',
    'integrations.description': 'Connect and manage communication platforms for team health analysis (7 services supported)',
    'integrations.teams.banner': 'Microsoft Teams integration is now available!',
    'integrations.teams.banner.description': 'Advanced team health analysis for Microsoft 365 environments. Analyze meeting participation, chat activity, and collaboration patterns.',
    'integrations.new': 'New',
    'integrations.connected': 'Connected',
    'integrations.connecting': 'Connecting...',
    'integrations.syncing': 'Syncing...',
    'integrations.error': 'Error',
    'integrations.connect': 'Connect',
    'integrations.disconnect': 'Disconnect',
    'integrations.sync': 'Sync',
    'integrations.details': 'Show Details',
    'integrations.health': 'Health Score',
    'integrations.lastSync': 'Last Sync',
    'integrations.syncAll': 'Sync All',
    'integrations.totalServices': 'Total Services',
    'integrations.avgHealth': 'Average Health Score',
    'integrations.recentSync': 'Recent Sync History',
    'integrations.metricsOverview': 'Integration Metrics Overview',
    'integrations.totalMessages': 'Total Messages',
    'integrations.totalUsers': 'Total Active Users',
    'integrations.avgEngagement': 'Average Engagement',
    
    // General Settings
    'general.title': 'General Settings',
    'general.description': 'Configure application display and behavior settings',
    'general.theme': 'Theme',
    'general.theme.light': 'Light Theme',
    'general.theme.dark': 'Dark Theme',
    'general.theme.system': 'Follow System Settings',
    'general.theme.description': 'Select your preferred application theme',
    'general.language': 'Language',
    'general.language.description': 'Select your preferred application language',
    'general.timezone': 'Timezone',
    'general.timezone.description': 'Timezone used for report and notification timestamps',
    'general.account': 'Account Information',
    'general.account.userId': 'User ID',
    'general.account.email': 'Email Address',
    'general.account.role': 'Role',
    'general.account.department': 'Department',
    'general.account.registered': 'Registration Date',
    'general.account.member': 'Member',
    'general.account.notSet': 'Not Set',
    
    // Buttons & Actions
    'button.save': 'Save Settings',
    'button.saving': 'Saving...',
    'button.close': 'Close',
    'button.retry': 'Retry',
    'button.cancel': 'Cancel',
    
    // Messages
    'message.saved': 'Settings saved successfully',
    'message.error': 'Failed to save settings',
    'message.loading': 'Loading...',
    'message.loadingSettings': 'Loading settings...',
    'message.connected': ' integration completed successfully!',
    'message.disconnected': ' disconnection completed',
    'message.syncStarted': ' data sync started...',
    'message.syncCompleted': ' data sync completed! Health score',
    'message.syncFailed': ' data sync failed',
    'message.globalSync': 'Global sync completed',
    'message.connectFailed': ' integration failed',
    'message.disconnectConfirm': 'Disconnect integration with ',
    
    // Integration Service Descriptions
    'integration.slack.description': 'Team communication and message analytics',
    'integration.teams.description': 'Microsoft 365 integrated communication analytics',
    'integration.chatwork.description': 'Japanese business chat platform analytics',
    'integration.lineworks.description': 'LINE business communication analytics',
    'integration.cybozu.description': 'Cybozu groupware analytics',
    'integration.zoom.description': 'Video conferencing and engagement analytics',
    'integration.googlemeet.description': 'Google Workspace integrated video conferencing analytics',
    'integration.discord.description': 'Gaming and creative team analytics',
  }
};

// 言語プロバイダー
const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['ja']] || key;
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'ja' | 'en';
    if (savedLanguage && (savedLanguage === 'ja' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 言語フック
const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

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

// 通知機能の実装
const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  // ブラウザ通知
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('LinkSense設定', {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });
  }
  
  // コンソールログ
  console.log(`通知: ${message} (${type})`);
  
  // カスタムイベントでUIに通知
  window.dispatchEvent(new CustomEvent('settings-notification', {
    detail: { message, type }
  }));
};

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
    setupUrl: '/api/auth/chatwork',
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
  setupUrl: '/api/auth/lineworksauth',  // ✅ 正しい
  icon: <MessageSquare className="w-5 h-5" />,
  priority: 4
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
    setupUrl: '/api/auth/zoom',
    icon: <Zap className="w-5 h-5" />,
    priority: 5
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
    setupUrl: '/api/auth/google-meet',
    icon: <Globe className="w-5 h-5" />,
    priority: 6
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
    setupUrl: '/api/auth/discord',
    icon: <Users className="w-5 h-5" />,
    priority: 7
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

const SettingsPageContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, loading } = useAuth();
  const [settings, setSettings] = useState<LocalUserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'security' | 'general' | 'integrations'>('notifications');

  // 統合ページ関連のstate
  const [integrationsState, setIntegrationsState] = useState<Integration[]>(integrations);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  
  // 言語変更ハンドラーを追加
  const handleLanguageChange = (newLanguage: 'ja' | 'en') => {
    setLanguage(newLanguage);
    showNotification(
      newLanguage === 'ja' ? '言語が日本語に変更されました' : 'Language changed to English',
      'success'
    );
  };

  // 統合サービス初期化用のuseEffect
  useEffect(() => {
    const initializeIntegrations = async () => {
      try {
        console.log('統合管理システムの初期化を開始...');
        console.log('integrationManager:', integrationManager);
        
        console.log('SlackIntegration クラス登録確認...');
        console.log('TeamsIntegration クラス登録確認...');
        
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
        console.log('Teams統合確認:', integrationManager.integrations.get('microsoft-teams'));
        
        console.log('統合管理システムの初期化が完了しました');
      } catch (error) {
        console.error('統合管理システム初期化エラー:', error);
        console.error('エラー詳細:', error instanceof Error ? error.message : String(error));
      }
    };

    initializeIntegrations();
  }, []);

  // 統合管理システムからの状態更新
  useEffect(() => {
    const updateIntegrationStates = async () => {
      try {
        console.log('統合状態の更新を開始...');
        
        const registeredIntegrations = integrationManager.integrations;
        
        setIntegrationsState(prev => 
          prev.map(integration => {
            const registered = registeredIntegrations.get(integration.id);
            if (registered) {
              console.log(`${integration.name} ステータス:`, registered.status);
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
      console.log('Slack接続成功を検出:', teamName);
      
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
      console.log('Teams接続成功を検出:', displayName);
      
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
    // モックデータとして初期設定を設定
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
          console.log('Teams OAuth フローを開始...');
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
      console.log(`実際の同期を開始: ${integration.name}`);
      
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
        console.log('Slack統合管理システム同期実行...');
        
        const syncResult = await integrationManager.sync('slack');
        
        if (syncResult) {
          console.log('Slack同期結果:', syncResult);
          
          const analytics = (syncResult as any).analytics;
          let healthScore = 85;
          let recordsProcessed = 0;
          
          if (analytics) {
            healthScore = analytics.healthScore || 85;
            console.log('分析データの取得に成功:', analytics);
          } else {
            const analyticsFromManager = await integrationManager.getAnalytics('slack');
            if (analyticsFromManager) {
              healthScore = analyticsFromManager.healthScore || 85;
              console.log('統合マネージャーから分析データを取得:', analyticsFromManager);
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
        console.log('Teams統合管理システム同期実行...');
        
        const syncResult = await integrationManager.sync('microsoft-teams');
        
        if (syncResult) {
          console.log('Teams同期結果:', syncResult);
          
          const analytics = (syncResult as any).analytics;
          let healthScore = 82;
          let recordsProcessed = 0;
          
          if (analytics) {
            healthScore = analytics.healthScore || 82;
            console.log('Teams分析データの取得に成功:', analytics);
          } else {
            const analyticsFromManager = await integrationManager.getAnalytics('microsoft-teams');
            if (analyticsFromManager) {
              healthScore = analyticsFromManager.healthScore || 82;
              console.log('統合マネージャーからTeams分析データを取得:', analyticsFromManager);
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
        console.log(`モック同期: ${integration.name}`);
        
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
      console.error(`${integration.name} 同期エラー:`, error);
      
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

  // 通知設定の変更（実際の機能動作実装）
  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    if (settings) {
      setSettings({
        ...settings,
        notifications: {
          ...settings.notifications,
          [key]: value
        }
      });
      
      // 実際の機能動作実装
      console.log(`通知設定変更: ${key} = ${value}`);
      
      // 実際の通知設定APIを呼び出し
      if (key === 'pushNotifications' && value) {
        // プッシュ通知の許可を要求
        if ('Notification' in window && Notification.permission !== 'granted') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              showNotification('プッシュ通知が有効になりました', 'success');
              // Service Worker登録（実際のプッシュ通知実装）
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                  console.log('Service Worker登録成功:', registration);
                }).catch(error => {
                  console.error('Service Worker登録失敗:', error);
                });
              }
            } else {
              showNotification('プッシュ通知の許可が必要です', 'warning');
            }
          });
        } else if (Notification.permission === 'granted') {
          showNotification('プッシュ通知設定が更新されました', 'success');
        }
      }
      
      if (key === 'emailNotifications') {
        // 実際のメール通知設定API呼び出し
        fetch('/api/notifications/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: value, userId: user?.id })
        }).then(response => {
          if (response.ok) {
            showNotification(
              value ? 'メール通知が有効になりました' : 'メール通知が無効になりました',
              'success'
            );
          }
        }).catch(error => {
          console.error('メール通知設定エラー:', error);
          showNotification('メール通知設定の更新に失敗しました', 'error');
        });
      }
      
      if (key === 'weeklyReports') {
        // 週次レポート配信設定
        const scheduleWeeklyReport = async () => {
          try {
            const response = await fetch('/api/reports/schedule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                enabled: value, 
                userId: user?.id,
                frequency: 'weekly',
                timezone: settings.timezone 
              })
            });
            
            if (response.ok) {
              showNotification(
                value ? '週次レポートの配信を開始します' : '週次レポートの配信を停止します',
                'success'
              );
            }
          } catch (error) {
            console.error('週次レポート設定エラー:', error);
            showNotification('週次レポート設定の更新に失敗しました', 'error');
          }
        };
        
        scheduleWeeklyReport();
      }
      
      if (key === 'criticalAlerts') {
        // 緊急アラート設定
        const updateCriticalAlerts = async () => {
          try {
            const response = await fetch('/api/alerts/critical', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                enabled: value, 
                userId: user?.id,
                thresholds: {
                  burnoutRisk: 80,
                  stressLevel: 85,
                  workLifeBalance: 30
                }
              })
            });
            
            if (response.ok) {
              showNotification(
                value ? '緊急アラートが有効になりました' : '緊急アラートが無効になりました',
                value ? 'success' : 'warning'
              );
            }
          } catch (error) {
            console.error('緊急アラート設定エラー:', error);
            showNotification('緊急アラート設定の更新に失敗しました', 'error');
          }
        };
        
        updateCriticalAlerts();
      }
      
      if (key === 'teamUpdates') {
        // チーム更新通知設定
        const updateTeamNotifications = async () => {
          try {
            const response = await fetch('/api/notifications/team', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                enabled: value, 
                userId: user?.id,
                events: ['member_added', 'member_removed', 'role_changed']
              })
            });
            
            if (response.ok) {
              showNotification(
                value ? 'チーム更新通知が有効になりました' : 'チーム更新通知が無効になりました',
                'success'
              );
            }
          } catch (error) {
            console.error('チーム更新通知設定エラー:', error);
            showNotification('チーム更新通知設定の更新に失敗しました', 'error');
          }
        };
        
        updateTeamNotifications();
      }
    }
  };

  // プライバシー設定の変更（実際の機能動作実装）
  const handlePrivacyChange = (key: keyof PrivacySettings, value: boolean) => {
    if (settings) {
      setSettings({
        ...settings,
        privacy: {
          ...settings.privacy,
          [key]: value
        }
      });
      
      // 実際の機能動作実装
      console.log(`プライバシー設定変更: ${key} = ${value}`);
      
      if (key === 'shareAnalytics') {
        // 分析データ共有設定API呼び出し
        const updateAnalyticsSharing = async () => {
          try {
            const response = await fetch('/api/privacy/analytics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                shareAnalytics: value, 
                userId: user?.id,
                consentTimestamp: new Date().toISOString()
              })
            });
            
            if (response.ok) {
              showNotification(
                value 
                  ? 'サービス改善のための分析データ共有が有効になりました' 
                  : '分析データの共有を停止しました',
                'success'
              );
              
              // Google Analytics等の設定更新
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('consent', 'update', {
                  'analytics_storage': value ? 'granted' : 'denied'
                });
              }
            }
          } catch (error) {
            console.error('分析データ共有設定エラー:', error);
            showNotification('分析データ共有設定の更新に失敗しました', 'error');
          }
        };
        
        updateAnalyticsSharing();
      }
      
      if (key === 'anonymizeData') {
        // データ匿名化設定
        const updateDataAnonymization = async () => {
          try {
            const response = await fetch('/api/privacy/anonymize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                anonymizeData: value, 
                userId: user?.id,
                anonymizationLevel: value ? 'full' : 'minimal'
              })
            });
            
            if (response.ok) {
              showNotification(
                value 
                  ? 'データの匿名化が有効になりました' 
                  : 'データの匿名化が無効になりました',
                'success'
              );
            }
          } catch (error) {
            console.error('データ匿名化設定エラー:', error);
            showNotification('データ匿名化設定の更新に失敗しました', 'error');
          }
        };
        
        updateDataAnonymization();
      }
      
      if (key === 'dataRetention') {
        // データ保持設定
        const updateDataRetention = async () => {
          try {
            const response = await fetch('/api/privacy/retention', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                dataRetention: value, 
                userId: user?.id,
                retentionPeriod: value ? 90 : 30
              })
            });
            
            if (response.ok) {
              showNotification(
                value 
                  ? 'プランベースのデータ保持設定が有効になりました' 
                  : 'データ保持設定が無効になりました',
                'success'
              );
            }
          } catch (error) {
            console.error('データ保持設定エラー:', error);
            showNotification('データ保持設定の更新に失敗しました', 'error');
          }
        };
        
        updateDataRetention();
      }
      
      if (key === 'exportData') {
        // データエクスポート機能設定
        const updateDataExport = async () => {
          try {
            const response = await fetch('/api/privacy/export', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                exportData: value, 
                userId: user?.id,
                exportFormats: value ? ['json', 'csv', 'pdf'] : []
              })
            });
            
            if (response.ok) {
              showNotification(
                value 
                  ? 'データエクスポート機能が有効になりました' 
                  : 'データエクスポート機能が無効になりました',
                'success'
              );
              
              if (value) {
                // エクスポート機能のテスト実行
                setTimeout(() => {
                  showNotification('データエクスポートの準備が完了しました', 'info');
                }, 2000);
              }
            }
          } catch (error) {
            console.error('データエクスポート設定エラー:', error);
            showNotification('データエクスポート設定の更新に失敗しました', 'error');
          }
        };
        
        updateDataExport();
      }
    }
  };

  // 一般設定の変更（実際の機能動作実装）
  const handleGeneralChange = (key: keyof Pick<LocalUserSettings, 'theme' | 'language' | 'timezone'>, value: string) => {
    if (settings) {
      setSettings({
        ...settings,
        [key]: value
      });
      
      // 実際の機能動作実装
      console.log(`一般設定変更: ${key} = ${value}`);
      
      if (key === 'theme') {
        // テーマの実際の適用
        const applyTheme = (theme: string) => {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
            showNotification('ダークテーマに変更されました', 'success');
          } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
            showNotification('ライトテーマに変更されました', 'success');
          } else if (theme === 'system') {
            // システム設定に従う
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (systemDark) {
              document.documentElement.classList.add('dark');
              document.documentElement.setAttribute('data-theme', 'dark');
            } else {
              document.documentElement.classList.remove('dark');
              document.documentElement.setAttribute('data-theme', 'light');
            }
            showNotification('システム設定に従うテーマに変更されました', 'success');
            
            // システムテーマ変更の監視
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleSystemThemeChange = (e: MediaQueryListEvent) => {
              if (e.matches) {
                document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-theme', 'dark');
              } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.setAttribute('data-theme', 'light');
              }
            };
            
            mediaQuery.addEventListener('change', handleSystemThemeChange);
          }
        };
        
        applyTheme(value);
        
        // ローカルストレージに保存
        localStorage.setItem('theme', value);
        
        // サーバーに設定保存
        fetch('/api/user/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: value, userId: user?.id })
        }).catch(error => {
          console.error('テーマ設定保存エラー:', error);
        });
      }
      
      if (key === 'language') {
        // 言語設定の実際の適用
        document.documentElement.lang = value;
        
        // ローカルストレージに保存
        localStorage.setItem('language', value);
        
        // サーバーに設定保存
        fetch('/api/user/language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: value, userId: user?.id })
        }).catch(error => {
          console.error('言語設定保存エラー:', error);
        });
        
        showNotification(
          value === 'ja' ? '言語が日本語に変更されました' : 'Language changed to English',
          'success'
        );
        
        // 必要に応じてページリロード
        setTimeout(() => {
          const reloadMessage = value === 'ja' 
            ? '言語変更を完全に適用するためにページを再読み込みしますか？' 
            : 'Reload page to fully apply language change?';
          
          if (confirm(reloadMessage)) {
            window.location.reload();
          }
        }, 1000);
      }
      
      if (key === 'timezone') {
        // タイムゾーン設定の実際の適用
        showNotification(`タイムゾーンが ${value} に変更されました`, 'success');
        
        // ローカルストレージに保存
        localStorage.setItem('timezone', value);
        
        // サーバーに設定保存
        fetch('/api/user/timezone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timezone: value, userId: user?.id })
        }).catch(error => {
          console.error('タイムゾーン設定保存エラー:', error);
        });
        
        // 現在時刻を新しいタイムゾーンで表示
        const now = new Date();
        const timeInNewTimezone = now.toLocaleString('ja-JP', { 
          timeZone: value,
          year: 'numeric',
          month: '2-digit',
           day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        setTimeout(() => {
          showNotification(`新しいタイムゾーンでの現在時刻: ${timeInNewTimezone}`, 'info');
        }, 1500);
        
        // 既存のスケジュールされた通知やレポートのタイムゾーン更新
        fetch('/api/user/timezone/update-schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timezone: value, userId: user?.id })
        }).then(response => {
          if (response.ok) {
            setTimeout(() => {
              showNotification('スケジュールされた通知とレポートのタイムゾーンが更新されました', 'success');
            }, 3000);
          }
        }).catch(error => {
          console.error('スケジュール更新エラー:', error);
        });
      }
    }
  };

  // セキュリティダッシュボード機能実装
  const handleSecurityDashboard = () => {
    console.log('セキュリティダッシュボードを開く');
    
    // 実際のセキュリティダッシュボードデータを取得
    fetch('/api/security/dashboard', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json' 
      }
    }).then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('セキュリティダッシュボードの取得に失敗しました');
    }).then(data => {
      console.log('セキュリティダッシュボードデータ:', data);
      
      // 新しいタブでセキュリティダッシュボードを開く
      const securityWindow = window.open('/security-dashboard', '_blank');
      
      if (securityWindow) {
        // セキュリティダッシュボードにデータを渡す
        securityWindow.addEventListener('load', () => {
          securityWindow.postMessage({ 
            type: 'SECURITY_DATA', 
            data: data 
          }, window.location.origin);
        });
        
        showNotification('セキュリティダッシュボードを開きました', 'success');
      } else {
        showNotification('ポップアップがブロックされました。ブラウザの設定を確認してください。', 'warning');
      }
    }).catch(error => {
      console.error('セキュリティダッシュボードエラー:', error);
      showNotification('セキュリティダッシュボードの読み込みに失敗しました', 'error');
      
      // エラーの場合でもページは開く
      window.open('/security-dashboard', '_blank');
    });
  };

  // 2要素認証設定機能実装
  const handle2FASetup = () => {
    console.log('2要素認証設定を開く');
    
    // 2FA設定前の準備
    fetch('/api/auth/2fa/prepare', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ userId: user?.id })
    }).then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('2FA準備に失敗しました');
    }).then(data => {
      console.log('2FA準備データ:', data);
      
      // 2FA設定ページを開く
      const twoFAWindow = window.open('/settings/2fa', '_blank');
      
      if (twoFAWindow) {
        // 2FA設定ページにデータを渡す
        twoFAWindow.addEventListener('load', () => {
          twoFAWindow.postMessage({ 
            type: '2FA_SETUP_DATA', 
            data: data 
          }, window.location.origin);
        });
        
        showNotification('2要素認証設定ページを開きました', 'success');
      } else {
        showNotification('ポップアップがブロックされました。ブラウザの設定を確認してください。', 'warning');
      }
    }).catch(error => {
      console.error('2FA準備エラー:', error);
      showNotification('2要素認証の準備に失敗しました', 'error');
      
      // エラーの場合でもページは開く
      window.open('/settings/2fa', '_blank');
    });
  };

  // パスワードリセット機能実装
  const handlePasswordReset = () => {
    console.log('パスワードリセットを開く');
    
    // パスワードリセット準備
    fetch('/api/auth/password-reset/prepare', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        userId: user?.id,
        email: user?.email,
        requestSource: 'settings_page'
      })
    }).then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('パスワードリセット準備に失敗しました');
    }).then(data => {
      console.log('パスワードリセット準備データ:', data);
      
      // パスワードリセットページを開く
      const resetWindow = window.open('/reset-password', '_blank');
      
      if (resetWindow) {
        // パスワードリセットページにデータを渡す
        resetWindow.addEventListener('load', () => {
          resetWindow.postMessage({ 
            type: 'PASSWORD_RESET_DATA', 
            data: data 
          }, window.location.origin);
        });
        
        showNotification('パスワードリセットページを開きました', 'success');
      } else {
        showNotification('ポップアップがブロックされました。ブラウザの設定を確認してください。', 'warning');
      }
    }).catch(error => {
      console.error('パスワードリセット準備エラー:', error);
      showNotification('パスワードリセットの準備に失敗しました', 'error');
      
      // エラーの場合でもページは開く
      window.open('/reset-password', '_blank');
    });
  };

  // 設定の保存
  const handleSave = async () => {
    if (!settings || !user) return;

    try {
      setSaving(true);
      setMessage(null);

      const response = await updateUserSettings(user.id, settings);

      if (response.success && response.data) {
        setMessage({ type: 'success', text: '設定が正常に保存されました' });
        showNotification('設定が正常に保存されました', 'success');
      } else {
        const errorMessage = response.error || '設定の保存に失敗しました';
        setMessage({ type: 'error', text: errorMessage });
        showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('設定保存エラー:', error);
      const errorMessage = '設定の保存中にエラーが発生しました';
      setMessage({ type: 'error', text: errorMessage });
      showNotification(errorMessage, 'error');
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

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-900">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">設定を読み込み中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">設定</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            チーム健全性分析ツールの設定と統合を管理
          </p>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-4 sm:mb-6 p-4 rounded-md border ${
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
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max">
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
                  } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 transition-colors duration-200`}
                >
                  <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
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
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bell className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
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
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-4`}
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
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
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
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-4`}
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
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
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
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-4`}
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
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
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
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-4`}
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
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
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
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-4`}
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
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
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
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-4`}
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
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
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
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-4`}
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
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
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
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-4`}
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
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Download className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
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
                       } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-4`}
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
                    <Trash2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-red-800 mb-2">データ削除</h4>
                      <p className="text-sm text-red-600 mb-4">
                        アカウントに関連するすべてのデータを完全に削除します。この操作は元に戻せません。
                      </p>
                      <button
                        type="button"
                        className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                        onClick={() => {
                          if (confirm('すべてのデータを削除してもよろしいですか？この操作は元に戻せません。')) {
                            // 実際のデータ削除API呼び出し
                            fetch('/api/user/delete-all-data', {
                              method: 'DELETE',
                              headers: { 
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                'Content-Type': 'application/json' 
                              },
                              body: JSON.stringify({ userId: user?.id })
                            }).then(response => {
                              if (response.ok) {
                                showNotification('すべてのデータが削除されました', 'success');
                                // ログアウト処理
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.href = '/';
                              } else {
                                throw new Error('データ削除に失敗しました');
                              }
                            }).catch(error => {
                              console.error('データ削除エラー:', error);
                              showNotification('データ削除に失敗しました', 'error');
                            });
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-blue-900 mb-2">セキュリティダッシュボード</h4>
                      <p className="text-sm text-blue-700 mb-4">
                        ログイン履歴、異常検知、セキュリティアラートを監視・管理します。
                      </p>
                      
                      <button
                        onClick={handleSecurityDashboard}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        セキュリティダッシュボードを開く
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2要素認証設定 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Lock className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-green-900 mb-2">2要素認証</h4>
                      <p className="text-sm text-green-700 mb-4">
                        パスワードに加えて認証アプリのコードを使用することで、アカウントのセキュリティを大幅に向上させます。
                      </p>
                      
                      <button
                        onClick={handle2FASetup}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        2要素認証を設定
                      </button>
                    </div>
                  </div>
                </div>

                {/* パスワードリセット */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-yellow-900 mb-2">パスワード管理</h4>
                      <p className="text-sm text-yellow-700 mb-4">
                        パスワードの変更やリセットを安全に行います。
                      </p>
                      
                      <button
                        onClick={handlePasswordReset}
                        className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        パスワードをリセット
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
                    チーム健全性分析のためのコミュニケーションプラットフォームを接続・管理（7サービス対応）
                  </p>
                </div>

                {/* Microsoft Teams 新機能案内バナー */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {integration.icon}
                            <h4 className="font-medium text-gray-900 truncate">{integration.name}</h4>
                            {integration.id === 'microsoft-teams' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
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
                              <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-500 truncate">
                                最終同期: {new Date(integration.lastSync).toLocaleString()}
                              </span>
                            </div>
                          )}
                          
                          {/* エラーメッセージ表示 */}
                          {integration.errorMessage && (
                            <div className="mt-2 flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                              <span className="text-xs text-red-600">{integration.errorMessage}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1 ml-3">
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

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                        <button
                          onClick={() => setSelectedIntegration(integration)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                        >
                          <Info className="w-3 h-3" />
                          <span>詳細を表示</span>
                        </button>
                        
                        <div className="flex space-x-2 w-full sm:w-auto">
                          {integration.isConnected ? (
                            <React.Fragment>
                              <button
                                onClick={() => handleSync(integration.id)}
                                disabled={integration.isSyncing}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none ${
                                  integration.isSyncing
                                   ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                                title="データを同期"
                              >
                                {integration.isSyncing ? (
                                  <div className="flex items-center justify-center space-x-1">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                     <span>同期中</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center space-x-1">
                                    <RefreshCw className="w-3 h-3" />
                                    <span>同期</span>
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={() => handleDisconnect(integration.id)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors flex items-center space-x-1 flex-1 sm:flex-none justify-center"
                              >
                                <X className="w-3 h-3" />
                                <span>切断</span>
                              </button>
                            </React.Fragment>
                          ) : (
                            <button
                              onClick={() => handleConnect(integration.id)}
                              disabled={integration.isConnecting}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 justify-center w-full sm:w-auto ${
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                      <h4 className="text-sm font-medium text-blue-800 flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>接続ステータス（7サービス対応）</span>
                      </h4>
                      <button
                        onClick={async () => {
                          console.log('グローバル同期を開始...');
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
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 w-full sm:w-auto justify-center ${
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
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-blue-600">総サービス数:</span>
                        <span className="font-medium">{integrationsState.length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-blue-600">接続済み:</span>
                        <span className="font-medium">{integrationsState.filter(i => i.isConnected).length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                        <span className="text-blue-600">同期中:</span>
                        <span className="font-medium">{integrationsState.filter(i => i.isSyncing).length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
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
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  integration.isSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
                                }`}></div>
                                <div className="flex items-center space-x-2 min-w-0">
                                  {integration.icon}
                                  <span className="text-sm font-medium text-green-700 truncate">{integration.name}</span>
                                  {integration.id === 'microsoft-teams' && (
                                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                                      新機能
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3 flex-shrink-0">
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
                                  <span className="hidden sm:inline">
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
                                  <span className="sm:hidden">
                                    {integration.lastSync 
                                      ? new Date(integration.lastSync).toLocaleString('ja-JP', {
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
                                    <span className="text-xs text-yellow-600 hidden sm:inline">同期中</span>
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
                      
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value as 'ja' | 'en')}
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
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <span className="text-sm text-gray-600">ユーザーID:</span>
                      <span className="text-sm font-medium text-gray-900 break-all">{user?.id}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <span className="text-sm text-gray-600">メールアドレス:</span>
                      <span className="text-sm font-medium text-gray-900 break-all">{user?.email}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <span className="text-sm text-gray-600">役割:</span>
                      <span className="text-sm font-medium text-gray-900">メンバー</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <span className="text-sm text-gray-600">部署:</span>
                      <span className="text-sm font-medium text-gray-900">未設定</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <span className="text-sm text-gray-600">登録日:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date().toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 保存ボタン */}
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`${
                  saving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 w-full sm:w-auto justify-center`}
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
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="flex-1">{feature}</span>
                      {selectedIntegration.id === 'microsoft-teams' && 
                       (feature.includes('会議参加') || feature.includes('Teams通話') || feature.includes('チーム結束度')) && (
                        <span className="ml-2 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                          強化済み
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row justify-end pt-4 border-t border-gray-200 space-y-2 sm:space-y-0 sm:space-x-2">
                {selectedIntegration.isConnected ? (
                  <>
                    <button
                      onClick={async () => {
                        await handleSync(selectedIntegration.id);
                        setSelectedIntegration(null);
                      }}
                      disabled={selectedIntegration.isSyncing}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
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
                      className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
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
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1 w-full sm:w-auto ${
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

const SettingsPage: React.FC = () => {
  return (
    <LanguageProvider>
      <SettingsPageContent />
    </LanguageProvider>
  );
};

export default SettingsPage;