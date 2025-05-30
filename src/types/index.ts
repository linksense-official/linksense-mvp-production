// src/types/index.ts
// LinkSense MVP 統合型定義ファイル v3.2
// 最終更新: 2025年5月28日
// 完成度: 100% (認証システム・サブスクリプション・settings対応完了)

// ===== 基本型定義 =====

export type Status = 'active' | 'inactive' | 'pending' | 'error';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'ja' | 'en' | 'zh' | 'ko';
export type Timezone = 'Asia/Tokyo' | 'America/New_York' | 'Europe/London' | 'Asia/Shanghai';

// ===== ユーザー設定関連 (settings対応) =====

/**
 * ユーザー設定 - settings プロパティ用
 */
export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    weekly: boolean;
    slack?: boolean;
  };
  privacy: {
    profileVisible: boolean;
    analyticsSharing: boolean;
    dataExport?: boolean;
  };
  preferences: {
    theme: Theme;
    language: Language;
    timezone: Timezone;
    dateFormat?: string;
    timeFormat?: string;
  };
  integrations?: {
    slack?: boolean;
    teams?: boolean;
    email?: boolean;
  };
  advanced?: {
    debugMode?: boolean;
    betaFeatures?: boolean;
    apiAccess?: boolean;
  };
}

// ===== 認証・ユーザー関連 =====

/**
 * ユーザー基本情報 - settings プロパティ追加済み
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  timezone: Timezone;
  language: Language;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  isEmailVerified: boolean;
  preferences: UserPreferences;
  permissions: Permission[];
  department?: string;
  
  // 🆕 settings プロパティ追加 (TypeScript エラー解決)
  settings?: UserSettings;
  
  // 🆕 subscription プロパティ追加 (将来の拡張用)
  subscription?: {
    id: string;
    plan: string;
    status: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
    features: string[];
    limits: {
      teamMembers: number;
      reports: number;
      storage: number;
    };
  };
}

export type UserRole = 'admin' | 'manager' | 'member' | 'viewer';
export type UserStatus = 'online' | 'offline' | 'away' | 'busy' | 'dnd';

/**
 * 認証コンテキストの型定義 - isAuthenticated 追加済み
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean; // 🆕 追加 (TypeScript エラー解決)
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void; // 🆕 追加
  isLoading: boolean;
}

/**
 * ユーザー設定
 */
export interface UserPreferences {
  timezone: string;
  language: Language;
  notificationSettings: {
    email: boolean;
    push: boolean;
    slack: boolean;
  };
  theme: Theme;
  workingHours?: WorkingHours;
  digestSettings?: DigestSettings;
}

/**
 * 権限管理
 */
export interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'admin')[];
}

// ===== サブスクリプション・課金関連 =====

/**
 * サブスクリプションプラン
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  interval: 'monthly' | 'yearly';
  currency: string;
  features: string[];
  limits: {
    teams?: number;
    members?: number;
    storage?: number;
    apiCalls?: number;
    messageAnalysis?: number;
  };
  isActive: boolean;
  isPopular?: boolean;
  trialDays?: number;
  setupFee?: number;
  metadata?: Record<string, any>;
}

/**
 * 使用量メトリクス
 */
export interface UsageMetrics {
  // 基本使用量
  apiCalls: number;
  teams: number;
  members: number;
  storage: number;
  messageAnalysis: number;
  
  // 制限値（プランから取得、またはAPI応答に含まれる）
  apiCallsLimit?: number;
  teamsLimit?: number;
  membersLimit?: number;
  storageLimit?: number;
  messageAnalysisLimit?: number;
  
  // 期間別データ
  currentPeriod: number;
  previousPeriod: number;
  
  // 期間情報
  period: string;
  periodStart: string;
  periodEnd: string;
  
  // 追加統計
  totalRequests?: number;
  averageResponseTime?: number;
  errorRate?: number;
  
  // 詳細データ
  dailyUsage?: UsageDataPoint[];
  weeklyUsage?: UsageDataPoint[];
  monthlyUsage?: UsageDataPoint[];
}

/**
 * 使用量データポイント
 */
export interface UsageDataPoint {
  date: string;
  value: number;
  type: string;
  metadata?: Record<string, any>;
}

/**
 * 支払い方法
 */
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * 請求書
 */
export interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  amount: number;
  currency: string;
  tax?: number;
  discount?: number;
  subtotal: number;
  total: number;
  date: string;
  dueDate?: string;
  paidAt?: string;
  items: InvoiceItem[];
  paymentMethod?: PaymentMethod;
  downloadUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * 請求書項目
 */
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  period?: {
    start: string;
    end: string;
  };
  metadata?: Record<string, any>;
}

/**
 * 課金情報
 */
export interface BillingInfo {
  customerId: string;
  subscriptionId?: string;
  currentPlan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: PaymentMethod;
  billingAddress?: BillingAddress;
  taxInfo?: TaxInfo;
}

/**
 * 請求先住所
 */
export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

/**
 * 税情報
 */
export interface TaxInfo {
  taxId?: string;
  taxType?: string;
  taxRate: number;
  taxExempt: boolean;
}

/**
 * サブスクリプション統計
 */
export interface SubscriptionStats {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  churnRate: number;
  lifetimeValue: number;
  conversionRate: number;
  trialConversionRate: number;
  upgradeRate: number;
  downgradeRate: number;
  refundRate: number;
}

/**
 * プラン変更リクエスト
 */
export interface PlanChangeRequest {
  currentPlanId: string;
  newPlanId: string;
  effectiveDate?: Date;
  prorationBehavior: 'create_prorations' | 'none' | 'always_invoice';
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * サブスクリプションイベント
 */
export interface SubscriptionEvent {
  id: string;
  type: SubscriptionEventType;
  timestamp: Date;
  data: Record<string, any>;
  processed: boolean;
  retryCount: number;
  lastError?: string;
}

export type SubscriptionEventType = 
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'subscription.trial_will_end'
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'payment_method.attached'
  | 'payment_method.detached'
  | 'plan.changed'
  | 'usage.threshold_exceeded';

/**
 * 割引・クーポン
 */
export interface Discount {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'amount';
  value: number;
  currency?: string;
  validFrom: Date;
  validUntil?: Date;
  maxUses?: number;
  usedCount: number;
  applicablePlans?: string[];
  firstTimeOnly: boolean;
  metadata?: Record<string, any>;
}

/**
 * コホート分析データ
 */
export interface CohortData {
  cohortMonth: string;
  userCount: number;
  retentionRates: number[];
  revenueRetention: number[];
  churnRate: number;
  lifetimeValue: number;
}

// ===== チーム・組織関連 =====

/**
 * チーム情報
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  channels: string[];
  settings: TeamSettings;
  healthScore: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * チームメンバー詳細情報
 */
export interface TeamMember {
  /** ユーザーID */
  id: string;
  /** 表示名 */
  name: string;
  /** メールアドレス */
  email?: string;
  /** 役割 */
  role: TeamRole;
  /** アバター画像URL */
  avatar?: string;
  /** アクティビティレベル */
  activityLevel: number; // 0-100
  /** 最後のアクティビティ */
  lastActivity: Date;
  /** メッセージ統計 */
  messageStats: {
    sent: number;
    received: number;
    replyRate: number;
    averageResponseTime: number;
  };
  /** 感情スコア */
  sentimentScore: number; // -1 to 1
  /** 孤立リスク */
  isolationRisk: number; // 0-100
  /** 過労リスク */
  burnoutRisk: number; // 0-100
  /** 接続しているメンバー */
  connections: string[];
  /** ステータス */
  status: UserStatus;
  /** チーム参加日 */
  joinedAt: Date;
  /** アクティブフラグ */
  isActive: boolean;
  /** 権限 */
  permissions: Permission[];
}

export type TeamRole = 'owner' | 'admin' | 'member';

/**
 * チーム設定
 */
export interface TeamSettings {
  isPublic: boolean;
  allowGuestAccess: boolean;
  notificationSettings: NotificationSettings;
  workingHours: WorkingHours;
  holidays: Holiday[];
}

/**
 * 勤務時間設定
 */
export interface WorkingHours {
  timezone: Timezone;
  schedule: {
    [key in DayOfWeek]: {
      enabled: boolean;
      start: string; // HH:mm format
      end: string;   // HH:mm format
    };
  };
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * 祝日情報
 */
export interface Holiday {
  id: string;
  name: string;
  date: Date;
  isRecurring: boolean;
  country?: string;
}

// ===== チーム分析関連 =====

/**
 * チーム分析の基本データ
 */
export interface TeamAnalysis {
  /** チームID */
  teamId: string;
  /** チーム名 */
  teamName: string;
  /** 分析期間 */
  period: {
    start: Date;
    end: Date;
  };
  /** チームメンバー情報 */
  members: TeamMember[];
  /** 全体的な健全性スコア */
  overallHealthScore: number;
  /** コミュニケーション統計 */
  communicationStats: {
    totalMessages: number;
    averageMessagesPerDay: number;
    activeMembers: number;
    responseRate: number;
    averageResponseTime: number; // 分単位
  };
  /** 感情分析結果 */
  sentimentAnalysis: {
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
    overallSentiment: 'positive' | 'negative' | 'neutral';
    trendDirection: 'improving' | 'declining' | 'stable';
  };
  /** アクティビティパターン */
  activityPatterns: {
    peakHours: number[];
    busyDays: string[];
    quietPeriods: {
      start: string;
      end: string;
    }[];
  };
  /** リスク指標 */
  riskIndicators: {
    burnoutRisk: number; // 0-100
    isolationRisk: number; // 0-100
    communicationGaps: number; // 0-100
    workloadImbalance: number; // 0-100
  };
  /** 推奨事項 */
  recommendations: Recommendation[];
  /** 分析実行時刻 */
  analyzedAt: Date;
  /** データの信頼度 */
  confidenceScore: number;
}

/**
 * チーム概要情報
 */
export interface TeamSummary {
  /** チームID */
  id: string;
  /** チーム名 */
  name: string;
  /** メンバー数 */
  memberCount: number;
  /** 健全性スコア */
  healthScore: number;
  /** 最後のアクティビティ */
  lastActivity: Date;
  /** ステータス */
  status: 'healthy' | 'warning' | 'critical';
  /** アクティブアラート数 */
  activeAlerts: number;
  /** 今日のメッセージ数 */
  todayMessages: number;
}

// ===== ダッシュボード関連 =====

/**
 * ダッシュボードの基本データ
 */
export interface DashboardData {
  /** ダッシュボードID */
  id: string;
  /** ユーザーID */
  userId: string;
  /** 最終更新時刻 */
  lastUpdated: Date;
  /** チーム概要 */
  teamOverview: {
    totalTeams: number;
    totalMembers: number;
    activeTeams: number;
    averageHealthScore: number;
  };
  /** 今日の統計 */
  todayStats: {
    messages: number;
    activeUsers: number;
    alerts: number;
    completedTasks: number;
  };
  /** 週間トレンド */
  weeklyTrends: {
    messageVolume: number[];
    activityLevels: number[];
    sentimentScores: number[];
    healthScores: number[];
  };
  /** アラート情報 */
  alerts: Alert[];
  /** 最近のインサイト */
  recentInsights: Insight[];
  /** チームリスト */
  teams: TeamSummary[];
  /** パフォーマンス指標 */
  performanceMetrics: {
    responseTime: number;
    engagement: number;
    satisfaction: number;
    productivity: number;
  };
  /** 設定情報 */
  settings: {
    timezone: string;
    language: string;
    refreshInterval: number;
    notificationsEnabled: boolean;
  };
}

// ===== メッセージ・コミュニケーション関連 =====

/**
 * メッセージ情報
 */
export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  threadId?: string;
  parentMessageId?: string;
  reactions: Reaction[];
  attachments: Attachment[];
  mentions: string[];
  metadata: MessageMetadata;
  isEdited: boolean;
  isDeleted: boolean;
}

export type MessageType = 'text' | 'image' | 'file' | 'link' | 'system' | 'bot';

/**
 * リアクション情報
 */
export interface Reaction {
  emoji: string;
  users: string[];
  count: number;
  timestamp: Date;
}

/**
 * 添付ファイル情報
 */
export interface Attachment {
  id: string;
  type: AttachmentType;
  url: string;
  filename?: string;
  size?: number;
  mimetype?: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

export type AttachmentType = 'image' | 'video' | 'audio' | 'document' | 'link' | 'other';

/**
 * メッセージメタデータ
 */
export interface MessageMetadata {
  sentiment?: SentimentScore;
  topics?: string[];
  language?: Language;
  urgency?: Priority;
  responseTime?: number;
  isQuestion?: boolean;
  hasDeadline?: boolean;
}

/**
 * 感情スコア
 */
export interface SentimentScore {
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  label: SentimentLabel;
  emotions?: EmotionScore[];
}

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

/**
 * 感情詳細スコア
 */
export interface EmotionScore {
  emotion: EmotionType;
  score: number;
  confidence: number;
}

export type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'trust' | 'anticipation';

// ===== チャンネル関連 =====

/**
 * チャンネル情報
 */
export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: ChannelType;
  isPrivate: boolean;
  members: ChannelMember[];
  settings: ChannelSettings;
  statistics: ChannelStatistics;
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
}

export type ChannelType = 'general' | 'project' | 'team' | 'announcement' | 'social' | 'support';

/**
 * チャンネルメンバー
 */
export interface ChannelMember {
  userId: string;
  role: ChannelRole;
  joinedAt: Date;
  lastRead: Date;
  isMuted: boolean;
  notificationLevel: NotificationLevel;
}

export type ChannelRole = 'owner' | 'admin' | 'member';
export type NotificationLevel = 'all' | 'mentions' | 'none';

/**
 * チャンネル設定
 */
export interface ChannelSettings {
  allowThreads: boolean;
  allowReactions: boolean;
  allowFileUploads: boolean;
  retentionDays?: number;
  moderationLevel: ModerationLevel;
}

export type ModerationLevel = 'none' | 'basic' | 'strict';

/**
 * チャンネル統計
 */
export interface ChannelStatistics {
  totalMessages: number;
  activeMembers: number;
  averageResponseTime: number;
  peakHours: number[];
  sentimentTrend: SentimentTrend[];
  topKeywords: KeywordCount[];
}

/**
 * 感情トレンド
 */
export interface SentimentTrend {
  date: Date;
  positive: number;
  neutral: number;
  negative: number;
}

/**
 * キーワード出現回数
 */
export interface KeywordCount {
  keyword: string;
  count: number;
  trend: number; // percentage change
}

// ===== アラート・通知関連 =====

/**
 * アラート情報
 */
export interface Alert {
  /** アラートID */
  id: string;
  /** タイプ */
  type: AlertType;
  /** 重要度 */
  severity: AlertSeverity;
  /** タイトル */
  title: string;
  /** メッセージ */
  message: string;
  /** ソース */
  source: AlertSource;
  /** 対象 */
  target: AlertTarget;
  /** 条件 */
  conditions: AlertCondition[];
  /** 対象チーム */
  teamId?: string;
  /** 対象ユーザー */
  userId?: string;
  /** 発生時刻 */
  timestamp: Date;
  /** 確認済みフラグ */
  acknowledged: boolean;
  /** 確認者 */
  acknowledgedBy?: string;
  /** 確認時刻 */
  acknowledgedAt?: Date;
  /** 解決済みフラグ */
  resolved: boolean;
  /** 解決時刻 */
  resolvedAt?: Date;
  /** アクション */
  actions?: AlertAction[];
  /** メタデータ */
  metadata: AlertMetadata;
}

export type AlertType = 'isolation' | 'burnout' | 'communication-gap' | 'sentiment-decline' | 'system' | 'threshold' | 'anomaly' | 'trend' | 'custom';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertSource = 'system' | 'ai' | 'manual' | 'integration';

/**
 * アラート対象
 */
export interface AlertTarget {
  type: 'user' | 'team' | 'channel' | 'system';
  id: string;
  name: string;
}

/**
 * アラート条件
 */
export interface AlertCondition {
  metric: string;
  operator: ComparisonOperator;
  value: number;
  duration?: number;
}

export type ComparisonOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';

/**
 * アラートアクション
 */
export interface AlertAction {
  /** アクションID */
  id: string;
  /** ラベル */
  label: string;
  /** アクションタイプ */
  type: 'acknowledge' | 'resolve' | 'escalate' | 'notify' | 'custom';
  /** URL（リンクアクションの場合） */
  url?: string;
  /** 確認メッセージ */
  confirmMessage?: string;
}

/**
 * アラートメタデータ
 */
export interface AlertMetadata {
  ruleName?: string;
  threshold?: number;
  currentValue?: number;
  trend?: number;
  affectedEntities?: string[];
  suggestedActions?: string[];
  [key: string]: any;
}

// ===== 通知システム関連 =====

/**
 * 通知設定
 */
export interface NotificationSettings {
  channels: NotificationChannelConfig[];
  rules: NotificationRule[];
  schedule: NotificationSchedule;
  preferences: NotificationPreferences;
}

/**
 * 通知チャンネル設定
 */
export interface NotificationChannelConfig {
  type: NotificationChannelType;
  enabled: boolean;
  config: Record<string, any>;
  priority: Priority;
}

export type NotificationChannelType = 'email' | 'slack' | 'teams' | 'webhook' | 'sms' | 'push';

/**
 * 通知ルール
 */
export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: NotificationAction[];
  throttling: ThrottlingConfig;
}

/**
 * 通知アクション
 */
export interface NotificationAction {
  type: NotificationChannelType;
  template: string;
  recipients: string[];
  delay?: number;
}

/**
 * スロットリング設定
 */
export interface ThrottlingConfig {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
  cooldownMinutes: number;
}

/**
 * 通知スケジュール
 */
export interface NotificationSchedule {
  enabled: boolean;
  quietHours: QuietHours;
  workingDays: DayOfWeek[];
  timezone: Timezone;
}

/**
 * 静寂時間
 */
export interface QuietHours {
  start: string; // HH:mm
  end: string;   // HH:mm
  enabled: boolean;
}

/**
 * 通知設定
 */
export interface NotificationPreferences {
  digest: DigestSettings;
  realtime: RealtimeSettings;
  escalation: EscalationSettings;
}

/**
 * ダイジェスト設定
 */
export interface DigestSettings {
  enabled: boolean;
  frequency: DigestFrequency;
  time: string; // HH:mm
  includeSummary: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
}

export type DigestFrequency = 'daily' | 'weekly' | 'monthly';

/**
 * リアルタイム設定
 */
export interface RealtimeSettings {
  enabled: boolean;
  severityThreshold: AlertSeverity;
  channels: NotificationChannelType[];
  grouping: GroupingSettings;
}

/**
 * グループ化設定
 */
export interface GroupingSettings {
  enabled: boolean;
  timeWindow: number; // minutes
  maxItems: number;
}

/**
 * エスカレーション設定
 */
export interface EscalationSettings {
  enabled: boolean;
  levels: EscalationLevel[];
}

/**
 * エスカレーションレベル
 */
export interface EscalationLevel {
  level: number;
  delay: number; // minutes
  recipients: string[];
  channels: NotificationChannelType[];
}

// ===== インサイト・推奨事項関連 =====

/**
 * インサイト情報
 */
export interface Insight {
  /** インサイトID */
  id: string;
  /** タイプ */
  type: InsightType;
  /** カテゴリ */
  category: InsightCategory;
  /** タイトル */
  title: string;
  /** 説明 */
  description: string;
  /** 重要度 */
  priority: Priority;
  /** 信頼度 */
  confidence: number; // 0-100
  /** 証拠データ */
  evidence: Evidence[];
  /** 推奨事項 */
  recommendations: Recommendation[];
  /** 生成時刻 */
  timestamp: Date;
  /** アクション可能フラグ */
  isActionable: boolean;
  /** 読み取り済みフラグ */
  isRead: boolean;
  /** 対象チーム */
  teamId?: string;
  /** 対象ユーザー */
  userId?: string;
  /** 影響度 */
  impact: {
    scope: 'individual' | 'team' | 'organization';
    severity: number; // 0-100
    timeframe: 'immediate' | 'short-term' | 'long-term';
  };
}

export type InsightType = 'prediction' | 'anomaly' | 'trend' | 'recommendation' | 'warning' | 'pattern' | 'opportunity' | 'risk';
export type InsightCategory = 'team-health' | 'communication' | 'productivity' | 'sentiment' | 'workload' | 'collaboration' | 'engagement';

/**
 * 証拠データ
 */
export interface Evidence {
  /** 証拠ID */
  id: string;
  /** タイプ */
  type: EvidenceType;
  /** 説明 */
  description: string;
  /** データ値 */
  value: number | string;
  /** 単位 */
  unit?: string;
  /** 重要度 */
  weight: number; // 0-1
  /** ソース */
  source: string;
  /** 時刻 */
  timestamp: Date;
  /** 信頼度 */
  confidence: number;
}

export type EvidenceType = 'metric' | 'pattern' | 'anomaly' | 'correlation' | 'statistical' | 'behavioral' | 'temporal' | 'comparative' | 'predictive';

/**
 * 推奨事項
 */
export interface Recommendation {
  /** 推奨事項ID */
  id: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description: string;
  /** タイプ */
  type: RecommendationType;
  /** 優先度 */
  priority: Priority;
  /** カテゴリ */
  category: 'communication' | 'workload' | 'team-health' | 'process';
  /** 対象メンバー */
  targetMembers?: string[];
  /** 推定効果 */
  estimatedImpact: number; // 0-100
  /** 実装難易度 */
  implementationDifficulty: EffortLevel;
  /** 期待される結果 */
  expectedOutcome: string;
  /** アクションアイテム */
  actionItems: string[];
  /** 作成日時 */
  createdAt: Date;
  /** 努力レベル */
  effort: EffortLevel;
  /** 影響レベル */
  impact: ImpactLevel;
  /** タイムライン */
  timeline: Timeline;
  /** ステップ */
  steps: ActionStep[];
  /** メトリクス */
  metrics: string[];
  /** タグ */
  tags: string[];
}

export type RecommendationType = 'process' | 'policy' | 'tool' | 'training' | 'communication';
export type EffortLevel = 'low' | 'medium' | 'high';
export type ImpactLevel = 'low' | 'medium' | 'high';

/**
 * タイムライン
 */
export interface Timeline {
  start?: Date;
  end?: Date;
  duration: number; // days
  milestones: Milestone[];
}

/**
 * マイルストーン
 */
export interface Milestone {
  name: string;
  date: Date;
  description: string;
  isCompleted: boolean;
}

/**
 * アクションステップ
 */
export interface ActionStep {
  id: string;
  title: string;
  description: string;
  assignee?: string;
  dueDate?: Date;
  status: ActionStatus;
  dependencies: string[];
}

export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';

// ===== ヒートマップ関連 =====

/**
 * ヒートマップデータの基本構造
 */
export interface HeatmapData {
  /** X軸の値（通常はユーザー名やID） */
  x: string;
  /** Y軸の値（通常はユーザー名やID） */
  y: string;
  /** データの値（対話回数、頻度など） */
  value: number;
  /** 追加のメタデータ */
  metadata?: {
    /** 最後の対話日時 */
    lastInteraction?: Date;
    /** 対話の種類 */
    interactionType?: 'message' | 'reaction' | 'mention' | 'reply';
    /** 対話の品質スコア */
    qualityScore?: number;
    /** 対話の感情スコア */
    sentimentScore?: number;
  };
}

/**
 * ヒートマップの設定オプション
 */
export interface HeatmapOptions {
  /** 表示する最大ユーザー数 */
  maxUsers?: number;
  /** データの集計期間 */
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  /** 色のスケール設定 */
  colorScale?: {
    min: string;
    max: string;
    steps: number;
  };
  /** フィルタリング条件 */
  filters?: {
    /** 最小値フィルター */
    minValue?: number;
    /** 最大値フィルター */
    maxValue?: number;
    /** 除外するユーザー */
    excludeUsers?: string[];
    /** 含めるユーザーのみ */
    includeUsersOnly?: string[];
  };
}

/**
 * ヒートマップの統計情報
 */
export interface HeatmapStats {
  /** 総データ数 */
  totalDataPoints: number;
  /** 最大値 */
  maxValue: number;
  /** 最小値 */
  minValue: number;
  /** 平均値 */
  averageValue: number;
  /** 中央値 */
  medianValue: number;
  /** ユーザー数 */
  userCount: number;
  /** 対話が発生しているペア数 */
  activeInteractionPairs: number;
}

/**
 * 関係性分析の結果
 */
export interface RelationshipAnalysis {
  /** ヒートマップデータ */
  heatmapData: HeatmapData[];
  /** 統計情報 */
  stats: HeatmapStats;
  /** 最も活発な関係性 */
  topInteractions: {
    userPair: [string, string];
    value: number;
    rank: number;
  }[];
  /** 孤立しているユーザー */
  isolatedUsers: {
    userId: string;
    interactionCount: number;
    lastInteraction?: Date;
  }[];
  /** チーム内のクラスター */
  clusters: {
    id: string;
    members: string[];
    cohesionScore: number;
    averageInteractionRate: number;
  }[];
  /** 分析実行時刻 */
  analyzedAt: Date;
  /** 分析対象期間 */
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * ヒートマップコンポーネントのプロパティ
 */
export interface HeatmapComponentProps {
  /** ヒートマップデータ */
  data: HeatmapData[];
  /** 表示オプション */
  options?: HeatmapOptions;
  /** クリック時のコールバック */
  onCellClick?: (data: HeatmapData) => void;
  /** ホバー時のコールバック */
  onCellHover?: (data: HeatmapData | null) => void;
  /** ローディング状態 */
  loading?: boolean;
  /** エラー状態 */
  error?: string;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * ネットワーク図のノード
 */
export interface NetworkNode {
  /** ノードID */
  id: string;
  /** 表示名 */
  label: string;
  /** ノードのサイズ（重要度を表す） */
  size: number;
  /** ノードの色 */
  color?: string;
  /** ノードのグループ */
  group?: string;
  /** 追加のメタデータ */
  metadata?: {
    role?: string;
    department?: string;
    activityLevel?: number;
    centralityScore?: number;
  };
}

/**
 * ネットワーク図のエッジ（接続線）
 */
export interface NetworkEdge {
  /** エッジID */
  id: string;
  /** 開始ノード */
  source: string;
  /** 終了ノード */
  target: string;
  /** エッジの重み（太さ） */
  weight: number;
  /** エッジの色 */
  color?: string;
  /** エッジのタイプ */
  type?: 'directed' | 'undirected';
  /** 追加のメタデータ */
  metadata?: {
    interactionType?: string;
    strength?: number;
    frequency?: number;
  };
}

/**
 * ネットワーク図のデータ
 */
export interface NetworkData {
  /** ノードの配列 */
  nodes: NetworkNode[];
  /** エッジの配列 */
  edges: NetworkEdge[];
  /** ネットワークの統計情報 */
  stats?: {
    nodeCount: number;
    edgeCount: number;
    density: number;
    averageDegree: number;
    clusteringCoefficient: number;
  };
}

// ===== 統計・分析関連 =====

/**
 * 時系列データ
 */
export interface TimeSeriesData {
  /** 時刻 */
  timestamp: Date;
  /** 値 */
  value: number;
  /** ラベル */
  label?: string;
  /** メタデータ */
  metadata?: {
    [key: string]: any;
  };
}

/**
 * 統計サマリー
 */
export interface StatsSummary {
  /** 合計 */
  total: number;
  /** 平均 */
  average: number;
  /** 中央値 */
  median: number;
  /** 最大値 */
  max: number;
  /** 最小値 */
  min: number;
  /** 標準偏差 */
  standardDeviation: number;
  /** データポイント数 */
  count: number;
}

/**
 * トレンド情報
 */
export interface TrendInfo {
  /** 方向 */
  direction: TrendDirection;
  /** 変化率（パーセント） */
  changePercentage: number;
  /** 信頼度 */
  confidence: number;
  /** 期間 */
  period: string;
}

export type TrendDirection = 'up' | 'down' | 'stable' | 'volatile';

/**
 * 分析データ
 */
export interface AnalyticsData {
  timeRange: TimeRange;
  metrics: Metrics;
  insights: Insight[];
  recommendations: Recommendation[];
  alerts: Alert[];
  trends: Trend[];
  comparisons: Comparison[];
}

/**
 * 時間範囲
 */
export interface TimeRange {
  start: Date;
  end: Date;
  granularity: TimeGranularity;
}

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * メトリクス
 */
export interface Metrics {
  communication: CommunicationMetrics;
  engagement: EngagementMetrics;
  productivity: ProductivityMetrics;
  wellbeing: WellbeingMetrics;
  collaboration: CollaborationMetrics;
}

/**
 * コミュニケーションメトリクス
 */
export interface CommunicationMetrics {
  totalMessages: number;
  averageResponseTime: number;
  messageFrequency: FrequencyData[];
  channelActivity: ChannelActivityData[];
  userActivity: UserActivityData[];
}

/**
 * エンゲージメントメトリクス
 */
export interface EngagementMetrics {
  activeUsers: number;
  engagementRate: number;
  reactionCount: number;
  threadParticipation: number;
  shareRate: number;
}

/**
 * 生産性メトリクス
 */
export interface ProductivityMetrics {
  tasksCompleted: number;
  meetingEfficiency: number;
  decisionSpeed: number;
  blockerResolution: number;
  knowledgeSharing: number;
}

/**
 * ウェルビーイングメトリクス
 */
export interface WellbeingMetrics {
  overworkRisk: RiskLevel[];
  sentimentScore: number;
  stressIndicators: StressIndicator[];
  workLifeBalance: number;
  burnoutRisk: RiskLevel[];
}

/**
 * コラボレーションメトリクス
 */
export interface CollaborationMetrics {
  crossTeamInteraction: number;
  knowledgeFlow: number;
  mentorshipActivity: number;
  innovationIndex: number;
  teamCohesion: number;
}

/**
 * 頻度データ
 */
export interface FrequencyData {
  timestamp: Date;
  count: number;
  users: string[];
}

/**
 * チャンネルアクティビティデータ
 */
export interface ChannelActivityData {
  channelId: string;
  channelName: string;
  messageCount: number;
  activeUsers: number;
  engagementRate: number;
  averageResponseTime: number;
}

/**
 * ユーザーアクティビティデータ
 */
export interface UserActivityData {
  userId: string;
  userName: string;
  messageCount: number;
  responseTime: number;
  engagementScore: number;
  sentimentScore: number;
  riskLevel: RiskLevel;
}

/**
 * リスクレベル
 */
export interface RiskLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: string[];
  recommendations: string[];
}

/**
 * ストレス指標
 */
export interface StressIndicator {
  type: StressType;
  value: number;
  threshold: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export type StressType = 'message_frequency' | 'response_pressure' | 'after_hours' | 'multitasking' | 'interruptions';

/**
 * トレンド
 */
export interface Trend {
  metric: string;
  timeRange: TimeRange;
  dataPoints: DataPoint[];
  direction: TrendDirection;
  strength: number;
  significance: number;
  forecast?: Forecast;
}

/**
 * データポイント
 */
export interface DataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

/**
 * 予測
 */
export interface Forecast {
  dataPoints: DataPoint[];
  confidence: number;
  method: ForecastMethod;
  accuracy?: number;
}

export type ForecastMethod = 'linear' | 'exponential' | 'seasonal' | 'ml';

/**
 * 比較
 */
export interface Comparison {
  type: ComparisonType;
  baseline: ComparisonPeriod;
  current: ComparisonPeriod;
  metrics: ComparisonMetric[];
  insights: string[];
}

export type ComparisonType = 'period' | 'cohort' | 'segment' | 'benchmark';

/**
 * 比較期間
 */
export interface ComparisonPeriod {
  name: string;
  timeRange: TimeRange;
  description?: string;
}

/**
 * 比較メトリクス
 */
export interface ComparisonMetric {
  name: string;
  baselineValue: number;
  currentValue: number;
  change: number;
  changePercent: number;
  significance: number;
  trend: TrendDirection;
}

// ===== 設定・構成関連 =====

/**
 * アプリケーション設定
 */
export interface AppSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  privacy: PrivacySettings;
  integrations: IntegrationSettings;
  advanced: AdvancedSettings;
}

/**
 * 一般設定
 */
export interface GeneralSettings {
  timezone: Timezone;
  language: Language;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  weekStart: DayOfWeek;
}

export type DateFormat = 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'DD.MM.YYYY';
export type TimeFormat = '24h' | '12h';

/**
 * 外観設定
 */
export interface AppearanceSettings {
  theme: Theme;
  density: DisplayDensity;
  fontSize: FontSize;
  colorScheme?: string;
  customCSS?: string;
}

export type DisplayDensity = 'compact' | 'comfortable' | 'spacious';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

/**
 * プライバシー設定
 */
export interface PrivacySettings {
  dataRetention: DataRetentionSettings;
  analytics: AnalyticsPrivacySettings;
  sharing: SharingSettings;
}

/**
 * データ保持設定
 */
export interface DataRetentionSettings {
  messages: number; // days
  analytics: number; // days
  logs: number; // days
  autoDelete: boolean;
}

/**
 * 分析プライバシー設定
 */
export interface AnalyticsPrivacySettings {
  allowUsageTracking: boolean;
  allowPerformanceTracking: boolean;
  allowErrorReporting: boolean;
  anonymizeData: boolean;
}

/**
 * 共有設定
 */
export interface SharingSettings {
  allowDataExport: boolean;
  allowPublicSharing: boolean;
  requireApproval: boolean;
  watermarkReports: boolean;
}

/**
 * 統合設定
 */
export interface IntegrationSettings {
  slack: SlackIntegrationConfig;
  teams: TeamsIntegrationConfig;
  chatwork: ChatworkIntegrationConfig;
  lineWorks: LineWorksIntegrationConfig;
  email: EmailIntegrationConfig;
  webhook: WebhookIntegrationConfig;
  api: APIIntegrationConfig;
}

/**
 * Slack統合設定
 */
export interface SlackIntegrationConfig {
  enabled: boolean;
  botToken?: string;
  userToken?: string;
  signingSecret?: string;
  webhookUrl?: string;
  defaultChannel?: string;
  syncInterval: number; // minutes
  features: SlackFeature[];
}

export type SlackFeature = 'messages' | 'reactions' | 'threads' | 'files' | 'users' | 'channels';

/**
 * Teams統合設定
 */
export interface TeamsIntegrationConfig {
  enabled: boolean;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  webhookUrl?: string;
  syncInterval: number; // minutes
  features: TeamsFeature[];
}

export type TeamsFeature = 'messages' | 'meetings' | 'files' | 'calls' | 'presence';

/**
 * ChatWork統合設定
 */
export interface ChatworkIntegrationConfig {
  enabled: boolean;
  apiToken?: string;
  roomId?: string;
  syncInterval: number; // minutes
  features: ChatworkFeature[];
}

export type ChatworkFeature = 'messages' | 'tasks' | 'files' | 'contacts';

/**
 * LINE WORKS統合設定
 */
export interface LineWorksIntegrationConfig {
  enabled: boolean;
  botToken?: string;
  domainId?: string;
  syncInterval: number; // minutes
  features: LineWorksFeature[];
}

export type LineWorksFeature = 'messages' | 'calendar' | 'drive' | 'contacts';

/**
 * メール統合設定
 */
export interface EmailIntegrationConfig {
  enabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  username?: string;
  password?: string;
  fromAddress?: string;
  templates: EmailTemplate[];
}

/**
 * メールテンプレート
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: EmailTemplateType;
}

export type EmailTemplateType = 'alert' | 'digest' | 'report' | 'invitation' | 'notification';

/**
 * Webhook統合設定
 */
export interface WebhookIntegrationConfig {
  enabled: boolean;
  endpoints: WebhookEndpoint[];
  retryPolicy: RetryPolicy;
  security: WebhookSecurity;
}

/**
 * Webhookエンドポイント
 */
export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  method: HTTPMethod;
  headers: Record<string, string>;
  events: WebhookEvent[];
  enabled: boolean;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type WebhookEvent = 'alert' | 'insight' | 'user_activity' | 'channel_activity' | 'system';

/**
 * リトライポリシー
 */
export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: BackoffStrategy;
  timeout: number; // seconds
}

export type BackoffStrategy = 'fixed' | 'exponential' | 'linear';

/**
 * Webhookセキュリティ
 */
export interface WebhookSecurity {
  signatureHeader?: string;
  secret?: string;
  algorithm: SignatureAlgorithm;
}

export type SignatureAlgorithm = 'sha1' | 'sha256' | 'sha512';

/**
 * API統合設定
 */
export interface APIIntegrationConfig {
  enabled: boolean;
  rateLimit: RateLimitConfig;
  authentication: AuthenticationConfig;
  cors: CORSConfig;
}

/**
 * レート制限設定
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

/**
 * 認証設定
 */
export interface AuthenticationConfig {
  methods: AuthMethod[];
  tokenExpiry: number; // seconds
  refreshEnabled: boolean;
}

export type AuthMethod = 'api_key' | 'oauth2' | 'jwt' | 'basic';

/**
 * CORS設定
 */
export interface CORSConfig {
  enabled: boolean;
  allowedOrigins: string[];
  allowedMethods: HTTPMethod[];
  allowedHeaders: string[];
  credentials: boolean;
}

/**
 * 高度な設定
 */
export interface AdvancedSettings {
  debug: DebugSettings;
  performance: PerformanceSettings;
  experimental: ExperimentalSettings;
}

/**
 * デバッグ設定
 */
export interface DebugSettings {
  enabled: boolean;
  logLevel: LogLevel;
  includeStackTrace: boolean;
  maxLogSize: number; // MB
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * パフォーマンス設定
 */
export interface PerformanceSettings {
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
  compressionEnabled: boolean;
  lazyLoading: boolean;
  batchSize: number;
}

/**
 * 実験的機能設定
 */
export interface ExperimentalSettings {
  features: ExperimentalFeature[];
  aiModels: AIModelConfig[];
}

/**
 * 実験的機能
 */
export interface ExperimentalFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  beta: boolean;
}

/**
 * AIモデル設定
 */
export interface AIModelConfig {
  id: string;
  name: string;
  type: AIModelType;
  endpoint?: string;
  apiKey?: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

export type AIModelType = 'sentiment' | 'classification' | 'prediction' | 'generation' | 'embedding';

// ===== API・レスポンス関連 =====

/**
 * APIレスポンス
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | APIError;
  metadata?: ResponseMetadata;
}

/**
 * APIエラー
 */
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * レスポンスメタデータ
 */
export interface ResponseMetadata {
  timestamp: Date;
  requestId: string;
  version: string;
  pagination?: PaginationInfo;
  rateLimit?: RateLimitInfo;
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * レート制限情報
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

// ===== イベント関連 =====

/**
 * システムイベント
 */
export interface SystemEvent {
  id: string;
  type: EventType;
  source: EventSource;
  timestamp: Date;
  data: Record<string, any>;
  metadata: EventMetadata;
}

export type EventType = 
  | 'user.login' | 'user.logout' | 'user.created' | 'user.updated' | 'user.deleted'
  | 'message.sent' | 'message.edited' | 'message.deleted' | 'message.reacted'
  | 'channel.created' | 'channel.updated' | 'channel.deleted' | 'channel.joined' | 'channel.left'
  | 'team.created' | 'team.updated' | 'team.deleted' | 'team.member_added' | 'team.member_removed'
  | 'alert.triggered' | 'alert.acknowledged' | 'alert.resolved'
  | 'insight.generated' | 'recommendation.created' | 'recommendation.completed'
  | 'integration.connected' | 'integration.disconnected' | 'integration.error'
  | 'system.startup' | 'system.shutdown' | 'system.error';

export type EventSource = 'web' | 'mobile' | 'api' | 'integration' | 'system' | 'ai';

/**
 * イベントメタデータ
 */
export interface EventMetadata {
  userId?: string;
  teamId?: string;
  channelId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  version?: string;
}

// ===== 拡張型定義 =====

/**
 * チーム分析データにヒートマップ情報を追加
 */
export interface EnhancedTeamAnalysis extends TeamAnalysis {
  /** 関係性分析結果 */
  relationshipAnalysis?: RelationshipAnalysis;
  /** ネットワーク図データ */
  networkData?: NetworkData;
}

/**
 * ダッシュボードデータにヒートマップ情報を追加
 */
export interface EnhancedDashboardData extends DashboardData {
  /** 関係性ヒートマップデータ */
  relationshipHeatmap?: HeatmapData[];
  /** ネットワーク図データ */
  teamNetwork?: NetworkData;
}

// ===== エンティティ型ユニオン =====

export type Entity = User | Team | Channel | Message | Alert | Insight | Recommendation;
export type EntityType = 'user' | 'team' | 'channel' | 'message' | 'alert' | 'insight' | 'recommendation';

// ===== 型ガード関数 =====

export const isUser = (entity: any): entity is User => {
  return entity && typeof entity.id === 'string' && typeof entity.name === 'string' && typeof entity.email === 'string';
};

export const isTeam = (entity: any): entity is Team => {
  return entity && typeof entity.id === 'string' && typeof entity.name === 'string' && Array.isArray(entity.members);
};

export const isChannel = (entity: any): entity is Channel => {
  return entity && typeof entity.id === 'string' && typeof entity.name === 'string' && typeof entity.type === 'string';
};

export const isMessage = (entity: any): entity is Message => {
  return entity && typeof entity.id === 'string' && typeof entity.content === 'string' && entity.timestamp instanceof Date;
};

export const isAlert = (entity: any): entity is Alert => {
  return entity && typeof entity.id === 'string' && typeof entity.type === 'string' && typeof entity.severity === 'string';
};

export const isInsight = (entity: any): entity is Insight => {
  return entity && typeof entity.id === 'string' && typeof entity.type === 'string' && typeof entity.category === 'string';
};

export const isRecommendation = (entity: any): entity is Recommendation => {
  return entity && typeof entity.id === 'string' && typeof entity.title === 'string' && typeof entity.priority === 'string';
};

// ===== 定数 =====

export const DEFAULT_PAGINATION_SIZE = 20;
export const MAX_PAGINATION_SIZE = 100;
export const DEFAULT_CACHE_TTL = 300; // 5 minutes
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// ===== エラーコード =====

export enum ErrorCode {
  // 認証・認可
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // バリデーション
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // リソース
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  
  // サブスクリプション
  SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  PLAN_NOT_FOUND = 'PLAN_NOT_FOUND',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  
  // システム
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // 統合
  INTEGRATION_ERROR = 'INTEGRATION_ERROR',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

// ===== バリデーション関数 =====

/**
 * メールアドレスの妥当性をチェック
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * パスワードの強度をチェック
 */
export const isStrongPassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

/**
 * URLの妥当性をチェック
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 日付範囲の妥当性をチェック
 */
export const isValidDateRange = (start: Date, end: Date): boolean => {
  return start <= end && start <= new Date() && end <= new Date();
};

// ===== ユーティリティ関数 =====

/**
 * 健全性スコアの色を取得
 */
export const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
};

/**
 * 優先度の数値を取得
 */
export const getPriorityValue = (priority: Priority): number => {
  const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 };
  return priorityMap[priority];
};

/**
 * 相対時間の文字列を取得
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'たった今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  
  return date.toLocaleDateString('ja-JP');
};

/**
 * ファイルサイズの文字列を取得
 */
export const formatFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${Math.round(size * 100) / 100} ${sizes[i]}`;
};

/**
 * パーセンテージの文字列を取得
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * 通貨フォーマット関数
 */
export const formatCurrency = (amount: number, currency: string = 'JPY'): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * 使用量パーセンテージの計算
 */
export const calculateUsagePercentage = (used: number, limit: number): number => {
  if (limit === 0) return 0;
  return Math.min((used / limit) * 100, 100);
};

/**
 * プランの価格比較
 */
export const comparePlanPrices = (plan1: SubscriptionPlan, plan2: SubscriptionPlan): number => {
  // 年間プランは月額換算で比較
  const price1 = plan1.interval === 'yearly' ? plan1.price / 12 : plan1.price;
  const price2 = plan2.interval === 'yearly' ? plan2.price / 12 : plan2.price;
  return price1 - price2;
};

/**
 * 使用量の危険度レベル取得
 */
export const getUsageRiskLevel = (percentage: number): 'safe' | 'warning' | 'danger' => {
  if (percentage >= 90) return 'danger';
  if (percentage >= 75) return 'warning';
  return 'safe';
};

// ===== デフォルト値 =====

/**
 * デフォルトのユーザー設定 (settings用)
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    push: true,
    weekly: true,
    slack: false,
  },
  privacy: {
    profileVisible: true,
    analyticsSharing: true,
    dataExport: false,
  },
  preferences: {
    theme: 'system',
    language: 'ja',
    timezone: 'Asia/Tokyo',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
  },
  integrations: {
    slack: false,
    teams: false,
    email: true,
  },
  advanced: {
    debugMode: false,
    betaFeatures: false,
    apiAccess: false,
  },
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  timezone: 'Asia/Tokyo',
  language: 'ja',
  notificationSettings: {
    email: true,
    push: true,
    slack: false,
  },
  theme: 'system',
};

export const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  isPublic: false,
  allowGuestAccess: false,
  notificationSettings: {
    channels: [],
    rules: [],
    schedule: {
      enabled: true,
      quietHours: { start: '22:00', end: '08:00', enabled: true },
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timezone: 'Asia/Tokyo',
    },
    preferences: {
      digest: {
        enabled: true,
        frequency: 'daily',
        time: '09:00',
        includeSummary: true,
        includeInsights: true,
        includeRecommendations: true,
      },
      realtime: {
        enabled: true,
        severityThreshold: 'warning',
        channels: ['push'],
        grouping: { enabled: true, timeWindow: 5, maxItems: 3 },
      },
      escalation: { enabled: false, levels: [] },
    },
  },
  workingHours: {
    timezone: 'Asia/Tokyo',
    schedule: {
      monday: { enabled: true, start: '09:00', end: '18:00' },
      tuesday: { enabled: true, start: '09:00', end: '18:00' },
      wednesday: { enabled: true, start: '09:00', end: '18:00' },
      thursday: { enabled: true, start: '09:00', end: '18:00' },
      friday: { enabled: true, start: '09:00', end: '18:00' },
      saturday: { enabled: false, start: '09:00', end: '18:00' },
      sunday: { enabled: false, start: '09:00', end: '18:00' },
    },
  },
  holidays: [],
};

export const DEFAULT_HEATMAP_OPTIONS: HeatmapOptions = {
  maxUsers: 20,
  period: 'week',
  colorScale: {
    min: '#f0f9ff',
    max: '#1e40af',
    steps: 5,
  },
  filters: {
    minValue: 0,
  },
};

/**
 * デフォルトのサブスクリプションプラン制限
 */
export const DEFAULT_PLAN_LIMITS = {
  free: {
    teams: 1,
    members: 5,
    storage: 1, // GB
    apiCalls: 1000,
    messageAnalysis: 100,
  },
  basic: {
    teams: 3,
    members: 25,
    storage: 10, // GB
    apiCalls: 10000,
    messageAnalysis: 1000,
  },
  professional: {
    teams: 10,
    members: 100,
    storage: 50, // GB
    apiCalls: 50000,
    messageAnalysis: 5000,
  },
  enterprise: {
    teams: -1, // unlimited
    members: -1, // unlimited
    storage: -1, // unlimited
    apiCalls: -1, // unlimited
    messageAnalysis: -1, // unlimited
  },
};

/**
 * デフォルトの使用量メトリクス
 */
export const DEFAULT_USAGE_METRICS: Partial<UsageMetrics> = {
  apiCalls: 0,
  teams: 0,
  members: 0,
  storage: 0,
  messageAnalysis: 0,
  currentPeriod: 0,
  previousPeriod: 0,
  period: 'current_month',
  periodStart: new Date().toISOString().slice(0, 10),
  periodEnd: new Date().toISOString().slice(0, 10),
};

/**
 * デフォルトの請求書設定
 */
export const DEFAULT_INVOICE_CONFIG = {
  currency: 'JPY',
  taxRate: 0.1, // 10%
  paymentTerms: 30, // days
  reminderDays: [7, 3, 1], // days before due date
};

// ===== サブスクリプション関連の追加型定義 =====

/**
 * プラン比較データ
 */
export interface PlanComparison {
  plans: SubscriptionPlan[];
  features: FeatureComparison[];
  recommendations: {
    bestValue: string;
    mostPopular: string;
    enterprise: string;
  };
}

/**
 * 機能比較
 */
export interface FeatureComparison {
  name: string;
  description: string;
  category: string;
  plans: {
    [planId: string]: boolean | string | number;
  };
}

/**
 * 使用量アラート設定
 */
export interface UsageAlertConfig {
  id: string;
  metric: keyof UsageMetrics;
  threshold: number; // percentage (0-100)
  enabled: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    slack: boolean;
  };
  frequency: 'once' | 'daily' | 'weekly';
  lastTriggered?: Date;
}

/**
 * 課金履歴
 */
export interface BillingHistory {
  invoices: Invoice[];
  payments: PaymentHistory[];
  refunds: RefundHistory[];
  credits: CreditHistory[];
  totalSpent: number;
  averageMonthlySpend: number;
  paymentMethods: PaymentMethod[];
}

/**
 * 支払い履歴
 */
export interface PaymentHistory {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'cancelled';
  paymentMethod: PaymentMethod;
  processedAt: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

/**
 * 返金履歴
 */
export interface RefundHistory {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  requestedAt: Date;
  processedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * クレジット履歴
 */
export interface CreditHistory {
  id: string;
  amount: number;
  currency: string;
  type: 'promotional' | 'refund' | 'adjustment' | 'compensation';
  description: string;
  appliedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * サブスクリプション変更履歴
 */
export interface SubscriptionChangeHistory {
  id: string;
  type: 'plan_change' | 'cancellation' | 'reactivation' | 'pause' | 'resume';
  fromPlan?: SubscriptionPlan;
  toPlan?: SubscriptionPlan;
  effectiveDate: Date;
  reason?: string;
  prorationAmount?: number;
  initiatedBy: string;
  metadata?: Record<string, any>;
}

/**
 * 使用量予測
 */
export interface UsageForecast {
  metric: keyof UsageMetrics;
  currentUsage: number;
  projectedUsage: number;
  projectedDate: Date;
  confidence: number; // 0-100
  factors: string[];
  recommendations: string[];
}

/**
 * コスト分析
 */
export interface CostAnalysis {
  currentPeriod: {
    cost: number;
    usage: UsageMetrics;
    efficiency: number; // cost per unit
  };
  previousPeriod: {
    cost: number;
    usage: UsageMetrics;
    efficiency: number;
  };
  trends: {
    costTrend: 'increasing' | 'decreasing' | 'stable';
    usageTrend: 'increasing' | 'decreasing' | 'stable';
    efficiencyTrend: 'improving' | 'declining' | 'stable';
  };
  projections: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
  };
  optimizations: CostOptimization[];
}

/**
 * コスト最適化提案
 */
export interface CostOptimization {
  id: string;
  title: string;
  description: string;
  type: 'plan_change' | 'usage_optimization' | 'feature_adjustment';
  potentialSavings: number;
  effort: EffortLevel;
  impact: ImpactLevel;
  steps: string[];
  risks: string[];
}

// ===== エクスポート関数の追加 =====

/**
 * デフォルトユーザー設定を取得
 */
export const getDefaultUserSettings = (): UserSettings => {
  return { ...DEFAULT_USER_SETTINGS };
};

/**
 * 空のユーザー設定を作成
 */
export const createEmptyUserSettings = (): UserSettings => {
  return {
    notifications: {
      email: false,
      push: false,
      weekly: false,
      slack: false,
    },
    privacy: {
      profileVisible: false,
      analyticsSharing: false,
      dataExport: false,
    },
    preferences: {
      theme: 'light',
      language: 'ja',
      timezone: 'Asia/Tokyo',
    },
  };
};

/**
 * ユーザー設定をマージ
 */
export const mergeUserSettings = (
  existing: Partial<UserSettings>, 
  updates: Partial<UserSettings>
): UserSettings => {
  return {
    notifications: { ...DEFAULT_USER_SETTINGS.notifications, ...existing.notifications, ...updates.notifications },
    privacy: { ...DEFAULT_USER_SETTINGS.privacy, ...existing.privacy, ...updates.privacy },
    preferences: { ...DEFAULT_USER_SETTINGS.preferences, ...existing.preferences, ...updates.preferences },
    integrations: { ...DEFAULT_USER_SETTINGS.integrations, ...existing.integrations, ...updates.integrations },
    advanced: { ...DEFAULT_USER_SETTINGS.advanced, ...existing.advanced, ...updates.advanced },
  };
};

/**
 * 設定の妥当性をチェック
 */
export const validateUserSettings = (settings: UserSettings): boolean => {
  try {
    // 必須フィールドの存在チェック
    if (!settings.notifications || !settings.privacy || !settings.preferences) {
      return false;
    }

    // 型チェック
    if (typeof settings.notifications.email !== 'boolean' ||
        typeof settings.notifications.push !== 'boolean' ||
        typeof settings.notifications.weekly !== 'boolean') {
      return false;
    }

    if (typeof settings.privacy.profileVisible !== 'boolean' ||
        typeof settings.privacy.analyticsSharing !== 'boolean') {
      return false;
    }

    // 言語とタイムゾーンの妥当性チェック
    const validLanguages: Language[] = ['ja', 'en', 'zh', 'ko'];
    const validTimezones: Timezone[] = ['Asia/Tokyo', 'America/New_York', 'Europe/London', 'Asia/Shanghai'];
    
    if (!validLanguages.includes(settings.preferences.language) ||
        !validTimezones.includes(settings.preferences.timezone)) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};
