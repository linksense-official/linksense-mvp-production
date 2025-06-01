// src/lib/integrations/base-integration.ts
// LinkSense MVP - 統合サービス基底クラスシステム - 本番版
// 8サービス完全対応 + 拡張可能な設計 + 非同期メソッド対応

import type {
  Integration,
  IntegrationConfig,
  IntegrationCredentials,
  IntegrationAnalytics,
  AnalyticsMetrics,
  AnalyticsInsight,
  AnalyticsAlert,
  ConnectionStatus,
  SyncResult,
  IntegrationApiResponse,
  AuthType
} from '@/types/integrations';

/**
 * 統合サービス基底クラス - 本番版
 */
export abstract class BaseIntegration {
  protected integration: Integration;
  protected isInitialized: boolean = false;
  protected lastError: string | null = null;
  protected syncInProgress: boolean = false;

  constructor(integration: Integration) {
    this.integration = integration;
  }

  // 抽象メソッド - 各サービスで実装必須
  abstract connect(credentials: IntegrationCredentials): Promise<boolean>;
  abstract disconnect(): Promise<boolean>;
  abstract validateCredentials(credentials: IntegrationCredentials): Promise<boolean>;
  abstract fetchData(): Promise<any>;
  abstract calculateMetrics(data: any): Promise<AnalyticsMetrics>;
  abstract generateInsights(metrics: AnalyticsMetrics): Promise<AnalyticsInsight[]>;

  /**
   * 統合サービスの初期化
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.integration.credentials) {
        const isValid = await this.validateCredentials(this.integration.credentials);
        if (isValid) {
          this.integration.status = 'connected';
          this.isInitialized = true;
          await this.updateLastSync();
          console.log(`統合サービス初期化成功: ${this.integration.name}`);
          return true;
        }
      }
      this.integration.status = 'disconnected';
      console.warn(`統合サービス初期化失敗: ${this.integration.name}`);
      return false;
    } catch (error) {
      this.handleError('初期化エラー', error);
      return false;
    }
  }

  /**
   * データ同期実行
   */
  async sync(): Promise<SyncResult> {
    const startTime = Date.now();
    const syncResult: SyncResult = {
      integrationId: this.integration.id,
      success: false,
      recordsProcessed: 0,
      errors: [],
      duration: 0,
      nextSyncAt: new Date(Date.now() + this.integration.config.syncIntervalMinutes * 60000)
    };

    if (this.syncInProgress) {
      const errorMsg = '同期が既に進行中です';
      syncResult.errors.push(errorMsg);
      console.warn(`${this.integration.name}: ${errorMsg}`);
      return syncResult;
    }

    try {
      this.syncInProgress = true;
      this.integration.status = 'connecting';
      console.log(`データ同期開始: ${this.integration.name}`);

      // 認証状態確認
      if (!await this.isAuthenticated()) {
        throw new Error('認証が無効です');
      }

      // データ取得
      const rawData = await this.fetchData();
      if (!rawData) {
        throw new Error('データ取得に失敗しました');
      }

      // メトリクス計算
      const metrics = await this.calculateMetrics(rawData);
      
      // インサイト生成
      const insights = await this.generateInsights(metrics);

      // アラート検証
      const alerts = await this.checkAlerts(metrics);

      // 健全性スコア計算
      const healthScore = await this.calculateHealthScore(metrics);

      // 分析結果保存
      const analytics: IntegrationAnalytics = {
        integrationId: this.integration.id,
        healthScore,
        lastUpdated: new Date(),
        metrics,
        insights,
        alerts,
        trends: await this.calculateTrends(metrics)
      };

      await this.saveAnalytics(analytics);

      // 統合情報更新
      this.integration.healthScore = healthScore;
      this.integration.lastSync = new Date();
      this.integration.status = 'connected';

      syncResult.success = true;
      syncResult.recordsProcessed = this.getRecordCount(rawData);
      
      console.log(`データ同期完了: ${this.integration.name} (${syncResult.recordsProcessed}件処理)`);
      
    } catch (error) {
      this.handleError('同期エラー', error);
      syncResult.errors.push(this.lastError || '不明なエラー');
      this.integration.status = 'error';
    } finally {
      this.syncInProgress = false;
      syncResult.duration = Date.now() - startTime;
    }

    return syncResult;
  }

  /**
   * 健全性スコア計算（0-100）
   */
  protected async calculateHealthScore(metrics: AnalyticsMetrics): Promise<number> {
    const weights = {
      engagement: 0.3,    // エンゲージメント
      response: 0.25,     // 応答時間
      burnout: 0.25,      // バーンアウト
      collaboration: 0.2  // チーム結束
    };

    let score = 0;

    // エンゲージメントスコア (0-100)
    const engagementScore = Math.min(100, metrics.engagementRate * 100);
    score += engagementScore * weights.engagement;

    // 応答時間スコア (逆比例: 早いほど高スコア)
    const responseScore = Math.max(0, 100 - (metrics.averageResponseTime / 60)); // 分単位
    score += Math.min(100, responseScore) * weights.response;

    // バーンアウトリスク (逆スコア: 低いほど良い)
    const burnoutScore = Math.max(0, 100 - metrics.burnoutRisk);
    score += burnoutScore * weights.burnout;

    // チーム結束スコア
    const collaborationScore = metrics.teamCohesion;
    score += collaborationScore * weights.collaboration;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * アラート検証
   */
  protected async checkAlerts(metrics: AnalyticsMetrics): Promise<AnalyticsAlert[]> {
    const alerts: AnalyticsAlert[] = [];
    const now = new Date();

    // バーンアウトリスクアラート
    if (metrics.burnoutRisk >= 70) {
      alerts.push({
        id: `burnout-${this.integration.id}-${now.getTime()}`,
        severity: metrics.burnoutRisk >= 85 ? 'critical' : 'warning',
        title: 'バーンアウトリスク検出',
        message: `チームのバーンアウトリスクが${metrics.burnoutRisk}%に達しています`,
        integrationId: this.integration.id,
        isRead: false,
        createdAt: now
      });
    }

    // 応答時間アラート
    if (metrics.averageResponseTime > 300) { // 5分以上
      alerts.push({
        id: `response-${this.integration.id}-${now.getTime()}`,
        severity: metrics.averageResponseTime > 600 ? 'error' : 'warning',
        title: '応答時間の遅延',
        message: `平均応答時間が${Math.round(metrics.averageResponseTime / 60)}分を超えています`,
        integrationId: this.integration.id,
        isRead: false,
        createdAt: now
      });
    }

    // エンゲージメント低下アラート
    if (metrics.engagementRate < 0.3) {
      alerts.push({
        id: `engagement-${this.integration.id}-${now.getTime()}`,
        severity: metrics.engagementRate < 0.2 ? 'error' : 'warning',
        title: 'エンゲージメント低下',
        message: `チームエンゲージメントが${Math.round(metrics.engagementRate * 100)}%に低下しています`,
        integrationId: this.integration.id,
        isRead: false,
        createdAt: now
      });
    }

    return alerts;
  }

  /**
   * トレンド分析
   */
  protected async calculateTrends(currentMetrics: AnalyticsMetrics) {
    // 過去のメトリクスと比較してトレンドを計算
    // 実装は各サービスの履歴データに基づく
    return [];
  }

  /**
   * 認証状態確認
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.integration.credentials) {
      return false;
    }

    // トークン有効期限確認
    if (this.integration.credentials.expiresAt) {
      if (new Date() >= this.integration.credentials.expiresAt) {
        // リフレッシュトークンで更新試行
        if (this.integration.credentials.refreshToken) {
          return await this.refreshToken();
        }
        console.warn(`認証トークンが期限切れです: ${this.integration.name}`);
        return false;
      }
    }

    return await this.validateCredentials(this.integration.credentials);
  }

  /**
   * トークンリフレッシュ
   */
  protected async refreshToken(): Promise<boolean> {
    // 各サービスで実装
    console.log(`トークンリフレッシュが必要です: ${this.integration.name}`);
    return false;
  }

  /**
   * 設定更新
   */
  updateConfig(config: Partial<IntegrationConfig>): void {
    this.integration.config = {
      ...this.integration.config,
      ...config
    };
    console.log(`設定更新完了: ${this.integration.name}`);
  }

  /**
   * 認証情報更新
   */
  updateCredentials(credentials: Partial<IntegrationCredentials>): void {
    this.integration.credentials = {
      ...this.integration.credentials,
      ...credentials
    };
    console.log(`認証情報更新完了: ${this.integration.name}`);
  }

  /**
   * 統合情報取得
   */
  getIntegration(): Integration {
    return { ...this.integration };
  }

  /**
   * 接続状態取得
   */
  getStatus(): ConnectionStatus {
    return this.integration.status;
  }

  /**
   * 健全性スコア取得
   */
  async getHealthScore(): Promise<number> {
    try {
      // 既存のスコアがある場合はそれを返す
      if (this.integration.healthScore !== undefined) {
        return this.integration.healthScore;
      }

      // データを取得してスコア計算
      const data = await this.fetchData();
      if (!data) return 0;

      const metrics = await this.calculateMetrics(data);
      const healthScore = await this.calculateHealthScore(metrics);
      
      // 計算結果を保存
      this.integration.healthScore = healthScore;
      
      return healthScore;
    } catch (error) {
      console.error(`健全性スコア取得エラー [${this.integration.name}]:`, error);
      return 0;
    }
  }

  /**
   * 健全性スコア取得（同期版） - 互換性のため
   */
  getHealthScoreSync(): number | undefined {
    return this.integration.healthScore;
  }

  /**
   * 最後の同期時刻取得
   */
  getLastSync(): Date | undefined {
    return this.integration.lastSync;
  }

  /**
   * エラー状態確認
   */
  hasError(): boolean {
    return this.integration.status === 'error' || this.lastError !== null;
  }

  /**
   * 最後のエラー取得
   */
  getLastError(): string | null {
    return this.lastError;
  }

  /**
   * 統合有効化
   */
  enable(): void {
    this.integration.isEnabled = true;
    console.log(`統合サービス有効化: ${this.integration.name}`);
  }

  /**
   * 統合無効化
   */
  disable(): void {
    this.integration.isEnabled = false;
    this.integration.status = 'disconnected';
    console.log(`統合サービス無効化: ${this.integration.name}`);
  }

  /**
   * 統合有効状態確認
   */
  isEnabled(): boolean {
    return this.integration.isEnabled;
  }

  /**
   * 接続状態確認
   */
  async isConnected(): Promise<boolean> {
    return this.getStatus() === 'connected' && await this.isAuthenticated();
  }

  /**
   * 分析データ取得
   */
  async getAnalytics(): Promise<IntegrationAnalytics | null> {
    try {
      const data = await this.fetchData();
      if (!data) return null;

      const metrics = await this.calculateMetrics(data);
      const insights = await this.generateInsights(metrics);
      const alerts = await this.checkAlerts(metrics);
      const healthScore = await this.getHealthScore();

      return {
        integrationId: this.integration.id,
        healthScore,
        lastUpdated: new Date(),
        metrics,
        insights,
        alerts,
        trends: await this.calculateTrends(metrics)
      };
    } catch (error) {
      console.error(`分析データ取得エラー [${this.integration.name}]:`, error);
      return null;
    }
  }

  // 保護されたヘルパーメソッド

  /**
   * エラーハンドリング
   */
  protected handleError(context: string, error: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.lastError = `${context}: ${errorMessage}`;
    console.error(`[${this.integration.name}] ${this.lastError}`, error);
    this.integration.status = 'error';
  }

  /**
   * 最終同期時刻更新
   */
  protected async updateLastSync(): Promise<void> {
    this.integration.lastSync = new Date();
  }

  /**
   * レコード数取得
   */
  protected getRecordCount(data: any): number {
    if (Array.isArray(data)) {
      return data.length;
    }
    if (data && typeof data === 'object') {
      return Object.keys(data).length;
    }
    return 0;
  }

  /**
   * 分析結果保存
   */
  protected async saveAnalytics(analytics: IntegrationAnalytics): Promise<void> {
    try {
      const key = `analytics_${this.integration.id}_${Date.now()}`;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(analytics));
        console.log(`分析結果保存完了: ${this.integration.name}`);
      }
    } catch (error) {
      console.warn(`分析結果の保存に失敗 [${this.integration.name}]:`, error);
    }
  }

  /**
   * API呼び出し共通処理
   */
  protected async makeApiCall<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<IntegrationApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers
        }
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.message || 'API呼び出しエラー',
        code: response.status.toString(),
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ネットワークエラー',
        timestamp: new Date()
      };
    }
  }

  /**
   * 認証ヘッダー生成
   */
  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.integration.credentials?.accessToken) {
      headers['Authorization'] = `Bearer ${this.integration.credentials.accessToken}`;
    }

    if (this.integration.credentials?.apiKey) {
      headers['X-API-Key'] = this.integration.credentials.apiKey;
    }

    return headers;
  }

  /**
   * レート制限処理
   */
  protected async handleRateLimit(retryAfter?: number): Promise<void> {
    const delay = retryAfter ? retryAfter * 1000 : 1000;
    console.warn(`レート制限のため${delay}ms待機: ${this.integration.name}`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * データ検証
   */
  protected validateData(data: any, schema: any): boolean {
    // 簡易的なデータ検証
    return data !== null && data !== undefined;
  }

  /**
   * 設定値取得
   */
  protected getConfigValue<T>(key: string, defaultValue: T): T {
    return this.integration.config.customSettings?.[key] ?? defaultValue;
  }

  /**
   * 機能有効状態確認
   */
  protected isFeatureEnabled(feature: string): boolean {
    return this.integration.config.enabledFeatures.includes(feature);
  }
}

/**
 * 統合サービスコンストラクタ型定義
 */
export interface IntegrationConstructor {
  new (integration: Integration): BaseIntegration;
}

/**
 * 統合サービスファクトリー
 */
export class IntegrationFactory {
  private static integrations = new Map<string, IntegrationConstructor>();

  /**
   * 統合サービス登録
   */
  static register(id: string, integrationClass: IntegrationConstructor): void {
    this.integrations.set(id, integrationClass);
    console.log(`統合サービス登録完了: ${id}`);
  }

  /**
   * 統合サービス作成
   */
  static create(integration: Integration): BaseIntegration | null {
    const IntegrationClass = this.integrations.get(integration.id);
    if (!IntegrationClass) {
      console.error(`統合サービス '${integration.id}' が登録されていません`);
      return null;
    }

    console.log(`統合サービス作成: ${integration.id}`);
    return new IntegrationClass(integration);
  }

  /**
   * 登録済み統合サービス一覧取得
   */
  static getRegisteredIntegrations(): string[] {
    return Array.from(this.integrations.keys());
  }

  /**
   * 統合サービス登録状態確認
   */
  static isRegistered(integrationId: string): boolean {
    return this.integrations.has(integrationId);
  }

  /**
   * 統合サービス登録解除
   */
  static unregister(integrationId: string): boolean {
    const result = this.integrations.delete(integrationId);
    if (result) {
      console.log(`統合サービス登録解除: ${integrationId}`);
    }
    return result;
  }

  /**
   * 全統合サービス登録解除
   */
  static clear(): void {
    console.log('全統合サービス登録解除');
    this.integrations.clear();
  }
}

/**
 * 統合サービスレジストリ
 */
export class IntegrationRegistry {
  private static instance: IntegrationRegistry;
  private integrations = new Map<string, BaseIntegration>();

  static getInstance(): IntegrationRegistry {
    if (!this.instance) {
      this.instance = new IntegrationRegistry();
    }
    return this.instance;
  }

  /**
   * 統合サービス追加
   */
  add(integration: BaseIntegration): void {
    this.integrations.set(integration.getIntegration().id, integration);
    console.log(`統合サービス追加: ${integration.getIntegration().name}`);
  }

  /**
   * 統合サービス取得
   */
  get(integrationId: string): BaseIntegration | undefined {
    return this.integrations.get(integrationId);
  }

  /**
   * 全統合サービス取得
   */
  getAll(): BaseIntegration[] {
    return Array.from(this.integrations.values());
  }

  /**
   * 接続済み統合サービス取得
   */
  getConnected(): BaseIntegration[] {
    return this.getAll().filter(integration => 
      integration.getStatus() === 'connected'
    );
  }

  /**
   * 統合サービス削除
   */
  remove(integrationId: string): boolean {
    const result = this.integrations.delete(integrationId);
    if (result) {
      console.log(`統合サービス削除: ${integrationId}`);
    }
    return result;
  }

  /**
   * 全統合サービスクリア
   */
  clear(): void {
    console.log('全統合サービスクリア');
    this.integrations.clear();
  }

  /**
   * 統合サービス数取得
   */
  size(): number {
    return this.integrations.size;
  }

  /**
   * 統合サービス存在確認
   */
  has(integrationId: string): boolean {
    return this.integrations.has(integrationId);
  }

  /**
   * 統合サービス一覧取得（ID配列）
   */
  getIntegrationIds(): string[] {
    return Array.from(this.integrations.keys());
  }

  /**
   * 健全性スコア一覧取得
   */
  async getHealthScores(): Promise<{ [integrationId: string]: number }> {
    const scores: { [integrationId: string]: number } = {};
    
    for (const [id, integration] of this.integrations) {
      try {
        scores[id] = await integration.getHealthScore();
      } catch (error) {
        console.error(`健全性スコア取得エラー [${id}]:`, error);
        scores[id] = 0;
      }
    }
    
    return scores;
  }

  /**
   * 分析データ一覧取得
   */
  async getAllAnalytics(): Promise<{ [integrationId: string]: IntegrationAnalytics | null }> {
    const analytics: { [integrationId: string]: IntegrationAnalytics | null } = {};
    
    for (const [id, integration] of this.integrations) {
      try {
        analytics[id] = await integration.getAnalytics();
      } catch (error) {
        console.error(`分析データ取得エラー [${id}]:`, error);
        analytics[id] = null;
      }
    }
    
    return analytics;
  }
}

export default BaseIntegration;