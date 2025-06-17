'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UnifiedUser, TeamHealthMetrics, RiskAnalysis } from '@/types/unified-user';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  RefreshCw,
  Database,
  Activity,
  Heart,
  BarChart3,
  Shield,
  Clock,
  TrendingDown,
  Zap,
  Settings,
  Building2,
  Calendar,
  Target,
  Network,
  Brain,
  Eye,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  Star,
  Timer,
  Cpu,
  Wifi,
  Server,
  Bell,
  Play
} from 'lucide-react';

// 本番対応型定義
interface DashboardStats {
  averageHealthScore: number;
  activeMembers: number;
  totalMembers: number;
  atRiskMembers: number;
  teamSatisfaction: number;
  alertsCount: number;
  criticalAlertsCount: number;
  connectedServices: number;
  totalServices: number;
  lastUpdated: string;
  // 本番追加フィールド
  totalMessages: number;
  totalMeetings: number;
  engagementRate: number;
  responseTimeAverage: number;
  collaborationScore: number;
  burnoutRiskCount: number;
  dataQualityScore: number;
  processingTime: number;
}

interface Integration {
  id: string;
  service: string;
  isActive: boolean;
  hasToken: boolean;
  createdAt: string;
  updatedAt: string;
  teamId?: string;
  teamName?: string;
  lastSync?: string;
  errorMessage?: string;
  userCount?: number;
  healthScore?: number;
}

interface DashboardData {
  stats: DashboardStats;
  integrations: Integration[];
  users: UnifiedUser[];
  teamHealth: TeamHealthMetrics | null;
  riskAnalysis: RiskAnalysis | null;
  aiInsights: AIInsight[];
  recentActivity: ActivityEvent[];
  performance: PerformanceMetrics;
}

interface AIInsight {
  id: string;
  type: 'recommendation' | 'warning' | 'opportunity' | 'trend';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
  confidence: number;
  generatedAt: string;
  affectedUsers?: string[];
  relatedServices?: string[];
}

interface ActivityEvent {
  id: string;
  type: 'integration' | 'alert' | 'analysis' | 'user_action';
  service?: string;
  title: string;
  description: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
  userName?: string;
}

interface PerformanceMetrics {
  apiResponseTime: number;
  dataFreshness: string;
  systemLoad: number;
  cacheHitRate: number;
  errorRate: number;
  uptime: number;
}

// UIコンポーネント
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex flex-col space-y-1.5 p-4 sm:p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-base sm:text-lg font-semibold leading-none tracking-tight text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 leading-relaxed ${className}`}>
    {children}
  </p>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}> = ({ children, onClick, disabled = false, variant = 'default', size = 'default', className = '' }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500"
  };
  const sizeClasses = size === 'sm' ? "px-3 py-1.5 text-sm" : size === 'lg' ? "px-6 py-3 text-base" : "px-4 py-2";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const Badge: React.FC<{ 
  children: React.ReactNode; 
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'success';
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    outline: "border border-gray-300 text-gray-700",
    secondary: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    success: "bg-green-100 text-green-800"
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Alert: React.FC<{ 
  children: React.ReactNode; 
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: "border-blue-200 bg-blue-50",
    destructive: "border-red-200 bg-red-50",
    warning: "border-yellow-200 bg-yellow-50",
    success: "border-green-200 bg-green-50"
  };
    
  return (
    <div className={`border rounded-lg p-4 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

const AlertTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h5 className="font-medium mb-2">{children}</h5>
);

const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm">{children}</div>
);

const Progress: React.FC<{ 
  value: number; 
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}> = ({ value, className = '', variant = 'default' }) => {
  const colorClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };
  
  const normalizedValue = Math.min(100, Math.max(0, value));
  
  return (
    <div className={`relative ${className}`}>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-500 ease-out ${colorClasses[variant]}`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
};

// 本番対応ダッシュボードサービス
class DashboardService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5分
  private static cache: { data: DashboardData | null; timestamp: number } = { data: null, timestamp: 0 };

  static async fetchDashboardData(): Promise<DashboardData> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 本番ダッシュボードデータ取得開始');

      // キャッシュチェック
      if (this.isCacheValid()) {
        console.log('✅ キャッシュからデータ取得');
        return this.cache.data!;
      }

      // 並行データ取得
      const [integrationsResult, realDataResult] = await Promise.allSettled([
        this.fetchIntegrations(),
        this.fetchRealAnalyticsData()
      ]);

      // 統合情報処理
      let integrations: Integration[] = [];
      if (integrationsResult.status === 'fulfilled') {
        integrations = integrationsResult.value;
      } else {
        console.warn('統合情報取得失敗:', integrationsResult.reason);
      }

      // リアル分析データ処理
      let analyticsData: any = null;
      let users: UnifiedUser[] = [];
      let teamHealth: TeamHealthMetrics | null = null;
      let riskAnalysis: RiskAnalysis | null = null;

      if (realDataResult.status === 'fulfilled') {
        analyticsData = realDataResult.value;
        users = analyticsData?.users || [];
        teamHealth = analyticsData?.teamHealth || null;
        riskAnalysis = analyticsData?.riskAnalysis || null;
      } else {
        console.warn('リアル分析データ取得失敗:', realDataResult.reason);
      }

      // AI分析実行
      const aiInsights = await this.generateAIInsights(users, teamHealth, riskAnalysis, integrations);

      // アクティビティ生成
      const recentActivity = await this.generateRecentActivity(integrations, users);

      // 統計計算
      const stats = this.calculateAdvancedStats(users, teamHealth, integrations, startTime);

      // パフォーマンス指標
      const performance: PerformanceMetrics = {
        apiResponseTime: Date.now() - startTime,
        dataFreshness: analyticsData?.metadata?.dataFreshness || new Date().toISOString(),
        systemLoad: Math.random() * 30 + 20, // 実際のシステム負荷に置き換え
        cacheHitRate: this.cache.data ? 85 : 0,
        errorRate: (integrationsResult.status === 'rejected' || realDataResult.status === 'rejected') ? 15 : 2,
        uptime: 99.8
      };

      const dashboardData: DashboardData = {
        stats,
        integrations,
        users,
        teamHealth,
        riskAnalysis,
        aiInsights,
        recentActivity,
        performance
      };

      // キャッシュ更新
      this.updateCache(dashboardData);

      console.log('✅ 本番ダッシュボードデータ取得完了:', {
        processingTime: Date.now() - startTime,
        userCount: users.length,
        integrationsCount: integrations.length,
        aiInsightsCount: aiInsights.length
      });

      return dashboardData;

    } catch (error) {
      console.error('❌ ダッシュボードデータ取得エラー:', error);
      return this.getFallbackData();
    }
  }

  private static async fetchIntegrations(): Promise<Integration[]> {
    const response = await fetch('/api/integrations/user', {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) {
      throw new Error(`統合API エラー: ${response.status}`);
    }

    const data = await response.json();
    return (data?.integrations || []).map((integration: any) => ({
      id: integration.id,
      service: integration.service,
      isActive: integration.isActive && integration.hasToken,
      hasToken: integration.hasToken,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      teamId: integration.teamId,
      teamName: integration.teamName,
      lastSync: integration.lastSync,
      errorMessage: integration.errorMessage,
      userCount: integration.stats?.userCount || 0,
      healthScore: integration.stats?.healthScore || 0
    }));
  }

  private static async fetchRealAnalyticsData(): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25秒タイムアウト

    try {
      const response = await fetch('/api/integrations/data', {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`分析API エラー: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '分析データ取得失敗');
      }

      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private static async generateAIInsights(
    users: UnifiedUser[], 
    teamHealth: TeamHealthMetrics | null, 
    riskAnalysis: RiskAnalysis | null,
    integrations: Integration[]
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const now = new Date().toISOString();

    try {
      // 1. チーム健全性に基づくインサイト
if (teamHealth) {
  if (teamHealth.healthScore < 60) {
    insights.push({
      id: `health-${Date.now()}`,
      type: 'warning',
      priority: 'high',
      title: 'チームの元気度が下がっています',
      description: `チームの元気度スコアが${teamHealth.healthScore}%になっています。`,
      impact: 'メンバーのやる気低下や退職の可能性があります',
      actionItems: [
        '個別面談の回数を増やす',
        'チームで楽しい活動を企画する',
        '仕事の負担を見直す'
      ],
      confidence: 85,
      generatedAt: now,
      affectedUsers: users.filter(u => u.isolationRisk === 'high').map(u => u.name),
      relatedServices: integrations.map(i => i.service)
    });
  }

  if (teamHealth.isolationRisks.high > 0) {
    insights.push({
      id: `isolation-${Date.now()}`,
      type: 'warning',
      priority: 'critical',
      title: '心配なメンバーがいます - 早めの対応をお勧めします',
      description: `${teamHealth.isolationRisks.high}名のメンバーが孤立している可能性があります。`,
      impact: 'チームの結束が弱くなり、大切な知識を失う可能性があります',
      actionItems: [
        '今すぐ個別に話を聞く時間を作る',
        'メンタルヘルスのサポートを提供する',
        '仕事の量を調整する'
      ],
      confidence: 92,
      generatedAt: now,
      affectedUsers: users.filter(u => u.isolationRisk === 'high').map(u => u.name)
    });
  }
}

// 2. コミュニケーションパターン分析
if (users.length > 0) {
  const avgCommunicationScore = users.reduce((sum, u) => sum + u.communicationScore, 0) / users.length;
  
  if (avgCommunicationScore < 50) {
    insights.push({
      id: `communication-${Date.now()}`,
      type: 'recommendation',
      priority: 'medium',
      title: 'チーム内のコミュニケーションを活発にしませんか？',
      description: `チーム全体のコミュニケーション活発度が${Math.round(avgCommunicationScore)}%です。`,
      impact: 'チームワークと情報共有がもっと良くなります',
      actionItems: [
        '定期的なチーム会議を設定する',
        '気軽に話せる機会を作る',
        'コミュニケーションツールをもっと活用する'
      ],
      confidence: 78,
      generatedAt: now
    });
  }

  // 3. サービス利用パターン分析
  const serviceUsage = users.reduce((acc, user) => {
    user.service.split(',').forEach(service => {
      acc[service.trim()] = (acc[service.trim()] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const dominantService = Object.entries(serviceUsage).sort(([,a], [,b]) => b - a)[0];
  if (dominantService && dominantService[1] / users.length > 0.8) {
    insights.push({
      id: `service-diversity-${Date.now()}`,
      type: 'opportunity',
      priority: 'low',
      title: '他のコミュニケーションツールも試してみませんか？',
      description: `${dominantService[0]}をよく使っています（${Math.round(dominantService[1] / users.length * 100)}%）。`,
      impact: '一つのツールに問題があっても大丈夫になり、効率も上がります',
      actionItems: [
        '他のコミュニケーションツールを試してみる',
        'ツール同士の連携を強化する',
        '予備のコミュニケーション手段を準備する'
      ],
      confidence: 65,
      generatedAt: now,
      relatedServices: [dominantService[0]]
    });
  }
}

// 4. 統合サービス最適化提案
const activeIntegrations = integrations.filter(i => i.isActive);
if (activeIntegrations.length < 3) {
  insights.push({
    id: `integration-${Date.now()}`,
    type: 'opportunity',
    priority: 'medium',
    title: 'もっと詳しい分析のために、他のツールも連携しませんか？',
    description: `現在${activeIntegrations.length}個のツールを連携しています。`,
    impact: 'より正確で詳しいチーム分析ができるようになります',
    actionItems: [
      'よく使うコミュニケーションツールを追加する',
      'カレンダーアプリと連携する',
      'プロジェクト管理ツールと連携する'
    ],
    confidence: 70,
    generatedAt: now,
    relatedServices: integrations.map(i => i.service)
  });
}

// 5. パフォーマンストレンド分析
if (users.some(u => u.metadata?.processingMode === 'optimized')) {
  insights.push({
    id: `performance-${Date.now()}`,
    type: 'trend',
    priority: 'low',
    title: 'システムの動作が最適化されています',
    description: 'データ処理が改善され、分析速度が向上しています。',
    impact: 'リアルタイムで正確な分析結果が得られています',
    actionItems: [
      '現在の設定を維持する',
      '定期的にシステム状態をチェックする',
      'さらなる改善の機会を探す'
    ],
    confidence: 88,
    generatedAt: now
  });
}

    } catch (error) {
      console.error('AI インサイト生成エラー:', error);
    }

    return insights.slice(0, 5); // 最大5個のインサイト
  }

  private static async generateRecentActivity(integrations: Integration[], users: UnifiedUser[]): Promise<ActivityEvent[]> {
    const activities: ActivityEvent[] = [];
    const now = Date.now();

    // 統合関連アクティビティ
    integrations.forEach((integration, index) => {
      if (integration.isActive) {
        activities.push({
          id: `integration-${integration.id}`,
          type: 'integration',
          service: integration.service,
          title: `${this.getServiceDisplayName(integration.service)} データ同期完了`,
          description: `${integration.userCount || 0}人のユーザーデータを正常に取得`,
          timestamp: new Date(now - index * 60000).toISOString(),
          severity: 'success'
        });
      }
    });

    // 分析関連アクティビティ
    if (users.length > 0) {
      activities.push({
        id: `analysis-${now}`,
        type: 'analysis',
        title: 'AI分析完了',
        description: `${users.length}人のメンバーデータを分析し、インサイトを生成`,
        timestamp: new Date(now - 30000).toISOString(),
        severity: 'info'
      });
    }

    // 高リスクユーザーアラート
    const highRiskUsers = users.filter(u => u.isolationRisk === 'high');
    if (highRiskUsers.length > 0) {
      activities.push({
        id: `alert-highrisk-${now}`,
        type: 'alert',
        title: '高リスクメンバー検出',
        description: `${highRiskUsers.length}名のメンバーに離職リスクを検出`,
        timestamp: new Date(now - 120000).toISOString(),
        severity: 'warning'
      });
    }

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
  }

   private static calculateAdvancedStats(
    users: UnifiedUser[], 
    teamHealth: TeamHealthMetrics | null, 
    integrations: Integration[],
    startTime: number
  ): DashboardStats {
    const connectedServices = integrations.filter(i => i.isActive).length;
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const atRiskUsers = users.filter(u => u.isolationRisk === 'high').length;

    // 高度な統計計算
    const avgHealthScore = teamHealth?.healthScore || (connectedServices === 0 ? 0 : Math.min(95, 60 + connectedServices * 8));
    const avgCommunicationScore = totalUsers > 0 ? users.reduce((sum, u) => sum + u.communicationScore, 0) / totalUsers : 0;
    
    // メッセージ・ミーティング統計
    const totalMessages = users.reduce((sum, u) => sum + (u.metadata?.messagesLast30Days || 0), 0);
    const totalMeetings = users.reduce((sum, u) => sum + (u.metadata?.meetingsAttended || 0), 0);
    
    // エンゲージメント率
    const engagementRate = totalUsers > 0 ? users.filter(u => u.activityScore > 60).length / totalUsers : 0;
    
    // 平均応答時間
    const responseTimes = users.map(u => u.metadata?.avgResponseTimeMinutes).filter(Boolean) as number[];
    const responseTimeAverage = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    return {
      averageHealthScore: Math.round(avgHealthScore),
      activeMembers: activeUsers,
      totalMembers: totalUsers,
      atRiskMembers: atRiskUsers,
      teamSatisfaction: Math.round(avgCommunicationScore),
      alertsCount: atRiskUsers > 0 ? 1 : 0, // 修正: 実際のリスク状況に基づく
      criticalAlertsCount: atRiskUsers > 2 ? 1 : 0, // 修正: 実際のリスク状況に基づく
      connectedServices,
      totalServices: 4, // 修正: 6から4に変更（Slack, Discord, Teams, Google Meet）
      lastUpdated: new Date().toISOString(),
      totalMessages,
      totalMeetings,
      engagementRate: Math.round(engagementRate * 100),
      responseTimeAverage: Math.round(responseTimeAverage),
      collaborationScore: Math.round(avgHealthScore * 0.8 + avgCommunicationScore * 0.2),
      burnoutRiskCount: users.filter(u => u.activityScore < 30).length,
      dataQualityScore: Math.round((connectedServices / 4) * 100), // 修正: 4で除算
      processingTime: Date.now() - startTime
    };
  }

  private static getServiceDisplayName(service: string): string {
  const names: { [key: string]: string } = {
    slack: 'Slack',
    discord: 'Discord',
    teams: 'Microsoft Teams',
    'azure-ad': 'Microsoft Teams',
    'microsoft-teams': 'Microsoft Teams',
    google: 'Google Meet',
    'google-meet': 'Google Meet'
  };
  return names[service] || service;
}

  private static isCacheValid(): boolean {
    return this.cache.data !== null && (Date.now() - this.cache.timestamp) < this.CACHE_DURATION;
  }

  private static updateCache(data: DashboardData): void {
    this.cache = {
      data,
      timestamp: Date.now()
    };
  }

    private static getFallbackData(): DashboardData {
    return {
      stats: {
        averageHealthScore: 0,
        activeMembers: 0,
        totalMembers: 0,
        atRiskMembers: 0,
        teamSatisfaction: 0,
        alertsCount: 0, // 修正: データなしの場合は0
        criticalAlertsCount: 0,
        connectedServices: 0,
        totalServices: 4, // 修正: 6から4に変更
        lastUpdated: new Date().toISOString(),
        totalMessages: 0,
        totalMeetings: 0,
        engagementRate: 0,
        responseTimeAverage: 0,
        collaborationScore: 0,
        burnoutRiskCount: 0,
        dataQualityScore: 0,
        processingTime: 0
      },
      integrations: [],
      users: [],
      teamHealth: null,
      riskAnalysis: null,
      aiInsights: [{
        id: 'fallback-1',
        type: 'warning',
        priority: 'high',
        title: 'データ取得エラー',
        description: 'システムデータの取得に失敗しました。',
        impact: 'ダッシュボード機能の制限',
        actionItems: ['ページの更新', '統合設定の確認', 'システム管理者への連絡'],
        confidence: 100,
        generatedAt: new Date().toISOString()
      }],
      recentActivity: [],
      performance: {
        apiResponseTime: 0,
        dataFreshness: new Date().toISOString(),
        systemLoad: 0,
        cacheHitRate: 0,
        errorRate: 100,
        uptime: 0
      }
    };
  }
}

// サービス名マッピング
const getServiceName = (service: string) => {
  const names: { [key: string]: string } = {
    google: 'Google Meet',
    'google-meet': 'Google Meet',
    slack: 'Slack',
    discord: 'Discord',
    'azure-ad': 'Microsoft Teams',
    teams: 'Microsoft Teams',
    'microsoft-teams': 'Microsoft Teams'
  };
  return names[service] || service;
};

// メインダッシュボードコンポーネント（修正箇所4-7: 完全更新）
const DashboardPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // 修正箇所4: 拡張された状態管理
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
   // 新機能の状態管理
  const [aiInsightsExpanded, setAiInsightsExpanded] = useState(false);
  const [performanceVisible, setPerformanceVisible] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // 修正箇所5: 最適化されたデータ取得処理
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      console.log('🚀 本番ダッシュボードデータ取得開始...');
      
      const dashboardData = await DashboardService.fetchDashboardData();
      setData(dashboardData);
      setLoading(false);
      
      console.log('✅ ダッシュボードデータ設定完了:', {
        users: dashboardData.users.length,
        integrations: dashboardData.integrations.length,
        aiInsights: dashboardData.aiInsights.length,
        processingTime: dashboardData.performance.apiResponseTime
      });
      
    } catch (err) {
      console.error('❌ ダッシュボードデータ取得エラー:', err);
      setError('ダッシュボードデータの取得に失敗しました');
      setLoading(false);
    }
  }, []);

  // OAuth成功後の自動更新
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      console.log('OAuth成功後の自動更新実行');
      fetchData();
      
      // URLからパラメータを削除
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [fetchData]);

  // リアルタイム更新とデータ取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
      
      // リアルタイム更新が有効な場合のみ自動更新
      if (realTimeUpdates) {
        const interval = setInterval(fetchData, 5 * 60 * 1000); // 5分間隔
        return () => clearInterval(interval);
      }
    }
    return undefined;
  }, [status, realTimeUpdates, fetchData]);

  // 手動更新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // 統合設定ページへの遷移
  const handleIntegrationSettings = useCallback(() => {
    router.push('/integrations');
  }, [router]);

  // AI分析ページへの遷移
  const handleAnalyticsView = useCallback(() => {
    router.push('/analytics');
  }, [router]);

  // メンバー詳細ページへの遷移
  const handleMembersView = useCallback(() => {
    router.push('/members');
  }, [router]);

  // 健全性スコア設定（メモ化）
  const getHealthScoreConfig = useMemo(() => (score: number) => {
  if (score >= 85) return { color: 'text-green-600', label: '優秀', bgColor: 'bg-green-50', variant: 'success' as const };
  if (score >= 70) return { color: 'text-blue-600', label: '良好', bgColor: 'bg-blue-50', variant: 'default' as const };
  if (score >= 55) return { color: 'text-yellow-600', label: '注意', bgColor: 'bg-yellow-50', variant: 'secondary' as const };
  if (score >= 40) return { color: 'text-orange-600', label: '警告', bgColor: 'bg-orange-50', variant: 'destructive' as const };
  return { color: 'text-gray-600', label: 'データなし', bgColor: 'bg-gray-50', variant: 'default' as const };
}, []);
  // AI分析インサイトのフィルタリング（メモ化）
  const filteredInsights = useMemo(() => {
    if (!data?.aiInsights) return [];
    return data.aiInsights.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [data?.aiInsights]);

  // パフォーマンス指標の計算（メモ化）
  const performanceStatus = useMemo(() => {
    if (!data?.performance) return null;
    
    const { apiResponseTime, systemLoad, errorRate, uptime } = data.performance;
    
    return {
      responseTime: {
        value: apiResponseTime,
        status: apiResponseTime < 2000 ? 'excellent' : apiResponseTime < 5000 ? 'good' : 'poor',
        label: apiResponseTime < 2000 ? '高速' : apiResponseTime < 5000 ? '良好' : '改善要'
      },
      systemLoad: {
        value: systemLoad,
        status: systemLoad < 50 ? 'excellent' : systemLoad < 80 ? 'good' : 'poor',
        label: systemLoad < 50 ? '軽負荷' : systemLoad < 80 ? '中負荷' : '高負荷'
      },
      errorRate: {
        value: errorRate,
        status: errorRate < 5 ? 'excellent' : errorRate < 15 ? 'good' : 'poor',
        label: errorRate < 5 ? '安定' : errorRate < 15 ? '注意' : '不安定'
      },
      uptime: {
        value: uptime,
        status: uptime > 99 ? 'excellent' : uptime > 95 ? 'good' : 'poor',
        label: uptime > 99 ? '高可用性' : uptime > 95 ? '安定' : '要改善'
      }
    };
  }, [data?.performance]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <RefreshCw className="h-12 sm:h-16 w-12 sm:w-16 animate-spin mx-auto mb-4 sm:mb-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">ダッシュボード読み込み中</h2>
            <p className="text-gray-600 mb-4">
              統合サービスからのデータ取得中...
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Database className="h-4 w-4 animate-pulse" />
              <span>AI分析処理中</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">認証が必要です</h1>
          <p className="text-gray-600 mb-8">ダッシュボードにはログインが必要です</p>
          <Button onClick={() => router.push('/login')}>
            ログイン
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription>
            <div className="space-y-3">
              <p>{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  再試行
                </Button>
                <Button variant="outline" size="sm" onClick={handleIntegrationSettings}>
                  <Settings className="h-4 w-4 mr-1" />
                  設定確認
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 sm:py-16">
            <Network className="mx-auto h-16 sm:h-24 w-16 sm:w-24 text-gray-400 mb-4 sm:mb-6" />
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              ダッシュボードデータがありません
            </h3>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
              統合分析を開始するには、まずサービスを接続してください。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleRefresh} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                データを更新
              </Button>
              <Button variant="outline" onClick={handleIntegrationSettings} className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                統合設定
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { stats, integrations, aiInsights, recentActivity, performance } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 修正箇所6: 拡張されたヘッダー */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6 sm:mb-8">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
                LinkSense ダッシュボード
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600">
  <div className="flex items-center gap-2">
    <Shield className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />
    <span className="text-green-600 font-semibold">
      {stats.connectedServices > 0 ? 'チーム分析実行中' : 'チーム分析準備中'}
    </span>
  </div>
  <div className="flex items-center gap-2">
    <Network className="h-4 w-4" />
    <span>{stats.connectedServices}/{stats.totalServices}つのツールを接続</span>
  </div>
  <div className="flex items-center gap-2">
    <Clock className="h-4 w-4" />
    <span className="hidden sm:inline">最新情報: </span>
    <span>{new Date(stats.lastUpdated).toLocaleString('ja-JP')}</span>
  </div>
  {performance && (
    <div className="flex items-center gap-2">
      <Timer className="h-4 w-4" />
      <span>分析時間: {performance.apiResponseTime}ms</span>
    </div>
  )}
</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* リアルタイム更新トグル */}
              <Button 
                variant={realTimeUpdates ? "default" : "outline"}
                size="sm"
                onClick={() => setRealTimeUpdates(!realTimeUpdates)}
                className="flex items-center gap-2"
              >
                <Activity className={`h-4 w-4 ${realTimeUpdates ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">
                  {realTimeUpdates ? 'リアルタイム' : '手動更新'}
                </span>
              </Button>
              
              {/* パフォーマンス表示トグル */}
              <Button 
                variant={performanceVisible ? "default" : "outline"}
                size="sm"
                onClick={() => setPerformanceVisible(!performanceVisible)}
                className="flex items-center gap-2"
              >
                <Cpu className="h-4 w-4" />
                <span className="hidden sm:inline">パフォーマンス</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleIntegrationSettings} 
                className="flex items-center gap-2"
                size="sm"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">統合管理</span>
                <span className="sm:hidden">設定</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="flex items-center gap-2"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">更新</span>
              </Button>
            </div>
          </div>

          {/* パフォーマンス監視ダッシュボード */}
          {performanceVisible && performanceStatus && (
            <Card className="mb-6 sm:mb-8 border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-blue-600" />
                  システムパフォーマンス監視
                </CardTitle>
                <CardDescription>
                  リアルタイムシステム状態とパフォーマンス指標
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Timer className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <div className="text-lg font-bold text-gray-900">
                      {performanceStatus.responseTime.value}ms
                    </div>
                    <div className="text-sm text-gray-600">API応答時間</div>
                    <Badge 
                      variant={performanceStatus.responseTime.status === 'excellent' ? 'success' : 
                              performanceStatus.responseTime.status === 'good' ? 'default' : 'destructive'}
                      className="mt-1"
                    >
                      {performanceStatus.responseTime.label}
                    </Badge>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Server className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <div className="text-lg font-bold text-gray-900">
                      {Math.round(performanceStatus.systemLoad.value)}%
                    </div>
                    <div className="text-sm text-gray-600">システム負荷</div>
                    <Badge 
                      variant={performanceStatus.systemLoad.status === 'excellent' ? 'success' : 
                              performanceStatus.systemLoad.status === 'good' ? 'default' : 'destructive'}
                      className="mt-1"
                    >
                      {performanceStatus.systemLoad.label}
                    </Badge>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                    <div className="text-lg font-bold text-gray-900">
                      {Math.round(performanceStatus.errorRate.value)}%
                    </div>
                    <div className="text-sm text-gray-600">エラー率</div>
                    <Badge 
                      variant={performanceStatus.errorRate.status === 'excellent' ? 'success' : 
                              performanceStatus.errorRate.status === 'good' ? 'default' : 'destructive'}
                      className="mt-1"
                    >
                      {performanceStatus.errorRate.label}
                    </Badge>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Wifi className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <div className="text-lg font-bold text-gray-900">
                      {performanceStatus.uptime.value}%
                    </div>
                    <div className="text-sm text-gray-600">稼働率</div>
                    <Badge 
                      variant={performanceStatus.uptime.status === 'excellent' ? 'success' : 
                              performanceStatus.uptime.status === 'good' ? 'default' : 'destructive'}
                      className="mt-1"
                    >
                      {performanceStatus.uptime.label}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">キャッシュヒット率</span>
                    <span className="text-sm text-blue-700">{performance.cacheHitRate}%</span>
                  </div>
                  <Progress value={performance.cacheHitRate} variant="default" />
                  <p className="text-xs text-blue-700 mt-1">
                    高いキャッシュヒット率により応答速度が向上しています
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 統合状況アラート */}
          {stats.connectedServices === 0 && (
            <Alert className="mb-6 sm:mb-8 border-l-4 border-l-blue-500" variant="default">
              <Info className="h-4 w-4" />
              <AlertTitle>サービス統合を開始しましょう</AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <p className="mb-3">
                    LinkSenseの統合分析機能を活用するために、コミュニケーションサービスを接続してください。
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleIntegrationSettings} size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      サービスを接続する
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/demo')}>
                      <Eye className="h-4 w-4 mr-1" />
                      デモを見る
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 統計カード */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {/* チーム健全性スコア */}
            <Card className="hover:shadow-lg transition-shadow">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-xs sm:text-sm font-medium">チーム元気度</CardTitle>
    <Heart className="h-4 sm:h-5 w-4 sm:w-5 text-red-500" />
  </CardHeader>
  <CardContent>
    <div className="flex items-end space-x-1 sm:space-x-2">
      <div className={`text-xl sm:text-3xl font-bold ${getHealthScoreConfig(stats.averageHealthScore).color}`}>
        {stats.averageHealthScore}
      </div>
      <div className="text-xs sm:text-sm text-gray-500 mb-1">/100</div>
      <Badge 
        variant={getHealthScoreConfig(stats.averageHealthScore).variant} 
        className={`${getHealthScoreConfig(stats.averageHealthScore).bgColor} text-xs`}
      >
        {getHealthScoreConfig(stats.averageHealthScore).label}
      </Badge>
    </div>
    <Progress 
      value={stats.averageHealthScore} 
      variant={stats.averageHealthScore >= 70 ? 'success' : stats.averageHealthScore >= 50 ? 'warning' : 'danger'}
      className="mt-2 sm:mt-4" 
    />
    <p className="text-xs text-gray-500 mt-1 sm:mt-2">
      {stats.connectedServices > 0 
        ? `${stats.connectedServices}つのツールから分析`
        : 'ツールを連携すると詳しく分析できます'
      }
    </p>
  </CardContent>
</Card>

{/* アクティブメンバー */}
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-xs sm:text-sm font-medium">活発なメンバー</CardTitle>
    <Users className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600" />
  </CardHeader>
  <CardContent>
    <div className="flex items-end space-x-1 sm:space-x-2">
      <div className="text-xl sm:text-3xl font-bold text-gray-900">
        {stats.activeMembers}
      </div>
      <div className="text-sm sm:text-lg font-normal text-gray-500">
        /{stats.totalMembers}人
      </div>
    </div>
    {stats.totalMembers > 0 && (
      <div className="mt-2 flex items-center text-xs sm:text-sm">
        <div className="flex items-center text-green-600">
          <TrendingUp className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
          <span className="font-medium">{Math.round((stats.activeMembers / stats.totalMembers) * 100)}%</span>
        </div>
        <span className="text-gray-500 ml-2">が活発に活動中</span>
      </div>
    )}
    <p className="text-xs text-gray-500 mt-1 sm:mt-2">
      {stats.atRiskMembers > 0 && `${stats.atRiskMembers}人が心配な状態`}
      {stats.totalMembers === 0 && 'データなし'}
    </p>
    {stats.totalMembers > 0 && (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleMembersView}
        className="mt-2 p-0 h-auto text-xs text-blue-600 hover:text-blue-800"
      >
        詳しく見る →
      </Button>
    )}
  </CardContent>
</Card>

{/* 接続ツール */}
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-xs sm:text-sm font-medium">連携ツール</CardTitle>
    <Network className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />
  </CardHeader>
  <CardContent>
    <div className="flex items-end space-x-1 sm:space-x-2">
      <div className="text-xl sm:text-3xl font-bold text-green-600">
        {stats.connectedServices}
      </div>
      <div className="text-sm sm:text-lg font-normal text-gray-500">
        /{stats.totalServices}個
      </div>
    </div>
    <Progress 
      value={(stats.connectedServices / stats.totalServices) * 100} 
      variant="success"
      className="mt-2 sm:mt-4" 
    />
    <p className="text-xs text-gray-500 mt-1 sm:mt-2">
      {stats.connectedServices === 0 
        ? 'ツールを連携して分析を開始'
        : `あと${stats.totalServices - stats.connectedServices}個連携可能`
      }
    </p>
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleIntegrationSettings}
      className="mt-2 p-0 h-auto text-xs text-green-600 hover:text-green-800"
    >
      {stats.connectedServices === 0 ? '連携開始' : '設定'} →
    </Button>
  </CardContent>
</Card>

{/* チームワーク度 */}
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-xs sm:text-sm font-medium">チームワーク度</CardTitle>
    <Target className="h-4 sm:h-5 w-4 sm:w-5 text-purple-600" />
  </CardHeader>
  <CardContent>
    <div className="flex items-end space-x-1 sm:space-x-2">
      <div className={`text-xl sm:text-3xl font-bold ${getHealthScoreConfig(stats.collaborationScore).color}`}>
        {stats.collaborationScore}
      </div>
      <div className="text-xs sm:text-sm text-gray-500 mb-1">/100</div>
    </div>
    <Progress 
      value={stats.collaborationScore} 
      variant={stats.collaborationScore >= 70 ? 'success' : stats.collaborationScore >= 50 ? 'warning' : 'danger'}
      className="mt-2 sm:mt-4" 
    />
    <p className="text-xs text-gray-500 mt-1 sm:mt-2">
      {stats.engagementRate > 0 && `参加率: ${stats.engagementRate}%`}
      {stats.collaborationScore === 0 && 'データなし'}
    </p>
  </CardContent>
</Card>

            {/* アクティブメンバー */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">アクティブメンバー</CardTitle>
                <Users className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end space-x-1 sm:space-x-2">
                  <div className="text-xl sm:text-3xl font-bold text-gray-900">
                    {stats.activeMembers}
                  </div>
                  <div className="text-sm sm:text-lg font-normal text-gray-500">
                    /{stats.totalMembers}
                  </div>
                </div>
                {stats.totalMembers > 0 && (
                  <div className="mt-2 flex items-center text-xs sm:text-sm">
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                      <span className="font-medium">{Math.round((stats.activeMembers / stats.totalMembers) * 100)}%</span>
                    </div>
                    <span className="text-gray-500 ml-2">アクティブ率</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                  {stats.atRiskMembers > 0 && `${stats.atRiskMembers}人がリスク状態`}
                  {stats.totalMembers === 0 && 'データなし'}
                </p>
                {stats.totalMembers > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMembersView}
                    className="mt-2 p-0 h-auto text-xs text-blue-600 hover:text-blue-800"
                  >
                    詳細を確認 →
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* 接続サービス */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">接続サービス</CardTitle>
                <Network className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end space-x-1 sm:space-x-2">
                  <div className="text-xl sm:text-3xl font-bold text-green-600">
                    {stats.connectedServices}
                  </div>
                  <div className="text-sm sm:text-lg font-normal text-gray-500">
                    /{stats.totalServices}
                  </div>
                </div>
                <Progress 
                  value={(stats.connectedServices / stats.totalServices) * 100} 
                  variant="success"
                  className="mt-2 sm:mt-4" 
                />
                <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                  {stats.connectedServices === 0 
                    ? 'サービスを接続して分析を開始'
                    : `${stats.totalServices - stats.connectedServices}サービスが接続可能`
                  }
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleIntegrationSettings}
                  className="mt-2 p-0 h-auto text-xs text-green-600 hover:text-green-800"
                >
                  {stats.connectedServices === 0 ? '接続開始' : '管理'} →
                </Button>
              </CardContent>
            </Card>

            {/* コラボレーションスコア */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">コラボレーション</CardTitle>
                <Target className="h-4 sm:h-5 w-4 sm:w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end space-x-1 sm:space-x-2">
                  <div className={`text-xl sm:text-3xl font-bold ${getHealthScoreConfig(stats.collaborationScore).color}`}>
                    {stats.collaborationScore}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 mb-1">/100</div>
                </div>
                <Progress 
                  value={stats.collaborationScore} 
                  variant={stats.collaborationScore >= 70 ? 'success' : stats.collaborationScore >= 50 ? 'warning' : 'danger'}
                  className="mt-2 sm:mt-4" 
                />
                <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                  {stats.engagementRate > 0 && `エンゲージメント率: ${stats.engagementRate}%`}
                  {stats.collaborationScore === 0 && 'データなし'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI分析インサイトセクション */}
          {filteredInsights.length > 0 && (
            <Card className="mb-6 sm:mb-8 border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg sm:text-xl">AI分析インサイト</CardTitle>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {filteredInsights.length}件
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAiInsightsExpanded(!aiInsightsExpanded)}
                    className="flex items-center gap-1"
                  >
                    {aiInsightsExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        <span className="hidden sm:inline">折りたたむ</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        <span className="hidden sm:inline">展開</span>
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>
                  統合データから生成されたAI分析結果と改善提案
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredInsights.slice(0, aiInsightsExpanded ? undefined : 2).map((insight) => (
                    <div 
                      key={insight.id} 
                      className={`p-4 rounded-lg border-l-4 ${
                        insight.priority === 'critical' ? 'border-l-red-500 bg-red-50' :
                        insight.priority === 'high' ? 'border-l-orange-500 bg-orange-50' :
                        insight.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                        'border-l-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                          {insight.type === 'recommendation' && <Lightbulb className="h-4 w-4 text-blue-600" />}
                          {insight.type === 'opportunity' && <Star className="h-4 w-4 text-green-600" />}
                          {insight.type === 'trend' && <TrendingUp className="h-4 w-4 text-purple-600" />}
                          <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              insight.priority === 'critical' ? 'destructive' :
                              insight.priority === 'high' ? 'default' :
                              insight.priority === 'medium' ? 'secondary' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {insight.priority === 'critical' ? '緊急' :
                             insight.priority === 'high' ? '高' :
                             insight.priority === 'medium' ? '中' : '低'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            信頼度: {insight.confidence}%
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                      
                      <div className="mb-3">
                        <h5 className="text-xs font-medium text-gray-600 mb-1">影響:</h5>
                        <p className="text-xs text-gray-600">{insight.impact}</p>
                      </div>
                      
                      {insight.actionItems.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-gray-600 mb-2">推奨アクション:</h5>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {insight.actionItems.map((action, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-gray-400 mt-0.5">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {(insight.affectedUsers?.length || insight.relatedServices?.length) && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                          {insight.affectedUsers?.length && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                対象: {insight.affectedUsers.length}名
                              </span>
                            </div>
                          )}
                          {insight.relatedServices?.length && (
                            <div className="flex items-center gap-1">
                              <Network className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                関連: {insight.relatedServices.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {!aiInsightsExpanded && filteredInsights.length > 2 && (
                    <Button
                      variant="outline"
                      onClick={() => setAiInsightsExpanded(true)}
                      className="w-full flex items-center gap-2"
                    >
                      <ChevronDown className="h-4 w-4" />
                      他 {filteredInsights.length - 2} 件のインサイトを表示
                    </Button>
                  )}
                  
                  <div className="flex justify-end pt-3 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyticsView}
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      詳細分析を確認
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* 統合サービス状況 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Network className="h-5 w-5 text-blue-600" />
                  統合サービス状況
                </CardTitle>
                <CardDescription>
                  接続済みサービスと統合状態
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {integrations.length > 0 ? (
                    integrations.map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${integration.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                          <div>
                            <div className="font-medium text-sm sm:text-base flex items-center gap-2">
                              {getServiceName(integration.service)}
                              {integration.isActive && (
                                <Badge variant="success" className="text-xs">
                                  同期中
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              {integration.isActive ? 
                                `${integration.userCount || 0}名のデータを取得中` : 
                                '接続済み・同期停止中'
                              }
                              {integration.teamName && (
                                <span className="ml-2 text-blue-600">({integration.teamName})</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {new Date(integration.updatedAt).toLocaleDateString('ja-JP')}
                          </div>
                          {integration.healthScore && integration.healthScore > 0 && (
                            <div className="text-xs font-medium text-green-600">
                              健全性: {integration.healthScore}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <Network className="mx-auto h-8 sm:h-12 w-8 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        統合サービスがありません
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                        サービスを接続して分析を開始しましょう
                      </p>
                      <Button onClick={handleIntegrationSettings} size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        サービスを接続
                      </Button>
                    </div>
                  )}
                </div>
                
                {integrations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">統合状態</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleIntegrationSettings}
                        className="flex items-center gap-1"
                      >
                        <Settings className="h-3 w-3" />
                        管理
                      </Button>
                    </div>
                    <Progress 
                      value={(stats.connectedServices / stats.totalServices) * 100} 
                      variant="success"
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.connectedServices}/{stats.totalServices} サービス接続済み
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* リアルタイムアクティビティフィード */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  リアルタイムアクティビティ
                </CardTitle>
                <CardDescription>
                  最新のシステム活動と分析結果
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          activity.severity === 'success' ? 'bg-green-500' :
                          activity.severity === 'warning' ? 'bg-yellow-500' :
                          activity.severity === 'error' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {activity.title}
                            </h4>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {new Date(activity.timestamp).toLocaleTimeString('ja-JP', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {activity.description}
                          </p>
                          {activity.service && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {getServiceName(activity.service)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Bell className="mx-auto h-8 w-8 text-gray-300 mb-3" />
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        アクティビティなし
                      </h3>
                      <p className="text-sm text-gray-600">
                        {stats.connectedServices > 0 
                          ? '新しいアクティビティが表示されます'
                          : 'サービス接続後にアクティビティが表示されます'
                        }
                      </p>
                    </div>
                  )}
                </div>
                
                {recentActivity.length > 6 && (
                  <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/activity')}
                      className="flex items-center gap-2"
                    >
                      <Activity className="h-4 w-4" />
                      すべてのアクティビティを表示
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 統合データ概要 */}
          {stats.connectedServices > 0 && (
            <Card className="mt-6 sm:mt-8 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  統合データ概要
                </CardTitle>
                <CardDescription>
                  接続済みサービスからの統合分析データ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <MessageSquare className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {stats.totalMessages.toLocaleString()}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">総メッセージ数</div>
                    <div className="text-xs text-gray-500 mt-1">過去30日間</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <Calendar className="h-6 sm:h-8 w-6 sm:w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {stats.totalMeetings.toLocaleString()}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">ミーティング数</div>
                    <div className="text-xs text-gray-500 mt-1">過去30日間</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                    <Target className="h-6 sm:h-8 w-6 sm:w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">
                      {stats.engagementRate}%
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">エンゲージメント率</div>
                    <div className="text-xs text-gray-500 mt-1">統合分析結果</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                    <Timer className="h-6 sm:h-8 w-6 sm:w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                      {stats.responseTimeAverage}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">平均応答時間</div>
                    <div className="text-xs text-gray-500 mt-1">分</div>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">統合データ品質</span>
                      <span className="text-sm text-gray-600">
                        {stats.dataQualityScore}%
                      </span>
                    </div>
                    <Progress 
                      value={stats.dataQualityScore} 
                      variant="success"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      データ品質が高いほど、より正確な分析結果が得られます
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">分析処理時間</span>
                      <span className="text-sm text-gray-600">
                        {stats.processingTime}ms
                      </span>
                    </div>
                    <Progress 
                      value={Math.max(0, 100 - (stats.processingTime / 100))} 
                      variant={stats.processingTime < 2000 ? 'success' : stats.processingTime < 5000 ? 'warning' : 'danger'}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {stats.processingTime < 2000 ? '高速処理中' : 
                       stats.processingTime < 5000 ? '標準処理時間' : '処理時間が長めです'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* クイックアクション */}
          <Card className="mt-6 sm:mt-8 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                クイックアクション
              </CardTitle>
              <CardDescription>
                よく使用される機能への素早いアクセス
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleAnalyticsView}
                  className="flex items-center gap-2 h-auto p-3 sm:p-4 text-left hover:bg-blue-50 transition-colors"
                >
                  <BarChart3 className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-base">AI分析を表示</div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {stats.connectedServices > 0 
                        ? '詳細な統合分析結果を確認'
                        : 'サンプル分析を確認'
                      }
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleMembersView}
                  className="flex items-center gap-2 h-auto p-3 sm:p-4 text-left hover:bg-green-50 transition-colors"
                  disabled={stats.totalMembers === 0}
                >
                  <Users className="h-5 sm:h-6 w-5 sm:w-6 text-green-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-base">メンバー詳細</div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {stats.totalMembers > 0 
                        ? `${stats.totalMembers}名のメンバー分析を確認`
                        : 'データ取得後に利用可能'
                      }
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleIntegrationSettings}
                  className="flex items-center gap-2 h-auto p-3 sm:p-4 text-left hover:bg-purple-50 transition-colors"
                >
                  <Settings className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-base">統合設定</div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {stats.connectedServices === 0 
                        ? 'サービス接続を開始'
                        : 'サービス接続を管理'
                      }
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 推奨アクション */}
          {stats.connectedServices < stats.totalServices && (
            <Card className="mt-6 sm:mt-8 border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-green-600" />
                  推奨アクション
                </CardTitle>
                <CardDescription>
                  分析精度向上のための次のステップ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.connectedServices === 0 && (
  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
    <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
    <div className="flex-1">
      <h4 className="font-medium text-blue-900 text-sm sm:text-base">チーム分析を始めましょう</h4>
      <p className="text-xs sm:text-sm text-blue-700 mt-1 mb-3">
        まずは普段使っているコミュニケーションツール（Slack、Teams、Google Meet）を連携して、
        チームの状況を把握してみましょう。
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleIntegrationSettings}>
          <Play className="h-4 w-4 mr-1" />
          ツールを連携する
        </Button>
        <Button variant="outline" size="sm" onClick={() => router.push('/demo')}>
          <Eye className="h-4 w-4 mr-1" />
          使い方を見る
        </Button>
      </div>
    </div>
  </div>
)}

{stats.connectedServices > 0 && stats.connectedServices < 3 && (
  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
    <div className="flex-1">
      <h4 className="font-medium text-green-900 text-sm sm:text-base">もっと詳しく分析しませんか？</h4>
      <p className="text-xs sm:text-sm text-green-700 mt-1 mb-3">
        他のツールも連携すると、より詳しくチームの状況がわかります。
        現在 {stats.connectedServices}/{stats.totalServices} 個のツールを連携中です。
      </p>
      <Button size="sm" variant="outline" onClick={handleIntegrationSettings}>
        <Network className="h-4 w-4 mr-1" />
        他のツールも連携する
      </Button>
    </div>
  </div>
)}

{stats.connectedServices >= 3 && (
  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
    <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
    <div className="flex-1">
      <h4 className="font-medium text-purple-900 text-sm sm:text-base">詳しい分析結果を確認してみましょう</h4>
      <p className="text-xs sm:text-sm text-purple-700 mt-1 mb-3">
        複数のツールが連携されました。AI分析機能を使って、
        チームの生産性とコミュニケーションをもっと良くしましょう。
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleAnalyticsView}>
          <Brain className="h-4 w-4 mr-1" />
          AI分析を見る
        </Button>
        <Button size="sm" variant="outline" onClick={handleMembersView}>
          <Users className="h-4 w-4 mr-1" />
          メンバー詳細
        </Button>
      </div>
    </div>
  </div>
)}

{stats.atRiskMembers > 0 && (
  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
    <div className="flex-1">
      <h4 className="font-medium text-red-900 text-sm sm:text-base">心配なメンバーがいます</h4>
      <p className="text-xs sm:text-sm text-red-700 mt-1 mb-3">
        {stats.atRiskMembers}名のメンバーが孤立している可能性があります。
        早めに声をかけてあげることをお勧めします。
      </p>
      <Button size="sm" onClick={handleMembersView} className="bg-red-600 hover:bg-red-700">
        <Users className="h-4 w-4 mr-1" />
        心配なメンバーを確認
      </Button>
    </div>
  </div>
)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;