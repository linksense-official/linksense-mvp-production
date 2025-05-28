// src/types/subscription.ts
// 購読・サブスクリプション関連の型定義

import type { User, Team, Channel } from './index';

// ===== 基本購読型 =====

export interface Subscription {
  id: string;
  userId: string;
  type: SubscriptionType;
  status: SubscriptionStatus;
  config: SubscriptionConfig;
  metadata: SubscriptionMetadata;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  lastNotificationAt?: Date;
}

export type SubscriptionType = 
  | 'push_notification'
  | 'email_digest'
  | 'slack_integration'
  | 'teams_integration'
  | 'webhook'
  | 'sms'
  | 'real_time_updates'
  | 'analytics_report'
  | 'alert_monitoring';

export type SubscriptionStatus = 
  | 'active'
  | 'paused'
  | 'expired'
  | 'cancelled'
  | 'pending_verification'
  | 'failed';

export interface SubscriptionConfig {
  enabled: boolean;
  frequency: NotificationFrequency;
  filters: SubscriptionFilter[];
  channels: string[];
  preferences: SubscriptionPreferences;
  throttling: ThrottlingConfig;
}

export type NotificationFrequency = 
  | 'real_time'
  | 'every_5_minutes'
  | 'every_15_minutes'
  | 'every_30_minutes'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly';

export interface SubscriptionFilter {
  type: FilterType;
  field: string;
  operator: FilterOperator;
  value: any;
  enabled: boolean;
}

export type FilterType = 
  | 'include'
  | 'exclude'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'regex'
  | 'range';

export type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'not_contains';

export interface SubscriptionPreferences {
  quietHours: QuietHoursConfig;
  grouping: GroupingConfig;
  formatting: FormattingConfig;
  delivery: DeliveryConfig;
}

export interface QuietHoursConfig {
  enabled: boolean;
  timezone: string;
  periods: QuietPeriod[];
  emergencyOverride: boolean;
}

export interface QuietPeriod {
  id: string;
  name: string;
  start: string; // HH:mm format
  end: string;   // HH:mm format
  days: DayOfWeek[];
  enabled: boolean;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface GroupingConfig {
  enabled: boolean;
  timeWindow: number; // minutes
  maxItems: number;
  strategy: GroupingStrategy;
}

export type GroupingStrategy = 
  | 'by_source'
  | 'by_type'
  | 'by_priority'
  | 'by_channel'
  | 'by_time'
  | 'intelligent';

export interface FormattingConfig {
  template: NotificationTemplate;
  includeMetadata: boolean;
  includeActions: boolean;
  maxLength?: number;
  truncateStrategy: TruncateStrategy;
}

export type TruncateStrategy = 'end' | 'middle' | 'smart' | 'none';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: SubscriptionType;
  subject?: string;
  body: string;
  variables: TemplateVariable[];
  format: TemplateFormat;
}

export type TemplateFormat = 'plain' | 'html' | 'markdown' | 'json';

export interface TemplateVariable {
  name: string;
  type: VariableType;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export type VariableType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

export interface DeliveryConfig {
  retryPolicy: RetryPolicy;
  failureHandling: FailureHandling;
  confirmationRequired: boolean;
  trackingEnabled: boolean;
}

export interface RetryPolicy {
  enabled: boolean;
  maxRetries: number;
  backoffStrategy: BackoffStrategy;
  retryDelays: number[]; // seconds
  giveUpAfter: number; // hours
}

export type BackoffStrategy = 'fixed' | 'linear' | 'exponential' | 'custom';

export interface FailureHandling {
  onFailure: FailureAction;
  fallbackChannels: string[];
  escalationEnabled: boolean;
  escalationDelay: number; // minutes
}

export type FailureAction = 
  | 'retry'
  | 'fallback'
  | 'escalate'
  | 'log_only'
  | 'disable_subscription';

export interface ThrottlingConfig {
  enabled: boolean;
  maxPerMinute: number;
  maxPerHour: number;
  maxPerDay: number;
  burstLimit: number;
  cooldownPeriod: number; // seconds
}

export interface SubscriptionMetadata {
  source: SubscriptionSource;
  version: string;
  tags: string[];
  customFields: Record<string, any>;
  analytics: SubscriptionAnalytics;
  lastError?: SubscriptionError;
}

export type SubscriptionSource = 
  | 'user_created'
  | 'system_generated'
  | 'imported'
  | 'api'
  | 'webhook'
  | 'migration';

export interface SubscriptionAnalytics {
  totalNotifications: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number; // milliseconds
  lastDeliveryAt?: Date;
  engagementRate: number; // 0-1
  clickThroughRate: number; // 0-1
}

export interface SubscriptionError {
  code: string;
  message: string;
  timestamp: Date;
  retryCount: number;
  details?: Record<string, any>;
}

// ===== Stripe関連型定義（追加） =====

/**
 * Stripeプラン
 */
export interface StripePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: BillingInterval;
  currency: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  features: string[];
  limits?: {
    teams?: number; // -1 = unlimited
    members?: number; // -1 = unlimited
    storage?: number; // GB, -1 = unlimited
    apiCalls?: number; // -1 = unlimited
    messageAnalysis?: number; // -1 = unlimited
  };
  isPopular?: boolean;
  isRecommended?: boolean;
  yearlyDiscount?: number; // 0.0 - 1.0
  nextBillingDate?: Date;
  trialEndsAt?: Date;
  stripeProductId?: string;
  stripePriceId?: string;
}

/**
 * 課金間隔
 */
export type BillingInterval = 'monthly' | 'yearly';

/**
 * 価格表示
 */
export interface PriceDisplay {
  amount: number;
  currency: string;
  interval: BillingInterval;
  formatted: string;
  originalAmount?: number;
  discountPercentage?: number;
}

/**
 * プラン比較
 */
export interface PlanComparison {
  plans: StripePlan[];
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
 * Stripeサブスクリプション状態
 */
export interface StripeSubscriptionState {
  subscriptionId?: string;
  customerId?: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  plan: StripePlan;
  paymentMethod?: PaymentMethod;
  lastInvoice?: Invoice;
  nextInvoice?: Partial<Invoice>;
}

// ===== プッシュ通知専用型 =====

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: PushKeys;
  userAgent: string;
  platform: Platform;
  isActive: boolean;
  permissions: PushPermissions;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface PushKeys {
  p256dh: string;
  auth: string;
}

export type Platform = 
  | 'web_chrome'
  | 'web_firefox'
  | 'web_safari'
  | 'web_edge'
  | 'android'
  | 'ios'
  | 'windows'
  | 'macos'
  | 'linux';

export interface PushPermissions {
  granted: boolean;
  prompt: boolean;
  denied: boolean;
  grantedAt?: Date;
  requestCount: number;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: PushAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
}

export interface PushAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushNotificationResult {
  subscriptionId: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  deliveredAt: Date;
  responseTime: number; // milliseconds
}

// ===== Webhook購読型 =====

export interface WebhookSubscription {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent[];
  headers: Record<string, string>;
  secret?: string;
  signatureHeader?: string;
  timeout: number; // seconds
  retryPolicy: RetryPolicy;
  isActive: boolean;
  lastTriggeredAt?: Date;
  statistics: WebhookStatistics;
}

export interface WebhookEvent {
  type: EventType;
  filters: SubscriptionFilter[];
  enabled: boolean;
}

export type EventType = 
  | 'message.created'
  | 'message.updated'
  | 'message.deleted'
  | 'channel.created'
  | 'channel.updated'
  | 'user.joined'
  | 'user.left'
  | 'alert.triggered'
  | 'insight.generated'
  | 'health.score_changed'
  | 'integration.connected'
  | 'integration.disconnected';

export interface WebhookStatistics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastResponseCode?: number;
  uptime: number; // percentage
}

export interface WebhookDelivery {
  id: string;
  subscriptionId: string;
  event: WebhookEvent;
  payload: Record<string, any>;
  attempt: number;
  statusCode?: number;
  responseBody?: string;
  deliveredAt: Date;
  responseTime: number;
  success: boolean;
  error?: string;
}

// ===== メール購読型 =====

export interface EmailSubscription {
  id: string;
  userId: string;
  emailAddress: string;
  type: EmailSubscriptionType;
  frequency: EmailFrequency;
  template: EmailTemplate;
  isVerified: boolean;
  verificationToken?: string;
  verifiedAt?: Date;
  lastSentAt?: Date;
  bounceCount: number;
  isBlocked: boolean;
}

export type EmailSubscriptionType = 
  | 'digest'
  | 'alert'
  | 'report'
  | 'newsletter'
  | 'announcement'
  | 'security';

export type EmailFrequency = 
  | 'immediate'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'on_demand';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: TemplateVariable[];
  attachments: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  content: string; // base64 encoded
  inline?: boolean;
  cid?: string; // content-id for inline images
}

export interface EmailDeliveryResult {
  subscriptionId: string;
  messageId: string;
  recipient: string;
  status: EmailDeliveryStatus;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  bounceReason?: string;
  unsubscribedAt?: Date;
}

export type EmailDeliveryStatus = 
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'unsubscribed'
  | 'failed';

// ===== サブスクリプションプラン（統合版） =====

/**
 * サブスクリプションプラン
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  currency: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  features: string[];
  limits?: {
    teams?: number; // -1 = unlimited
    members?: number; // -1 = unlimited
    storage?: number; // GB, -1 = unlimited
    apiCalls?: number; // -1 = unlimited
    messageAnalysis?: number; // -1 = unlimited
  };
  isPopular?: boolean;
  isRecommended?: boolean;
  yearlyDiscount?: number; // 0.0 - 1.0
  nextBillingDate?: Date;
  trialEndsAt?: Date;
}

/**
 * 支払い方法
 */
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  brand: string; // Visa, Mastercard, etc.
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  holderName: string;
  isDefault: boolean;
  createdAt: Date;
}

/**
 * 請求先情報
 */
export interface BillingInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  taxId?: string;
  address: {
    country: string;
    postalCode: string;
    prefecture: string;
    city: string;
    street: string;
    building?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 請求書
 */
export interface Invoice {
  id: string;
  number: string;
  date: Date;
  dueDate: Date;
  periodStart: Date;
  periodEnd: Date;
  amount: number;
  tax: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'cancelled';
  items: InvoiceItem[];
  paymentMethod?: PaymentMethod;
  paidAt?: Date;
  createdAt: Date;
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
  metadata?: Record<string, any>;
}

/**
 * 使用量メトリクス
 */
export interface UsageMetrics {
  period: {
    start: Date;
    end: Date;
  };
  teams: {
    current: number;
    limit: number;
    history?: UsageDataPoint[];
  };
  members: {
    current: number;
    limit: number;
    history?: UsageDataPoint[];
  };
  storage: {
    used: number; // bytes
    limit: number; // bytes
    history?: UsageDataPoint[];
  };
  apiCalls: {
    current: number;
    limit: number;
    history?: UsageDataPoint[];
  };
  messageAnalysis?: {
    current: number;
    limit: number;
    history?: UsageDataPoint[];
  };
}

/**
 * 使用量データポイント
 */
export interface UsageDataPoint {
  date: Date;
  value: number;
}

/**
 * サブスクリプション統計
 */
export interface SubscriptionStats {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
}

/**
 * プラン変更リクエスト
 */
export interface PlanChangeRequest {
  fromPlanId: string;
  toPlanId: string;
  effectiveDate: Date;
  prorationAmount?: number;
  reason?: string;
}

/**
 * サブスクリプションイベント
 */
export interface SubscriptionEvent {
  id: string;
  type: SubscriptionEventType;
  subscriptionId: string;
  planId?: string;
  amount?: number;
  currency?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type SubscriptionEventType = 
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'subscription.renewed'
  | 'subscription.trial_started'
  | 'subscription.trial_ended'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'invoice.created'
  | 'invoice.paid'
  | 'plan.changed';

/**
 * 割引・クーポン
 */
export interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  currency?: string;
  description: string;
  validFrom: Date;
  validUntil: Date;
  maxUses?: number;
  usedCount: number;
  applicablePlans?: string[];
  isActive: boolean;
}

/**
 * コホート分析データ
 */
export interface CohortData {
  cohort: string; // YYYY-MM
  size: number;
  retentionRates: {
    month: number;
    rate: number;
    revenue: number;
  }[];
}

// ===== 定数 =====

export const SUBSCRIPTION_LIMITS = {
  MAX_SUBSCRIPTIONS_PER_USER: 100,
  MAX_FILTERS_PER_SUBSCRIPTION: 20,
  MAX_WEBHOOK_TIMEOUT: 30, // seconds
  MAX_EMAIL_ATTACHMENTS: 10,
  MAX_BATCH_SIZE: 10000,
  DEFAULT_RETRY_ATTEMPTS: 3
} as const;

export const DEFAULT_NOTIFICATION_FREQUENCIES: NotificationFrequency[] = [
  'real_time',
  'every_15_minutes',
  'hourly',
  'daily',
  'weekly'
];

export const SUPPORTED_PLATFORMS: Platform[] = [
  'web_chrome',
  'web_firefox',
  'web_safari',
  'web_edge',
  'android',
  'ios'
];

// ===== 型ガード関数 =====

export const isPushSubscription = (subscription: any): subscription is PushSubscription => {
  return subscription && typeof subscription.endpoint === 'string' && subscription.keys;
};

export const isWebhookSubscription = (subscription: any): subscription is WebhookSubscription => {
  return subscription && typeof subscription.url === 'string' && Array.isArray(subscription.events);
};

export const isEmailSubscription = (subscription: any): subscription is EmailSubscription => {
  return subscription && typeof subscription.emailAddress === 'string';
};

export const isActiveSubscription = (subscription: Subscription): boolean => {
  return subscription.status === 'active' && 
         subscription.config.enabled && 
         (!subscription.expiresAt || subscription.expiresAt > new Date());
};

// ===== エクスポート =====

export default {
  SUBSCRIPTION_LIMITS,
  DEFAULT_NOTIFICATION_FREQUENCIES,
  SUPPORTED_PLATFORMS,
  isPushSubscription,
  isWebhookSubscription,
  isEmailSubscription,
  isActiveSubscription
} as const;