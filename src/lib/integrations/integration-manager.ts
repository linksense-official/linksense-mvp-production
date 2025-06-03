// src/lib/integrations/integration-manager.ts
// LinkSense MVP - 統合管理システム中核 - 本番版
// 8サービス完全対応 + リアルタイム分析 + 非同期処理

import BaseIntegration, { IntegrationFactory, IntegrationRegistry } from './base-integration';
import type {
  Integration,
  IntegrationAnalytics,
  IntegrationSettings,
  IntegrationDashboardData,
  AnalyticsInsight,
  AnalyticsAlert,
  AnalyticsMetrics,
  SyncResult,
  IntegrationManager as IIntegrationManager,
  DashboardMetric,
  IntegrationStatusSummary,
  DEFAULT_INTEGRATION_CONFIG,
  AlertThresholds,
  IntegrationServiceId
} from '@/types/integrations';

const INTEGRATION_SERVICES = {
  SLACK: 'slack',
  MICROSOFT_TEAMS: 'microsoft-teams',
  CHATWORK: 'chatwork',
  LINE_WORKS: 'line-works',
  DISCORD: 'discord',
  GOOGLE_MEET: 'google-meet',
  CYBOZU_OFFICE: 'cybozu-office',
  ZOOM: 'zoom'
} as const;

const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  burnoutRisk: 70,
  responseTimeWarning: 300, // 5分
  engagementDropWarning: 20, // 20%減少
  inactivityWarning: 7 // 7日間
};

interface ModifiedIntegrationManager {
  integrations: Map<string, Integration>;
  connect(integrationId: string, credentials: any): Promise<boolean>;
  disconnect(integrationId: string): Promise<boolean>;
  sync(integrationId: string): Promise<IntegrationAnalytics | null>;
  syncAll(): Promise<IntegrationAnalytics[]>;
  getAnalytics(integrationId: string): Promise<IntegrationAnalytics | null>;
  getHealthScore(integrationId?: string): Promise<number>;
  getInsights(integrationId?: string): Promise<AnalyticsInsight[]>;
  getAlerts(severity?: string): Promise<AnalyticsAlert[]>;
}

export class IntegrationManager implements ModifiedIntegrationManager {
  private static instance: IntegrationManager;
  private registry: IntegrationRegistry;
  private settings: IntegrationSettings;
  private syncIntervals = new Map<string, NodeJS.Timeout>();
  private analytics = new Map<string, IntegrationAnalytics>();
  private eventListeners = new Map<string, Function[]>();

  public integrations = new Map<string, Integration>();

  private constructor() {
    this.registry = IntegrationRegistry.getInstance();
    this.settings = this.getDefaultSettings();
    this.initializeEventSystem();
  }

  static getInstance(): IntegrationManager {
    if (!this.instance) {
      this.instance = new IntegrationManager();
    }
    return this.instance;
  }

  async initialize(integrations: Integration[]): Promise<boolean> {
    try {
      console.log('統合管理システムの初期化を開始...');

      this.registry.clear();
      this.integrations.clear();
      this.clearSyncIntervals();

      for (const integrationConfig of integrations) {
        this.integrations.set(integrationConfig.id, integrationConfig);

        const integration = IntegrationFactory.create(integrationConfig);
        if (integration) {
          this.registry.add(integration);
          
          if (integrationConfig.status === 'connected') {
            await integration.initialize();
          }
        }
      }

      this.startAutoSync();

      console.log(`統合管理システム初期化完了: ${this.registry.size()}サービス`);
      this.emit('initialized', { count: this.registry.size() });

      return true;
    } catch (error) {
      console.error('統合管理システム初期化エラー:', error);
      return false;
    }
  }

  async connect(integrationId: string, credentials: any): Promise<boolean> {
    try {
      const integration = this.registry.get(integrationId);
      if (!integration) {
        throw new Error(`統合サービス '${integrationId}' が見つかりません`);
      }

      console.log(`統合サービス接続開始: ${integrationId}`);
      this.emit('connecting', { integrationId });

      const success = await integration.connect(credentials);
      
      if (success) {
        const integrationData = integration.getIntegration();
        this.integrations.set(integrationId, integrationData);

        await this.sync(integrationId);
        this.startSyncInterval(integrationId);
        
        console.log(`統合サービス接続成功: ${integrationId}`);
        this.emit('connected', { integrationId });
      } else {
        console.error(`統合サービス接続失敗: ${integrationId}`);
        this.emit('connection_failed', { integrationId, error: integration.getLastError() });
      }

      return success;
    } catch (error) {
      console.error(`統合サービス接続エラー [${integrationId}]:`, error);
      this.emit('connection_error', { integrationId, error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  async disconnect(integrationId: string): Promise<boolean> {
    try {
      const integration = this.registry.get(integrationId);
      if (!integration) {
        throw new Error(`統合サービス '${integrationId}' が見つかりません`);
      }

      console.log(`統合サービス切断開始: ${integrationId}`);
      this.emit('disconnecting', { integrationId });

      this.stopSyncInterval(integrationId);

      const success = await integration.disconnect();
      
      if (success) {
        const integrationData = integration.getIntegration();
        integrationData.status = 'disconnected';
        this.integrations.set(integrationId, integrationData);

        this.analytics.delete(integrationId);
        
        console.log(`統合サービス切断成功: ${integrationId}`);
        this.emit('disconnected', { integrationId });
      }

      return success;
    } catch (error) {
      console.error(`統合サービス切断エラー [${integrationId}]:`, error);
      this.emit('disconnection_error', { integrationId, error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  async sync(integrationId: string): Promise<IntegrationAnalytics | null> {
  try {
    console.log(`同期開始: ${integrationId}`);
    console.log('登録済み統合サービス:', Array.from(this.registry.getAll().map(i => i.getIntegration().id)));
    
    let integration = this.registry.get(integrationId);
    
    if (!integration) {
      console.warn(`統合サービス '${integrationId}' がレジストリに見つかりません - 動的作成を試行`);
      
      const integrationConfig = this.integrations.get(integrationId);
      if (!integrationConfig) {
        console.error(`統合設定が見つかりません: ${integrationId}`);
        return null;
      }

      try {
        let integrationInstance: BaseIntegration;

        switch (integrationId) {
          case 'slack':
            console.log('Slack統合を動的に作成中...');
            try {
              const SlackIntegration = (await import('./slack-integration')).default;
              integrationInstance = new SlackIntegration(integrationConfig);
            } catch (importError) {
              console.error('Slack統合インポートエラー:', importError);
              return null;
            }
            break;

          case 'microsoft-teams':
            console.log('Microsoft Teams統合を動的に作成中...');
            try {
              const TeamsIntegration = (await import('./teams-integration')).default;
              integrationInstance = new TeamsIntegration(integrationConfig);
            } catch (importError) {
              console.error('Teams統合インポートエラー:', importError);
              return null;
            }
            break;

          case 'chatwork':
            console.log('ChatWork統合を動的に作成中...');
            try {
              const ChatWorkIntegration = (await import('./chatwork-integration')).default;
              integrationInstance = new ChatWorkIntegration(integrationConfig);
            } catch (importError) {
              console.error('ChatWork統合インポートエラー:', importError);
              return null;
            }
            break;

          case 'line-works':
            console.log('LINE WORKS統合を動的に作成中...');
            try {
              const LineWorksIntegration = (await import('./line-works-integration')).default;
              integrationInstance = new LineWorksIntegration(integrationConfig);
            } catch (importError) {
              console.error('LINE WORKS統合インポートエラー:', importError);
              return null;
            }
            break;

          case 'discord':
            console.log('Discord統合を動的に作成中...');
            try {
              const DiscordIntegration = (await import('./discord-integration')).default;
              integrationInstance = new DiscordIntegration(integrationConfig);
            } catch (importError) {
              console.error('Discord統合インポートエラー:', importError);
              return null;
            }
            break;

          case 'google-meet':
            console.log('Google Meet統合を動的に作成中...');
            try {
              const GoogleMeetIntegration = (await import('./google-meet-integration')).default;
              integrationInstance = new GoogleMeetIntegration(integrationConfig);
            } catch (importError) {
              console.error('Google Meet統合インポートエラー:', importError);
              return null;
            }
            break;

          case 'cybozu-office':
            console.log('サイボウズ Office統合を動的に作成中...');
            try {
              const CybozuIntegration = (await import('./cybozu-office-integration')).default;
              integrationInstance = new CybozuIntegration(integrationConfig);
            } catch (importError) {
              console.error('サイボウズ統合インポートエラー:', importError);
              return null;
            }
            break;

          case 'zoom':
            console.log('Zoom統合を動的に作成中...');
            try {
              const ZoomIntegration = (await import('./zoom-integration')).default;
              integrationInstance = new ZoomIntegration(integrationConfig);
            } catch (importError) {
              console.error('Zoom統合インポートエラー:', importError);
              return null;
            }
            break;

          default:
            console.error(`未対応の統合サービス: ${integrationId}`);
            return null;
        }

        this.registry.add(integrationInstance);
        console.log(`${integrationId}統合を動的に追加しました`);
        integration = this.registry.get(integrationId);
      } catch (importError) {
        console.error(`${integrationId}統合動的作成エラー:`, importError);
        return null;
      }
      
      if (!integration) {
        console.error(`${integrationId}統合の作成に失敗しました`);
        return null;
      }
    }

    if (!integration.isEnabled()) {
      console.log(`統合サービス無効のため同期スキップ: ${integrationId}`);
      return null;
    }

    console.log(`データ同期開始: ${integrationId}`);
    this.emit('sync_started', { integrationId });

    const syncResult = await integration.sync();
    
    if (syncResult.success) {
      const analytics = await this.getAnalytics(integrationId);
      if (analytics) {
        this.analytics.set(integrationId, analytics);
      }

      console.log(`データ同期成功: ${integrationId} (${syncResult.recordsProcessed}件処理)`);
      this.emit('sync_completed', { integrationId, syncResult });

      return analytics;
    } else {
      console.error(`データ同期失敗: ${integrationId}`, syncResult.errors);
      this.emit('sync_failed', { integrationId, errors: syncResult.errors });
      return null;
    }
  } catch (error) {
    console.error(`データ同期エラー [${integrationId}]:`, error);
    this.emit('sync_error', { integrationId, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

  async syncAll(): Promise<IntegrationAnalytics[]> {
    console.log('全統合サービス同期開始...');
    this.emit('sync_all_started', {});

    const connectedIntegrations = this.registry.getConnected();
    const results: IntegrationAnalytics[] = [];
    const errors: string[] = [];

    const syncPromises = connectedIntegrations.map(async (integration) => {
      try {
        const analytics = await this.sync(integration.getIntegration().id);
        if (analytics) {
          results.push(analytics);
        }
      } catch (error) {
        const errorMessage = `${integration.getIntegration().name}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMessage);
      }
    });

    await Promise.allSettled(syncPromises);

    console.log(`全統合サービス同期完了: 成功${results.length}件, エラー${errors.length}件`);
    this.emit('sync_all_completed', { successCount: results.length, errorCount: errors.length, errors });

    return results;
  }

  async getAnalytics(integrationId: string): Promise<IntegrationAnalytics | null> {
    try {
      console.log(`分析データ取得開始: ${integrationId}`);
      
      const cached = this.analytics.get(integrationId);
      if (cached && this.isAnalyticsFresh(cached)) {
        console.log(`キャッシュから分析データ取得: ${integrationId}`);
        return cached;
      }

      const integration = this.registry.get(integrationId);
      if (!integration) {
        console.error(`統合サービスが見つかりません: ${integrationId}`);
        return null;
      }

      try {
        const analytics = await integration.getAnalytics();
        if (analytics) {
          this.analytics.set(integrationId, analytics);
          console.log(`統合サービスから分析データ取得: ${integrationId}`);
          return analytics;
        }
      } catch (error) {
        console.warn(`統合サービスからの分析データ取得失敗 [${integrationId}]:`, error);
      }

      const stored = this.loadAnalyticsFromStorage(integrationId);
      if (stored && this.isAnalyticsFresh(stored)) {
        this.analytics.set(integrationId, stored);
        console.log(`ストレージから分析データ取得: ${integrationId}`);
        return stored;
      }

      console.log(`分析データが見つかりません: ${integrationId}`);
      return null;
    } catch (error) {
      console.error(`分析データ取得エラー [${integrationId}]:`, error);
      return null;
    }
  }

  private getServiceDisplayName(integrationId: string): string {
    const displayNames: { [key: string]: string } = {
      'slack': 'Slack',
      'microsoft-teams': 'Microsoft Teams',
      'chatwork': 'ChatWork',
      'line-works': 'LINE WORKS',
      'discord': 'Discord',
      'google-meet': 'Google Meet',
      'cybozu-office': 'サイボウズ Office',
      'zoom': 'Zoom'
    };
    return displayNames[integrationId] || integrationId;
  }

  async getHealthScore(integrationId?: string): Promise<number> {
    try {
      if (integrationId) {
        const integration = this.registry.get(integrationId);
        if (!integration) return 0;
        
        return await integration.getHealthScore();
      } else {
        const connectedIntegrations = this.registry.getConnected();
        if (connectedIntegrations.length === 0) return 0;

        const scorePromises = connectedIntegrations.map(async (integration) => {
          try {
            return await integration.getHealthScore();
          } catch (error) {
            console.warn(`健全性スコア取得エラー [${integration.getIntegration().id}]:`, error);
            return 0;
          }
        });

        const scores = await Promise.all(scorePromises);
        const validScores = scores.filter(score => score > 0);

        if (validScores.length === 0) return 0;

        return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
      }
    } catch (error) {
      console.error('健全性スコア取得エラー:', error);
      return 0;
    }
  }

  async getInsights(integrationId?: string): Promise<AnalyticsInsight[]> {
    try {
      const insights: AnalyticsInsight[] = [];

      if (integrationId) {
        const analytics = await this.getAnalytics(integrationId);
        if (analytics) {
          insights.push(...analytics.insights);
        }
      } else {
        const allAnalytics = Array.from(this.analytics.values());
        for (const analytics of allAnalytics) {
          insights.push(...analytics.insights);
        }
      }

      return insights.sort((a, b) => {
        const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return importanceOrder[b.impact] - importanceOrder[a.impact];
      });
    } catch (error) {
      console.error('インサイト取得エラー:', error);
      return [];
    }
  }

  async getAlerts(severity?: string): Promise<AnalyticsAlert[]> {
    try {
      const alerts: AnalyticsAlert[] = [];

      const allAnalytics = Array.from(this.analytics.values());
      for (const analytics of allAnalytics) {
        alerts.push(...analytics.alerts);
      }

      let filteredAlerts = alerts;
      if (severity) {
        filteredAlerts = alerts.filter(alert => alert.severity === severity);
      }

      return filteredAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('アラート取得エラー:', error);
      return [];
    }
  }

  async getDashboardData(): Promise<IntegrationDashboardData> {
    try {
      const totalIntegrations = this.registry.size();
      const connectedIntegrations = this.registry.getConnected().length;
      const overallHealthScore = await this.getHealthScore();
      
      const allAlerts = await this.getAlerts();
      const criticalAlerts = allAlerts.filter(alert => alert.severity === 'critical').length;
      
      const recentInsights = (await this.getInsights()).slice(0, 5);
      
      const topMetrics = await this.generateTopMetrics();
      const integrationStatus = await this.generateIntegrationStatusSummary();

      return {
        overallHealthScore,
        totalIntegrations,
        connectedIntegrations,
        criticalAlerts,
        recentInsights,
        topMetrics,
        integrationStatus
      };
    } catch (error) {
      console.error('ダッシュボードデータ生成エラー:', error);
      return this.getEmptyDashboardData();
    }
  }

  getSettings(): IntegrationSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<IntegrationSettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings
    };

    this.applySettings();
    
    console.log('統合設定更新完了');
    this.emit('settings_updated', { settings: this.settings });
  }

  private startAutoSync(): void {
    const connectedIntegrations = this.registry.getConnected();
    
    for (const integration of connectedIntegrations) {
      this.startSyncInterval(integration.getIntegration().id);
    }

    console.log(`自動同期開始: ${connectedIntegrations.length}サービス`);
  }

  private startSyncInterval(integrationId: string): void {
    this.stopSyncInterval(integrationId);

    const intervalMs = this.settings.syncInterval * 60 * 1000;
    
    const interval = setInterval(async () => {
      await this.sync(integrationId);
    }, intervalMs);

    this.syncIntervals.set(integrationId, interval);
    console.log(`自動同期間隔設定: ${integrationId} (${this.settings.syncInterval}分)`);
  }

  private stopSyncInterval(integrationId: string): void {
    const interval = this.syncIntervals.get(integrationId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(integrationId);
      console.log(`自動同期間隔停止: ${integrationId}`);
    }
  }

  private clearSyncIntervals(): void {
    for (const [integrationId, interval] of this.syncIntervals) {
      clearInterval(interval);
    }
    this.syncIntervals.clear();
    console.log('全自動同期間隔クリア完了');
  }

  private isAnalyticsFresh(analytics: IntegrationAnalytics): boolean {
    const now = new Date();
    const lastUpdated = new Date(analytics.lastUpdated);
    const maxAgeMs = this.settings.syncInterval * 60 * 1000;
    
    return (now.getTime() - lastUpdated.getTime()) < maxAgeMs;
  }

  private loadAnalyticsFromStorage(integrationId: string): IntegrationAnalytics | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }

      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(`analytics_${integrationId}_`)
      );
      
      if (keys.length === 0) return null;

      const latestKey = keys.sort().pop();
      if (!latestKey) return null;

      const data = localStorage.getItem(latestKey);
      if (!data) return null;

      const analytics = JSON.parse(data) as IntegrationAnalytics;
      
      analytics.lastUpdated = new Date(analytics.lastUpdated);
      analytics.insights.forEach(insight => {
        insight.createdAt = new Date(insight.createdAt);
      });
      analytics.alerts.forEach(alert => {
        alert.createdAt = new Date(alert.createdAt);
        if (alert.resolvedAt) {
          alert.resolvedAt = new Date(alert.resolvedAt);
        }
      });

      return analytics;
    } catch (error) {
      console.error(`ローカルストレージ読み込みエラー [${integrationId}]:`, error);
      return null;
    }
  }

  private async generateTopMetrics(): Promise<DashboardMetric[]> {
    const metrics: DashboardMetric[] = [];

    try {
      const allAnalytics = Array.from(this.analytics.values());
      
      if (allAnalytics.length > 0) {
        const avgEngagement = allAnalytics.reduce((sum, analytics) => 
          sum + analytics.metrics.engagementRate, 0) / allAnalytics.length;
        
        metrics.push({
          name: 'エンゲージメント率',
          value: Math.round(avgEngagement * 100),
          unit: '%',
          trend: 'stable',
          changePercent: 0
        });

        const avgResponseTime = allAnalytics.reduce((sum, analytics) =>
           sum + analytics.metrics.averageResponseTime, 0) / allAnalytics.length;
        
        metrics.push({
          name: '平均応答時間',
          value: Math.round(avgResponseTime / 60),
          unit: '分',
          trend: 'stable',
          changePercent: 0
        });

        const totalActiveUsers = allAnalytics.reduce((sum, analytics) => 
          sum + analytics.metrics.activeUsers, 0);
        
        metrics.push({
          name: 'アクティブユーザー',
          value: totalActiveUsers,
          unit: '人',
          trend: 'stable',
          changePercent: 0
        });
      }
    } catch (error) {
      console.error('トップメトリクス生成エラー:', error);
    }

    return metrics;
  }

  private async generateIntegrationStatusSummary(): Promise<IntegrationStatusSummary[]> {
    const summary: IntegrationStatusSummary[] = [];

    try {
      const allIntegrations = this.registry.getAll();
      
      for (const integration of allIntegrations) {
        const integrationData = integration.getIntegration();
        
        let healthScore = 0;
        try {
          healthScore = await integration.getHealthScore();
        } catch (error) {
          console.warn(`健全性スコア取得失敗 [${integrationData.id}]:`, error);
        }
        
        summary.push({
          integrationId: integrationData.id,
          name: integrationData.name,
          status: integration.getStatus(),
          healthScore: healthScore,
          lastSync: integration.getLastSync() || new Date(),
          errorCount: integration.hasError() ? 1 : 0
        });
      }
    } catch (error) {
      console.error('統合状態サマリー生成エラー:', error);
    }

    return summary;
  }

  private getEmptyDashboardData(): IntegrationDashboardData {
    return {
      overallHealthScore: 0,
      totalIntegrations: 0,
      connectedIntegrations: 0,
      criticalAlerts: 0,
      recentInsights: [],
      topMetrics: [],
      integrationStatus: []
    };
  }

  private getDefaultSettings(): IntegrationSettings {
    return {
      enabledIntegrations: Object.values(INTEGRATION_SERVICES),
      syncInterval: 60,
      dataRetentionDays: 90,
      alertThresholds: DEFAULT_ALERT_THRESHOLDS,
      privacySettings: {
        anonymizeUserData: false,
        shareAnalyticsData: true,
        encryptStoredData: true,
        autoDeleteExpiredTokens: true
      },
      notificationSettings: {
        enableRealTimeAlerts: true,
        enableWeeklyReports: true,
        enableCriticalAlerts: true,
        alertChannels: ['email']
      }
    };
  }

  private applySettings(): void {
    this.clearSyncIntervals();
    this.startAutoSync();
  }

  private initializeEventSystem(): void {
    this.eventListeners.clear();
  }

  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`イベントリスナーエラー [${event}]:`, error);
        }
      });
    }
  }

  shutdown(): void {
    console.log('統合管理システム終了処理開始...');
    
    this.clearSyncIntervals();
    this.registry.clear();
    this.integrations.clear();
    this.analytics.clear();
    this.eventListeners.clear();
    
    console.log('統合管理システム終了処理完了');
  }
}

export const integrationManager = IntegrationManager.getInstance();
export default IntegrationManager;