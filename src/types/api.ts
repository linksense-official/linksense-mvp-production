// チーム健全性分析ツール用型定義

// ユーザー関連（統一版）
export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string; // string に統一（必須）
  role: 'admin' | 'manager' | 'member';
  department: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'on-leave'; // ハイフン形式に統一
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

// チーム健全性関連（TeamMember型を統一）
export interface TeamMember {
  id: string;
  name: string;
  email?: string; // オプショナルに変更（重複回避）
  department?: string; // オプショナルに変更
  role: string;
  joinDate: string;
  avatar: string;
  healthScore: number;
  status: 'active' | 'inactive' | 'on-leave';
  healthMetrics?: HealthMetrics; // オプショナルに変更
  lastActive?: string; // オプショナルに変更
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

// DashboardStats型
export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  averageHealthScore: number;
  alertsCount: number;
  criticalAlertsCount: number;
  teamHealthScore: number;
  atRiskMembers: number;
  teamSatisfaction: number;
  departmentBreakdown: {
    department: string;
    memberCount: number;
    averageScore: number;
  }[];
  trends: {
    healthScoreChange: number;
    engagementChange: number;
    stressChange: number;
    teamHealthScore: number;
  };
  recentAlerts: HealthAlert[];
}

// UsageData型
export interface UsageData {
  name: string;
  current: number;
  limit: number;
  percentage: number;
  clicks: number;
  links: number;
  revenue: number;
  period: string;
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

// Alert型
export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  isRead: boolean;
}

// AlertDetail型（Alert型を拡張）
export interface AlertDetail extends Alert {
  description: string;
  affectedMembers: string[];
  relatedMetrics: {
    name: string;
    value: number;
    change: number;
  }[];
  timeline: {
    timestamp: string;
    action: string;
    user: string;
  }[];
  recommendations: string[];
}

// Comment型
export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  userAvatar: string;
}

// EditableMember型
export interface EditableMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
  skills: string[];
  phone: string;
  location: string;
  bio: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  preferences: {
    workingHours: {
      start: string;
      end: string;
    };
    communicationStyle: string;
    preferredMeetingTimes: string[];
  };
}

// MemberDetail型
export interface MemberDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  joinDate: string;
  avatar: string;
  status: 'active' | 'inactive' | 'on-leave';
  healthScore: number;
  metrics: {
    stress: number;
    satisfaction: number;
    engagement: number;
    workload: number;
    communication: number;
  };
  recentActivity: {
    date: string;
    action: string;
    details: string;
  }[];
  skills: string[];
  projects: {
    name: string;
    role: string;
    status: 'active' | 'completed' | 'on-hold';
    completion: number;
  }[];
  goals: {
    title: string;
    description: string;
    progress: number;
    dueDate: string;
    status: 'on-track' | 'at-risk' | 'completed';
  }[];
  feedback: {
    date: string;
    from: string;
    type: 'positive' | 'constructive' | 'neutral';
    content: string;
  }[];
}

// Team型
export interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  leaderId: string;
  leaderName: string;
  healthScore: number;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  lastActivity: string;
  projects: number;
  tags: string[];
}

// TeamDetail型
export interface TeamDetail extends Team {
  members: TeamMember[];
  metrics: {
    satisfaction: number;
    stress: number;
    engagement: number;
    workload: number;
    communication: number;
  };
  recentActivity: {
    date: string;
    action: string;
    member: string;
  }[];
}

// Integration型
export interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'project' | 'hr' | 'analytics' | 'security';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  icon: string;
  features: string[];
  setupComplexity: 'easy' | 'medium' | 'advanced';
  lastSync?: string;
  dataPoints?: number;
  settings?: Record<string, any>;
}

// AnalyticsData型
export interface AnalyticsData {
  overview: {
    totalMembers: number;
    activeTeams: number;
    avgHealthScore: number;
    trendDirection: 'up' | 'down' | 'stable';
  };
  healthTrends: {
    month: string;
    overall: number;
    stress: number;
    satisfaction: number;
    engagement: number;
  }[];
  departmentComparison: {
    department: string;
    healthScore: number;
    memberCount: number;
    change: number;
  }[];
  riskFactors: {
    factor: string;
    impact: 'high' | 'medium' | 'low';
    affectedMembers: number;
    description: string;
  }[];
  predictions: {
    metric: string;
    current: number;
    predicted: number;
    confidence: number;
    timeframe: string;
  }[];
  heatmapData: {
    day: string;
    hour: number;
    value: number;
  }[];
}

// ReportDetail型
export interface ReportDetail {
  id: string;
  title: string;
  team: string;
  period: string;
  generatedAt: string;
  summary: {
    overallScore: number;
    trend: 'up' | 'down' | 'stable';
    keyFindings: string[];
  };
  metrics: {
    name: string;
    value: number;
    target: number;
    trend: number;
    status: 'good' | 'warning' | 'critical';
  }[];
  insights: {
    category: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendations: string[];
  }[];
  charts: {
    type: 'line' | 'bar' | 'pie';
    title: string;
    data: any[];
  }[];
}