'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

// メンバー型定義（API仕様に対応）
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

// API設定
const API_CONFIG = {
  USE_MOCK_DATA: true,
  ENDPOINTS: {
    MEMBERS: '/api/members',
    MEMBER_DETAIL: '/api/members/{id}',
    MEMBER_UPDATE: '/api/members/{id}',
    MEMBER_DELETE: '/api/members/{id}'
  }
};

// 通知状態型定義
interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

// 完全なモックメンバーデータ（8名分）
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
    status: 'active' as const,
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
    position: 'フロントエンドエンジニア',
    avatar: '👩‍💻',
    joinDate: new Date('2023-01-15'),
    lastActive: new Date(Date.now() - 30 * 60 * 1000),
    healthScore: 92,
    previousHealthScore: 89,
    metrics: {
      productivity: 95,
      collaboration: 88,
      satisfaction: 91,
      workLifeBalance: 87,
      communication: 89
    },
    status: 'active' as const,
    projects: ['Webアプリリニューアル', 'モバイル対応', 'パフォーマンス改善'],
    skills: ['React', 'TypeScript', 'UI/UX'],
    recentActivities: [
      { type: 'code', description: 'コンポーネントリファクタリング完了', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { type: 'review', description: 'コードレビュー実施', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) }
    ],
    manager: '田中 太郎',
    directReports: 0
  },
  {
    id: '3',
    name: '山田 健太',
    email: 'yamada@company.com',
    role: 'member',
    team: '営業',
    position: '営業担当',
    avatar: '👨‍💼',
    joinDate: new Date('2021-09-01'),
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    healthScore: 78,
    previousHealthScore: 75,
    metrics: {
      productivity: 82,
      collaboration: 76,
      satisfaction: 74,
      workLifeBalance: 72,
      communication: 85
    },
    status: 'busy' as const,
    projects: ['新規開拓', '既存顧客フォロー', '提案書作成'],
    skills: ['営業戦略', '顧客対応', 'プレゼンテーション'],
    recentActivities: [
      { type: 'meeting', description: '顧客訪問', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      { type: 'proposal', description: '提案書提出', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) }
    ],
    manager: '田中 太郎',
    directReports: 0
  },
  {
    id: '4',
    name: '鈴木 花子',
    email: 'suzuki@company.com',
    role: 'admin',
    team: '人事',
    position: '人事部長',
    avatar: '👩‍💼',
    joinDate: new Date('2020-03-01'),
    lastActive: new Date(Date.now() - 45 * 60 * 1000),
    healthScore: 88,
    previousHealthScore: 85,
    metrics: {
      productivity: 87,
      collaboration: 92,
      satisfaction: 85,
      workLifeBalance: 81,
      communication: 95
    },
    status: 'active' as const,
    projects: ['採用活動', '人事制度改革', '研修プログラム'],
    skills: ['人事戦略', 'チームビルディング', '制度設計'],
    recentActivities: [
      { type: 'interview', description: '面接実施', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      { type: 'planning', description: '研修計画策定', timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000) }
    ],
    manager: 'CEO',
    directReports: 6
  },
  {
    id: '5',
    name: '高橋 直樹',
    email: 'takahashi@company.com',
    role: 'member',
    team: '開発',
    position: 'バックエンドエンジニア',
    avatar: '👨‍💻',
    joinDate: new Date('2022-08-01'),
    lastActive: new Date(Date.now() - 20 * 60 * 1000),
    healthScore: 83,
    previousHealthScore: 80,
    metrics: {
      productivity: 86,
      collaboration: 79,
      satisfaction: 81,
      workLifeBalance: 85,
      communication: 84
    },
    status: 'active' as const,
    projects: ['API開発', 'データベース最適化', 'セキュリティ強化'],
    skills: ['Node.js', 'Python', 'AWS'],
    recentActivities: [
      { type: 'deployment', description: 'API新機能デプロイ', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
      { type: 'optimization', description: 'DB最適化完了', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) }
    ],
    manager: '田中 太郎',
    directReports: 0
  },
  {
    id: '6',
    name: '伊藤 美穂',
    email: 'ito@company.com',
    role: 'member',
    team: 'デザイン',
    position: 'UIデザイナー',
    avatar: '👩‍🎨',
    joinDate: new Date('2023-02-01'),
    lastActive: new Date(Date.now() - 60 * 60 * 1000),
    healthScore: 90,
    previousHealthScore: 88,
    metrics: {
      productivity: 91,
      collaboration: 87,
      satisfaction: 93,
      workLifeBalance: 89,
      communication: 90
    },
    status: 'away' as const,
    projects: ['デザインシステム構築', 'ブランドリニューアル', 'アプリUI改善'],
    skills: ['Figma', 'Adobe Creative Suite', 'プロトタイピング'],
    recentActivities: [
      { type: 'design', description: 'デザインシステム更新', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
      { type: 'review', description: 'デザインレビュー', timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000) }
    ],
    manager: '田中 太郎',
    directReports: 0
  },
  {
    id: '7',
    name: '渡辺 智也',
    email: 'watanabe@company.com',
    role: 'manager',
    team: '営業',
    position: '営業マネージャー',
    avatar: '👨‍💼',
    joinDate: new Date('2021-05-01'),
    lastActive: new Date(Date.now() - 3 * 60 * 60 * 1000),
    healthScore: 75,
    previousHealthScore: 78,
    metrics: {
      productivity: 77,
      collaboration: 73,
      satisfaction: 72,
      workLifeBalance: 70,
      communication: 83
    },
    status: 'busy' as const,
    projects: ['売上目標達成', 'チーム育成', '新規市場開拓'],
    skills: ['営業管理', 'チームマネジメント', '戦略立案'],
    recentActivities: [
      { type: 'meeting', description: '営業会議', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { type: 'training', description: 'メンバー指導', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) }
    ],
    manager: 'CEO',
    directReports: 3
  },
  {
    id: '8',
    name: '中村 あかり',
    email: 'nakamura@company.com',
    role: 'member',
    team: 'マーケティング',
    position: 'デジタルマーケター',
    avatar: '👩‍💼',
    joinDate: new Date('2022-11-01'),
    lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000),
    healthScore: 87,
    previousHealthScore: 84,
    metrics: {
      productivity: 89,
      collaboration: 86,
      satisfaction: 85,
      workLifeBalance: 88,
      communication: 87
    },
    status: 'offline' as const,
    projects: ['SNS運用', 'コンテンツマーケティング', '広告運用'],
    skills: ['Google Analytics', 'SNS運用', 'コンテンツ制作'],
    recentActivities: [
      { type: 'campaign', description: 'キャンペーン企画完了', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
      { type: 'analysis', description: '効果分析レポート作成', timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000) }
    ],
    manager: '田中 太郎',
    directReports: 0
  }
];

// 🔧 APIサービス関数（修正版 - 戻り値を明示）
class MemberService {
  // メンバー一覧取得
  static async fetchMembers(): Promise<TeamMember[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      // 開発環境：モックデータ使用
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockMembers.map(member => ({
        ...member,
        joinDate: new Date(member.joinDate),
        lastActive: new Date(member.lastActive),
        recentActivities: member.recentActivities.map(activity => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }))
      }));
    } else {
      // 本番環境：実API使用
      try {
        const response = await fetch(API_CONFIG.ENDPOINTS.MEMBERS, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return data.map((member: any) => ({
          ...member,
          joinDate: new Date(member.joinDate),
          lastActive: new Date(member.lastActive),
          recentActivities: member.recentActivities?.map((activity: any) => ({
            ...activity,
            timestamp: new Date(activity.timestamp)
          })) || []
        }));
      } catch (error) {
        console.error('API fetch error:', error);
        throw error;
      }
    }
  }

  // 個別メンバー取得
  static async fetchMember(id: string): Promise<TeamMember> {
    if (API_CONFIG.USE_MOCK_DATA) {
      const member = mockMembers.find(m => m.id === id);
      if (!member) {
        throw new Error('Member not found');
      }
      return {
        ...member,
        joinDate: new Date(member.joinDate),
        lastActive: new Date(member.lastActive),
        recentActivities: member.recentActivities.map(activity => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }))
      };
    } else {
      try {
        const response = await fetch(
          API_CONFIG.ENDPOINTS.MEMBER_DETAIL.replace('{id}', id),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const member = await response.json();
        return {
          ...member,
          joinDate: new Date(member.joinDate),
          lastActive: new Date(member.lastActive),
          recentActivities: member.recentActivities?.map((activity: any) => ({
            ...activity,
            timestamp: new Date(activity.timestamp)
          })) || []
        };
      } catch (error) {
        console.error('API fetch member error:', error);
        throw error;
      }
    }
  }

  // メンバー更新
  static async updateMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
    if (API_CONFIG.USE_MOCK_DATA) {
      // モック環境での更新シミュレート
      console.log('Mock update:', id, updates);
      const member = await this.fetchMember(id);
      return { ...member, ...updates };
    } else {
      try {
        const response = await fetch(
          API_CONFIG.ENDPOINTS.MEMBER_UPDATE.replace('{id}', id),
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
            },
            body: JSON.stringify(updates)
          }
        );
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('API update member error:', error);
        throw error;
      }
    }
  }
}

// ユーティリティ関数群
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

const getScoreColor = (score: number): string => {
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

// MemberCard コンポーネント
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

  const handleViewNewDetails = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔗 Navigating to new member detail page:', member.id);
    window.location.href = `/members/${member.id}`;
  }, [member.id]);

  const handleEditMember = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔗 Navigating to edit page:', member.id);
    window.location.href = `/members/${member.id}/edit`;
  }, [member.id]);

  const handleShowModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewDetails(member);
  }, [member, onViewDetails]);

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      style={{ 
        animation: `slideUp 0.6s ease-out ${index * 0.1}s both`
      }}
      onClick={handleShowModal}
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
          {member.projects.slice(0, 3).map((project, idx) => (
            <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
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
            onClick={handleEditMember}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors z-10"
            title="メンバー情報を編集"
          >
            編集
          </button>
          <button
            onClick={handleViewNewDetails}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors z-10"
            title="新しい詳細ページを表示"
          >
            詳細
          </button>
          <button
            onClick={handleShowModal}
            className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors z-10"
            title="モーダルで詳細表示"
          >
            モーダル
          </button>
        </div>
      </div>
    </div>
  );
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
    <div className="fixed top-4 right-4 z-50" style={{ animation: 'slideInRight 0.3s ease-out' }}>
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

// メインコンポーネント（修正版）
export default function MembersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // 🔧 メンバーデータの取得（修正版 - 戻り値を明示）
  const fetchMembers = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const membersData = await MemberService.fetchMembers();
      setMembers(membersData);
      
      const dataSource = API_CONFIG.USE_MOCK_DATA ? 'モックデータ' : '実API';
      showNotification(`${dataSource}からメンバーデータを読み込みました (${membersData.length}名)`, 'success');
      
    } catch (error) {
      console.error('メンバーデータの読み込みに失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : 'データの読み込みに失敗しました';
      setError(errorMessage);
      showNotification('データの読み込みに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // 初期データ読み込み
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // リアルタイム更新（将来の実装用）
  useEffect(() => {
    if (!API_CONFIG.USE_MOCK_DATA) {
      const interval = setInterval(() => {
        fetchMembers();
      }, 30000);

      return () => clearInterval(interval);
    }
    return undefined; // 明示的にundefinedを返す
  }, [fetchMembers]);

  // 詳細表示（モーダル）
  const handleViewDetails = useCallback((member: TeamMember): void => {
    console.log('📋 Opening modal for member:', member.name);
    showNotification(`${member.name}の詳細をモーダルで表示中`, 'info');
  }, [showNotification]);

  // メンバー更新
  const handleUpdateMember = useCallback(async (member: TeamMember): Promise<void> => {
    try {
      await MemberService.updateMember(member.id, member);
      
      setMembers(prev => prev.map(m => m.id === member.id ? member : m));
      
      showNotification(`${member.name}の情報を更新しました`, 'success');
    } catch (error) {
      console.error('メンバー更新エラー:', error);
      showNotification('メンバー情報の更新に失敗しました', 'error');
    }
  }, [showNotification]);

  // エラー状態の表示
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">データ読み込みエラー</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchMembers}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ローディング状態の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">読み込み中...</h2>
            <p className="text-gray-600">
              {API_CONFIG.USE_MOCK_DATA ? 'モックデータ' : '実API'}からメンバーデータを取得しています
            </p>
          </div>
        </div>
      </div>
    );
  }

  // メインレンダリング
  return (
    <>
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6 pb-16">
          {/* ページヘッダー */}
          <div 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            style={{ animation: 'slideDown 0.6s ease-out' }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">チームメンバー</h1>
                <p className="text-gray-600 mt-1">
                  チームメンバーの健全性とパフォーマンスを管理します
                  {API_CONFIG.USE_MOCK_DATA && (
                    <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      開発モード
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={fetchMembers}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  title="データを再読み込み"
                >
                  🔄 更新
                </button>
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
            <div 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              style={{ animation: 'slideUp 0.6s ease-out 0.1s both' }}
            >
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

            <div 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              style={{ animation: 'slideUp 0.6s ease-out 0.2s both' }}
            >
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

            <div 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              style={{ animation: 'slideUp 0.6s ease-out 0.3s both' }}
            >
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

            <div 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              style={{ animation: 'slideUp 0.6s ease-out 0.4s both' }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">📈</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">平均スコア</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {members.length > 0 
                      ? Math.round(members.reduce((sum, m) => sum + m.healthScore, 0) / members.length)
                      : 0
                    }
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

            {members.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">メンバーが見つかりません</h3>
                <p className="text-gray-600">メンバーを追加するか、データを再読み込みしてください。</p>
              </div>
            ) : (
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
            )}
          </div>

          <div className="h-8"></div>
        </div>

        {/* 通知コンポーネント */}
        <Notification
          notification={notification}
          onClose={closeNotification}
        />
      </div>
    </>
  );
}