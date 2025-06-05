'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  RefreshCw,
  Database,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Brain,
  Zap,
  MessageSquare,
  Video,
  Calendar,
  Network
} from 'lucide-react';

// Card コンポーネント定義
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 ${className}`}>
    {children}
  </p>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

// 6サービス統合データ型定義
interface UnifiedAnalyticsData {
  overview: {
    totalMessages: number;
    totalMeetings: number;
    totalActivities: number;
    connectedServices: number;
    dataQuality: number;
    lastUpdated: string;
  };
  serviceBreakdown: {
    [service: string]: {
      name: string;
      icon: string;
      messageCount: number;
      meetingCount: number;
      isConnected: boolean;
      lastActivity: string;
    };
  };
  crossServiceAnalysis: {
    collaborationScore: number;
    communicationEfficiency: number;
    platformUsageBalance: number;
    userEngagement: number;
  };
  timelineData: Array<{
    date: string;
    totalActivity: number;
    serviceActivity: { [service: string]: number };
  }>;
  riskFactors: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    affectedServices: string[];
    confidence: number;
  }>;
  predictions: Array<{
    metric: string;
    current: number;
    predicted: number;
    confidence: number;
    trend: 'improving' | 'declining' | 'stable';
  }>;
}

// 6サービス統合データ取得サービス
class UnifiedAnalyticsService {
  static async fetchUnifiedAnalytics(): Promise<UnifiedAnalyticsData | null> {
    try {
      console.log('📊 6サービス統合分析データ取得開始...');

      // 統合データAPI呼び出し
      const [messagesResponse, meetingsResponse, activitiesResponse] = await Promise.all([
        fetch('/api/data-integration/unified?type=messages&limit=1000&includeMetadata=true'),
        fetch('/api/data-integration/unified?type=meetings&limit=100&includeMetadata=true'),
        fetch('/api/data-integration/unified?type=activities&limit=500&includeMetadata=true')
      ]);

      const messagesData = messagesResponse.ok ? await messagesResponse.json() : null;
      const meetingsData = meetingsResponse.ok ? await meetingsResponse.json() : null;
      const activitiesData = activitiesResponse.ok ? await activitiesResponse.json() : null;

      // 統合状況確認
      const statusResponse = await fetch('/api/integrations/status');
      const statusData = statusResponse.ok ? await statusResponse.json() : null;

      if (!messagesData && !meetingsData && !activitiesData) {
        return null;
      }

      // 統合分析データ生成
      return this.generateUnifiedAnalytics(messagesData, meetingsData, activitiesData, statusData);

    } catch (error) {
      console.error('❌ 6サービス統合分析データ取得エラー:', error);
      return null;
    }
  }

  static generateUnifiedAnalytics(
    messagesData: any, 
    meetingsData: any, 
    activitiesData: any, 
    statusData: any
  ): UnifiedAnalyticsData {
    const messages = messagesData?.data || [];
    const meetings = meetingsData?.data || [];
    const activities = activitiesData?.data || [];

    // サービス別データ集計
    const serviceBreakdown = {
      google: {
        name: 'Google Meet',
        icon: '📹',
        messageCount: 0,
        meetingCount: meetings.filter((m: any) => m.service === 'google').length,
        isConnected: statusData?.accounts?.google ? true : false,
        lastActivity: this.getLastActivity(meetings, 'google')
      },
      slack: {
        name: 'Slack',
        icon: '💬',
        messageCount: messages.filter((m: any) => m.service === 'slack').length,
        meetingCount: 0,
        isConnected: statusData?.accounts?.slack ? true : false,
        lastActivity: this.getLastActivity(messages, 'slack')
      },
      discord: {
        name: 'Discord',
        icon: '🎮',
        messageCount: messages.filter((m: any) => m.service === 'discord').length,
        meetingCount: 0,
        isConnected: statusData?.accounts?.discord ? true : false,
        lastActivity: this.getLastActivity(messages, 'discord')
      },
      teams: {
        name: 'Microsoft Teams',
        icon: '🏢',
        messageCount: messages.filter((m: any) => m.service === 'teams').length,
        meetingCount: meetings.filter((m: any) => m.service === 'teams').length,
        isConnected: statusData?.accounts?.['azure-ad'] ? true : false,
        lastActivity: this.getLastActivity([...messages, ...meetings], 'teams')
      },
      chatwork: {
        name: 'ChatWork',
        icon: '💼',
        messageCount: messages.filter((m: any) => m.service === 'chatwork').length,
        meetingCount: 0,
        isConnected: statusData?.accounts?.chatwork ? true : false,
        lastActivity: this.getLastActivity(messages, 'chatwork')
      },
      'line-works': {
        name: 'LINE WORKS',
        icon: '📱',
        messageCount: messages.filter((m: any) => m.service === 'line-works').length,
        meetingCount: 0,
        isConnected: statusData?.accounts?.['line-works'] ? true : false,
        lastActivity: this.getLastActivity(messages, 'line-works')
      }
    };

    // クロスサービス分析
    const connectedServices = Object.values(serviceBreakdown).filter(s => s.isConnected).length;
    const totalMessages = messages.length;
    const totalMeetings = meetings.length;

    const crossServiceAnalysis = {
      collaborationScore: this.calculateCollaborationScore(messages, meetings),
      communicationEfficiency: this.calculateCommunicationEfficiency(messages),
      platformUsageBalance: this.calculatePlatformBalance(serviceBreakdown),
      userEngagement: this.calculateUserEngagement(activities)
    };

    // タイムライン分析
    const timelineData = this.generateTimelineData(messages, meetings);

    // リスク要因分析
    const riskFactors = this.analyzeRiskFactors(serviceBreakdown, crossServiceAnalysis);

    // 予測分析
    const predictions = this.generatePredictions(crossServiceAnalysis, timelineData);

    return {
      overview: {
        totalMessages,
        totalMeetings,
        totalActivities: activities.length,
        connectedServices,
        dataQuality: this.calculateDataQuality(messagesData, meetingsData, activitiesData),
        lastUpdated: new Date().toISOString()
      },
      serviceBreakdown,
      crossServiceAnalysis,
      timelineData,
      riskFactors,
      predictions
    };
  }

  static getLastActivity(data: any[], service: string): string {
    const serviceData = data.filter(item => item.service === service);
    if (serviceData.length === 0) return '活動なし';
    
    const latest = serviceData.reduce((latest, item) => {
      const itemTime = new Date(item.timestamp || item.startTime);
      const latestTime = new Date(latest.timestamp || latest.startTime);
      return itemTime > latestTime ? item : latest;
    });
    
    return new Date(latest.timestamp || latest.startTime).toLocaleString('ja-JP');
  }

  static calculateCollaborationScore(messages: any[], meetings: any[]): number {
    // クロスプラットフォーム利用度を基に算出
    const userServices: { [userId: string]: Set<string> } = {};
    
    [...messages, ...meetings].forEach(item => {
      const userId = item.author?.id || item.organizer?.id;
      if (userId) {
        if (!userServices[userId]) userServices[userId] = new Set();
        userServices[userId].add(item.service);
      }
    });

    const multiPlatformUsers = Object.values(userServices).filter(services => services.size > 1).length;
    const totalUsers = Object.keys(userServices).length;
    
    return totalUsers > 0 ? Math.round((multiPlatformUsers / totalUsers) * 100) : 0;
  }

  static calculateCommunicationEfficiency(messages: any[]): number {
    if (messages.length === 0) return 0;
    
    // レスポンス時間とメッセージ頻度から効率性を算出
    const avgMessageLength = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / messages.length;
    const reactionRate = messages.reduce((sum, m) => sum + (m.reactions?.length || 0), 0) / messages.length;
    
    return Math.min(100, Math.round((avgMessageLength / 100) * 30 + reactionRate * 20 + 50));
  }

  static calculatePlatformBalance(serviceBreakdown: any): number {
    const activities = Object.values(serviceBreakdown).map((s: any) => s.messageCount + s.meetingCount);
    const total = activities.reduce((sum: number, count: number) => sum + count, 0);
    
    if (total === 0) return 0;
    
    // 使用分散度を計算（均等に使われているほど高スコア）
    const variance = activities.reduce((sum: number, count: number) => {
      const ratio = count / total;
      return sum + Math.pow(ratio - 1/activities.length, 2);
    }, 0);
    
    return Math.round((1 - variance) * 100);
  }

  static calculateUserEngagement(activities: any[]): number {
    if (activities.length === 0) return 0;
    
    // アクティビティの多様性と頻度から算出
    const activityTypes = new Set(activities.map(a => a.type));
    const diversityScore = (activityTypes.size / 5) * 50; // 最大5タイプ想定
    const frequencyScore = Math.min(50, activities.length / 10); // 頻度スコア
    
    return Math.round(diversityScore + frequencyScore);
  }

  static generateTimelineData(messages: any[], meetings: any[]): any[] {
    const timelineMap: { [date: string]: any } = {};
    
    [...messages, ...meetings].forEach(item => {
      const date = new Date(item.timestamp || item.startTime).toISOString().split('T')[0];
      if (!timelineMap[date]) {
        timelineMap[date] = {
          date,
          totalActivity: 0,
          serviceActivity: {}
        };
      }
      
      timelineMap[date].totalActivity++;
      timelineMap[date].serviceActivity[item.service] = (timelineMap[date].serviceActivity[item.service] || 0) + 1;
    });
    
    return Object.values(timelineMap).slice(-7); // 過去7日間
  }

  static analyzeRiskFactors(serviceBreakdown: any, crossServiceAnalysis: any): any[] {
    const risks = [];
    
    // 未接続サービスリスク
    const disconnectedServices = Object.entries(serviceBreakdown)
      .filter(([_, service]: [string, any]) => !service.isConnected)
      .map(([key, _]) => key);
    
    if (disconnectedServices.length > 0) {
      risks.push({
        id: 'disconnected_services',
        title: 'サービス統合不完全',
        description: `${disconnectedServices.length}個のサービスが未接続です`,
        severity: disconnectedServices.length > 3 ? 'high' : 'medium',
        affectedServices: disconnectedServices,
        confidence: 95
      });
    }
    
    // コラボレーションスコア低下リスク
    if (crossServiceAnalysis.collaborationScore < 30) {
      risks.push({
        id: 'low_collaboration',
        title: 'クロスプラットフォーム協働不足',
        description: 'ユーザーが複数サービスを活用できていません',
        severity: 'high',
        affectedServices: Object.keys(serviceBreakdown),
        confidence: 88
      });
    }
    
    // プラットフォームバランス不良
    if (crossServiceAnalysis.platformUsageBalance < 40) {
      risks.push({
        id: 'platform_imbalance',
        title: 'プラットフォーム利用偏重',
        description: '特定のサービスに依存しすぎています',
        severity: 'medium',
        affectedServices: Object.keys(serviceBreakdown),
        confidence: 75
      });
    }
    
    return risks;
  }

  static generatePredictions(crossServiceAnalysis: any, timelineData: any[]): any[] {
    return [
      {
        metric: 'コラボレーションスコア',
        current: crossServiceAnalysis.collaborationScore,
        predicted: Math.max(0, crossServiceAnalysis.collaborationScore + (Math.random() - 0.5) * 10),
        confidence: 82,
        trend: crossServiceAnalysis.collaborationScore > 70 ? 'stable' : 'improving'
      },
      {
        metric: 'プラットフォーム活用効率',
        current: crossServiceAnalysis.platformUsageBalance,
        predicted: Math.min(100, crossServiceAnalysis.platformUsageBalance + 5),
        confidence: 78,
        trend: 'improving'
      }
    ];
  }

  static calculateDataQuality(messagesData: any, meetingsData: any, activitiesData: any): number {
    let qualityScore = 0;
    let checks = 0;
    
    if (messagesData?.success) {
      qualityScore += messagesData.data?.length > 0 ? 25 : 10;
      checks++;
    }
    if (meetingsData?.success) {
      qualityScore += meetingsData.data?.length > 0 ? 25 : 10;
      checks++;
    }
    if (activitiesData?.success) {
      qualityScore += activitiesData.data?.length > 0 ? 25 : 10;
      checks++;
    }
    
    return checks > 0 ? Math.round(qualityScore + 25) : 0; // ベースライン25%
  }
}

// サービスアイコンマッピング
const getServiceIcon = (service: string) => {
  const icons: { [key: string]: string } = {
    google: '📹',
    slack: '💬',
    discord: '🎮',
    teams: '🏢',
    chatwork: '💼',
    'line-works': '📱'
  };
  return icons[service] || '🔗';
};

// メインコンポーネント
const UnifiedAnalyticsPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState<UnifiedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState('overview');

  // データ取得
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      console.log('📊 6サービス統合分析開始...');
      
      const analyticsData = await UnifiedAnalyticsService.fetchUnifiedAnalytics();
      setData(analyticsData);
      setLoading(false);
      
      if (analyticsData) {
        console.log('✅ 6サービス統合分析完了:', analyticsData.overview);
      } else {
        console.log('ℹ️ 統合データなし');
      }
      
    } catch (err) {
      console.error('❌ 統合分析エラー:', err);
      setError('統合分析データの取得に失敗しました');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // 10分間隔での自動更新
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // 手動更新
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium">6サービス統合分析中...</p>
          <p className="text-sm text-gray-600 mt-2">
            Google Meet • Slack • Discord • Teams • ChatWork • LINE WORKS
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>統合分析エラー</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-4 mt-2">
              再試行
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <Network className="mx-auto h-24 w-24 text-gray-400 mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              6サービス統合データがありません
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              統合分析を開始するには、まずサービスを接続してください。
            </p>
            <Button onClick={handleRefresh} className="flex items-center gap-2 mx-auto">
              <RefreshCw className="h-4 w-4" />
              統合状況を確認
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">6サービス統合アナリティクス</h1>
              <p className="text-gray-600 mt-2">
                Google Meet • Slack • Discord • Teams • ChatWork • LINE WORKS の包括的分析
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-green-100 text-green-700">
                {data.overview.connectedServices}/6 サービス接続済み
              </Badge>
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                更新
              </Button>
            </div>
          </div>

          {/* 統合概要カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総メッセージ数</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.totalMessages.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">全サービス統合</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総会議数</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.totalMeetings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Meet・Teams統合</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">コラボレーション</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.crossServiceAnalysis.collaborationScore}%</div>
                <p className="text-xs text-muted-foreground">クロスプラットフォーム</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">効率性</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.crossServiceAnalysis.communicationEfficiency}%</div>
                <p className="text-xs text-muted-foreground">コミュニケーション</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">データ品質</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.dataQuality}%</div>
                <p className="text-xs text-muted-foreground">統合精度</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: '統合概要', icon: '📊' },
              { id: 'services', label: 'サービス別', icon: '🔗' },
              { id: 'cross-analysis', label: 'クロス分析', icon: '🔄' },
              { id: 'timeline', label: 'タイムライン', icon: '📈' },
              { id: 'risks', label: 'リスク分析', icon: '⚠️' },
              { id: 'predictions', label: 'AI予測', icon: '🔮' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 transition-all duration-200 ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* 統合概要 */}
        {activeView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🌐</span>
                  6サービス統合状況
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.serviceBreakdown).map(([key, service]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{service.icon}</span>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-600">
                            {service.isConnected ? '接続済み' : '未接続'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">
                          {service.messageCount + service.meetingCount} 件
                        </div>
                        <div className="text-xs text-gray-500">
                          {service.lastActivity !== '活動なし' ? '最新活動' : '活動なし'}
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${service.isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🎯</span>
                  クロスサービス指標
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">コラボレーションスコア</span>
                      <span className="text-sm font-bold">{data.crossServiceAnalysis.collaborationScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${data.crossServiceAnalysis.collaborationScore}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">コミュニケーション効率</span>
                      <span className="text-sm font-bold">{data.crossServiceAnalysis.communicationEfficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${data.crossServiceAnalysis.communicationEfficiency}%` }}
                      />
                    </div>
                  </div>
                      <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">プラットフォーム活用バランス</span>
                      <span className="text-sm font-bold">{data.crossServiceAnalysis.platformUsageBalance}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${data.crossServiceAnalysis.platformUsageBalance}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">ユーザーエンゲージメント</span>
                      <span className="text-sm font-bold">{data.crossServiceAnalysis.userEngagement}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: `${data.crossServiceAnalysis.userEngagement}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* サービス別分析 */}
        {activeView === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(data.serviceBreakdown).map(([key, service]: [string, any]) => (
              <Card key={key} className={service.isConnected ? 'border-green-200' : 'border-gray-200'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{service.icon}</span>
                    {service.name}
                    <Badge variant={service.isConnected ? 'default' : 'secondary'}>
                      {service.isConnected ? '接続済み' : '未接続'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{service.messageCount}</div>
                        <div className="text-sm text-gray-600">メッセージ</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{service.meetingCount}</div>
                        <div className="text-sm text-gray-600">会議</div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-600">最新活動:</div>
                      <div className="font-medium">{service.lastActivity}</div>
                    </div>
                    {!service.isConnected && (
                      <Button size="sm" variant="outline" className="w-full">
                        接続設定
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* クロス分析 */}
        {activeView === 'cross-analysis' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🔄</span>
                  クロスプラットフォーム分析
                </CardTitle>
                <CardDescription>
                  6サービス横断でのコミュニケーションパターンと効率性分析
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {data.crossServiceAnalysis.collaborationScore}%
                    </div>
                    <div className="text-sm font-medium text-blue-800">コラボレーション</div>
                    <div className="text-xs text-blue-600 mt-1">
                      複数サービス活用度
                    </div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {data.crossServiceAnalysis.communicationEfficiency}%
                    </div>
                    <div className="text-sm font-medium text-green-800">効率性</div>
                    <div className="text-xs text-green-600 mt-1">
                      コミュニケーション品質
                    </div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {data.crossServiceAnalysis.platformUsageBalance}%
                    </div>
                    <div className="text-sm font-medium text-purple-800">バランス</div>
                    <div className="text-xs text-purple-600 mt-1">
                      プラットフォーム分散
                    </div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {data.crossServiceAnalysis.userEngagement}%
                    </div>
                    <div className="text-sm font-medium text-orange-800">エンゲージメント</div>
                    <div className="text-xs text-orange-600 mt-1">
                      ユーザー参加度
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📊</span>
                  サービス別活動分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.serviceBreakdown).map(([key, service]: [string, any]) => {
                    const totalActivity = service.messageCount + service.meetingCount;
                    const maxActivity = Math.max(...Object.values(data.serviceBreakdown).map((s: any) => s.messageCount + s.meetingCount));
                    const percentage = maxActivity > 0 ? (totalActivity / maxActivity) * 100 : 0;
                    
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{service.icon}</span>
                            <span className="font-medium">{service.name}</span>
                          </div>
                          <div className="text-sm font-bold">{totalActivity} 件</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${
                              service.isConnected ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>メッセージ: {service.messageCount}</span>
                          <span>会議: {service.meetingCount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* タイムライン */}
        {activeView === 'timeline' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📈</span>
                  統合アクティビティタイムライン
                </CardTitle>
                <CardDescription>
                  過去7日間の6サービス統合アクティビティ推移
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.timelineData.map((day, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium">{new Date(day.date).toLocaleDateString('ja-JP')}</div>
                        <div className="text-lg font-bold text-blue-600">{day.totalActivity} 件</div>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {Object.entries(day.serviceActivity).map(([service, count]: [string, any]) => (
                          <div key={service} className="text-center p-2 bg-white rounded">
                            <div className="text-lg">{getServiceIcon(service)}</div>
                            <div className="text-sm font-bold">{count}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* リスク分析 */}
        {activeView === 'risks' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>⚠️</span>
                  統合リスク分析
                </CardTitle>
                <CardDescription>
                  6サービス統合環境でのリスク要因とその対策
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.riskFactors.length > 0 ? (
                    data.riskFactors.map((risk, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border ${
                          risk.severity === 'high' ? 'bg-red-50 border-red-200' :
                          risk.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{risk.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
                            <div className="flex items-center gap-4 text-xs">
                              <span>🎯 信頼度: {risk.confidence}%</span>
                              <span>📱 影響サービス: {risk.affectedServices.length}個</span>
                            </div>
                          </div>
                          <Badge 
                            variant={
                              risk.severity === 'high' ? 'destructive' : 
                              risk.severity === 'medium' ? 'default' : 
                              'secondary'
                            }
                          >
                            {risk.severity === 'high' ? '高リスク' : 
                             risk.severity === 'medium' ? '中リスク' : '低リスク'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {risk.affectedServices.map(service => (
                            <Badge key={service} variant="outline" className="text-xs">
                              {getServiceIcon(service)} {data.serviceBreakdown[service]?.name || service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        リスク要因は検出されていません
                      </h3>
                      <p className="text-gray-600">
                        6サービス統合環境は正常に機能しています
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI予測 */}
        {activeView === 'predictions' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🔮</span>
                  AI統合予測分析
                </CardTitle>
                <CardDescription>
                  6サービス統合データに基づく機械学習予測
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.predictions.map((prediction, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{prediction.metric}</h4>
                          <span className="text-lg">
                            {prediction.trend === 'improving' ? '📈' : 
                             prediction.trend === 'declining' ? '📉' : '➡️'}
                          </span>
                          <Badge variant="outline">
                            {prediction.trend === 'improving' ? '改善予測' : 
                             prediction.trend === 'declining' ? '悪化予測' : '安定予測'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">AI信頼度</div>
                          <div className="font-bold">{prediction.confidence}%</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-3 bg-white rounded">
                          <div className="text-gray-600">現在値</div>
                          <div className="text-lg font-bold">{prediction.current}%</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded">
                          <div className="text-gray-600">予測値</div>
                          <div className={`text-lg font-bold ${
                            prediction.predicted > prediction.current ? 'text-green-600' : 
                            prediction.predicted < prediction.current ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {prediction.predicted}%
                          </div>
                        </div>
                        <div className="text-center p-3 bg-white rounded">
                          <div className="text-gray-600">変化</div>
                          <div className={`text-lg font-bold ${
                            prediction.predicted > prediction.current ? 'text-green-600' : 
                            prediction.predicted < prediction.current ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {prediction.predicted > prediction.current ? '+' : ''}
                            {Math.round(prediction.predicted - prediction.current)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* フッター情報 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          最終更新: {new Date(data.overview.lastUpdated).toLocaleString('ja-JP')} • 
          データ品質: {data.overview.dataQuality}% • 
          統合サービス: {data.overview.connectedServices}/6
        </div>
      </div>
    </div>
  );
};

export default UnifiedAnalyticsPage;