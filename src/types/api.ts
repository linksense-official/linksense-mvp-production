// チーム健全性分析ツール用型定義

// ユーザー関連
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'member';
  department: string;
  createdAt: string;
  updatedAt: string;
  settings?: UserSettings;
  subscription?: Subscription;
}

// サブスクリプション関連
export interface Subscription {
  id: string;
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  features: string[];
  limits: {
    teamMembers: number;
    reports: number;
    storage: number;
  };
}

// プラン関連
export interface PlanLimits {
  teamMembers: number; // -1 = 無制限
  reports: number;     // -1 = 無制限
  storage: number;     // MB単位
  alertsPerMonth: number;
  dataRetentionDays: number;
}

export interface PlanFeatures {
  basicDashboard: boolean;
  advancedAnalytics: boolean;
  predictiveAnalysis: boolean;
  customDashboard: boolean;
  apiAccess: boolean;
  ssoIntegration: boolean;
  prioritySupport: boolean;
  customReports: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  limits: PlanLimits;
  features: PlanFeatures;
  popular?: boolean;
}

// チーム健全性ツール向けプラン定義
export const HEALTH_ANALYSIS_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'free',
    displayName: 'フリープラン',
    price: 0,
    interval: 'month',
    description: '小規模チーム向けの基本機能',
    limits: {
      teamMembers: 5,
      reports: 1,
      storage: 100,
      alertsPerMonth: 10,
      dataRetentionDays: 30
    },
    features: {
      basicDashboard: true,
      advancedAnalytics: false,
      predictiveAnalysis: false,
      customDashboard: false,
      apiAccess: false,
      ssoIntegration: false,
      prioritySupport: false,
      customReports: false
    }
  },
  basic: {
    id: 'basic',
    name: 'basic',
    displayName: 'ベーシックプラン',
    price: 2980,
    interval: 'month',
    description: '中規模チーム向けの詳細分析',
    limits: {
      teamMembers: 20,
      reports: 4,
      storage: 1024,
      alertsPerMonth: 100,
      dataRetentionDays: 90
    },
    features: {
      basicDashboard: true,
      advancedAnalytics: true,
      predictiveAnalysis: false,
      customDashboard: false,
      apiAccess: false,
      ssoIntegration: false,
      prioritySupport: false,
      customReports: true
    },
    popular: true
  },
  premium: {
    id: 'premium',
    name: 'premium',
    displayName: 'プレミアムプラン',
    price: 9800,
    interval: 'month',
    description: '大規模チーム向けの高度な分析',
    limits: {
      teamMembers: 100,
      reports: -1,
      storage: 10240,
      alertsPerMonth: 1000,
      dataRetentionDays: 365
    },
    features: {
      basicDashboard: true,
      advancedAnalytics: true,
      predictiveAnalysis: true,
      customDashboard: true,
      apiAccess: true,
      ssoIntegration: false,
      prioritySupport: true,
      customReports: true
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'エンタープライズプラン',
    price: 29800,
    interval: 'month',
    description: '企業向けの全機能とカスタマイズ',
    limits: {
      teamMembers: -1,
      reports: -1,
      storage: -1,
      alertsPerMonth: -1,
      dataRetentionDays: -1
    },
    features: {
      basicDashboard: true,
      advancedAnalytics: true,
      predictiveAnalysis: true,
      customDashboard: true,
      apiAccess: true,
      ssoIntegration: true,
      prioritySupport: true,
      customReports: true
    }
  }
};

// チーム健全性関連
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  joinDate: string;
  avatar?: string;
  healthMetrics: HealthMetrics;
  lastActive: string;
  status: 'active' | 'inactive' | 'on_leave';
}

export interface HealthMetrics {
  overallScore: number; // 0-100
  stressLevel: number; // 0-100
  workload: number; // 0-100
  satisfaction: number; // 0-100
  engagement: number; // 0-100
  burnoutRisk: 'low' | 'medium' | 'high';
  lastUpdated: string;
  trends: {
    week: number;
    month: number;
  };
}

export interface HealthAlert {
  id: string;
  type: 'burnout_risk' | 'low_engagement' | 'high_stress' | 'workload_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  memberId: string;
  memberName: string;
  department: string;
  createdAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
  actionRequired: boolean;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  averageHealthScore: number;
  alertsCount: number;
  criticalAlertsCount: number;
  departmentBreakdown: {
    department: string;
    memberCount: number;
    averageScore: number;
  }[];
  trends: {
    healthScoreChange: number;
    engagementChange: number;
    stressChange: number;
  };
}

// 設定関連
export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  criticalAlerts: boolean;
  teamUpdates: boolean;
}

export interface PrivacySettings {
  shareAnalytics: boolean;
  anonymizeData: boolean;
  dataRetention: boolean;
  exportData: boolean;
}

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
  timezone: string;
}

// API関連
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | { message: string; code?: string };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 認証関連
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}