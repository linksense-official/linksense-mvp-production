// src/types/integrations.ts
// LinkSense MVP - 統合サービス型定義システム - 8サービス完全対応版
// 型安全性完全確保 + Discord・Google Meet対応 + 新サービス型定義追加

// ✅ 基本的な統合サービス型定義
export type IntegrationCategory = 'communication' | 'project' | 'analytics' | 'hr' | 'meeting';
export type IntegrationMarket = 'global' | 'us' | 'japan';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'expired';
export type AuthType = 'oauth2' | 'api_key' | 'webhook' | 'bot_token' | 'session' | 'client_credentials';

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

// ✅ 認証情報（暗号化保存）- 拡張版
export interface IntegrationCredentials {
  // OAuth関連
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  sessionToken?: string;  // サイボウズ Office用
  baseUrl?: string;       // サイボウズ Office用
  
  // API Key関連
  apiKey?: string;
  apiSecret?: string;
  
  // Bot Token関連
  botToken?: string;
  webhookSecret?: string;
  
  // 基本認証関連
  username?: string;
  password?: string;
  
  // サービス固有
  teamId?: string;
  workspaceId?: string;
  tenantId?: string;
  accountId?: string;
  guildId?: string; // Discord用
  
  // トークン管理
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

// ✅ 分析メトリクス - Discord・Google Meet対応拡張版
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
  
  // Discord特化指標
  voiceParticipation?: number;
  communityHealth?: number;
  roleUtilization?: number;
  botEffectiveness?: number;
  
  // Google Meet特化指標
  meetingFatigue?: number;
  cameraUsageRate?: number;
  screenShareRate?: number;
  recordingUsage?: number;
}

// ✅ 分析インサイト - 拡張版
export interface AnalyticsInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning' | 'suggestion';
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

// ✅ ChatWork統合（日本市場特化）
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
  contacts: ChatWorkUser[];
  tasks: ChatWorkTask[];
  messages: ChatWorkMessage[];
}

export interface ChatWorkRoom {
  room_id: string;
  name: string;
  type: 'my' | 'direct' | 'group';
  role: 'admin' | 'member' | 'readonly';
  sticky: boolean;
  unread_num: number;
  mention_num: number;
  mytask_num: number;
  message_num: number;
  file_num: number;
  task_num: number;
  icon_path: string;
  last_update_time: number;
}

export interface ChatWorkUser {
  account_id: number;
  room_id?: number;
  name: string;
  chatwork_id: string;
  organization_id: number;
  organization_name: string;
  department: string;
  title: string;
  url: string;
  introduction: string;
  mail: string;
  tel_organization: string;
  tel_extension: string;
  tel_mobile: string;
  skype: string;
  facebook: string;
  twitter: string;
  avatar_image_url: string;
  login_mail: string;
}

export interface ChatWorkTask {
  task_id: number;
  room: {
    room_id: number;
    name: string;
    icon_path: string;
  };
  assigned_by_account: {
    account_id: number;
    name: string;
    avatar_image_url: string;
  };
  message_id: string;
  body: string;
  limit_time: number;
  status: 'open' | 'done';
  limit_type: 'none' | 'date' | 'time';
}

export interface ChatWorkMessage {
  message_id: string;
  room_id: number;
  account: {
    account_id: number;
    name: string;
    avatar_image_url: string;
  };
  body: string;
  send_time: number;
  update_time: number;
}

// ✅ LINE WORKS統合（日本市場特化）
export interface LineWorksIntegration extends Integration {
  id: 'line-works';
  credentials?: LineWorksCredentials;
  data?: LineWorksData;
}

export interface LineWorksCredentials extends IntegrationCredentials {
  clientId: string;
  clientSecret: string;
  serviceAccount: string;
  privateKey: string;
  domainId: string;
}

export interface LineWorksData {
  users: LineWorksUser[];
  groups: LineWorksGroup[];
  talks: LineWorksTalk[];
  messages: LineWorksMessage[];
}

export interface LineWorksUser {
  userId: string;
  orgUnitId: string;
  email: string;
  userName: string;
  aliasEmails: string[];
  domainId: string;
  isActivated: boolean;
  isDeleted: boolean;
  createdTime: string;
  updatedTime: string;
  i18nNames: {
    [locale: string]: string;
  };
  phoneNumbers: Array<{
    type: string;
    number: string;
  }>;
}

export interface LineWorksGroup {
  groupId: string;
  groupName: string;
  createdTime: string;
  updatedTime: string;
  memberCount: number;
  type: 'NORMAL' | 'EXTERNAL';
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
}

export interface LineWorksTalk {
  roomId: string;
  roomName?: string;
  roomType: 'DIRECT' | 'GROUP';
  memberCount: number;
  createdTime: string;
  updatedTime: string;
}

export interface LineWorksMessage {
  messageId: string;
  roomId: string;
  userId: string;
  content: {
    type: 'text' | 'image' | 'file' | 'sticker';
    text?: string;
    fileUrl?: string;
    fileName?: string;
  };
  createdTime: string;
  updatedTime: string;
}

// ✅ Discord統合（ゲーミング・クリエイター特化）
export interface DiscordIntegration extends Integration {
  id: 'discord';
  credentials?: DiscordCredentials;
  data?: DiscordData;
}

export interface DiscordCredentials extends IntegrationCredentials {
  accessToken: string;
  refreshToken?: string;
  guildId: string;
  botToken?: string;
}

export interface DiscordData {
  guild: DiscordGuild;
  channels: DiscordChannel[];
  members: DiscordMember[];
  messages: DiscordMessage[];
  voiceStates: DiscordVoiceState[];
  roles: DiscordRole[];
  bots: DiscordBot[];
}

export interface DiscordGuild {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  onlineCount: number;
  boostLevel: number;
  createdAt: Date;
  features: string[];
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'category' | 'forum' | 'stage';
  memberCount: number;
  messageCount: number;
  lastActivity: Date;
  isNsfw: boolean;
  parentId?: string;
}

export interface DiscordMember {
  id: string;
  username: string;
  displayName: string;
  isBot: boolean;
  isOnline: boolean;
  joinedAt: Date;
  roles: string[];
  messageCount: number;
  voiceMinutes: number;
  lastSeen: Date;
  gameActivity?: string;
  streamingActivity?: string;
}

export interface DiscordMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  timestamp: Date;
  reactionCount: number;
  attachmentCount: number;
  mentionCount: number;
  isReply: boolean;
  threadId?: string;
}

export interface DiscordVoiceState {
  userId: string;
  channelId: string;
  sessionStart: Date;
  sessionEnd?: Date;
  duration: number;
  isMuted: boolean;
  isDeafened: boolean;
  isStreaming: boolean;
  isVideoEnabled: boolean;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  permissions: string;
  memberCount: number;
  isManaged: boolean;
  isHoisted: boolean;
  position: number;
}

export interface DiscordBot {
  id: string;
  name: string;
  commandsUsed: number;
  automationLevel: number;
  moderationActions: number;
  musicMinutes: number;
}

// ✅ Google Meet統合
export interface GoogleMeetIntegration extends Integration {
  id: 'google-meet';
  credentials?: GoogleMeetCredentials;
  data?: GoogleMeetData;
}

export interface GoogleMeetCredentials extends IntegrationCredentials {
  accessToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  scope: string;
}

export interface GoogleMeetData {
  meetings: GoogleMeetMeeting[];
  users: GoogleMeetUser[];
  calendar: GoogleCalendarEvent[];
  workspace: GoogleWorkspace;
}

export interface GoogleMeetMeeting {
  id: string;
  meetingCode: string;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  organizerId: string;
  participantCount: number;
  participants: GoogleMeetParticipant[];
  isRecorded: boolean;
  hasScreenShare: boolean;
}

export interface GoogleMeetUser {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  isActive: boolean;
  lastActivity: Date;
  meetingCount: number;
  totalMeetingMinutes: number;
}

export interface GoogleMeetParticipant {
  userId: string;
  email: string;
  name: string;
  joinTime: Date;
  leaveTime?: Date;
  duration: number;
  cameraOnTime: number;
  micOnTime: number;
  screenShareTime: number;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  attendees: Array<{
    email: string;
    responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  }>;
  meetingUrl?: string;
  isRecurring: boolean;
  createdBy: string;
}

export interface GoogleWorkspace {
  domain: string;
  organizationName: string;
  userCount: number;
  adminEmail: string;
  createdTime: Date;
}

// ✅ サイボウズ Office統合（日本市場特化）
export interface CybozuOfficeIntegration extends Integration {
  id: 'cybozu-office';
  credentials?: CybozuCredentials;
  data?: CybozuData;
}

export interface CybozuCredentials extends IntegrationCredentials {
  username: string;
  password: string;
  baseUrl: string;
  sessionToken?: string;
}

export interface CybozuData {
  users: CybozuUser[];
  schedules: CybozuSchedule[];
  messages: CybozuMessage[];
  workflows: CybozuWorkflow[];
  applications: CybozuApplication[];
}

export interface CybozuUser {
  userId: string;
  loginName: string;
  displayName: string;
  email: string;
  isValid: boolean;
  organizationId: string;
  organizationName: string;
  lastLogin?: string;
  createdTime: string;
  modifiedTime: string;
}

export interface CybozuSchedule {
  eventId: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  isAllDay: boolean;
  attendees: Array<{
    userId: string;
    name: string;
    type: 'organizer' | 'attendee';
  }>;
  facilities: string[];
  notes: string;
  createdTime: string;
  modifiedTime: string;
}

export interface CybozuMessage {
  messageId: string;
  subject: string;
  body: string;
  from: {
    userId: string;
    name: string;
  };
  to: Array<{
    userId: string;
    name: string;
  }>;
  isRead: boolean;
  createdTime: string;
  modifiedTime: string;
}

export interface CybozuWorkflow {
  requestId: string;
  processId: string;
  subject: string;
  applicant: {
    userId: string;
    name: string;
  };
  status: 'PROGRESS' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  currentStep: string;
  createdTime: string;
  modifiedTime: string;
  processedTime?: string;
}

export interface CybozuApplication {
  appId: string;
  name: string;
  description: string;
  recordCount: number;
  createdTime: string;
  modifiedTime: string;
}

// ✅ Zoom統合
export interface ZoomIntegration extends Integration {
  id: 'zoom';
  credentials?: ZoomCredentials;
  data?: ZoomData;
}

export interface ZoomCredentials extends IntegrationCredentials {
  clientId: string;
  clientSecret: string;
  accountId: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface ZoomData {
  meetings: ZoomMeeting[];
  users: ZoomUser[];
  webinars: ZoomWebinar[];
  account: ZoomAccount;
}

export interface ZoomMeeting {
  id: string;
  uuid: string;
  host_id: string;
  host_email: string;
  topic: string;
  type: number;
  status: string;
  start_time: string;
  duration: number;
  timezone: string;
  participants?: ZoomParticipant[];
  total_minutes: number;
  participants_count: number;
}

export interface ZoomUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  type: number;
  role_name: string;
  pmi: number;
  use_pmi: boolean;
  personal_meeting_url: string;
  timezone: string;
  verified: number;
  dept: string;
  created_at: string;
  last_login_time: string;
  last_client_version: string;
  language: string;
  phone_country: string;
  phone_number: string;
  status: string;
}

export interface ZoomWebinar {
  uuid: string;
  id: number;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  agenda: string;
  created_at: string;
  start_url: string;
  join_url: string;
}

// ✅ ZoomParticipant型定義（エクスポート確認）
export interface ZoomParticipant {
  id: string;
  user_id: string;
  name: string;
  user_email: string;
  join_time: string;
  leave_time: string;
  duration: number;
  attentiveness_score?: string;
  camera_on_time?: number;
  microphone_on_time?: number;
  total_duration?: number;
}

export interface ZoomAccount {
  id: string;
  account_name: string;
  account_number: string;
  owner_email: string;
  owner_id: string;
  plan_type: string;
  type: number;
  sub_account_id?: string;
  created_at: string;
}

// ✅ 統合管理システム
export interface IntegrationManager {
  integrations: Map<string, Integration>;
  connect(integrationId: string, credentials: IntegrationCredentials): Promise<boolean>;
  disconnect(integrationId: string): Promise<boolean>;
  sync(integrationId: string): Promise<IntegrationAnalytics | null>;
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

// ✅ 統合サービス定義（8サービス対応）
export const INTEGRATION_SERVICES = {
  // 主要8サービス
  SLACK: 'slack',
  MICROSOFT_TEAMS: 'microsoft-teams',
  CHATWORK: 'chatwork',
  LINE_WORKS: 'line-works',
  DISCORD: 'discord',
  GOOGLE_MEET: 'google-meet',
  CYBOZU_OFFICE: 'cybozu-office',
  ZOOM: 'zoom',
  
  // 将来拡張予定
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