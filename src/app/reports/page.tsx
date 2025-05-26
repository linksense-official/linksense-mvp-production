'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// レポート型定義
interface TeamHealthReport {
  id: string;
  teamName: string;
  period: string;
  healthScore: number;
  previousScore: number;
  metrics: {
    communication: number;
    productivity: number;
    satisfaction: number;
    workLifeBalance: number;
    collaboration: number;
  };
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  recommendations: string[];
  lastUpdated: Date;
}

interface ReportSummary {
  totalTeams: number;
  averageHealthScore: number;
  teamsImproving: number;
  teamsDeclining: number;
  criticalIssues: number;
  period: string;
}

// フィルター状態型定義
interface ReportFilterState {
  period: string;
  team: string;
  metric: string;
  sortBy: string;
}

// モックレポートデータ
const mockReports: TeamHealthReport[] = [
  {
    id: '1',
    teamName: 'マーケティング',
    period: '2024年11月',
    healthScore: 72,
    previousScore: 78,
    metrics: {
      communication: 68,
      productivity: 75,
      satisfaction: 70,
      workLifeBalance: 65,
      collaboration: 82
    },
    trends: {
      improving: ['collaboration'],
      declining: ['communication', 'workLifeBalance'],
      stable: ['productivity', 'satisfaction']
    },
    recommendations: [
      'チーム内コミュニケーションの改善',
      'ワークライフバランスの見直し',
      '定期的な1on1ミーティングの実施'
    ],
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '2',
    teamName: '開発',
    period: '2024年11月',
    healthScore: 85,
    previousScore: 82,
    metrics: {
      communication: 88,
      productivity: 90,
      satisfaction: 85,
      workLifeBalance: 75,
      collaboration: 87
    },
    trends: {
      improving: ['productivity', 'satisfaction', 'communication'],
      declining: [],
      stable: ['workLifeBalance', 'collaboration']
    },
    recommendations: [
      '現在の好調な状態を維持',
      'ワークライフバランスの更なる改善',
      'チーム間連携の強化'
    ],
    lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000)
  },
  {
    id: '3',
    teamName: '営業',
    period: '2024年11月',
    healthScore: 79,
    previousScore: 76,
    metrics: {
      communication: 82,
      productivity: 78,
      satisfaction: 80,
      workLifeBalance: 70,
      collaboration: 85
    },
    trends: {
      improving: ['satisfaction', 'communication'],
      declining: ['workLifeBalance'],
      stable: ['productivity', 'collaboration']
    },
    recommendations: [
      'ワークライフバランスの改善施策',
      '目標設定の見直し',
      'チーム内情報共有の促進'
    ],
    lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000)
  },
  {
    id: '4',
    teamName: 'デザイン',
    period: '2024年11月',
    healthScore: 68,
    previousScore: 72,
    metrics: {
      communication: 65,
      productivity: 70,
      satisfaction: 68,
      workLifeBalance: 60,
      collaboration: 77
    },
    trends: {
      improving: [],
      declining: ['communication', 'satisfaction', 'workLifeBalance'],
      stable: ['productivity', 'collaboration']
    },
    recommendations: [
      '緊急：チーム健全性の改善が必要',
      'プロジェクト負荷の見直し',
      'チームビルディング活動の実施',
      'メンタルヘルスサポートの強化'
    ],
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: '5',
    teamName: 'カスタマーサポート',
    period: '2024年11月',
    healthScore: 83,
    previousScore: 80,
    metrics: {
      communication: 85,
      productivity: 82,
      satisfaction: 88,
      workLifeBalance: 78,
      collaboration: 82
    },
    trends: {
      improving: ['satisfaction', 'workLifeBalance'],
      declining: [],
      stable: ['communication', 'productivity', 'collaboration']
    },
    recommendations: [
      '現在の良好な状態を維持',
      'ベストプラクティスの他チーム展開',
      '継続的な改善活動の推進'
    ],
    lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    id: '6',
    teamName: '人事',
    period: '2024年11月',
    healthScore: 75,
    previousScore: 73,
    metrics: {
      communication: 78,
      productivity: 72,
      satisfaction: 75,
      workLifeBalance: 80,
      collaboration: 70
    },
    trends: {
      improving: ['workLifeBalance', 'communication'],
      declining: [],
      stable: ['productivity', 'satisfaction', 'collaboration']
    },
    recommendations: [
      'チーム間連携の強化',
      'プロセス効率化の推進',
      '社内制度の見直し'
    ],
    lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000)
  }
];

// 時間フォーマット関数
const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes}分前更新`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前更新`;
  } else {
    return `${diffDays}日前更新`;
  }
};

// スコア変化の表示
const getScoreChange = (current: number, previous: number) => {
  const change = current - previous;
  if (change > 0) {
    return { value: `+${change}`, color: 'text-green-600', icon: '↗️' };
  } else if (change < 0) {
    return { value: `${change}`, color: 'text-red-600', icon: '↘️' };
  } else {
    return { value: '±0', color: 'text-gray-600', icon: '→' };
  }
};

// スコアカラー取得
const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 bg-green-100';
  if (score >= 70) return 'text-yellow-600 bg-yellow-100';
  if (score >= 60) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
};

// メトリクス表示コンポーネント
interface MetricsRadarProps {
  metrics: TeamHealthReport['metrics'];
  teamName: string;
}

const MetricsRadar = ({ metrics, teamName }: MetricsRadarProps) => {
  const metricsData = [
    { name: 'コミュニケーション', value: metrics.communication, key: 'communication' },
    { name: '生産性', value: metrics.productivity, key: 'productivity' },
    { name: '満足度', value: metrics.satisfaction, key: 'satisfaction' },
    { name: 'ワークライフバランス', value: metrics.workLifeBalance, key: 'workLifeBalance' },
    { name: 'コラボレーション', value: metrics.collaboration, key: 'collaboration' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">{teamName} - 詳細メトリクス</h4>
      <div className="space-y-4">
        {metricsData.map((metric) => (
          <div key={metric.key} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{metric.name}</span>
              <span className={`text-sm font-bold px-2 py-1 rounded ${getScoreColor(metric.value)}`}>
                {metric.value}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  metric.value >= 80 ? 'bg-green-500' :
                  metric.value >= 70 ? 'bg-yellow-500' :
                  metric.value >= 60 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${metric.value}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// トレンド表示コンポーネント
interface TrendsDisplayProps {
  trends: TeamHealthReport['trends'];
}

const TrendsDisplay = ({ trends }: TrendsDisplayProps) => {
  const metricLabels: { [key: string]: string } = {
    communication: 'コミュニケーション',
    productivity: '生産性',
    satisfaction: '満足度',
    workLifeBalance: 'ワークライフバランス',
    collaboration: 'コラボレーション'
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">トレンド分析</h4>
      <div className="space-y-4">
        {trends.improving.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <span className="text-green-600 text-lg mr-2">📈</span>
              <span className="font-medium text-green-700">改善中</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trends.improving.map((metric) => (
                <span
                  key={metric}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {metricLabels[metric]}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {trends.declining.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <span className="text-red-600 text-lg mr-2">📉</span>
              <span className="font-medium text-red-700">悪化中</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trends.declining.map((metric) => (
                <span
                  key={metric}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                >
                  {metricLabels[metric]}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {trends.stable.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <span className="text-gray-600 text-lg mr-2">📊</span>
              <span className="font-medium text-gray-700">安定</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trends.stable.map((metric) => (
                <span
                  key={metric}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {metricLabels[metric]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// レポートカードコンポーネント
interface ReportCardProps {
  report: TeamHealthReport;
  onViewDetails: (report: TeamHealthReport) => void;
  index: number;
}

const ReportCard = ({ report, onViewDetails, index }: ReportCardProps) => {
  const scoreChange = getScoreChange(report.healthScore, report.previousScore);
  const scoreColorClass = getScoreColor(report.healthScore);

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 animate-slide-up"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => onViewDetails(report)}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{report.teamName}チーム</h3>
          <p className="text-sm text-gray-600">{report.period} | {formatTimeAgo(report.lastUpdated)}</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${scoreColorClass}`}>
            {report.healthScore}
          </div>
          <div className={`text-sm font-medium mt-1 ${scoreChange.color}`}>
            {scoreChange.icon} {scoreChange.value}
          </div>
        </div>
      </div>

      {/* メトリクス概要 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">コミュニケーション</div>
          <div className={`font-bold ${getScoreColor(report.metrics.communication).split(' ')[0]}`}>
            {report.metrics.communication}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">生産性</div>
          <div className={`font-bold ${getScoreColor(report.metrics.productivity).split(' ')[0]}`}>
            {report.metrics.productivity}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">満足度</div>
          <div className={`font-bold ${getScoreColor(report.metrics.satisfaction).split(' ')[0]}`}>
            {report.metrics.satisfaction}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">ワークライフ</div>
          <div className={`font-bold ${getScoreColor(report.metrics.workLifeBalance).split(' ')[0]}`}>
            {report.metrics.workLifeBalance}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">コラボレーション</div>
          <div className={`font-bold ${getScoreColor(report.metrics.collaboration).split(' ')[0]}`}>
            {report.metrics.collaboration}
          </div>
        </div>
      </div>

      {/* 推奨事項プレビュー */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">主な推奨事項</h5>
        <p className="text-sm text-gray-600 line-clamp-2">
          {report.recommendations[0]}
        </p>
      </div>

      {/* アクションボタン */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {report.trends.improving.length > 0 && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              📈 {report.trends.improving.length}項目改善
            </span>
          )}
          {report.trends.declining.length > 0 && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              📉 {report.trends.declining.length}項目悪化
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(report);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          詳細を見る
        </button>
      </div>
    </div>
  );
};

// フィルターコンポーネント
interface ReportFilterProps {
  filter: ReportFilterState;
  onFilterChange: (filter: ReportFilterState) => void;
  teams: string[];
  reportCounts: {
    total: number;
    filtered: number;
  };
}

const ReportFilter = ({ filter, onFilterChange, teams, reportCounts }: ReportFilterProps) => {
  const handleFilterChange = (key: keyof ReportFilterState, value: string) => {
    onFilterChange({
      ...filter,
      [key]: value
    });
  };

  const resetFilters = () => {
    onFilterChange({
      period: 'all',
      team: 'all',
      metric: 'all',
      sortBy: 'healthScore'
    });
  };

  const isFiltered = filter.period !== 'all' || filter.team !== 'all' || filter.metric !== 'all';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 animate-slide-up">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">フィルター & ソート</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            表示中: <span className="font-semibold text-blue-600">{reportCounts.filtered}</span> / {reportCounts.total}件
          </div>
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              リセット
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 期間フィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            期間
          </label>
          <select
            value={filter.period}
            onChange={(e) => handleFilterChange('period', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">すべて</option>
            <option value="2024年11月">2024年11月</option>
            <option value="2024年10月">2024年10月</option>
            <option value="2024年09月">2024年09月</option>
          </select>
        </div>

        {/* チームフィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            チーム
          </label>
          <select
            value={filter.team}
            onChange={(e) => handleFilterChange('team', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">すべて</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>

        {/* メトリクスフィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            重点メトリクス
          </label>
          <select
            value={filter.metric}
            onChange={(e) => handleFilterChange('metric', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">すべて</option>
            <option value="communication">コミュニケーション</option>
            <option value="productivity">生産性</option>
            <option value="satisfaction">満足度</option>
            <option value="workLifeBalance">ワークライフバランス</option>
            <option value="collaboration">コラボレーション</option>
          </select>
        </div>

        {/* ソート */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ソート
          </label>
          <select
            value={filter.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="healthScore">健全性スコア順</option>
            <option value="teamName">チーム名順</option>
            <option value="lastUpdated">更新日時順</option>
            <option value="improvement">改善度順</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// メインコンポーネント
export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<TeamHealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<TeamHealthReport | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filter, setFilter] = useState<ReportFilterState>({
    period: 'all',
    team: 'all',
    metric: 'all',
    sortBy: 'healthScore'
  });

  // レポートデータの初期化
  useEffect(() => {
    const initializeReports = async () => {
      try {
        setLoading(true);
        // 実際のAPIコールをシミュレート
        await new Promise(resolve => setTimeout(resolve, 800));
        setReports(mockReports);
      } catch (error) {
        console.error('レポートデータの読み込みに失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeReports();
  }, []);

  // フィルタリング & ソート
  const filteredAndSortedReports = useMemo(() => {
    let filtered = reports.filter(report => {
      if (filter.period !== 'all' && report.period !== filter.period) return false;
      if (filter.team !== 'all' && report.teamName !== filter.team) return false;
      return true;
    });

    // ソート
    filtered.sort((a, b) => {
      switch (filter.sortBy) {
        case 'healthScore':
          return b.healthScore - a.healthScore;
        case 'teamName':
          return a.teamName.localeCompare(b.teamName);
        case 'lastUpdated':
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        case 'improvement':
          const aImprovement = a.healthScore - a.previousScore;
          const bImprovement = b.healthScore - b.previousScore;
          return bImprovement - aImprovement;
        default:
          return 0;
      }
    });

    return filtered;
  }, [reports, filter]);

  // 詳細表示
  const handleViewDetails = (report: TeamHealthReport) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  // サマリー計算
  const reportSummary: ReportSummary = useMemo(() => {
    const totalTeams = reports.length;
    const averageHealthScore = Math.round(
      reports.reduce((sum, report) => sum + report.healthScore, 0) / totalTeams
    );
    const teamsImproving = reports.filter(r => r.healthScore > r.previousScore).length;
    const teamsDeclining = reports.filter(r => r.healthScore < r.previousScore).length;
    const criticalIssues = reports.filter(r => r.healthScore < 70).length;

    return {
      totalTeams,
      averageHealthScore,
      teamsImproving,
      teamsDeclining,
      criticalIssues,
      period: '2024年11月'
    };
  }, [reports]);

  // ユニークなチーム取得
  const teams = useMemo(() => 
    Array.from(new Set(reports.map(report => report.teamName))).sort(), 
    [reports]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">読み込み中...</h2>
            <p className="text-gray-600">レポートデータを取得しています</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6 pb-16">
        {/* ページヘッダー */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slide-down">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">チーム健全性レポート</h1>
              <p className="text-gray-600 mt-1">各チームの詳細な健全性分析とトレンドレポート</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                📊 レポート出力
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                📧 レポート共有
              </button>
            </div>
          </div>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg">👥</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">総チーム数</div>
                <div className="text-2xl font-bold text-blue-600">{reportSummary.totalTeams}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-lg">📊</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">平均健全性スコア</div>
                <div className={`text-2xl font-bold ${getScoreColor(reportSummary.averageHealthScore).split(' ')[0]}`}>
                  {reportSummary.averageHealthScore}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-lg">📈</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">改善中チーム</div>
                <div className="text-2xl font-bold text-green-600">{reportSummary.teamsImproving}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-lg">📉</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">悪化中チーム</div>
                <div className="text-2xl font-bold text-red-600">{reportSummary.teamsDeclining}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-lg">⚠️</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">要注意チーム</div>
                <div className="text-2xl font-bold text-orange-600">{reportSummary.criticalIssues}</div>
              </div>
            </div>
          </div>
        </div>

        {/* フィルターコンポーネント */}
        <ReportFilter
          filter={filter}
          onFilterChange={setFilter}
          teams={teams}
          reportCounts={{
            total: reports.length,
            filtered: filteredAndSortedReports.length
          }}
        />

        {/* レポート一覧 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              チームレポート一覧 ({filteredAndSortedReports.length}件)
            </h2>
            <div className="text-sm text-gray-500">
              {filter.sortBy === 'healthScore' && '健全性スコア順'}
              {filter.sortBy === 'teamName' && 'チーム名順'}
              {filter.sortBy === 'lastUpdated' && '更新日時順'}
              {filter.sortBy === 'improvement' && '改善度順'}
            </div>
          </div>

          {filteredAndSortedReports.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center animate-fade-in">
              <div className="text-4xl text-gray-300 mb-4">📋</div>
              <p className="text-gray-500">フィルター条件に一致するレポートがありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAndSortedReports.map((report, index) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onViewDetails={handleViewDetails}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        <div className="h-8"></div>
      </div>

      {/* 詳細モーダル */}
      {selectedReport && isDetailModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsDetailModalOpen(false)}
          ></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden animate-scale-in">
              {/* モーダルヘッダー */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedReport.teamName}チーム 詳細レポート</h2>
                    <p className="text-blue-100">{selectedReport.period} | {formatTimeAgo(selectedReport.lastUpdated)}</p>
                  </div>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* モーダルコンテンツ（スクロール可能エリア） */}
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 140px)' }}>
                <div className="p-6 pb-8">
                  <div className="space-y-6">
                    {/* 健全性スコア */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">総合健全性スコア</h3>
                        <div className="text-right">
                          <div className={`text-4xl font-bold px-6 py-3 rounded-lg ${getScoreColor(selectedReport.healthScore)}`}>
                            {selectedReport.healthScore}
                          </div>
                          <div className={`text-sm font-medium mt-2 ${getScoreChange(selectedReport.healthScore, selectedReport.previousScore).color}`}>
                            前月比: {getScoreChange(selectedReport.healthScore, selectedReport.previousScore).value}
                          </div>
                        </div>
                      </div>
                      
                      {/* スコア解釈 */}
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-gray-900 mb-2">スコア解釈</h4>
                        <p className="text-gray-700 text-sm">
                          {selectedReport.healthScore >= 80 && '非常に良好な状態です。現在の取り組みを継続し、他チームのベストプラクティスとして共有することを推奨します。'}
                          {selectedReport.healthScore >= 70 && selectedReport.healthScore < 80 && '良好な状態ですが、改善の余地があります。特定の分野に焦点を当てた施策を検討してください。'}
                          {selectedReport.healthScore >= 60 && selectedReport.healthScore < 70 && '注意が必要な状態です。早急な改善施策の実施を推奨します。'}
                          {selectedReport.healthScore < 60 && '緊急対応が必要です。包括的な改善計画の策定と実行が急務です。'}
                        </p>
                      </div>
                    </div>

                    {/* メトリクス詳細とトレンド */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <MetricsRadar 
                        metrics={selectedReport.metrics} 
                        teamName={selectedReport.teamName}
                      />
                      <TrendsDisplay trends={selectedReport.trends} />
                    </div>

                    {/* 推奨事項 */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">推奨改善施策</h4>
                      <div className="space-y-3">
                        {selectedReport.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">
                              {index + 1}
                            </div>
                            <p className="text-gray-700 text-sm">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* アクションプラン */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6 mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">次のステップ</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-green-600 text-lg mb-2">🎯</div>
                          <h5 className="font-medium text-gray-900 mb-1">短期目標 (1ヶ月)</h5>
                          <p className="text-sm text-gray-600">
                            最も改善が必要な1-2項目に集中的に取り組む
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                          <div className="text-blue-600 text-lg mb-2">📈</div>
                          <h5 className="font-medium text-gray-900 mb-1">中期目標 (3ヶ月)</h5>
                          <p className="text-sm text-gray-600">
                            全体的なスコア向上と安定化を図る
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <div className="text-purple-600 text-lg mb-2">🌟</div>
                          <h5 className="font-medium text-gray-900 mb-1">長期目標 (6ヶ月)</h5>
                          <p className="text-sm text-gray-600">
                            持続可能な高健全性状態の維持
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 追加の余白 */}
                    <div className="h-8"></div>
                  </div>
                </div>
              </div>

              {/* モーダルフッター（固定） */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                      📊 詳細レポート出力
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                      📧 チームに共有
                    </button>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm">
                      📅 改善計画作成
                    </button>
                  </div>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 