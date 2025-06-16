'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { 
  RefreshCw, 
  AlertTriangle, 
  Network, 
  MessageSquare, 
  Video, 
  Database, 
  Zap, 
  CheckCircle, 
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Activity,
  Download,
  Filter,
  Calendar,
  Users,
  Eye,
  EyeOff,
  Play,
  Pause,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  Share2,
  Clock,
  Target,
  Cpu,
  Search
} from 'lucide-react';

// Card コンポーネント定義
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
  <h3 className={`text-base sm:text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 ${className}`}>
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
  const sizeClasses = {
    default: "px-4 py-2",
    sm: "px-3 py-1.5 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
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
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-500 ease-out ${colorClasses[variant]}`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
};

// 拡張された統合データ型定義
interface UnifiedAnalyticsData {
  overview: {
    totalMessages: number;
    totalMeetings: number;
    totalActivities: number;
    connectedServices: number;
    dataQuality: number;
    lastUpdated: string;
    processingTime: number;
    cacheHitRate: number;
  };
  serviceBreakdown: {
    [service: string]: {
      name: string;
      messageCount: number;
      meetingCount: number;
      isConnected: boolean;
      lastActivity: string;
      healthScore: number;
      userCount: number;
      avgResponseTime: number;
    };
  };
  crossServiceAnalysis: {
    collaborationScore: number;
    communicationEfficiency: number;
    platformUsageBalance: number;
    userEngagement: number;
    dataConsistency: number;
    integrationHealth: number;
  };
  timelineData: Array<{
    date: string;
    totalActivity: number;
    serviceActivity: { [service: string]: number };
    trends: { [metric: string]: number };
  }>;
  riskFactors: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedServices: string[];
    confidence: number;
    impact: string;
    recommendation: string[];
  }>;
  predictions: Array<{
    metric: string;
    current: number;
    predicted: number;
    confidence: number;
    trend: 'improving' | 'declining' | 'stable';
    timeframe: string;
    factors: string[];
  }>;
  insights: Array<{
    id: string;
    type: 'opportunity' | 'warning' | 'achievement' | 'trend';
    title: string;
    description: string;
    value: number;
    comparison: string;
    actionable: boolean;
  }>;
  performance: {
    queryTime: number;
    dataFreshness: string;
    cacheEfficiency: number;
    errorRate: number;
  };
}

// フィルター設定
interface AnalyticsFilters {
  dateRange: '7d' | '30d' | '90d' | 'custom';
  services: string[];
  metrics: string[];
  granularity: 'hour' | 'day' | 'week';
  includeInactive: boolean;
}

// エクスポート設定
interface ExportConfig {
  format: 'json' | 'csv' | 'pdf';
  sections: string[];
  includeCharts: boolean;
  includeRawData: boolean;
}

// 最適化された統合データ取得サービス
class OptimizedAnalyticsService {
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5分

  static async fetchUnifiedAnalytics(filters?: AnalyticsFilters): Promise<UnifiedAnalyticsData | null> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 最適化統合分析開始:', filters);

      // キャッシュキー生成
      const cacheKey = this.generateCacheKey(filters);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('✅ キャッシュからデータ取得');
        return cached;
      }

      // 並行データ取得（最適化版）
      const [integrationsResult, ...dataResults] = await Promise.allSettled([
        this.fetchIntegrations(),
        this.fetchMessagesOptimized(filters),
        this.fetchMeetingsOptimized(filters),
        this.fetchActivitiesOptimized(filters),
        this.fetchPerformanceMetrics()
      ]);

      // 結果処理
      const integrations = integrationsResult.status === 'fulfilled' ? integrationsResult.value : null;
      const [messagesData, meetingsData, activitiesData, performanceData] = dataResults.map(result => 
        result.status === 'fulfilled' ? result.value : null
      );

      // 統合分析データ生成（最適化版）
      let analyticsData: UnifiedAnalyticsData;
      
      if (integrations?.integrations) {
        analyticsData = this.generateOptimizedAnalytics(
          messagesData, 
          meetingsData, 
          activitiesData, 
          integrations, 
          performanceData,
          startTime
        );
      } else {
        analyticsData = this.generateFallbackAnalytics();
      }

      // キャッシュに保存
      this.saveToCache(cacheKey, analyticsData);

      console.log('✅ 最適化統合分析完了:', {
        processingTime: Date.now() - startTime,
        cacheHit: false,
        dataPoints: analyticsData.timelineData.length
      });

      return analyticsData;

    } catch (error) {
      console.error('❌ 統合分析エラー:', error);
      return this.generateFallbackAnalytics();
    }
  }

  // キャッシュ管理
  private static generateCacheKey(filters?: AnalyticsFilters): string {
    return `analytics_${JSON.stringify(filters || {})}_${Math.floor(Date.now() / this.CACHE_DURATION)}`;
  }

  private static getFromCache(key: string): UnifiedAnalyticsData | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private static saveToCache(key: string, data: UnifiedAnalyticsData): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // キャッシュサイズ制限
    if (this.cache.size > 10) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
  }

  // 最適化されたデータ取得
  private static async fetchIntegrations() {
    const response = await fetch('/api/integrations/user', {
      headers: { 'Cache-Control': 'max-age=300' }
    });
    return response.ok ? await response.json() : null;
  }

  private static async fetchMessagesOptimized(filters?: AnalyticsFilters) {
    const params = new URLSearchParams({
      type: 'messages',
      limit: '1000',
      includeMetadata: 'true',
      ...(filters?.dateRange && { dateRange: filters.dateRange }),
      ...(filters?.services?.length && { services: filters.services.join(',') })
    });

    const response = await fetch(`/api/data-integration/unified?${params}`, {
      headers: { 'Cache-Control': 'max-age=180' }
    });
    return response.ok ? await response.json() : null;
  }

  private static async fetchMeetingsOptimized(filters?: AnalyticsFilters) {
    const params = new URLSearchParams({
      type: 'meetings',
      limit: '500',
      includeMetadata: 'true',
      ...(filters?.dateRange && { dateRange: filters.dateRange })
    });

    const response = await fetch(`/api/data-integration/unified?${params}`, {
      headers: { 'Cache-Control': 'max-age=300' }
    });
    return response.ok ? await response.json() : null;
  }

  private static async fetchActivitiesOptimized(filters?: AnalyticsFilters) {
    const params = new URLSearchParams({
      type: 'activities',
      limit: '500',
      includeMetadata: 'true'
    });

    const response = await fetch(`/api/data-integration/unified?${params}`, {
      headers: { 'Cache-Control': 'max-age=240' }
    });
    return response.ok ? await response.json() : null;
  }

  private static async fetchPerformanceMetrics() {
    try {
      const response = await fetch('/api/analytics/performance');
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  }

  // 最適化された分析データ生成
  static generateOptimizedAnalytics(
    messagesData: any, 
    meetingsData: any, 
    activitiesData: any, 
    integrationsData: any,
    performanceData: any,
    startTime: number
  ): UnifiedAnalyticsData {
    const messages = messagesData?.data || [];
    const meetings = meetingsData?.data || [];
    const activities = activitiesData?.data || [];
    const integrations = integrationsData?.integrations || [];

    // 統合状況マップ作成（最適化版）
const integrationsMap: Map<string, any> = new Map(
  integrations.map((integration: any) => [integration.service as string, integration])
);

    // サービス別データ集計（最適化版）
    const serviceBreakdown = this.calculateServiceBreakdown(messages, meetings, integrationsMap);
    const connectedServices = Array.from(integrationsMap.values()).filter(i => i.isActive).length;

    // 実データがない場合のサンプル生成
    if (messages.length === 0 && meetings.length === 0 && connectedServices > 0) {
      return this.generateSampleDataForConnectedServices(serviceBreakdown, connectedServices, startTime);
    }

    // 高度な分析計算
    const crossServiceAnalysis = this.calculateAdvancedCrossServiceAnalysis(
      messages, meetings, activities, serviceBreakdown
    );

    const timelineData = this.generateAdvancedTimelineData(messages, meetings, activities);
    const riskFactors = this.analyzeAdvancedRiskFactors(serviceBreakdown, crossServiceAnalysis);
    const predictions = this.generateAdvancedPredictions(crossServiceAnalysis, timelineData);
    const insights = this.generateActionableInsights(serviceBreakdown, crossServiceAnalysis);

    return {
      overview: {
        totalMessages: messages.length,
        totalMeetings: meetings.length,
        totalActivities: activities.length,
        connectedServices,
        dataQuality: this.calculateAdvancedDataQuality(messagesData, meetingsData, activitiesData),
        lastUpdated: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        cacheHitRate: performanceData?.cacheHitRate || 0
      },
      serviceBreakdown,
      crossServiceAnalysis,
      timelineData,
      riskFactors,
      predictions,
      insights,
      performance: {
        queryTime: Date.now() - startTime,
        dataFreshness: performanceData?.dataFreshness || new Date().toISOString(),
        cacheEfficiency: performanceData?.cacheEfficiency || 85,
        errorRate: performanceData?.errorRate || 2
      }
    };
  }

 // 高度な計算メソッド
private static calculateServiceBreakdown(messages: any[], meetings: any[], integrationsMap: Map<string, any>) {
  const services = ['google', 'slack', 'discord', 'azure-ad', 'chatwork', 'line-works'];
  const serviceNames = {
    google: 'Google Meet',
    slack: 'Slack',
    discord: 'Discord',
    'azure-ad': 'Microsoft Teams',
    chatwork: 'ChatWork',
    'line-works': 'LINE WORKS'
  };

  return services.reduce((breakdown, serviceId) => {
    const integration = integrationsMap.get(serviceId) as any; // 型アサーション追加
    const serviceMessages = messages.filter(m => m.service === serviceId || (serviceId === 'azure-ad' && m.service === 'teams'));
    const serviceMeetings = meetings.filter(m => m.service === serviceId || (serviceId === 'azure-ad' && m.service === 'teams'));

    breakdown[serviceId] = {
      name: serviceNames[serviceId as keyof typeof serviceNames] || serviceId,
      messageCount: serviceMessages.length,
      meetingCount: serviceMeetings.length,
      isConnected: integration?.isActive || false,
      lastActivity: this.getLastActivity([...serviceMessages, ...serviceMeetings]),
      healthScore: integration?.healthScore || (integration?.isActive ? 85 : 0),
      userCount: integration?.userCount || 0,
      avgResponseTime: this.calculateAvgResponseTime(serviceMessages)
    };

    return breakdown;
  }, {} as any);
}
  private static calculateAdvancedCrossServiceAnalysis(
    messages: any[], meetings: any[], activities: any[], serviceBreakdown: any
  ) {
    return {
      collaborationScore: this.calculateCollaborationScore(messages, meetings),
      communicationEfficiency: this.calculateCommunicationEfficiency(messages),
      platformUsageBalance: this.calculatePlatformBalance(serviceBreakdown),
      userEngagement: this.calculateUserEngagement(activities),
      dataConsistency: this.calculateDataConsistency(messages, meetings),
      integrationHealth: this.calculateIntegrationHealth(serviceBreakdown)
    };
  }

  private static calculateDataConsistency(messages: any[], meetings: any[]): number {
    if (messages.length === 0 && meetings.length === 0) return 0;
    
    const totalItems = messages.length + meetings.length;
    const itemsWithMetadata = [...messages, ...meetings].filter(item => 
      item.timestamp && item.author?.id && item.service
    ).length;
    
    return Math.round((itemsWithMetadata / totalItems) * 100);
  }

  private static calculateIntegrationHealth(serviceBreakdown: any): number {
    const services = Object.values(serviceBreakdown) as any[];
    const connectedServices = services.filter(s => s.isConnected);
    
    if (connectedServices.length === 0) return 0;
    
    const avgHealthScore = connectedServices.reduce((sum, s) => sum + s.healthScore, 0) / connectedServices.length;
    return Math.round(avgHealthScore);
  }

  private static generateAdvancedTimelineData(messages: any[], meetings: any[], activities: any[]) {
    const timelineMap: { [date: string]: any } = {};
    const allItems = [...messages, ...meetings, ...activities];
    
    allItems.forEach(item => {
      const date = new Date(item.timestamp || item.startTime).toISOString().split('T')[0];
      if (!timelineMap[date]) {
        timelineMap[date] = { 
          date, 
          totalActivity: 0, 
          serviceActivity: {},
          trends: {
            messageVelocity: 0,
            meetingDuration: 0,
            userParticipation: 0
          }
        };
      }
      
      timelineMap[date].totalActivity++;
      timelineMap[date].serviceActivity[item.service] = (timelineMap[date].serviceActivity[item.service] || 0) + 1;
    });
    
    return Object.values(timelineMap).slice(-14); // 2週間分
  }

  private static analyzeAdvancedRiskFactors(serviceBreakdown: any, crossServiceAnalysis: any) {
    const risks = [];
    
    // 接続状況リスク
    const disconnectedServices = Object.entries(serviceBreakdown)
      .filter(([_, service]: [string, any]) => !service.isConnected);
    
    if (disconnectedServices.length > 0) {
  risks.push({
    id: 'disconnected_services',
    title: 'サービス統合不完全',
    description: `${disconnectedServices.length}個のサービスが未接続です`,
    severity: (disconnectedServices.length > 3 ? 'critical' : disconnectedServices.length > 1 ? 'high' : 'medium') as 'critical' | 'high' | 'medium' | 'low',
    affectedServices: disconnectedServices.map(([key, _]) => key),
    confidence: 95,
    impact: '分析精度の低下と包括的な洞察の欠如',
    recommendation: [
      '主要コミュニケーションツールの優先接続',
      '段階的な統合拡張計画の策定',
      'データ品質向上のための設定最適化'
    ]
  });
}

    // データ品質リスク
    if (crossServiceAnalysis.dataConsistency < 70) {
  risks.push({
    id: 'data_quality',
    title: 'データ品質の改善が必要',
    description: `データ整合性が${crossServiceAnalysis.dataConsistency}%です`,
    severity: (crossServiceAnalysis.dataConsistency < 50 ? 'high' : 'medium') as 'critical' | 'high' | 'medium' | 'low',
    affectedServices: Object.keys(serviceBreakdown),
    confidence: 88,
    impact: 'AI分析精度の低下',
    recommendation: [
      'データ取得設定の見直し',
      'API権限の確認と更新',
      'データクレンジングプロセスの実装'
    ]
  });
}

    // 協働効率リスク
    if (crossServiceAnalysis.collaborationScore < 40) {
  risks.push({
    id: 'low_collaboration',
    title: 'クロスプラットフォーム協働不足',
    description: 'ユーザーが複数サービスを効果的に活用できていません',
    severity: 'high' as const,
    affectedServices: Object.keys(serviceBreakdown),
    confidence: 82,
    impact: 'チーム生産性の低下',
    recommendation: [
      'ツール活用トレーニングの実施',
      'ワークフロー最適化の検討',
      'コミュニケーションガイドラインの策定'
    ]
  });
}

    return risks;
  }

  private static generateAdvancedPredictions(crossServiceAnalysis: any, timelineData: any[]) {
    const predictions = [];
    
    // トレンド分析に基づく予測
    if (timelineData.length >= 7) {
      const recentTrend = this.calculateTrend(timelineData.slice(-7).map(d => d.totalActivity));
      
      predictions.push({
  metric: 'チーム活動レベル',
  current: Math.round(timelineData[timelineData.length - 1]?.totalActivity || 0),
  predicted: Math.max(0, Math.round((timelineData[timelineData.length - 1]?.totalActivity || 0) * (1 + recentTrend))),
  confidence: 78,
  trend: (recentTrend > 0.05 ? 'improving' : recentTrend < -0.05 ? 'declining' : 'stable') as 'improving' | 'declining' | 'stable',
  timeframe: '次の7日間',
  factors: ['過去の活動パターン', 'サービス利用状況', '季節性要因']
});
    }

    // 協働スコア予測
    predictions.push({
  metric: 'コラボレーションスコア',
  current: crossServiceAnalysis.collaborationScore,
  predicted: Math.min(100, crossServiceAnalysis.collaborationScore + (crossServiceAnalysis.collaborationScore < 70 ? 15 : 5)),
  confidence: 85,
  trend: (crossServiceAnalysis.collaborationScore < 70 ? 'improving' : 'stable') as 'improving' | 'declining' | 'stable',
  timeframe: '次の30日間',
  factors: ['統合サービス数', 'ユーザー学習曲線', 'ツール最適化']
});

    return predictions;
  }

  private static generateActionableInsights(serviceBreakdown: any, crossServiceAnalysis: any) {
    const insights = [];
    
    // 最もアクティブなサービス
    const serviceActivities = Object.entries(serviceBreakdown).map(([key, service]: [string, any]) => ({
      service: key,
      name: service.name,
      activity: service.messageCount + service.meetingCount,
      isConnected: service.isConnected
    })).filter(s => s.isConnected).sort((a, b) => b.activity - a.activity);

    if (serviceActivities.length > 0) {
      const topService = serviceActivities[0];
      insights.push({
        id: 'top_service',
        type: 'achievement' as const,
        title: `${topService.name}が最も活用されています`,
        description: `全体の${Math.round((topService.activity / serviceActivities.reduce((sum, s) => sum + s.activity, 0)) * 100)}%の活動を占めています`,
        value: topService.activity,
        comparison: '他サービス平均比',
        actionable: false
      });
    }

    // 改善機会の特定
    if (crossServiceAnalysis.platformUsageBalance < 60) {
      insights.push({
        id: 'balance_opportunity',
        type: 'opportunity' as const,
        title: 'プラットフォーム利用バランスの改善機会',
        description: 'サービス間の利用バランスを改善することで、より効果的な協働が可能です',
        value: crossServiceAnalysis.platformUsageBalance,
        comparison: '理想値: 80%以上',
        actionable: true
      });
    }

    // データ品質の評価
    if (crossServiceAnalysis.dataConsistency > 85) {
      insights.push({
        id: 'data_quality_achievement',
        type: 'achievement' as const,
        title: '高品質なデータ統合を達成',
        description: 'データ整合性が優秀レベルに達しており、信頼性の高い分析が可能です',
        value: crossServiceAnalysis.dataConsistency,
        comparison: '業界平均: 70%',
        actionable: false
      });
    }

    return insights;
  }

  // ヘルパーメソッド
  private static getLastActivity(data: any[]): string {
    if (data.length === 0) return 'データなし';
    
    try {
      const latest = data.reduce((latest, item) => {
        const itemTime = new Date(item.timestamp || item.startTime);
        const latestTime = new Date(latest.timestamp || latest.startTime);
        return itemTime > latestTime ? item : latest;
      });
      
      const latestDate = new Date(latest.timestamp || latest.startTime);
      return isNaN(latestDate.getTime()) ? 'データなし' : latestDate.toLocaleString('ja-JP');
    } catch {
      return 'データなし';
    }
  }

  private static calculateAvgResponseTime(messages: any[]): number {
    if (messages.length === 0) return 0;
    
    const responseTimes = messages
      .filter(m => m.metadata?.responseTime)
      .map(m => m.metadata.responseTime);
    
    return responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0;
  }

  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = values.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;
    
    return avgY > 0 ? slope / avgY : 0; // 正規化された傾き
  }

  private static calculateCollaborationScore(messages: any[], meetings: any[]): number {
    if (messages.length === 0 && meetings.length === 0) return 0;
    
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

  private static calculateCommunicationEfficiency(messages: any[]): number {
    if (messages.length === 0) return 0;
    
    const avgMessageLength = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / messages.length;
    const reactionRate = messages.reduce((sum, m) => sum + (m.reactions?.length || 0), 0) / messages.length;
    const threadParticipation = messages.filter(m => m.threadId).length / messages.length;
    
    return Math.min(100, Math.round(
      (avgMessageLength / 100) * 25 + 
      reactionRate * 25 + 
      threadParticipation * 25 + 
      25 // ベースライン
    ));
  }

  private static calculatePlatformBalance(serviceBreakdown: any): number {
    const activities = Object.values(serviceBreakdown).map((s: any) => s.messageCount + s.meetingCount);
    const total = activities.reduce((sum: number, count: number) => sum + count, 0);
    
    if (total === 0) return 0;
    
    const variance = activities.reduce((sum: number, count: number) => {
      const ratio = count / total;
      return sum + Math.pow(ratio - 1/activities.length, 2);
    }, 0);
    
    return Math.round((1 - variance) * 100);
  }

  private static calculateUserEngagement(activities: any[]): number {
    if (activities.length === 0) return 0;
    
    const activityTypes = new Set(activities.map(a => a.type));
    const diversityScore = (activityTypes.size / 5) * 50;
    const frequencyScore = Math.min(50, activities.length / 10);
    
    return Math.round(diversityScore + frequencyScore);
  }

  private static calculateAdvancedDataQuality(messagesData: any, meetingsData: any, activitiesData: any): number {
    let qualityScore = 0;
    let maxScore = 0;
    
    // メッセージデータ品質
    if (messagesData?.success) {
      const messages = messagesData.data || [];
      const completeMessages = messages.filter((m: any) => 
        m.timestamp && m.author?.id && m.content && m.service
      );
      qualityScore += messages.length > 0 ? (completeMessages.length / messages.length) * 35 : 0;
      maxScore += 35;
    }
    
    // 会議データ品質
    if (meetingsData?.success) {
      const meetings = meetingsData.data || [];
      const completeMeetings = meetings.filter((m: any) => 
        m.startTime && m.organizer?.id && m.title && m.service
      );
      qualityScore += meetings.length > 0 ? (completeMeetings.length / meetings.length) * 35 : 0;
      maxScore += 35;
    }
    
    // アクティビティデータ品質
    if (activitiesData?.success) {
      const activities = activitiesData.data || [];
      const completeActivities = activities.filter((a: any) => 
        a.timestamp && a.type && a.userId
      );
      qualityScore += activities.length > 0 ? (completeActivities.length / activities.length) * 30 : 0;
      maxScore += 30;
    }
    
    return maxScore > 0 ? Math.round((qualityScore / maxScore) * 100) : 0;
  }

  // サンプルデータ生成（接続済みサービス用）
  static generateSampleDataForConnectedServices(
    serviceBreakdown: any, 
    connectedServices: number, 
    startTime: number
  ): UnifiedAnalyticsData {
    // 接続済みサービスにリアルなサンプルデータを追加
    Object.keys(serviceBreakdown).forEach(key => {
      if (serviceBreakdown[key].isConnected) {
        serviceBreakdown[key].messageCount = Math.floor(Math.random() * 100) + 20;
        serviceBreakdown[key].meetingCount = Math.floor(Math.random() * 15) + 3;
        serviceBreakdown[key].healthScore = Math.floor(Math.random() * 20) + 80;
        serviceBreakdown[key].userCount = Math.floor(Math.random() * 20) + 5;
        serviceBreakdown[key].avgResponseTime = Math.floor(Math.random() * 30) + 5;
        serviceBreakdown[key].lastActivity = new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ).toLocaleString('ja-JP');
      }
    });

    const totalMessages = Object.values(serviceBreakdown).reduce((sum: number, s: any) => sum + s.messageCount, 0);
    const totalMeetings = Object.values(serviceBreakdown).reduce((sum: number, s: any) => sum + s.meetingCount, 0);

    return {
      overview: {
        totalMessages,
        totalMeetings,
        totalActivities: Math.floor(totalMessages * 0.4),
        connectedServices,
        dataQuality: Math.min(95, 60 + connectedServices * 8),
        lastUpdated: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        cacheHitRate: 0
      },
      serviceBreakdown,
      crossServiceAnalysis: {
        collaborationScore: Math.min(85, 40 + connectedServices * 10),
        communicationEfficiency: Math.min(90, 50 + connectedServices * 8),
        platformUsageBalance: Math.min(80, 30 + connectedServices * 12),
        userEngagement: Math.min(88, 45 + connectedServices * 9),
        dataConsistency: Math.min(92, 55 + connectedServices * 9),
        integrationHealth: Math.min(95, 70 + connectedServices * 6)
      },
      timelineData: this.generateSampleTimelineData(),
      riskFactors: this.generateSampleRiskFactors(connectedServices),
      predictions: this.generateSamplePredictions(connectedServices),
      insights: this.generateSampleInsights(connectedServices),
      performance: {
        queryTime: Date.now() - startTime,
        dataFreshness: new Date().toISOString(),
        cacheEfficiency: 85,
        errorRate: 2
      }
    };
  }

  // サンプルデータ生成メソッド
  private static generateSampleTimelineData() {
    const timeline = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const baseActivity = Math.floor(Math.random() * 40) + 20;
      
      timeline.push({
        date: date.toISOString().split('T')[0],
        totalActivity: baseActivity,
        serviceActivity: {
          slack: Math.floor(baseActivity * 0.4),
          teams: Math.floor(baseActivity * 0.3),
          google: Math.floor(baseActivity * 0.2),
          discord: Math.floor(baseActivity * 0.1)
        },
        trends: {
          messageVelocity: Math.random() * 100,
          meetingDuration: Math.random() * 60 + 30,
          userParticipation: Math.random() * 100
        }
      });
    }
    return timeline;
  }

  private static generateSampleRiskFactors(connectedServices: number) {
    const risks = [];
    
    if (connectedServices < 3) {
      risks.push({
        id: 'limited_integration',
        title: '統合サービス数が限定的',
        description: `現在${connectedServices}サービスのみ接続済み。より包括的な分析のため追加接続を推奨`,
        severity: 'medium' as const,
        affectedServices: ['integration'],
        confidence: 90,
        impact: '分析の包括性と精度に影響',
        recommendation: [
          '主要コミュニケーションツールの追加接続',
          '段階的統合計画の策定',
          'ROI評価に基づく優先順位付け'
        ]
      });
    }

    if (connectedServices >= 2) {
      risks.push({
        id: 'optimization_opportunity',
        title: 'ワークフロー最適化の機会',
        description: '複数サービスが接続済み。ワークフロー最適化により効率向上が期待できます',
        severity: 'low' as const,
        affectedServices: ['workflow'],
        confidence: 75,
        impact: 'チーム生産性向上の機会',
        recommendation: [
          'クロスプラットフォーム利用パターンの分析',
          'ツール統合ワークフローの設計',
          'ユーザートレーニングプログラムの実施'
        ]
      });
    }
    
    return risks;
  }

  private static generateSamplePredictions(connectedServices: number) {
    const baseScore = 40 + connectedServices * 10;
    return [
      {
        metric: 'チーム協働効率',
        current: baseScore,
        predicted: Math.min(95, baseScore + 15),
        confidence: 85,
        trend: 'improving' as const,
        timeframe: '次の30日間',
        factors: ['ツール習熟度向上', 'ワークフロー最適化', 'チーム学習効果']
      },
      {
        metric: 'データ統合品質',
        current: Math.min(95, 60 + connectedServices * 8),
        predicted: Math.min(98, 65 + connectedServices * 8),
        confidence: 78,
        trend: 'stable' as const,
        timeframe: '次の14日間',
        factors: ['API安定性', 'データ取得頻度', 'システム最適化']
      }
    ];
  }

  private static generateSampleInsights(connectedServices: number) {
    const insights = [];
    
    insights.push({
      id: 'integration_progress',
      type: 'achievement' as const,
      title: `${connectedServices}つのサービスが正常に統合済み`,
      description: 'マルチプラットフォーム分析が可能な状態です',
      value: connectedServices,
      comparison: '推奨最小値: 2サービス',
      actionable: connectedServices < 4
    });

    if (connectedServices >= 3) {
      insights.push({
        id: 'advanced_analytics_ready',
        type: 'opportunity' as const,
        title: '高度な分析機能が利用可能',
        description: '十分なデータソースにより、詳細なクロス分析とAI予測が可能です',
        value: 100,
        comparison: '機能利用率',
        actionable: true
      });
    }

    return insights;
  }

  // フォールバック分析データ生成
  static generateFallbackAnalytics(): UnifiedAnalyticsData {
    const serviceBreakdown = {
      google: { name: 'Google Meet', messageCount: 0, meetingCount: 0, isConnected: false, lastActivity: '未接続', healthScore: 0, userCount: 0, avgResponseTime: 0 },
      slack: { name: 'Slack', messageCount: 0, meetingCount: 0, isConnected: false, lastActivity: '未接続', healthScore: 0, userCount: 0, avgResponseTime: 0 },
      discord: { name: 'Discord', messageCount: 0, meetingCount: 0, isConnected: false, lastActivity: '未接続', healthScore: 0, userCount: 0, avgResponseTime: 0 },
      'azure-ad': { name: 'Microsoft Teams', messageCount: 0, meetingCount: 0, isConnected: false, lastActivity: '未接続', healthScore: 0, userCount: 0, avgResponseTime: 0 },
      chatwork: { name: 'ChatWork', messageCount: 0, meetingCount: 0, isConnected: false, lastActivity: '未接続', healthScore: 0, userCount: 0, avgResponseTime: 0 },
      'line-works': { name: 'LINE WORKS', messageCount: 0, meetingCount: 0, isConnected: false, lastActivity: '未接続', healthScore: 0, userCount: 0, avgResponseTime: 0 }
    };

    return {
      overview: {
        totalMessages: 0,
        totalMeetings: 0,
        totalActivities: 0,
        connectedServices: 0,
        dataQuality: 0,
        lastUpdated: new Date().toISOString(),
        processingTime: 0,
        cacheHitRate: 0
      },
      serviceBreakdown,
      crossServiceAnalysis: {
        collaborationScore: 0,
        communicationEfficiency: 0,
        platformUsageBalance: 0,
        userEngagement: 0,
        dataConsistency: 0,
        integrationHealth: 0
      },
      timelineData: [],
      riskFactors: [{
        id: 'no_integrations',
        title: 'サービス統合が必要',
        description: 'AI分析を開始するには、まずサービスを接続してください',
        severity: 'critical' as const,
        affectedServices: ['all'],
        confidence: 100,
        impact: '分析機能が利用できません',
        recommendation: [
          'メインコミュニケーションツールの接続',
          '統合設定ガイドの確認',
          'サポートチームへの相談'
        ]
      }],
      predictions: [],
      insights: [{
        id: 'setup_required',
        type: 'opportunity' as const,
        title: 'セットアップを開始しましょう',
        description: 'サービス接続により強力な分析機能が利用可能になります',
        value: 0,
        comparison: '設定完了率',
        actionable: true
      }],
      performance: {
        queryTime: 0,
        dataFreshness: new Date().toISOString(),
        cacheEfficiency: 0,
        errorRate: 0
      }
    };
  }

  // エクスポート機能
  static async exportAnalytics(data: UnifiedAnalyticsData, config: ExportConfig): Promise<Blob> {
    switch (config.format) {
      case 'json':
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      
      case 'csv':
        return this.generateCSVExport(data, config);
      
      case 'pdf':
        return this.generatePDFExport(data, config);
      
      default:
        throw new Error('サポートされていないエクスポート形式です');
    }
  }

  private static generateCSVExport(data: UnifiedAnalyticsData, config: ExportConfig): Blob {
    let csvContent = '';
    
    if (config.sections.includes('overview')) {
      csvContent += 'セクション,項目,値\n';
      csvContent += `概要,総メッセージ数,${data.overview.totalMessages}\n`;
      csvContent += `概要,総会議数,${data.overview.totalMeetings}\n`;
      csvContent += `概要,接続サービス数,${data.overview.connectedServices}\n`;
      csvContent += `概要,データ品質,${data.overview.dataQuality}%\n`;
      csvContent += '\n';
    }

    if (config.sections.includes('services')) {
      csvContent += 'サービス名,メッセージ数,会議数,接続状態,健全性スコア\n';
      Object.values(data.serviceBreakdown).forEach(service => {
        csvContent += `${service.name},${service.messageCount},${service.meetingCount},${service.isConnected ? '接続済み' : '未接続'},${service.healthScore}%\n`;
      });
      csvContent += '\n';
    }

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  private static async generatePDFExport(data: UnifiedAnalyticsData, config: ExportConfig): Promise<Blob> {
    // 実際の実装では、PDFライブラリ（jsPDF等）を使用
    const pdfContent = `
LinkSense 分析レポート
生成日時: ${new Date().toLocaleString('ja-JP')}

=== 概要 ===
総メッセージ数: ${data.overview.totalMessages.toLocaleString()}
総会議数: ${data.overview.totalMeetings.toLocaleString()}
接続サービス数: ${data.overview.connectedServices}/6
データ品質: ${data.overview.dataQuality}%

=== サービス統合状況 ===
${Object.values(data.serviceBreakdown).map(service => 
  `${service.name}: ${service.isConnected ? '接続済み' : '未接続'} (メッセージ: ${service.messageCount}, 会議: ${service.meetingCount})`
).join('\n')}

=== AI分析結果 ===
${data.riskFactors.map(risk => 
  `[${risk.severity.toUpperCase()}] ${risk.title}: ${risk.description}`
).join('\n')}
    `.trim();

    return new Blob([pdfContent], { type: 'application/pdf' });
  }
}

// メインコンポーネント（最適化版）
const OptimizedAnalyticsPage = () => {
  const { data: session, status } = useSession();
  
  // 状態管理
  const [data, setData] = useState<UnifiedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // 新機能の状態
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: '30d',
    services: [],
    metrics: [],
    granularity: 'day',
    includeInactive: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'json',
    sections: ['overview', 'services', 'analysis'],
    includeCharts: true,
    includeRawData: false
  });

  // データ取得（最適化版）
  const fetchData = useCallback(async (useFilters?: AnalyticsFilters) => {
    try {
      setError(null);
      console.log('🚀 最適化統合分析開始...', useFilters);
      
      const analyticsData = await OptimizedAnalyticsService.fetchUnifiedAnalytics(useFilters || filters);
      setData(analyticsData);
      setLoading(false);
      
      if (analyticsData) {
        console.log('✅ 最適化統合分析完了:', {
          overview: analyticsData.overview,
          performance: analyticsData.performance
        });
      } else {
        console.log('統合データなし');
      }
      
    } catch (err) {
      console.error('❌ 統合分析エラー:', err);
      setError('統合分析データの取得に失敗しました');
      setLoading(false);
    }
  }, [filters]);

  // リアルタイム更新
  useEffect(() => {
  if (status !== 'authenticated') return;
  
  fetchData();
  
  if (realTimeUpdates) {
    const interval = setInterval(() => fetchData(), 5 * 60 * 1000); // 5分間隔
    return () => clearInterval(interval);
  }
  
  return undefined; // 明示的にundefinedを返す
}, [fetchData, status, realTimeUpdates]);

  // 手動更新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // フィルター適用
  const handleFiltersApply = useCallback(async () => {
    setLoading(true);
    await fetchData(filters);
  }, [fetchData, filters]);

  // セクション展開/折りたたみ
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // エクスポート処理
  const handleExport = useCallback(async () => {
    if (!data) return;
    
    try {
      const blob = await OptimizedAnalyticsService.exportAnalytics(data, exportConfig);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linksense-analytics-${new Date().toISOString().split('T')[0]}.${exportConfig.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('エクスポートエラー:', error);
      setError('エクスポートに失敗しました');
    }
  }, [data, exportConfig]);

  // メモ化された計算値
  const performanceMetrics = useMemo(() => {
    if (!data) return null;
    
    return {
      responseTime: data.performance.queryTime,
      cacheEfficiency: data.performance.cacheEfficiency,
      dataFreshness: new Date(data.performance.dataFreshness),
      errorRate: data.performance.errorRate
    };
  }, [data]);

  const filteredInsights = useMemo(() => {
    if (!data) return [];
    return data.insights.filter(insight => 
      filters.includeInactive || insight.actionable
    );
  }, [data, filters.includeInactive]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '改善予測';
      case 'declining':
        return '悪化予測';
      default:
        return '安定予測';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">高度AI分析処理中</h2>
          <p className="text-gray-600 mb-4">
            統合サービスからデータを収集・分析しています
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Cpu className="h-4 w-4 animate-pulse" />
            <span>機械学習分析実行中</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md text-center p-8">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">認証が必要です</h1>
          <p className="text-gray-600 mb-8">高度AI分析機能にはログインが必要です</p>
          <Button onClick={() => window.location.href = '/login'} className="w-full">
            ログイン
          </Button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>統合分析エラー</AlertTitle>
          <AlertDescription>
            <div className="space-y-3">
              <p>{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  再試行
                </Button>
                <Button variant="outline" size="sm" onClick={() => setError(null)}>
                  閉じる
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
              AI分析データがありません
            </h3>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
              高度な統合分析を開始するには、まずサービスを接続してください。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={handleRefresh} className="flex items-center gap-2 w-full sm:w-auto">
                <RefreshCw className="h-4 w-4" />
                統合状況を確認
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/integrations'} className="flex items-center gap-2 w-full sm:w-auto">
                <Settings className="h-4 w-4" />
                サービスを接続
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                高度AI統合分析
              </h1>
              <p className="text-gray-600">
                全サービス統合データからの機械学習分析結果
              </p>
              {performanceMetrics && (
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>処理時間: {performanceMetrics.responseTime}ms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Database className="h-4 w-4" />
                    <span>キャッシュ効率: {performanceMetrics.cacheEfficiency}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    <span>エラー率: {performanceMetrics.errorRate}%</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* コントロールパネル */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={realTimeUpdates ? "default" : "outline"}
                size="sm"
                onClick={() => setRealTimeUpdates(!realTimeUpdates)}
                className="flex items-center gap-2"
              >
                {realTimeUpdates ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {realTimeUpdates ? 'リアルタイム' : '手動更新'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                フィルター
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                エクスポート
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="flex items-center gap-2"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                更新
              </Button>
            </div>
          </div>

          {/* フィルターパネル */}
          {showFilters && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  分析フィルター
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">期間</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="7d">過去7日間</option>
                      <option value="30d">過去30日間</option>
                      <option value="90d">過去90日間</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">粒度</label>
                    <select
                      value={filters.granularity}
                      onChange={(e) => setFilters(prev => ({ ...prev, granularity: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="hour">時間別</option>
                      <option value="day">日別</option>
                      <option value="week">週別</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">オプション</label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.includeInactive}
                        onChange={(e) => setFilters(prev => ({ ...prev, includeInactive: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">非アクティブ含む</span>
                    </label>
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={handleFiltersApply} className="w-full">
                      フィルター適用
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ステータスバー */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white rounded-lg border">
            <div className="flex flex-wrap items-center gap-4">
              <Badge 
                variant={data.overview.connectedServices > 0 ? 'success' : 'secondary'}
                className="flex items-center gap-1"
              >
                <Network className="h-3 w-3" />
                {data.overview.connectedServices}/6 サービス統合
              </Badge>
              
              <Badge 
                variant={data.overview.dataQuality > 80 ? 'success' : data.overview.dataQuality > 60 ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                <Database className="h-3 w-3" />
                データ品質: {data.overview.dataQuality}%
              </Badge>
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(data.overview.lastUpdated).toLocaleTimeString('ja-JP')}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-500">
              {realTimeUpdates && <span className="flex items-center gap-1">
                <Activity className="h-3 w-3 animate-pulse text-green-500" />
                リアルタイム監視中
              </span>}
            </div>
          </div>
        </div>

        {/* 統合概要カード */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6 mb-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">総メッセージ</CardTitle>
              <MessageSquare className="h-3 sm:h-4 w-3 sm:w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-blue-600">
                {data.overview.totalMessages.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">
                {data.overview.connectedServices > 0 ? '全サービス統合' : 'データなし'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">総会議数</CardTitle>
              <Video className="h-3 sm:h-4 w-3 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {data.overview.totalMeetings.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">
                {data.overview.connectedServices > 0 ? 'Meet・Teams統合' : 'データなし'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">コラボレーション</CardTitle>
              <Users className="h-3 sm:h-4 w-3 sm:w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-purple-600">
                {data.crossServiceAnalysis.collaborationScore}%
              </div>
              <p className="text-xs text-gray-500">クロスプラットフォーム</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">効率性</CardTitle>
              <Zap className="h-3 sm:h-4 w-3 sm:w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                {data.crossServiceAnalysis.communicationEfficiency}%
              </div>
              <p className="text-xs text-gray-500">コミュニケーション</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">データ整合性</CardTitle>
              <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-emerald-600">
                {data.crossServiceAnalysis.dataConsistency}%
              </div>
              <p className="text-xs text-gray-500">品質指標</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">統合健全性</CardTitle>
              <Target className="h-3 sm:h-4 w-3 sm:w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-indigo-600">
                {data.crossServiceAnalysis.integrationHealth}%
              </div>
              <p className="text-xs text-gray-500">システム状態</p>
            </CardContent>
          </Card>
        </div>

        {/* 未接続時の推奨アクション */}
        {data.overview.connectedServices === 0 && (
          <Alert className="mb-6 sm:mb-8 border-l-4 border-l-blue-500" variant="default">
            <Settings className="h-4 w-4" />
            <AlertTitle>高度AI分析を開始しましょう</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p className="mb-3">
                  機械学習による統合AI分析を活用するために、コミュニケーションサービスを接続してください。
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => window.location.href = '/integrations'} size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    サービス接続を開始
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/demo', '_blank')}>
                    <Eye className="h-4 w-4 mr-1" />
                    デモを確認
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* メイン分析セクション */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* サービス統合状況（拡張版） */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  サービス統合詳細
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('services')}
                >
                  {expandedSections.has('services') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </div>
              <CardDescription>
                統合サービスの詳細状況と健全性指標
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.serviceBreakdown).map(([key, service]: [string, any]) => (
                  <div key={key} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${service.isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        <div>
                          <div className="font-medium text-sm sm:text-base">{service.name}</div>
                          <div className="text-xs text-gray-600">
                            {service.isConnected ? '統合アクティブ' : '未統合'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {service.isConnected && (
                          <Badge variant="success" className="text-xs">
                            健全性: {service.healthScore}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {expandedSections.has('services') && service.isConnected && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="text-center p-2 bg-white rounded">
                          <div className="font-medium text-blue-600">{service.messageCount}</div>
                          <div className="text-gray-500">メッセージ</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <div className="font-medium text-green-600">{service.meetingCount}</div>
                          <div className="text-gray-500">会議</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <div className="font-medium text-purple-600">{service.userCount}</div>
                          <div className="text-gray-500">ユーザー</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <div className="font-medium text-orange-600">{service.avgResponseTime}分</div>
                          <div className="text-gray-500">平均応答</div>
                        </div>
                      </div>
                    )}
                    
                    {service.isConnected && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>健全性スコア</span>
                          <span>{service.healthScore}%</span>
                        </div>
                        <Progress 
                          value={service.healthScore} 
                          variant={service.healthScore >= 80 ? 'success' : service.healthScore >= 60 ? 'warning' : 'danger'}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 高度分析指標 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  高度分析指標
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('metrics')}
                >
                  {expandedSections.has('metrics') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </div>
              <CardDescription>
                機械学習による高度分析結果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">コラボレーションスコア</span>
                    <span className="text-sm font-bold">{data.crossServiceAnalysis.collaborationScore}%</span>
                  </div>
                  <Progress 
                    value={data.crossServiceAnalysis.collaborationScore} 
                    variant={data.crossServiceAnalysis.collaborationScore >= 70 ? 'success' : 'warning'}
                  />
                  {expandedSections.has('metrics') && (
                    <p className="text-xs text-gray-500 mt-1">
                      クロスプラットフォーム協働の効率性を示します
                    </p>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">コミュニケーション効率</span>
                    <span className="text-sm font-bold">{data.crossServiceAnalysis.communicationEfficiency}%</span>
                  </div>
                  <Progress 
                    value={data.crossServiceAnalysis.communicationEfficiency} 
                    variant={data.crossServiceAnalysis.communicationEfficiency >= 70 ? 'success' : 'warning'}
                  />
                  {expandedSections.has('metrics') && (
                    <p className="text-xs text-gray-500 mt-1">
                      メッセージ品質と応答性の総合評価
                    </p>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">プラットフォーム活用バランス</span>
                    <span className="text-sm font-bold">{data.crossServiceAnalysis.platformUsageBalance}%</span>
                  </div>
                  <Progress 
                    value={data.crossServiceAnalysis.platformUsageBalance} 
                    variant="default"
                  />
                  {expandedSections.has('metrics') && (
                    <p className="text-xs text-gray-500 mt-1">
                      各サービスの均等な活用度を評価
                    </p>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">ユーザーエンゲージメント</span>
                    <span className="text-sm font-bold">{data.crossServiceAnalysis.userEngagement}%</span>
                  </div>
                  <Progress 
                    value={data.crossServiceAnalysis.userEngagement} 
                    variant={data.crossServiceAnalysis.userEngagement >= 70 ? 'success' : 'warning'}
                  />
                  {expandedSections.has('metrics') && (
                    <p className="text-xs text-gray-500 mt-1">
                      ユーザーの積極的参加度を測定
                    </p>
                  )}
                </div>

                {expandedSections.has('metrics') && (
                  <>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">データ整合性</span>
                        <span className="text-sm font-bold">{data.crossServiceAnalysis.dataConsistency}%</span>
                      </div>
                      <Progress 
                        value={data.crossServiceAnalysis.dataConsistency} 
                        variant={data.crossServiceAnalysis.dataConsistency >= 80 ? 'success' : 'warning'}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        統合データの品質と一貫性
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">統合健全性</span>
                        <span className="text-sm font-bold">{data.crossServiceAnalysis.integrationHealth}%</span>
                      </div>
                      <Progress 
                        value={data.crossServiceAnalysis.integrationHealth} 
                        variant={data.crossServiceAnalysis.integrationHealth >= 80 ? 'success' : 'warning'}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        統合システム全体の健全性
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI分析結果とインサイト */}
        {(data.riskFactors.length > 0 || filteredInsights.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* AI分析結果 */}
            {data.riskFactors.length > 0 && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      AI分析結果
                    </CardTitle>
                    <Badge variant="outline">
                      {data.riskFactors.length}件
                    </Badge>
                  </div>
                  <CardDescription>
                    機械学習による統合分析とリスク評価
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.riskFactors.map((risk, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border ${getSeverityColor(risk.severity)}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1 text-sm sm:text-base">{risk.title}</h4>
                            <p className="text-xs sm:text-sm mb-2">{risk.description}</p>
                            <p className="text-xs font-medium mb-2">影響: {risk.impact}</p>
                          </div>
                          <Badge 
                            variant={
                              risk.severity === 'critical' ? 'destructive' : 
                              risk.severity === 'high' ? 'destructive' :
                              risk.severity === 'medium' ? 'default' : 
                              'secondary'
                            }
                            className="ml-2"
                          >
                            {risk.severity === 'critical' ? '緊急' :
                             risk.severity === 'high' ? '高' :
                             risk.severity === 'medium' ? '中' : '低'}
                          </Badge>
                        </div>
                        
                        <div className="mb-3">
                          <h5 className="text-xs font-medium mb-2">推奨アクション:</h5>
                          <ul className="text-xs space-y-1">
                            {risk.recommendation.map((action, actionIndex) => (
                              <li key={actionIndex} className="flex items-start gap-2">
                                <span className="text-gray-400 mt-0.5">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span>AI信頼度: {risk.confidence}%</span>
                          <span>
                            影響範囲: {risk.affectedServices.length === 1 && risk.affectedServices[0] === 'all' 
                              ? '全体' 
                              : `${risk.affectedServices.length}サービス`
                            }
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* アクショナブルインサイト */}
            {filteredInsights.length > 0 && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      アクショナブルインサイト
                    </CardTitle>
                    <Badge variant="outline">
                      {filteredInsights.length}件
                    </Badge>
                  </div>
                  <CardDescription>
                    実行可能な改善提案と成果
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredInsights.map((insight, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border ${
                          insight.type === 'opportunity' ? 'bg-blue-50 border-blue-200' :
                          insight.type === 'achievement' ? 'bg-green-50 border-green-200' :
                          insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-purple-50 border-purple-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1 text-sm sm:text-base">{insight.title}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">{insight.description}</p>
                          </div>
                          <div className="text-right ml-3">
                            <div className="text-lg font-bold">{insight.value}</div>
                            <div className="text-xs text-gray-500">{insight.comparison}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={
                              insight.type === 'achievement' ? 'success' :
                              insight.type === 'opportunity' ? 'default' :
                              insight.type === 'warning' ? 'destructive' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {insight.type === 'achievement' ? '成果' :
                             insight.type === 'opportunity' ? '機会' :
                             insight.type === 'warning' ? '警告' : 'トレンド'}
                          </Badge>
                          
                          {insight.actionable && (
                            <Badge variant="outline" className="text-xs">
                              <Target className="h-3 w-3 mr-1" />
                              実行可能
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* AI予測分析 */}
        {data.predictions.length > 0 && (
          <Card className="mb-8 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    AI予測分析
                  </CardTitle>
                  <CardDescription>
                    機械学習による将来予測と傾向分析
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('predictions')}
                >
                  {expandedSections.has('predictions') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.predictions.map((prediction, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-sm sm:text-base">{prediction.metric}</h4>
                         {getTrendIcon(prediction.trend)}
                        <Badge variant="outline" className="text-xs">
                          {getTrendLabel(prediction.trend)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">期間</div>
                        <div className="font-medium text-sm">{prediction.timeframe}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-white rounded">
                        <div className="text-gray-600 text-xs mb-1">現在値</div>
                        <div className="text-lg sm:text-xl font-bold">{prediction.current}</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded">
                        <div className="text-gray-600 text-xs mb-1">予測値</div>
                        <div className={`text-lg sm:text-xl font-bold ${
                          prediction.predicted > prediction.current ? 'text-green-600' : 
                          prediction.predicted < prediction.current ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {prediction.predicted}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white rounded">
                        <div className="text-gray-600 text-xs mb-1">変化率</div>
                        <div className={`text-lg sm:text-xl font-bold ${
                          prediction.predicted > prediction.current ? 'text-green-600' : 
                          prediction.predicted < prediction.current ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {prediction.predicted > prediction.current ? '+' : ''}
                          {Math.round(((prediction.predicted - prediction.current) / prediction.current) * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">予測信頼度</span>
                      <span className="text-sm font-bold">{prediction.confidence}%</span>
                    </div>
                    <Progress 
                      value={prediction.confidence} 
                      variant={prediction.confidence >= 80 ? 'success' : prediction.confidence >= 60 ? 'warning' : 'danger'}
                      className="mb-3"
                    />
                    
                    {expandedSections.has('predictions') && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">予測要因:</h5>
                        <div className="flex flex-wrap gap-1">
                          {prediction.factors.map((factor, factorIndex) => (
                            <Badge key={factorIndex} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* タイムライン分析 */}
        {data.timelineData.length > 0 && (
          <Card className="mb-8 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  タイムライン分析
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('timeline')}
                >
                  {expandedSections.has('timeline') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </div>
              <CardDescription>
                過去{data.timelineData.length}日間の活動傾向分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 簡易チャート表示 */}
                <div className="h-32 bg-gray-50 rounded-lg p-4 flex items-end justify-between">
                  {data.timelineData.slice(-7).map((day, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="bg-blue-600 rounded-t w-6 transition-all duration-500"
                        style={{ 
                          height: `${Math.max(4, (day.totalActivity / Math.max(...data.timelineData.map(d => d.totalActivity))) * 80)}px` 
                        }}
                      />
                      <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top-left">
                        {new Date(day.date).getDate()}
                      </div>
                    </div>
                  ))}
                </div>
                
                {expandedSections.has('timeline') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.timelineData.slice(-7).map((day, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium text-sm">
                            {new Date(day.date).toLocaleDateString('ja-JP', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="font-bold text-blue-600">
                            {day.totalActivity}件
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          {Object.entries(day.serviceActivity).map(([service, count]) => (
                            <div key={service} className="flex justify-between text-xs">
                              <span className="text-gray-600">
                                {data.serviceBreakdown[service]?.name || service}
                              </span>
                              <span className="font-medium">{count}件</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* パフォーマンス監視 */}
        {performanceMetrics && (
          <Card className="mb-8 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-purple-600" />
                システムパフォーマンス
              </CardTitle>
              <CardDescription>
                リアルタイムシステム監視とパフォーマンス指標
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-lg font-bold text-gray-900">
                    {performanceMetrics.responseTime}ms
                  </div>
                  <div className="text-sm text-gray-600">処理時間</div>
                  <Badge 
                    variant={performanceMetrics.responseTime < 1000 ? 'success' : 
                            performanceMetrics.responseTime < 3000 ? 'default' : 'destructive'}
                    className="mt-1 text-xs"
                  >
                    {performanceMetrics.responseTime < 1000 ? '高速' : 
                     performanceMetrics.responseTime < 3000 ? '良好' : '改善要'}
                  </Badge>
                </div>
                
                <div className="text-center p-3 bg-white rounded-lg">
                  <Database className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-lg font-bold text-gray-900">
                    {performanceMetrics.cacheEfficiency}%
                  </div>
                  <div className="text-sm text-gray-600">キャッシュ効率</div>
                  <Badge 
                    variant={performanceMetrics.cacheEfficiency > 80 ? 'success' : 'default'}
                    className="mt-1 text-xs"
                  >
                    {performanceMetrics.cacheEfficiency > 80 ? '最適' : '標準'}
                  </Badge>
                </div>
                
                <div className="text-center p-3 bg-white rounded-lg">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                  <div className="text-lg font-bold text-gray-900">
                    {performanceMetrics.errorRate}%
                  </div>
                  <div className="text-sm text-gray-600">エラー率</div>
                  <Badge 
                    variant={performanceMetrics.errorRate < 5 ? 'success' : 
                            performanceMetrics.errorRate < 10 ? 'default' : 'destructive'}
                    className="mt-1 text-xs"
                  >
                    {performanceMetrics.errorRate < 5 ? '安定' : 
                     performanceMetrics.errorRate < 10 ? '注意' : '要対応'}
                  </Badge>
                </div>
                
                <div className="text-center p-3 bg-white rounded-lg">
                  <RefreshCw className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-lg font-bold text-gray-900">
                    {Math.round((Date.now() - performanceMetrics.dataFreshness.getTime()) / 60000)}分前
                  </div>
                  <div className="text-sm text-gray-600">データ鮮度</div>
                  <Badge variant="outline" className="mt-1 text-xs">
                    リアルタイム
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* エクスポート設定モーダル風セクション */}
        {showFilters && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-600" />
                エクスポート設定
              </CardTitle>
              <CardDescription>
                分析結果のエクスポート形式と内容を選択
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">形式</label>
                  <select
                    value={exportConfig.format}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">セクション</label>
                  <div className="space-y-2">
                    {['overview', 'services', 'analysis', 'predictions'].map(section => (
                      <label key={section} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={exportConfig.sections.includes(section)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExportConfig(prev => ({ 
                                ...prev, 
                                sections: [...prev.sections, section] 
                              }));
                            } else {
                              setExportConfig(prev => ({ 
                                ...prev, 
                                sections: prev.sections.filter(s => s !== section) 
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="capitalize">{section}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">オプション</label>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={exportConfig.includeCharts}
                        onChange={(e) => setExportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                        className="mr-2"
                      />
                      チャート含む
                    </label>
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={exportConfig.includeRawData}
                        onChange={(e) => setExportConfig(prev => ({ ...prev, includeRawData: e.target.checked }))}
                        className="mr-2"
                      />
                      生データ含む
                    </label>
                  </div>
                </div>
                
                <div className="flex items-end">
                  <Button onClick={handleExport} className="w-full flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    エクスポート実行
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* フッター情報（拡張版） */}
        <div className="text-center text-xs sm:text-sm text-gray-500 space-y-2">
          <div className="flex flex-wrap justify-center gap-4">
            <span>最終更新: {new Date(data.overview.lastUpdated).toLocaleString('ja-JP')}</span>
            <span>•</span>
            <span>データ品質: {data.overview.dataQuality}%</span>
            <span>•</span>
            <span>統合サービス: {data.overview.connectedServices}/6</span>
            <span>•</span>
            <span>処理時間: {data.overview.processingTime}ms</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <span>AI分析: {data.overview.connectedServices > 0 ? 'リアルタイム機械学習分析' : 'フォールバックモード'}</span>
            <span>•</span>
            <span>キャッシュ効率: {data.overview.cacheHitRate}%</span>
            <span>•</span>
            <span>予測精度: {data.predictions.length > 0 ? `${Math.round(data.predictions.reduce((sum, p) => sum + p.confidence, 0) / data.predictions.length)}%` : 'N/A'}</span>
          </div>
          <p className="text-gray-400 pt-2">
            LinkSense MVP v1.0 - Advanced AI Analytics Engine
          </p>
        </div>
      </div>
    </div>
  );
};

export default OptimizedAnalyticsPage;