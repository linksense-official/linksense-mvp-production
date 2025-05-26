'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface Team {
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

const TeamsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      
      // モックデータ
      const mockTeams: Team[] = [
        {
          id: '1',
          name: '開発チーム',
          description: 'プロダクト開発を担当するメインチーム',
          memberCount: 8,
          leaderId: 'lead1',
          leaderName: '田中リーダー',
          healthScore: 78,
          status: 'active',
          createdAt: '2023-01-15',
          lastActivity: '2025-05-26',
          projects: 3,
          tags: ['開発', 'フロントエンド', 'バックエンド']
        },
        {
          id: '2',
          name: 'デザインチーム',
          description: 'UI/UXデザインとブランディングを担当',
          memberCount: 5,
          leaderId: 'lead2',
          leaderName: '佐藤リーダー',
          healthScore: 85,
          status: 'active',
          createdAt: '2023-02-01',
          lastActivity: '2025-05-25',
          projects: 2,
          tags: ['デザイン', 'UI', 'UX']
        },
        {
          id: '3',
          name: 'マーケティングチーム',
          description: 'プロダクトマーケティングと成長戦略',
          memberCount: 6,
          leaderId: 'lead3',
          leaderName: '山田リーダー',
          healthScore: 72,
          status: 'active',
          createdAt: '2023-01-20',
          lastActivity: '2025-05-24',
          projects: 4,
          tags: ['マーケティング', 'グロース', 'データ分析']
        },
        {
          id: '4',
          name: 'QAチーム',
          description: '品質保証とテスト自動化',
          memberCount: 4,
          leaderId: 'lead4',
          leaderName: '鈴木リーダー',
          healthScore: 88,
          status: 'active',
          createdAt: '2023-03-01',
          lastActivity: '2025-05-26',
          projects: 2,
          tags: ['QA', 'テスト', '自動化']
        },
        {
          id: '5',
          name: 'インフラチーム',
          description: 'システムインフラとDevOps',
          memberCount: 3,
          leaderId: 'lead5',
          leaderName: '高橋リーダー',
          healthScore: 82,
          status: 'active',
          createdAt: '2023-02-15',
          lastActivity: '2025-05-25',
          projects: 1,
          tags: ['インフラ', 'DevOps', 'AWS']
        },
        {
          id: '6',
          name: '旧プロジェクトチーム',
          description: '完了したプロジェクトのアーカイブ',
          memberCount: 0,
          leaderId: '',
          leaderName: '',
          healthScore: 0,
          status: 'archived',
          createdAt: '2022-06-01',
          lastActivity: '2024-12-31',
          projects: 0,
          tags: ['アーカイブ']
        }
      ];

      setTimeout(() => {
        setTeams(mockTeams);
        setIsLoading(false);
      }, 500);
    };

    fetchTeams();
    return undefined;
  }, []);

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.leaderName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || team.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'healthScore':
        return b.healthScore - a.healthScore;
      case 'memberCount':
        return b.memberCount - a.memberCount;
      case 'lastActivity':
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'アクティブ';
      case 'inactive': return '非アクティブ';
      case 'archived': return 'アーカイブ';
      default: return '不明';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">チーム管理</h1>
              <p className="text-gray-600 mt-1">組織内のチーム情報を管理</p>
            </div>
            <button
              onClick={() => router.push('/teams/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新規チーム作成
            </button>
          </div>

          {/* 統計サマリー */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総チーム数</p>
                  <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">アクティブチーム</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teams.filter(t => t.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総メンバー数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teams.reduce((sum, team) => sum + team.memberCount, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">平均健全性</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(teams.filter(t => t.status === 'active').reduce((sum, team) => sum + team.healthScore, 0) / teams.filter(t => t.status === 'active').length)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* フィルター・検索 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">検索</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="チーム名、説明、リーダーで検索..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">すべて</option>
                  <option value="active">アクティブ</option>
                  <option value="inactive">非アクティブ</option>
                  <option value="archived">アーカイブ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">並び順</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">チーム名</option>
                  <option value="healthScore">健全性スコア</option>
                  <option value="memberCount">メンバー数</option>
                  <option value="lastActivity">最終活動日</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSortBy('name');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  リセット
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* チーム一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/teams/${team.id}`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{team.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{team.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(team.status)}`}>
                    {getStatusText(team.status)}
                  </span>
                </div>

                {team.status !== 'archived' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{team.memberCount}</div>
                        <div className="text-xs text-gray-600">メンバー</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{team.projects}</div>
                        <div className="text-xs text-gray-600">プロジェクト</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getHealthScoreColor(team.healthScore)}`}>
                          {team.healthScore}
                        </div>
                        <div className="text-xs text-gray-600">健全性</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        リーダー: {team.leaderName}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        最終活動: {new Date(team.lastActivity).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-wrap gap-1">
                  {team.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {team.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      +{team.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
                <div className="flex justify-between items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/teams/${team.id}`);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    詳細を見る
                  </button>
                  {user?.role === 'admin' && team.status !== 'archived' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // 編集機能（実装予定）
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedTeams.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">チームが見つかりません</h3>
            <p className="mt-1 text-sm text-gray-500">検索条件を変更してください。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;