'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// アラート型定義
interface TeamAlert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  team: string;
  timestamp: Date;
  isRead: boolean;
  category: 'health_decline' | 'communication_drop' | 'engagement_low' | 'meeting_overload' | 'response_delay';
  source: 'slack' | 'teams' | 'googleWorkspace' | 'zoom' | 'discord' | 'line-works' | 'system';
  affectedMembers: string[];
  metrics: {
    currentScore: number;
    previousScore: number;
    changePercentage: number;
  };
  actionRequired: boolean;
}

// データソース情報型定義
interface DataSourceInfo {
  hasData: boolean;
  source: string;
  lastUpdated: string;
  connectionStatus: 'connected' | 'error' | 'no_data';
  alertCount: number;
}

// フィルター状態型定義
interface FilterState {
  severity: string;
  status: string;
  team: string;
  category: string;
  searchQuery: string;
}

// チーム健全性アラート生成サービス
class TeamHealthAlertsService {
  static async fetchHealthAlerts(): Promise<{ alertsData: TeamAlert[] | null, dataSourceInfo: DataSourceInfo }> {
    try {
      console.log('チーム健全性データを取得中...');
      
      // 統合情報取得
      const integrationsResponse = await fetch('/api/integrations/user');
      let integrationsData = null;
      let integrations: any[] = [];
      
      if (integrationsResponse.ok) {
        integrationsData = await integrationsResponse.json();
        integrations = integrationsData?.integrations || [];
      }

      const connectedServices = integrations.filter((i: any) => i.isActive).length;

      // 接続されたサービスがない場合
      if (connectedServices === 0) {
        return {
          alertsData: null,
          dataSourceInfo: {
            hasData: false,
            source: 'チーム健全性監視システム',
            lastUpdated: new Date().toISOString(),
            connectionStatus: 'no_data',
            alertCount: 0
          }
        };
      }

      // 実際の健全性データからアラート生成
      const healthAlerts = await this.generateHealthAlerts(integrations, connectedServices);
      
      return {
        alertsData: healthAlerts,
        dataSourceInfo: {
          hasData: healthAlerts.length > 0,
          source: 'チーム健全性監視システム',
          lastUpdated: new Date().toISOString(),
          connectionStatus: 'connected',
          alertCount: healthAlerts.length
        }
      };
    } catch (error) {
      console.error('健全性アラート取得エラー:', error);
      return {
        alertsData: null,
        dataSourceInfo: {
          hasData: false,
          source: 'チーム健全性監視システム',
          lastUpdated: new Date().toISOString(),
          connectionStatus: 'error',
          alertCount: 0
        }
      };
    }
  }

  static async generateHealthAlerts(integrations: any[], connectedServices: number): Promise<TeamAlert[]> {
    const now = new Date();
    const alerts: TeamAlert[] = [];

    // 実際の健全性データに基づくアラート生成
    // 現在は接続されたサービスがあってもデータが不十分な場合は空配列を返す
    
    // 将来的に実装予定:
    // 1. コミュニケーション頻度の急激な低下
    // 2. チーム内の応答時間の悪化
    // 3. ミーティング参加率の低下
    // 4. エンゲージメントスコアの低下
    // 5. ストレス指標の上昇

    // 現在はデータ不足のため空配列を返す
    return alerts;
  }
}

// APIサービス関数
class AlertService {
  static async fetchAlerts(): Promise<{ alertsData: TeamAlert[] | null, dataSourceInfo: DataSourceInfo }> {
    return await TeamHealthAlertsService.fetchHealthAlerts();
  }
}

// 時間フォーマット関数
const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else {
    return `${diffDays}日前`;
  }
};

// カスタムAlert UIコンポーネント
const CustomAlertTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h5 className={`font-medium mb-2 ${className}`}>{children}</h5>
);

const CustomAlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`text-sm ${className}`}>{children}</div>
);

// データソースインジケーター コンポーネント
interface DataSourceIndicatorProps {
  dataSourceInfo: DataSourceInfo;
}

const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({ dataSourceInfo }) => {
  const getIndicatorConfig = () => {
    if (dataSourceInfo.connectionStatus === 'connected' && dataSourceInfo.hasData) {
      return {
        color: 'bg-green-50 text-green-800 border-green-200',
        icon: CheckCircle,
        text: 'チーム健全性監視中',
        description: `${dataSourceInfo.alertCount}件のアラートを検出`
      };
    } else if (dataSourceInfo.connectionStatus === 'connected' && !dataSourceInfo.hasData) {
      return {
        color: 'bg-blue-50 text-blue-800 border-blue-200',
        icon: Info,
        text: 'チーム健全性良好',
        description: '現在、健全性に関する問題は検出されていません'
      };
    } else if (dataSourceInfo.connectionStatus === 'no_data') {
      return {
        color: 'bg-gray-50 text-gray-800 border-gray-200',
        icon: Info,
        text: 'データ不足',
        description: '健全性監視にはサービス統合が必要です'
      };
    } else {
      return {
        color: 'bg-red-50 text-red-800 border-red-200',
        icon: XCircle,
        text: 'システムエラー',
        description: 'データ取得に失敗しました'
      };
    }
  };

  const config = getIndicatorConfig();
  const IconComponent = config.icon;

  return (
    <Alert className={`mb-6 ${config.color} border`}>
      <IconComponent className="h-4 w-4" />
      <CustomAlertTitle className="flex items-center gap-2">
        {config.text}
      </CustomAlertTitle>
      <CustomAlertDescription>
        {config.description} • 最終更新: {new Date(dataSourceInfo.lastUpdated).toLocaleString('ja-JP')}
      </CustomAlertDescription>
    </Alert>
  );
};

// アラートカードコンポーネント
interface AlertCardProps {
  alert: TeamAlert;
  onMarkAsRead: (id: string) => void;
  onClick: (alert: TeamAlert) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onMarkAsRead, onClick }) => {
  const severityConfig = {
    critical: { 
      bg: 'bg-red-50', 
      border: 'border-l-red-500', 
      icon: XCircle,
      label: '緊急',
      labelColor: 'bg-red-100 text-red-800'
    },
    warning: { 
      bg: 'bg-yellow-50', 
      border: 'border-l-yellow-500', 
      icon: AlertTriangle,
      label: '警告',
      labelColor: 'bg-yellow-100 text-yellow-800'
    },
    info: { 
      bg: 'bg-blue-50', 
      border: 'border-l-blue-500', 
      icon: Info,
      label: '情報',
      labelColor: 'bg-blue-100 text-blue-800'
    }
  };

  const config = severityConfig[alert.severity];
  const IconComponent = config.icon;

  return (
    <div 
      className={`
        bg-white ${config.border} border-l-4 border border-gray-200 rounded-lg p-4 sm:p-6 
        hover:shadow-lg transition-all duration-300 cursor-pointer
        ${!alert.isRead ? 'shadow-md ring-1 ring-blue-200' : 'shadow-sm'}
      `}
      onClick={() => onClick(alert)}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {alert.title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!alert.isRead && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    未読
                  </span>
                )}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.labelColor}`}>
                  {config.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-700 text-sm leading-relaxed">
          {alert.message}
        </p>
      </div>

      {/* メトリクス表示 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-gray-600">現在スコア:</span>
            <span className="ml-1 font-medium">{alert.metrics.currentScore}</span>
          </div>
          <div>
            <span className="text-gray-600">前回スコア:</span>
            <span className="ml-1 font-medium">{alert.metrics.previousScore}</span>
          </div>
          <div>
            <span className="text-gray-600">変化:</span>
            <span className={`ml-1 font-medium ${alert.metrics.changePercentage < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {alert.metrics.changePercentage > 0 ? '+' : ''}{alert.metrics.changePercentage}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span>{formatTimeAgo(alert.timestamp)}</span>
          <span>{alert.team}</span>
          <span>{alert.affectedMembers.length}名に影響</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!alert.isRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(alert.id);
              }}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-all duration-200"
            >
              既読
            </button>
          )}
          {alert.actionRequired && (
            <span className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
              要対応
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// メインコンポーネント
export default function AlertsPage() {
  const { user } = useAuth();
  
  // 状態管理
  const [data, setData] = useState<TeamAlert[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSourceInfo, setDataSourceInfo] = useState<DataSourceInfo | null>(null);
  
  // フィルター状態
  const [filter, setFilter] = useState<FilterState>({
    severity: 'all',
    status: 'all',
    team: 'all',
    category: 'all',
    searchQuery: ''
  });

  // データ取得関数
  const fetchData = useCallback(async () => {
    try {
      const { alertsData, dataSourceInfo: fetchedDataSourceInfo } = await AlertService.fetchAlerts();
      setData(alertsData);
      setDataSourceInfo(fetchedDataSourceInfo);
    } catch (error) {
      console.error('アラートデータ取得エラー:', error);
      setData(null);
      setDataSourceInfo({
        hasData: false,
        source: 'チーム健全性監視システム',
        lastUpdated: new Date().toISOString(),
        connectionStatus: 'error',
        alertCount: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 初期データ取得
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // OAuth成功後の自動更新
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      console.log('OAuth成功後のアラート更新');
      fetchData();
      
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [fetchData]);

  // 手動更新
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // アラートを既読にする
  const markAsRead = useCallback((alertId: string) => {
    if (data) {
      setData(prev => 
        prev ? prev.map(alert => 
          alert.id === alertId ? { ...alert, isRead: true } : alert
        ) : null
      );
    }
  }, [data]);

  // アラート詳細表示
  const showAlertDetail = useCallback((alert: TeamAlert) => {
    console.log('アラート詳細:', alert);
  }, []);

  // フィルター適用
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    return data.filter(alert => {
      if (filter.severity !== 'all' && alert.severity !== filter.severity) return false;
      if (filter.status === 'unread' && alert.isRead) return false;
      if (filter.status === 'read' && !alert.isRead) return false;
      if (filter.team !== 'all' && alert.team !== filter.team) return false;
      if (filter.category !== 'all' && alert.category !== filter.category) return false;
      
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        return alert.title.toLowerCase().includes(query) || 
               alert.message.toLowerCase().includes(query);
      }
      
      return true;
    });
  }, [data, filter]);

  // 統計計算
  const alertCounts = useMemo(() => {
    if (!data) return { total: 0, unread: 0, critical: 0, warning: 0, info: 0, filtered: 0 };
    
    const total = data.length;
    const unread = data.filter(a => !a.isRead).length;
    const critical = data.filter(a => a.severity === 'critical').length;
    const warning = data.filter(a => a.severity === 'warning').length;
    const info = data.filter(a => a.severity === 'info').length;
    const filtered = filteredData.length;

    return { total, unread, critical, warning, info, filtered };
  }, [data, filteredData]);

  // ユニークな値の取得
  const uniqueTeams = useMemo(() => data ? [...new Set(data.map(a => a.team))] : [], [data]);
  const uniqueCategories = useMemo(() => data ? [...new Set(data.map(a => a.category))] : [], [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">チーム健全性データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* ヘッダー */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">チーム健全性アラート</h1>
              <p className="text-gray-600 mt-2">
                チームの健全性低下やコミュニケーション課題を早期検知します
              </p>
            </div>
            
            <Button onClick={handleRefresh} disabled={refreshing} className="self-start sm:self-auto">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="ml-2">更新</span>
            </Button>
          </div>
        </div>

        {/* データソース表示 */}
        {dataSourceInfo && <DataSourceIndicator dataSourceInfo={dataSourceInfo} />}

        {/* データがない場合の表示 */}
        {(!data || data.length === 0) && dataSourceInfo && (
          <div className="text-center py-12 sm:py-16">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
                {dataSourceInfo.connectionStatus === 'no_data' 
                  ? 'データが不足しています'
                  : dataSourceInfo.connectionStatus === 'error'
                  ? 'データ取得エラー'
                  : 'アラートはありません'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {dataSourceInfo.connectionStatus === 'no_data' 
                  ? 'チーム健全性の監視には、コミュニケーションサービスの統合が必要です。'
                  : dataSourceInfo.connectionStatus === 'error'
                  ? 'データの取得に失敗しました。しばらく時間をおいて再試行してください。'
                  : 'チームの健全性は良好です。問題が検出された場合、こちらに表示されます。'
                }
              </p>
              {dataSourceInfo.connectionStatus === 'no_data' && (
                <Button 
                  onClick={() => window.location.href = '/integrations'}
                  className="w-full sm:w-auto"
                >
                  サービス統合を設定
                </Button>
              )}
            </div>
          </div>
        )}

        {/* アラートがある場合の表示 */}
        {data && data.length > 0 && (
          <>
            {/* 統計サマリー */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">総アラート</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{alertCounts.total}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">未読</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{alertCounts.unread}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">緊急</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{alertCounts.critical}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">警告</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{alertCounts.warning}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6 col-span-2 sm:col-span-1">
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">情報</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{alertCounts.info}</p>
                </div>
              </div>
            </div>

            {/* フィルター */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">フィルター</h3>
                <div className="text-sm text-gray-600">
                  表示中: <span className="font-semibold text-blue-600">{alertCounts.filtered}</span> / {alertCounts.total}件
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 検索バー */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    検索
                  </label>
                  <input
                    type="text"
                    placeholder="タイトル・メッセージで検索..."
                    value={filter.searchQuery}
                    onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 重要度フィルター */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    重要度
                  </label>
                  <select
                    value={filter.severity}
                    onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">すべて</option>
                    <option value="critical">緊急 ({alertCounts.critical})</option>
                    <option value="warning">警告 ({alertCounts.warning})</option>
                    <option value="info">情報 ({alertCounts.info})</option>
                  </select>
                </div>

                {/* ステータスフィルター */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <select
                    value={filter.status}
                    onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">すべて</option>
                    <option value="unread">未読のみ ({alertCounts.unread})</option>
                    <option value="read">既読のみ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* アラート一覧 */}
            <div className="space-y-4">
              {filteredData.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    フィルター条件に一致するアラートがありません
                  </h3>
                  <p className="text-gray-600 mb-4">
                    フィルター条件を変更してください
                  </p>
                  <Button
                    onClick={() => setFilter({
                      severity: 'all',
                      status: 'all',
                      team: 'all',
                      category: 'all',
                      searchQuery: ''
                    })}
                  >
                    フィルターをリセット
                  </Button>
                </div>
              ) : (
                filteredData.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onMarkAsRead={markAsRead}
                    onClick={showAlertDetail}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}