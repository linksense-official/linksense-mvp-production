'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

// メンバー型定義（既存と統合）
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

// モックメンバーデータ（既存のmockMembersをそのまま使用）
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
  // ... 他の7名のメンバーデータ（既存データをそのまま使用）
];

// ユーティリティ関数群（既存関数をそのまま使用）
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

const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-green-600 bg-green-100';
  if (score >= 75) return 'text-yellow-600 bg-yellow-100';
  if (score >= 65) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
};

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

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin': return '管理者';
    case 'manager': return 'マネージャー';
    case 'member': return 'メンバー';
    default: return role;
  }
};

// MemberCard コンポーネント（修正版）
interface MemberCardProps {
  member: TeamMember;
  onViewDetails: (member: TeamMember) => void;
  onUpdateMember: (member: TeamMember) => void;
  index: number;
}

const MemberCard = ({ member, onViewDetails, onUpdateMember, index }: MemberCardProps) => {
  const router = useRouter();
  const scoreChange = getScoreChange(member.healthScore, member.previousHealthScore);
  const scoreColorClass = getScoreColor(member.healthScore);
  const statusConfig = getStatusConfig(member.status);

  // 新しい詳細ページへの遷移
  const handleViewNewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔗 Navigating to new member detail page:', member.id);
    router.push(`/members/${member.id}`);
  };

  // 編集ページへの遷移
  const handleEditMember = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔗 Navigating to edit page:', member.id);
    router.push(`/members/${member.id}/edit`);
  };

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

      {/* 修正されたフッター */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <span>在籍: {calculateTenure(member.joinDate)}</span>
          <span className="mx-2">•</span>
          <span>最終: {formatTimeAgo(member.lastActive)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEditMember}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            title="メンバー情報を編集"
          >
            編集
          </button>
          <button
            onClick={handleViewNewDetails}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            title="新しい詳細ページを表示"
          >
            詳細
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(member);
            }}
            className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            title="モーダルで詳細表示"
          >
            モーダル
          </button>
        </div>
      </div>
    </div>
  );
};

// 通知コンポーネント（既存のまま）
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
    return undefined;
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

// メインコンポーネント
export default function MembersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
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

  // 詳細表示（モーダル）
  const handleViewDetails = useCallback((member: TeamMember) => {
    console.log('📋 Opening modal for member:', member.name);
    // モーダル機能は既存のまま維持
    showNotification(`${member.name}の詳細を表示中`, 'info');
  }, [showNotification]);

  // メンバー更新
  const handleUpdateMember = useCallback((member: TeamMember) => {
    showNotification(`${member.name}の情報を更新しました`, 'success');
  }, [showNotification]);

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
                <div className="text-2xl font-bold text-blue-600">{members.length}</div>
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
                <div className="text-2xl font-bold text-green-600">
                  {members.filter(m => m.status === 'active').length}
                </div>
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
                <div className="text-2xl font-bold text-orange-600">
                  {members.filter(m => m.healthScore < 70).length}
                </div>
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

        {/* メンバー一覧 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              メンバー一覧 ({members.length}人)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {members.map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                onViewDetails={handleViewDetails}
                onUpdateMember={handleUpdateMember}
                index={index}
              />
            ))}
          </div>
        </div>

        <div className="h-8"></div>
      </div>

      {/* 通知コンポーネント */}
      <Notification
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
}