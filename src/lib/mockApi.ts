import { 
  User, 
  TeamMember, 
  HealthAlert, 
  DashboardStats, 
  APIResponse, 
  LoginRequest, 
  LoginResponse,
  UserSettings,
  HEALTH_ANALYSIS_PLANS
} from '@/types/api';

// モックユーザーデータ
const mockUsers: User[] = [
  {
    id: 'demo-user',
    email: 'demo@company.com',
    name: 'デモユーザー',
    role: 'member',
    department: '開発部',
    avatar: undefined,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-05-25T00:00:00Z',
    subscription: {
      id: 'sub-demo-001',
      plan: 'basic',
      status: 'active',
      expiresAt: '2025-06-25T00:00:00Z',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-05-25T00:00:00Z',
      features: ['詳細分析', 'アラート機能', 'CSV出力'],
      limits: {
        teamMembers: 20,
        reports: 4,
        storage: 1024
      }
    },
    settings: {
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
    }
  },
  {
    id: 'admin-user',
    email: 'admin@company.com',
    name: '管理者ユーザー',
    role: 'admin',
    department: '経営企画',
    avatar: undefined,
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2025-05-25T00:00:00Z',
    subscription: {
      id: 'sub-admin-001',
      plan: 'enterprise',
      status: 'active',
      expiresAt: '2026-01-01T00:00:00Z',
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2025-05-25T00:00:00Z',
      features: ['全機能', '専用サポート', 'SSO連携'],
      limits: {
        teamMembers: -1,
        reports: -1,
        storage: -1
      }
    },
    settings: {
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        weeklyReports: true,
        criticalAlerts: true,
        teamUpdates: true
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
    }
  },
  {
    id: 'manager-user',
    email: 'manager@company.com',
    name: 'マネージャーユーザー',
    role: 'manager',
    department: '人事部',
    avatar: undefined,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-05-25T00:00:00Z',
    subscription: {
      id: 'sub-manager-001',
      plan: 'premium',
      status: 'active',
      expiresAt: '2025-08-01T00:00:00Z',
      createdAt: '2025-02-01T00:00:00Z',
      updatedAt: '2025-05-25T00:00:00Z',
      features: ['予測分析', 'カスタムダッシュボード', 'API連携'],
      limits: {
        teamMembers: 100,
        reports: -1,
        storage: 10240
      }
    },
    settings: {
      notifications: {
        emailNotifications: true,
        pushNotifications: false,
        weeklyReports: true,
        criticalAlerts: true,
        teamUpdates: true
      },
      privacy: {
        shareAnalytics: false,
        anonymizeData: true,
        dataRetention: true,
        exportData: false
      },
      theme: 'dark',
      language: 'ja',
      timezone: 'Asia/Tokyo'
    }
  }
];

// モックチームメンバーデータ
const mockTeamMembers: TeamMember[] = [
  {
    id: 'member-001',
    name: '田中太郎',
    email: 'tanaka@company.com',
    department: '開発部',
    role: 'シニアエンジニア',
    joinDate: '2023-04-01',
    healthMetrics: {
      overallScore: 75,
      stressLevel: 45,
      workload: 70,
      satisfaction: 80,
      engagement: 85,
      burnoutRisk: 'low',
      lastUpdated: '2025-05-25T09:00:00Z',
      trends: { week: 5, month: -2 }
    },
    lastActive: '2025-05-25T16:30:00Z',
    status: 'active'
  },
  {
    id: 'member-002',
    name: '佐藤花子',
    email: 'sato@company.com',
    department: 'デザイン部',
    role: 'UXデザイナー',
    joinDate: '2023-06-15',
    healthMetrics: {
      overallScore: 65,
      stressLevel: 70,
      workload: 85,
      satisfaction: 60,
      engagement: 55,
      burnoutRisk: 'medium',
      lastUpdated: '2025-05-25T10:15:00Z',
      trends: { week: -8, month: -15 }
    },
    lastActive: '2025-05-25T17:45:00Z',
    status: 'active'
  },
  {
    id: 'member-003',
    name: '鈴木一郎',
    email: 'suzuki@company.com',
    department: 'マーケティング部',
    role: 'マーケティングマネージャー',
    joinDate: '2022-09-01',
    healthMetrics: {
      overallScore: 40,
      stressLevel: 90,
      workload: 95,
      satisfaction: 30,
      engagement: 25,
      burnoutRisk: 'high',
      lastUpdated: '2025-05-25T11:30:00Z',
      trends: { week: -12, month: -25 }
    },
    lastActive: '2025-05-25T19:20:00Z',
    status: 'active'
  }
];

// モックアラートデータ
const mockAlerts: HealthAlert[] = [
  {
    id: 'alert-001',
    type: 'burnout_risk',
    severity: 'critical',
    title: 'バーンアウトリスク警告',
    description: '鈴木一郎さんのストレスレベルが危険域に達しています。早急な対応が必要です。',
    memberId: 'member-003',
    memberName: '鈴木一郎',
    department: 'マーケティング部',
    createdAt: '2025-05-25T08:00:00Z',
    status: 'active',
    actionRequired: true
  },
  {
    id: 'alert-002',
    type: 'low_engagement',
    severity: 'medium',
    title: 'エンゲージメント低下',
    description: '佐藤花子さんのエンゲージメントが先月比で15%低下しています。',
    memberId: 'member-002',
    memberName: '佐藤花子',
    department: 'デザイン部',
    createdAt: '2025-05-24T14:30:00Z',
    status: 'acknowledged',
    actionRequired: false
  },
  {
    id: 'alert-003',
    type: 'high_stress',
    severity: 'high',
    title: '高ストレス状態',
    description: '開発部全体のストレスレベルが上昇傾向にあります。',
    memberId: 'member-001',
    memberName: '田中太郎',
    department: '開発部',
    createdAt: '2025-05-23T16:00:00Z',
    status: 'active',
    actionRequired: true
  }
];

// モックダッシュボード統計（修正版）
const mockDashboardStats: DashboardStats = {
  totalMembers: 45,
  activeMembers: 42,
  averageHealthScore: 68,
  alertsCount: 8,
  criticalAlertsCount: 2,
  departmentBreakdown: [
    { department: '開発部', memberCount: 15, averageScore: 72 },
    { department: 'デザイン部', memberCount: 8, averageScore: 65 },
    { department: 'マーケティング部', memberCount: 10, averageScore: 58 },
    { department: '営業部', memberCount: 12, averageScore: 75 }
  ],
  trends: {
    healthScoreChange: -3,
    engagementChange: -8,
    stressChange: 12,
    teamHealthScore: 85,
  },
  // 不足していたプロパティを追加
  teamHealthScore: 68,
  atRiskMembers: 3,
  teamSatisfaction: 72,
  recentAlerts: mockAlerts
};

// API遅延シミュレーション
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// モックAPI実装
class MockAPI {
  // 認証
  async login(credentials: LoginRequest): Promise<APIResponse<LoginResponse>> {
    await delay(1000);
    
    const user = mockUsers.find(u => u.email === credentials.email);
    
    if (!user) {
      return {
        success: false,
        error: 'ユーザーが見つかりません'
      };
    }

    // パスワード検証（簡易版）
    const validPasswords: Record<string, string> = {
      'demo@company.com': 'demo123',
      'admin@company.com': 'admin123',
      'manager@company.com': 'manager123'
    };

    if (validPasswords[credentials.email] !== credentials.password) {
      return {
        success: false,
        error: 'パスワードが正しくありません'
      };
    }

    return {
      success: true,
      data: {
        user,
        token: 'mock_jwt_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now()
      }
    };
  }

  // ユーザー情報取得
  async getUser(userId: string): Promise<APIResponse<User>> {
    await delay(500);
    
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      return {
        success: false,
        error: 'ユーザーが見つかりません'
      };
    }

    return {
      success: true,
      data: user
    };
  }

  // チームメンバー一覧取得
  async getTeamMembers(): Promise<APIResponse<TeamMember[]>> {
    await delay(800);
    
    return {
      success: true,
      data: mockTeamMembers
    };
  }

  // アラート一覧取得
  async getHealthAlerts(): Promise<APIResponse<HealthAlert[]>> {
    await delay(600);
    
    return {
      success: true,
      data: mockAlerts
    };
  }

  // ダッシュボード統計取得
  async getDashboardStats(): Promise<APIResponse<DashboardStats>> {
    await delay(700);
    
    return {
      success: true,
      data: mockDashboardStats
    };
  }

  // サブスクリプションプラン取得
  async getSubscriptionPlans(): Promise<APIResponse<any[]>> {
    await delay(500);
    
    const plans = Object.values(HEALTH_ANALYSIS_PLANS);
    
    return {
      success: true,
      data: plans
    };
  }

  // ユーザー設定更新
  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<APIResponse<UserSettings>> {
    await delay(800);
    
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      return {
        success: false,
        error: 'ユーザーが見つかりません'
      };
    }

    // 設定を更新
    user.settings = {
      ...user.settings!,
      ...settings
    };

    return {
      success: true,
      data: user.settings
    };
  }
}

const mockApi = new MockAPI();
export default mockApi;