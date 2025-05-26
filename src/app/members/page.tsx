'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// メンバー型定義
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  position: string;
  avatar: string;
  joinDate: Date;
  lastActive: Date;
  healthScore: number;
  previousHealthScore: number;
  metrics: {
    productivity: number;
    collaboration: number;
    satisfaction: number;
    workLifeBalance: number;
    communication: number;
  };
  status: 'active' | 'away' | 'busy' | 'offline';
  projects: string[];
  skills: string[];
  recentActivities: {
    type: string;
    description: string;
    timestamp: Date;
  }[];
  manager: string;
  directReports: number;
}

// フィルター状態型定義
interface MemberFilterState {
  team: string;
  role: string;
  status: string;
  healthScore: string;
  searchQuery: string;
  sortBy: string;
}

// 通知状態型定義
interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

// モックメンバーデータ
const mockMembers: TeamMember[] = [
  {
    id: '1',
    name: '田中 太郎',
    email: 'tanaka@company.com',
    role: 'manager',
    team: 'マーケティング',
    position: 'マーケティングマネージャー',
    avatar: '👨‍💼',
    joinDate: new Date('2022-04-01'),
    lastActive: new Date(Date.now() - 15 * 60 * 1000),
    healthScore: 85,
    previousHealthScore: 82,
    metrics: {
      productivity: 88,
      collaboration: 85,
      satisfaction: 82,
      workLifeBalance: 78,
      communication: 90
    },
    status: 'active',
    projects: ['ブランド戦略', '新商品ローンチ', 'デジタル広告'],
    skills: ['戦略立案', 'データ分析', 'チームマネジメント'],
    recentActivities: [
      { type: 'meeting', description: '週次チームミーティング', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      { type: 'project', description: 'Q4戦略レビュー完了', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      { type: 'collaboration', description: '開発チームとの連携会議', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) }
    ],
    manager: '山田 花子',
    directReports: 4
  },
  {
    id: '2',
    name: '佐藤 美咲',
    email: 'sato@company.com',
    role: 'member',
    team: '開発',
    position: 'シニアエンジニア',
    avatar: '👩‍💻',
    joinDate: new Date('2021-08-15'),
    lastActive: new Date(Date.now() - 5 * 60 * 1000),
    healthScore: 92,
    previousHealthScore: 89,
    metrics: {
      productivity: 95,
      collaboration: 88,
      satisfaction: 90,
      workLifeBalance: 85,
      communication: 92
    },
    status: 'active',
    projects: ['API開発', 'パフォーマンス最適化', 'セキュリティ強化'],
    skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
    recentActivities: [
      { type: 'code', description: 'API v2.0リリース', timestamp: new Date(Date.now() - 30 * 60 * 1000) },
      { type: 'review', description: 'コードレビュー完了', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { type: 'meeting', description: 'アーキテクチャ設計会議', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) }
    ],
    manager: '鈴木 一郎',
    directReports: 0
  },
  {
    id: '3',
    name: '高橋 健太',
    email: 'takahashi@company.com',
    role: 'member',
    team: '営業',
    position: '営業担当',
    avatar: '👨‍💼',
    joinDate: new Date('2023-01-10'),
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    healthScore: 76,
    previousHealthScore: 80,
    metrics: {
      productivity: 78,
      collaboration: 75,
      satisfaction: 70,
      workLifeBalance: 68,
      communication: 85
    },
    status: 'busy',
    projects: ['新規顧客開拓', '既存顧客フォロー', '営業戦略立案'],
    skills: ['営業', 'プレゼンテーション', '顧客関係管理'],
    recentActivities: [
      { type: 'meeting', description: '大手クライアント商談', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      { type: 'proposal', description: '提案書作成', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      { type: 'training', description: '営業研修参加', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    ],
    manager: '田中 太郎',
    directReports: 0
  },
  {
    id: '4',
    name: '渡辺 優子',
    email: 'watanabe@company.com',
    role: 'admin',
    team: '人事',
    position: '人事部長',
    avatar: '👩‍💼',
    joinDate: new Date('2020-03-01'),
    lastActive: new Date(Date.now() - 45 * 60 * 1000),
    healthScore: 88,
    previousHealthScore: 85,
    metrics: {
      productivity: 85,
      collaboration: 92,
      satisfaction: 88,
      workLifeBalance: 82,
      communication: 95
    },
    status: 'active',
    projects: ['採用活動', '人事制度改革', '従業員満足度調査'],
    skills: ['人事管理', '組織開発', 'コーチング', '労務管理'],
    recentActivities: [
      { type: 'interview', description: '新卒採用面接', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { type: 'policy', description: '人事制度見直し会議', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
      { type: 'training', description: 'マネージャー研修実施', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) }
    ],
    manager: 'CEO',
    directReports: 6
  },
  {
    id: '5',
    name: '小林 大輔',
    email: 'kobayashi@company.com',
    role: 'member',
    team: 'デザイン',
    position: 'UIデザイナー',
    avatar: '👨‍🎨',
    joinDate: new Date('2022-11-01'),
    lastActive: new Date(Date.now() - 8 * 60 * 60 * 1000),
    healthScore: 65,
    previousHealthScore: 72,
    metrics: {
      productivity: 68,
      collaboration: 62,
      satisfaction: 60,
      workLifeBalance: 58,
      communication: 70
    },
    status: 'away',
    projects: ['アプリUI改善', 'ブランドガイドライン', 'ユーザビリティテスト'],
    skills: ['UI/UX', 'Figma', 'Adobe Creative Suite', 'プロトタイピング'],
    recentActivities: [
      { type: 'design', description: 'モバイルアプリUI更新', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      { type: 'feedback', description: 'デザインレビュー対応', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) },
      { type: 'research', description: 'ユーザー調査分析', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    ],
    manager: '佐々木 恵',
    directReports: 0
  },
  {
    id: '6',
    name: '中村 智子',
    email: 'nakamura@company.com',
    role: 'member',
    team: 'カスタマーサポート',
    position: 'サポートスペシャリスト',
    avatar: '👩‍💻',
    joinDate: new Date('2021-06-15'),
    lastActive: new Date(Date.now() - 20 * 60 * 1000),
    healthScore: 91,
    previousHealthScore: 88,
    metrics: {
      productivity: 90,
      collaboration: 93,
      satisfaction: 92,
      workLifeBalance: 87,
      communication: 95
    },
    status: 'active',
    projects: ['顧客満足度向上', 'サポート体制強化', 'FAQ整備'],
    skills: ['顧客対応', '問題解決', 'システム知識', '多言語対応'],
    recentActivities: [
      { type: 'support', description: '顧客問題解決', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      { type: 'documentation', description: 'FAQ更新', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      { type: 'training', description: '新人研修サポート', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) }
    ],
    manager: '松本 正志',
    directReports: 0
  },
  {
    id: '7',
    name: '森田 健',
    email: 'morita@company.com',
    role: 'manager',
    team: '開発',
    position: 'テックリード',
    avatar: '👨‍💻',
    joinDate: new Date('2019-09-01'),
    lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000),
    healthScore: 89,
    previousHealthScore: 87,
    metrics: {
      productivity: 92,
      collaboration: 88,
      satisfaction: 85,
      workLifeBalance: 80,
      communication: 90
    },
    status: 'active',
    projects: ['アーキテクチャ設計', 'チーム育成', '技術戦略'],
    skills: ['システム設計', 'チームリード', 'Python', 'クラウド'],
    recentActivities: [
      { type: 'architecture', description: 'システム設計レビュー', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { type: 'mentoring', description: 'ジュニア開発者指導', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
      { type: 'planning', description: 'スプリント計画', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) }
    ],
    manager: 'CTO',
    directReports: 8
  },
  {
    id: '8',
    name: '井上 麻衣',
    email: 'inoue@company.com',
    role: 'member',
    team: 'マーケティング',
    position: 'デジタルマーケター',
    avatar: '👩‍💼',
    joinDate: new Date('2023-03-15'),
    lastActive: new Date(Date.now() - 30 * 60 * 1000),
    healthScore: 79,
    previousHealthScore: 75,
    metrics: {
      productivity: 82,
      collaboration: 78,
      satisfaction: 80,
      workLifeBalance: 75,
      communication: 80
    },
    status: 'active',
    projects: ['SNS運用', 'コンテンツマーケティング', 'データ分析'],
    skills: ['デジタルマーケティング', 'SNS運用', 'Google Analytics', 'SEO'],
    recentActivities: [
      { type: 'campaign', description: 'SNSキャンペーン企画', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { type: 'analysis', description: 'マーケティング効果分析', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
      { type: 'content', description: 'ブログ記事作成', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) }
    ],
    manager: '田中 太郎',
    directReports: 0
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
    return `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else {
    return `${diffDays}日前`;
  }
};

// 在籍期間計算
const calculateTenure = (joinDate: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - joinDate.getTime();
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;

  if (years > 0) {
    return `${years}年${months}ヶ月`;
  } else {
    return `${months}ヶ月`;
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
  if (score >= 85) return 'text-green-600 bg-green-100';
  if (score >= 75) return 'text-yellow-600 bg-yellow-100';
  if (score >= 65) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
};

// ステータス表示
const getStatusConfig = (status: TeamMember['status']) => {
  switch (status) {
    case 'active':
      return { color: 'bg-green-500', label: 'アクティブ', textColor: 'text-green-700' };
    case 'busy':
      return { color: 'bg-red-500', label: '取り込み中', textColor: 'text-red-700' };
    case 'away':
      return { color: 'bg-yellow-500', label: '離席中', textColor: 'text-yellow-700' };
    case 'offline':
      return { color: 'bg-gray-500', label: 'オフライン', textColor: 'text-gray-700' };
    default:
      return { color: 'bg-gray-500', label: '不明', textColor: 'text-gray-700' };
  }
};

// ロール表示
const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin': return '管理者';
    case 'manager': return 'マネージャー';
    case 'member': return 'メンバー';
    default: return role;
  }
};

// 通知コンポーネント
interface NotificationProps {
  notification: NotificationState;
  onClose: () => void;
}

const Notification = ({ notification, onClose }: NotificationProps) => {
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show, onClose]);

  if (!notification.show) return null;

  const typeConfig = {
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '✅' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'ℹ️' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '⚠️' },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '❌' }
  };

  const config = typeConfig[notification.type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`${config.bg} ${config.border} border rounded-lg p-4 shadow-lg max-w-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{config.icon}</span>
            <p className={`${config.text} font-medium`}>{notification.message}</p>
          </div>
          <button
            onClick={onClose}
            className={`${config.text} hover:opacity-70 transition-opacity`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// メンバーカードコンポーネント
interface MemberCardProps {
  member: TeamMember;
  onViewDetails: (member: TeamMember) => void;
  onUpdateMember: (member: TeamMember) => void;
  index: number;
}

const MemberCard = ({ member, onViewDetails, onUpdateMember, index }: MemberCardProps) => {
  const scoreChange = getScoreChange(member.healthScore, member.previousHealthScore);
  const scoreColorClass = getScoreColor(member.healthScore);
  const statusConfig = getStatusConfig(member.status);

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 animate-slide-up"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => onViewDetails(member)}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="text-4xl">{member.avatar}</div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusConfig.color} rounded-full border-2 border-white`}></div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
            <p className="text-gray-600">{member.position}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-gray-500">{member.team}チーム</span>
              <span className="text-gray-300">•</span>
              <span className={`text-sm ${statusConfig.textColor}`}>{statusConfig.label}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${scoreColorClass}`}>
            {member.healthScore}
          </div>
          <div className={`text-xs font-medium mt-1 ${scoreChange.color}`}>
            {scoreChange.icon} {scoreChange.value}
          </div>
        </div>
      </div>

      {/* メトリクス概要 */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">生産性</div>
          <div className={`font-bold text-sm ${getScoreColor(member.metrics.productivity).split(' ')[0]}`}>
            {member.metrics.productivity}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">協調性</div>
          <div className={`font-bold text-sm ${getScoreColor(member.metrics.collaboration).split(' ')[0]}`}>
            {member.metrics.collaboration}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">満足度</div>
          <div className={`font-bold text-sm ${getScoreColor(member.metrics.satisfaction).split(' ')[0]}`}>
            {member.metrics.satisfaction}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">WLB</div>
          <div className={`font-bold text-sm ${getScoreColor(member.metrics.workLifeBalance).split(' ')[0]}`}>
            {member.metrics.workLifeBalance}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">コミュ</div>
          <div className={`font-bold text-sm ${getScoreColor(member.metrics.communication).split(' ')[0]}`}>
            {member.metrics.communication}
          </div>
        </div>
      </div>

      {/* プロジェクト */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">現在のプロジェクト</h5>
        <div className="flex flex-wrap gap-1">
          {member.projects.slice(0, 3).map((project, index) => (
            <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {project}
            </span>
          ))}
          {member.projects.length > 3 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              +{member.projects.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* フッター */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <span>在籍: {calculateTenure(member.joinDate)}</span>
          <span className="mx-2">•</span>
          <span>最終: {formatTimeAgo(member.lastActive)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateMember(member);
            }}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            編集
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(member);
            }}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            詳細
          </button>
        </div>
      </div>
    </div>
  );
};

// フィルターコンポーネント
interface MemberFilterProps {
  filter: MemberFilterState;
  onFilterChange: (filter: MemberFilterState) => void;
  teams: string[];
  memberCounts: {
    total: number;
    filtered: number;
    active: number;
    needsAttention: number;
  };
}

const MemberFilter = ({ filter, onFilterChange, teams, memberCounts }: MemberFilterProps) => {
  const handleFilterChange = useCallback((key: keyof MemberFilterState, value: string) => {
    onFilterChange({
      ...filter,
      [key]: value
    });
  }, [filter, onFilterChange]);

  const resetFilters = useCallback(() => {
    onFilterChange({
      team: 'all',
      role: 'all',
      status: 'all',
      healthScore: 'all',
      searchQuery: '',
      sortBy: 'name'
    });
  }, [onFilterChange]);

  const isFiltered = filter.team !== 'all' || filter.role !== 'all' || 
                    filter.status !== 'all' || filter.healthScore !== 'all' || 
                    filter.searchQuery !== '';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 animate-slide-up">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">フィルター & 検索</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            表示中: <span className="font-semibold text-blue-600">{memberCounts.filtered}</span> / {memberCounts.total}人
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* 検索バー */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            検索
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="名前・メール・スキルで検索..."
              value={filter.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

         {/* チームフィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            チーム
          </label>
          <select
            value={filter.team}
            onChange={(e) => handleFilterChange('team', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="all">すべて</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>

        {/* ロールフィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ロール
          </label>
          <select
            value={filter.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="all">すべて</option>
            <option value="admin">管理者</option>
            <option value="manager">マネージャー</option>
            <option value="member">メンバー</option>
          </select>
        </div>

        {/* ステータスフィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ステータス
          </label>
          <select
            value={filter.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="all">すべて</option>
            <option value="active">アクティブ</option>
            <option value="busy">取り込み中</option>
            <option value="away">離席中</option>
            <option value="offline">オフライン</option>
          </select>
        </div>

        {/* 健全性スコアフィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            健全性スコア
          </label>
          <select
            value={filter.healthScore}
            onChange={(e) => handleFilterChange('healthScore', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="all">すべて</option>
            <option value="excellent">優秀 (85+)</option>
            <option value="good">良好 (75-84)</option>
            <option value="fair">普通 (65-74)</option>
            <option value="poor">要注意 (64以下)</option>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="name">名前順</option>
            <option value="healthScore">健全性スコア順</option>
            <option value="team">チーム順</option>
            <option value="joinDate">入社日順</option>
            <option value="lastActive">最終活動順</option>
          </select>
        </div>
      </div>

      {/* アクティブフィルター表示 */}
      {isFiltered && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-slide-down">
          <div className="text-sm text-gray-600 mb-2">アクティブフィルター:</div>
          <div className="flex flex-wrap gap-2">
            {filter.team !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-slide-in">
                チーム: {filter.team}
                <button
                  onClick={() => handleFilterChange('team', 'all')}
                  className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {filter.role !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-slide-in">
                ロール: {getRoleLabel(filter.role)}
                <button
                  onClick={() => handleFilterChange('role', 'all')}
                  className="ml-1 text-green-600 hover:text-green-800 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {filter.status !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 animate-slide-in">
                ステータス: {getStatusConfig(filter.status as TeamMember['status']).label}
                <button
                  onClick={() => handleFilterChange('status', 'all')}
                  className="ml-1 text-purple-600 hover:text-purple-800 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {filter.healthScore !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 animate-slide-in">
                スコア: {filter.healthScore === 'excellent' ? '優秀' : filter.healthScore === 'good' ? '良好' : filter.healthScore === 'fair' ? '普通' : '要注意'}
                <button
                  onClick={() => handleFilterChange('healthScore', 'all')}
                  className="ml-1 text-orange-600 hover:text-orange-800 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {filter.searchQuery && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-slide-in">
                検索: "{filter.searchQuery}"
                <button
                  onClick={() => handleFilterChange('searchQuery', '')}
                  className="ml-1 text-yellow-600 hover:text-yellow-800 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// メンバー詳細モーダルコンポーネント
interface MemberDetailModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateMember: (member: TeamMember) => void;
}

const MemberDetailModal = ({ member, isOpen, onClose, onUpdateMember }: MemberDetailModalProps) => {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // モーダル表示時にスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !member) return null;

  const scoreChange = getScoreChange(member.healthScore, member.previousHealthScore);
  const scoreColorClass = getScoreColor(member.healthScore);
  const statusConfig = getStatusConfig(member.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden animate-scale-in">
          {/* モーダルヘッダー */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="text-5xl">{member.avatar}</div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${statusConfig.color} rounded-full border-2 border-white`}></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{member.name}</h2>
                  <p className="text-blue-100">{member.position} | {member.team}チーム</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-blue-200 text-sm">{getRoleLabel(member.role)}</span>
                    <span className="text-blue-300">•</span>
                    <span className="text-blue-200 text-sm">{statusConfig.label}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors hover:rotate-90 duration-300"
                aria-label="モーダルを閉じる"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* モーダルコンテンツ */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 140px)' }}>
            <div className="p-6 pb-8">
              <div className="space-y-6">
                {/* 健全性スコア */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">健全性スコア</h3>
                    <div className="text-right">
                      <div className={`text-4xl font-bold px-6 py-3 rounded-lg ${scoreColorClass}`}>
                        {member.healthScore}
                      </div>
                      <div className={`text-sm font-medium mt-2 ${scoreChange.color}`}>
                        前月比: {scoreChange.value}
                      </div>
                    </div>
                  </div>
                  
                  {/* メトリクス詳細 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(member.metrics).map(([key, value]) => {
                      const metricLabels: { [key: string]: string } = {
                        productivity: '生産性',
                        collaboration: '協調性',
                        satisfaction: '満足度',
                        workLifeBalance: 'ワークライフバランス',
                        communication: 'コミュニケーション'
                      };
                      
                      return (
                        <div key={key} className="bg-white rounded-lg p-4 border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">{metricLabels[key]}</span>
                            <span className={`text-sm font-bold px-2 py-1 rounded ${getScoreColor(value)}`}>
                              {value}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                value >= 85 ? 'bg-green-500' :
                                value >= 75 ? 'bg-yellow-500' :
                                value >= 65 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${value}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 基本情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">メールアドレス:</span>
                        <div className="font-medium">{member.email}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">入社日:</span>
                        <div className="font-medium">{member.joinDate.toLocaleDateString('ja-JP')}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">在籍期間:</span>
                        <div className="font-medium">{calculateTenure(member.joinDate)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">最終活動:</span>
                        <div className="font-medium">{formatTimeAgo(member.lastActive)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">上司:</span>
                        <div className="font-medium">{member.manager}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">部下:</span>
                        <div className="font-medium">{member.directReports}人</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">スキル</h4>
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* プロジェクト */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">現在のプロジェクト</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {member.projects.map((project, index) => (
                      <div key={index} className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="text-green-600 text-sm mb-1">プロジェクト</div>
                        <div className="font-medium text-gray-900">{project}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 最近の活動 */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">最近の活動</h4>
                  <div className="space-y-4">
                    {member.recentActivities.map((activity, index) => {
                      const activityIcons: { [key: string]: string } = {
                        meeting: '🤝',
                        project: '📋',
                        collaboration: '👥',
                        code: '💻',
                        review: '👀',
                        support: '🎧',
                        documentation: '📝',
                        training: '📚',
                        interview: '👔',
                        policy: '📄',
                        campaign: '📢',
                        analysis: '📊',
                        content: '✍️',
                        design: '🎨',
                        feedback: '💬',
                        research: '🔍',
                        proposal: '📑',
                        architecture: '🏗️',
                        mentoring: '🧑‍🏫',
                        planning: '📅'
                      };
                      
                      return (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg">{activityIcons[activity.type] || '📌'}</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{activity.description}</div>
                            <div className="text-sm text-gray-600">{formatTimeAgo(activity.timestamp)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 追加の余白 */}
                <div className="h-8"></div>
              </div>
            </div>
          </div>

          {/* モーダルフッター */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => onUpdateMember(member)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  👤 プロフィール編集
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                  📊 パフォーマンス分析
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm">
                  📧 メッセージ送信
                </button>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// メインコンポーネント
export default function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });
  const [filter, setFilter] = useState<MemberFilterState>({
    team: 'all',
    role: 'all',
    status: 'all',
    healthScore: 'all',
    searchQuery: '',
    sortBy: 'name'
  });

  // 通知表示関数
  const showNotification = useCallback((message: string, type: NotificationState['type'] = 'info') => {
    setNotification({
      show: true,
      message,
      type
    });
  }, []);

  // 通知を閉じる
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  // メンバーデータの初期化
  useEffect(() => {
    const initializeMembers = async () => {
      try {
        setLoading(true);
        // 実際のAPIコールをシミュレート
        await new Promise(resolve => setTimeout(resolve, 800));
        setMembers(mockMembers);
        showNotification('メンバーデータを読み込みました', 'success');
      } catch (error) {
        console.error('メンバーデータの読み込みに失敗しました:', error);
        showNotification('データの読み込みに失敗しました', 'error');
      } finally {
        setLoading(false);
      }
    };

    initializeMembers();
  }, [showNotification]);

  // フィルタリング & ソート
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members.filter(member => {
      // チームフィルター
      if (filter.team !== 'all' && member.team !== filter.team) return false;
      
      // ロールフィルター
      if (filter.role !== 'all' && member.role !== filter.role) return false;
      
      // ステータスフィルター
      if (filter.status !== 'all' && member.status !== filter.status) return false;
      
      // 健全性スコアフィルター
      if (filter.healthScore !== 'all') {
        switch (filter.healthScore) {
          case 'excellent':
            if (member.healthScore < 85) return false;
            break;
          case 'good':
            if (member.healthScore < 75 || member.healthScore >= 85) return false;
            break;
          case 'fair':
            if (member.healthScore < 65 || member.healthScore >= 75) return false;
            break;
          case 'poor':
            if (member.healthScore >= 65) return false;
            break;
        }
      }
      
      // 検索フィルター
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const nameMatch = member.name.toLowerCase().includes(query);
        const emailMatch = member.email.toLowerCase().includes(query);
        const skillsMatch = member.skills.some(skill => skill.toLowerCase().includes(query));
        if (!nameMatch && !emailMatch && !skillsMatch) return false;
      }
      
      return true;
    });

    // ソート
    filtered.sort((a, b) => {
      switch (filter.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'healthScore':
          return b.healthScore - a.healthScore;
        case 'team':
          return a.team.localeCompare(b.team);
        case 'joinDate':
          return b.joinDate.getTime() - a.joinDate.getTime();
        case 'lastActive':
          return b.lastActive.getTime() - a.lastActive.getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [members, filter]);

  // 詳細表示
  const handleViewDetails = useCallback((member: TeamMember) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
  }, []);

  // メンバー更新
  const handleUpdateMember = useCallback((member: TeamMember) => {
    showNotification(`${member.name}の情報を更新しました`, 'success');
    setIsDetailModalOpen(false);
  }, [showNotification]);

  // モーダルを閉じる
  const handleCloseModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedMember(null);
  }, []);

  // 統計情報計算
  const memberCounts = useMemo(() => ({
    total: members.length,
    filtered: filteredAndSortedMembers.length,
    active: members.filter(m => m.status === 'active').length,
    needsAttention: members.filter(m => m.healthScore < 70).length
  }), [members, filteredAndSortedMembers]);

  // ユニークなチーム取得
  const teams = useMemo(() => 
    Array.from(new Set(members.map(member => member.team))).sort(), 
    [members]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">読み込み中...</h2>
            <p className="text-gray-600">メンバーデータを取得しています</p>
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
              <h1 className="text-2xl font-bold text-gray-900">チームメンバー</h1>
              <p className="text-gray-600 mt-1">チームメンバーの健全性とパフォーマンスを管理します</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                👤 メンバー追加
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                📊 一括分析
              </button>
            </div>
          </div>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg">👥</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">総メンバー数</div>
                <div className="text-2xl font-bold text-blue-600">{memberCounts.total}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-lg">✅</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">アクティブ</div>
                <div className="text-2xl font-bold text-green-600">{memberCounts.active}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-lg">⚠️</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">要注意</div>
                <div className="text-2xl font-bold text-orange-600">{memberCounts.needsAttention}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-lg">📈</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">平均スコア</div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(members.reduce((sum, m) => sum + m.healthScore, 0) / members.length)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* フィルターコンポーネント */}
        <MemberFilter
          filter={filter}
          onFilterChange={setFilter}
          teams={teams}
          memberCounts={memberCounts}
        />

        {/* メンバー一覧 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              メンバー一覧 ({filteredAndSortedMembers.length}人)
            </h2>
            <div className="text-sm text-gray-500">
              {filter.sortBy === 'name' && '名前順'}
              {filter.sortBy === 'healthScore' && '健全性スコア順'}
              {filter.sortBy === 'team' && 'チーム順'}
              {filter.sortBy === 'joinDate' && '入社日順'}
              {filter.sortBy === 'lastActive' && '最終活動順'}
            </div>
          </div>

          {filteredAndSortedMembers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center animate-fade-in">
              <div className="text-4xl text-gray-300 mb-4">👤</div>
              <p className="text-gray-500">
                {filter.team !== 'all' || filter.role !== 'all' || filter.status !== 'all' || filter.healthScore !== 'all' || filter.searchQuery
                  ? 'フィルター条件に一致するメンバーがいません'
                  : 'メンバーが登録されていません'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedMembers.map((member, index) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onViewDetails={handleViewDetails}
                  onUpdateMember={handleUpdateMember}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        <div className="h-8"></div>
      </div>

      {/* メンバー詳細モーダル */}
      <MemberDetailModal
        member={selectedMember}
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        onUpdateMember={handleUpdateMember}
      />

      {/* 通知コンポーネント */}
      <Notification
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
}