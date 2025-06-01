// src/lib/integrations/index.ts
// LinkSense MVP - 統合サービス登録・エクスポート管理
// 既存ファイル活用版 - 実装済みサービスのみ登録

// ✅ 基底クラスとファクトリーをインポート
import BaseIntegration, { IntegrationFactory, IntegrationRegistry } from './base-integration';

// ✅ 実装済み統合サービスをインポート
import SlackIntegration from './slack-integration';
import ChatWorkIntegration from './chatwork-integration';
import TeamsIntegration from './teams-integration';

// ✅ 型定義をインポート
import type {
  Integration,
  IntegrationCredentials,
  IntegrationAnalytics,
  SyncResult,
  ConnectionStatus,
  IntegrationConfig
} from '@/types/integrations';

// ✅ 値として使用する定数を通常のimportでインポート
import { DEFAULT_INTEGRATION_CONFIG } from '@/types/integrations';

// ✅ 実装済み統合サービス一覧定義
export const AVAILABLE_INTEGRATIONS = {
  SLACK: 'slack',
  CHATWORK: 'chatwork',
  MICROSOFT_TEAMS: 'microsoft-teams'
  // 他のサービスは実装完了後に追加
  // LINE_WORKS: 'line-works',
  // CYBOZU_OFFICE: 'cybozu-office',
  // ZOOM: 'zoom'
} as const;

// ✅ 統合サービスファクトリー登録（実装済みのみ）
export function registerIntegrations(): void {
  console.log('🔧 統合サービスファクトリー登録開始...');

  try {
    // Slack統合登録
    IntegrationFactory.register('slack', SlackIntegration);
    console.log('✅ Slack統合登録完了');

    // ChatWork統合登録
    IntegrationFactory.register('chatwork', ChatWorkIntegration);
    console.log('✅ ChatWork統合登録完了');

    // Microsoft Teams統合登録
    IntegrationFactory.register('microsoft-teams', TeamsIntegration);
    console.log('✅ Microsoft Teams統合登録完了');

    console.log('🔧 統合サービスファクトリー登録完了（3サービス）');
  } catch (error) {
    console.error('❌ 統合サービス登録エラー:', error);
  }
}

// ✅ デフォルト統合設定生成（実装済みサービスのみ）
export function createDefaultIntegrations(): Integration[] {
  const defaultIntegrations: Integration[] = [
    // Slack統合設定
    {
      id: 'slack',
      name: 'Slack',
      description: 'チームコミュニケーションとコラボレーションプラットフォーム',
      category: 'communication',
      market: 'global',
      status: 'disconnected',
      features: ['messaging', 'channels', 'file-sharing', 'integrations'],
      authType: 'oauth2',
      config: {
        ...DEFAULT_INTEGRATION_CONFIG,
        setupUrl: 'https://slack.com/oauth/v2/authorize',
        scopes: ['channels:read', 'users:read', 'chat:read'],
        permissions: ['read_messages', 'read_users', 'read_channels'],
        enabledFeatures: ['messaging', 'analytics', 'health_monitoring'],
        customSettings: {
          apiEndpoint: 'https://slack.com/api',
          webhookUrl: '',
          botToken: '',
          appToken: ''
        }
      },
      credentials: {},
      healthScore: 0,
      lastSync: undefined,
      isEnabled: true
    },

    // ChatWork統合設定
    {
      id: 'chatwork',
      name: 'ChatWork',
      description: 'ChatWork統合によるチームコミュニケーション分析',
      category: 'communication',
      market: 'japan',
      status: 'disconnected',
      features: ['messaging', 'tasks', 'file-sharing'],
      authType: 'api_key',
      config: {
        ...DEFAULT_INTEGRATION_CONFIG,
        scopes: ['rooms:read', 'users:read', 'messages:read'],
        permissions: ['read_rooms', 'read_users', 'read_messages'],
        enabledFeatures: ['messaging', 'tasks', 'analytics'],
        customSettings: {
          apiEndpoint: 'https://api.chatwork.com/v2',
          apiToken: ''
        }
      },
      credentials: {},
      healthScore: 0,
      lastSync: undefined,
      isEnabled: true
    },

    // Microsoft Teams統合設定
    {
      id: 'microsoft-teams',
      name: 'Microsoft Teams',
      description: 'Microsoft Teams統合によるチームコラボレーション分析',
      category: 'communication',
      market: 'global',
      status: 'disconnected',
      features: ['meetings', 'chat', 'file-sharing', 'calendar'],
      authType: 'oauth2',
      config: {
        ...DEFAULT_INTEGRATION_CONFIG,
        setupUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        scopes: ['Team.ReadBasic.All', 'User.Read.All'],
        permissions: ['read_teams', 'read_users', 'read_meetings'],
        enabledFeatures: ['meetings', 'analytics', 'health_monitoring'],
        customSettings: {
          apiEndpoint: 'https://graph.microsoft.com',
          tenantId: '',
          clientId: '',
          clientSecret: ''
        }
      },
      credentials: {},
      healthScore: 0,
      lastSync: undefined,
      isEnabled: true
    }
  ];

  return defaultIntegrations;
}

// ✅ 統合サービス初期化ヘルパー
export async function initializeIntegrations(): Promise<boolean> {
  try {
    console.log('🚀 統合サービス初期化開始（実装済み3サービス）...');

    // ファクトリー登録
    registerIntegrations();

    // デフォルト統合設定を作成
    const defaultIntegrations = createDefaultIntegrations();

    // 統合管理システムに登録
    const { integrationManager } = await import('./integration-manager');
    const success = await integrationManager.initialize(defaultIntegrations);

    if (success) {
      console.log('✅ 統合サービス初期化完了（Slack, ChatWork, Teams）');
      return true;
    } else {
      console.error('❌ 統合サービス初期化失敗');
      return false;
    }
  } catch (error) {
    console.error('❌ 統合サービス初期化エラー:', error);
    return false;
  }
}

// ✅ 統合設定ヘルパー関数
export function getIntegrationConfig(integrationId: string): IntegrationConfig {
  const defaultIntegrations = createDefaultIntegrations();
  const integration = defaultIntegrations.find(i => i.id === integrationId);
  
  if (!integration) {
    console.warn(`⚠️ 統合設定が見つかりません: ${integrationId}`);
    return { ...DEFAULT_INTEGRATION_CONFIG };
  }
  
  return integration.config;
}

// ✅ カスタム設定取得ヘルパー
export function getCustomSetting(integrationId: string, settingKey: string): any {
  const config = getIntegrationConfig(integrationId);
  return config.customSettings?.[settingKey];
}

// ✅ API エンドポイント取得ヘルパー
export function getApiEndpoint(integrationId: string): string {
  return getCustomSetting(integrationId, 'apiEndpoint') || '';
}

// ✅ 統合サービス検証
export function validateIntegrationConfig(integration: Integration): boolean {
  try {
    // 必須フィールドの検証
    if (!integration.id || !integration.name || !integration.config) {
      return false;
    }

    // 設定の検証
    const config = integration.config;
    if (!Array.isArray(config.scopes) || !Array.isArray(config.permissions)) {
      return false;
    }

    // 数値フィールドの検証
    if (typeof config.dataRetentionDays !== 'number' || config.dataRetentionDays < 1) {
      return false;
    }

    if (typeof config.syncIntervalMinutes !== 'number' || config.syncIntervalMinutes < 1) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('統合設定検証エラー:', error);
    return false;
  }
}

// ✅ エクスポート
export {
  BaseIntegration,
  IntegrationFactory,
  IntegrationRegistry,
  SlackIntegration,
  ChatWorkIntegration,
  TeamsIntegration
};

export default {
  AVAILABLE_INTEGRATIONS,
  registerIntegrations,
  createDefaultIntegrations,
  initializeIntegrations,
  getIntegrationConfig,
  getCustomSetting,
  getApiEndpoint,
  validateIntegrationConfig
};