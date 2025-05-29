// src/types/integrations.ts
// LinkSense MVP - 統合サービス型定義システム
// 13サービス全対応 + 拡張可能な設計

// ✅ 基本的な統合サービス型定義
export type IntegrationCategory = 'communication' | 'project' | 'analytics' | 'hr' | 'meeting';
export type IntegrationMarket = 'global' | 'us' | 'japan';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'expired';
export type AuthType = 'oauth2' | 'api_key' | 'webhook' | 'bot_token';

// ✅ 統合サービス基本インターフェース
export interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  market: IntegrationMarket;
  status: ConnectionStatus;
  features: string[];
  authType: AuthType;
  config: IntegrationConfig;
  credentials?: IntegrationCredentials;
  lastSync?: Date;
  healthScore?: number;
  isEnabled: boolean;
}

// ✅ 統合設定構成
export interface IntegrationConfig {
  setupUrl?: string;
  webhookUrl?: string;
  scopes: string[];
  permissions: string[];
  dataRetentionDays: number;
  syncIntervalMinutes: number;
  enabledFeatures: string[];
  customSettings?: Record<string, any>;
}

// ✅ 認証情報（暗号化保存）
export interface IntegrationCredentials {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  botToken?: string;
  webhookSecret?: string;
  clientId?: string;
  teamId?: string;
  workspaceId?: string;
  expiresAt?: Date;
  tokenType?: string;
}

// ✅ 統合データ分析結果
export interface IntegrationAnalytics {
  integrationId: string;
  healthScore: number;
  lastUpdated: Date;
  metrics: AnalyticsMetrics;
  insights: AnalyticsInsight[];
  alerts: AnalyticsAlert[];
  trends: AnalyticsTrend[];
}

// ✅ 分析メトリクス
export interface AnalyticsMetrics {
  // コミュニケーション指標
  messageCount: number;
  activeUsers: number;
  averageResponseTime: number;
  engagementRate: number;
  
  // 会議指標
  meetingCount?: number;
  meetingDuration?: number;
  attendanceRate?: number;
  participationRate?: number;
  
  // プロジェクト指標
  taskCompletionRate?: number;
  projectProgress?: number;
  collaborationScore?: number;
  
  // 健全性指標
  burnoutRisk: number;
  stressLevel: number;
  workLifeBalance: number;
  teamCohesion: number;
}

// ✅ 分析インサイト
export interface AnalyticsInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  recommendations?: string[];
  createdAt: Date;
}

// ✅ アラート定義
export interface AnalyticsAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  integrationId: string;
  userId?: string;
  teamId?: string;
  isRead: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

// ✅ トレンド分析
export interface AnalyticsTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  timeframe: '1d' | '7d' | '30d' | '90d';
  significance: 'low' | 'medium' | 'high';
}

// ✅ サービス固有の型定義

// Slack統合
export interface SlackIntegration extends Integration {
  id: 'slack';
  credentials?: SlackCredentials;
  data?: SlackData;
}

export interface SlackCredentials extends IntegrationCredentials {
  botToken: string;
  userToken?: string;
  teamId: string;
  teamName: string;
}

export interface SlackData {
  channels: SlackChannel[];
  users: SlackUser[];
  messages: SlackMessage[];
  workspace: SlackWorkspace;
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
  messageCount: number;
  lastActivity: Date;
}

export interface SlackUser {
  id: string;
  name: string;
  realName: string;
  isActive: boolean;
  messageCount: number;
  lastSeen: Date;
}

export interface SlackMessage {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  timestamp: Date;
  threadTs?: string;
  reactionCount: number;
}

export interface SlackWorkspace {
  id: string;
  name: string;
  domain: string;
  memberCount: number;
  createdAt: Date;
}

// Microsoft Teams統合
export interface TeamsIntegration extends Integration {
  id: 'microsoft-teams';
  credentials?: TeamsCredentials;
  data?: TeamsData;
}

export interface TeamsCredentials extends IntegrationCredentials {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  clientId: string;
}

export interface TeamsData {
  teams: TeamsTeam[];
  channels: TeamsChannel[];
  meetings: TeamsMeeting[];
  users: TeamsUser[];
}

export interface TeamsTeam {
  id: string;
  displayName: string;
  description: string;
  memberCount: number;
  channelCount: number;
  createdAt: Date;
}

export interface TeamsChannel {
  id: string;
  teamId: string;
  displayName: string;
  memberCount: number;
  messageCount: number;
  lastActivity: Date;
}

export interface TeamsMeeting {
  id: string;
  subject: string;
  startTime: Date;
  endTime: Date;
  attendeeCount: number;
  organizerId: string;
  isRecurring: boolean;
}

export interface TeamsUser {
  id: string;
  displayName: string;
  email: string;
  isActive: boolean;
  lastActivity: Date;
}

// Zoom統合
export interface ZoomIntegration extends Integration {
  id: 'zoom';
  credentials?: ZoomCredentials;
  data?: ZoomData;
}

export interface ZoomCredentials extends IntegrationCredentials {
  apiKey: string;
  apiSecret: string;
  accountId: string;
}

export interface ZoomData {
  meetings: ZoomMeeting[];
  users: ZoomUser[];
  webinars: ZoomWebinar[];
  account: ZoomAccount;
}

export interface ZoomMeeting {
  id: string;
  topic: string;
  startTime: Date;
  duration: number;
  participantCount: number;
  hostId: string;
  isRecurring: boolean;
  attendanceRate: number;
}

export interface ZoomUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  meetingCount: number;
}

export interface ZoomWebinar {
  id: string;
  topic: string;
  startTime: Date;
  duration: number;
  registrantCount: number;
  attendeeCount: number;
}

export interface ZoomAccount {
  id: string;
  accountName: string;
  licenseCount: number;
  planType: string;
}

// ChatWork統合（日本市場特化）
export interface ChatWorkIntegration extends Integration {
  id: 'chatwork';
  credentials?: ChatWorkCredentials;
  data?: ChatWorkData;
}

export interface ChatWorkCredentials extends IntegrationCredentials {
  apiKey: string;
  accountId: string;
}

export interface ChatWorkData {
  rooms: ChatWorkRoom[];
  contacts: ChatWorkContact[];
  tasks: ChatWorkTask[];
  messages: ChatWorkMessage[];
}

export interface ChatWorkRoom {
  id: string;
  name: string;
  type: 'my' | 'direct' | 'group';
  memberCount: number;
  messageCount: number;
  taskCount: number;
  lastUpdateTime: Date;
}

export interface ChatWorkContact {
  accountId: string;
  name: string;
  chatworkId: string;
  organizationId: string;
  organizationName: string;
  department: string;
}

export interface ChatWorkTask {
  taskId: string;
  roomId: string;
  assignedByAccountId: string;
  messageId: string;
  body: string;
  limitTime: Date;
  status: 'open' | 'done';
}

export interface ChatWorkMessage {
  messageId: string;
  roomId: string;
  accountId: string;
  body: string;
  sendTime: Date;
  updateTime: Date;
}

// ✅ 統合管理システム
export interface IntegrationManager {
  integrations: Map<string, Integration>;
  connect(integrationId: string, credentials: IntegrationCredentials): Promise<boolean>;
  disconnect(integrationId: string): Promise<boolean>;
  sync(integrationId: string): Promise<IntegrationAnalytics>;
  syncAll(): Promise<IntegrationAnalytics[]>;
  getAnalytics(integrationId: string): Promise<IntegrationAnalytics | null>;
  getHealthScore(integrationId?: string): Promise<number>;
  getInsights(integrationId?: string): Promise<AnalyticsInsight[]>;
  getAlerts(severity?: string): Promise<AnalyticsAlert[]>;
}

// ✅ 統合設定
export interface IntegrationSettings {
  enabledIntegrations: string[];
  syncInterval: number;
  dataRetentionDays: number;
  alertThresholds: AlertThresholds;
  privacySettings: IntegrationPrivacySettings;
  notificationSettings: IntegrationNotificationSettings;
}

export interface AlertThresholds {
  burnoutRisk: number;
  responseTimeWarning: number;
  engagementDropWarning: number;
  inactivityWarning: number;
}

export interface IntegrationPrivacySettings {
  anonymizeUserData: boolean;
  shareAnalyticsData: boolean;
  encryptStoredData: boolean;
  autoDeleteExpiredTokens: boolean;
}

export interface IntegrationNotificationSettings {
  enableRealTimeAlerts: boolean;
  enableWeeklyReports: boolean;
  enableCriticalAlerts: boolean;
  alertChannels: ('email' | 'slack' | 'teams' | 'webhook')[];
}

// ✅ API応答型
export interface IntegrationApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: Date;
}

export interface SyncResult {
  integrationId: string;
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  duration: number;
  nextSyncAt: Date;
}

// ✅ ダッシュボード表示用
export interface IntegrationDashboardData {
  overallHealthScore: number;
  totalIntegrations: number;
  connectedIntegrations: number;
  criticalAlerts: number;
  recentInsights: AnalyticsInsight[];
  topMetrics: DashboardMetric[];
  integrationStatus: IntegrationStatusSummary[];
}

export interface DashboardMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface IntegrationStatusSummary {
  integrationId: string;
  name: string;
  status: ConnectionStatus;
  healthScore: number;
  lastSync: Date;
  errorCount: number;
}

// ✅ エクスポート/インポート
export interface IntegrationExportData {
  integrations: Integration[];
  analytics: IntegrationAnalytics[];
  settings: IntegrationSettings;
  exportedAt: Date;
  version: string;
}

// ✅ Webhook設定
export interface WebhookConfig {
  integrationId: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  retryPolicy: WebhookRetryPolicy;
}

export interface WebhookRetryPolicy {
  maxRetries: number;
  retryDelayMs: number;
  exponentialBackoff: boolean;
}

// ✅ 統合サービス定義（13サービス対応）
export const INTEGRATION_SERVICES = {
  // グローバルサービス
  SLACK: 'slack',
  MICROSOFT_TEAMS: 'microsoft-teams',
  ZOOM: 'zoom',
  GOOGLE_MEET: 'google-meet',
  DISCORD: 'discord',
  
  // 日本市場特化
  CHATWORK: 'chatwork',
  LINE_WORKS: 'line-works',
  CYBOZU_OFFICE: 'cybozu-office',
  
  // アメリカ市場特化
  CISCO_WEBEX: 'cisco-webex',
  GOTOMEETING: 'gotomeeting',
  RINGCENTRAL: 'ringcentral',
  WORKPLACE_META: 'workplace-meta',
  MATTERMOST: 'mattermost'
} as const;

export type IntegrationServiceId = typeof INTEGRATION_SERVICES[keyof typeof INTEGRATION_SERVICES];

// ✅ デフォルト設定
export const DEFAULT_INTEGRATION_CONFIG: IntegrationConfig = {
  scopes: [],
  permissions: [],
  dataRetentionDays: 90,
  syncIntervalMinutes: 60,
  enabledFeatures: [],
  customSettings: {}
};

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  burnoutRisk: 70,
  responseTimeWarning: 300, // 5分
  engagementDropWarning: 20, // 20%減少
  inactivityWarning: 7 // 7日間
};