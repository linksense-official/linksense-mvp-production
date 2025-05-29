'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { realDataTeamService, TeamData, TeamSummary, RealDataTeamResult } from '../../lib/services/real-data-team-service';

// 既存のTeam interfaceを削除し、TeamDataを使用

// DataSourceIndicatorコンポーネント
interface DataSourceIndicatorProps {
  isRealData: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: Date | null;
  dataCompleteness: number;
  onRefresh: () => void;
}

const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
  isRealData,
  syncStatus,
  lastSyncTime,
  dataCompleteness,
  onRefresh
}) => {
  const getStatusColor = () => {
    if (syncStatus === 'syncing') return 'text-blue-600';
    if (syncStatus === 'error') return 'text-red-600';
    return isRealData ? 'text-green-600' : 'text-yellow-600';
  };

  const getStatusText = () => {
    if (syncStatus === 'syncing') return '同期中...';
    if (syncStatus === 'error') return 'エラー';
    return isRealData ? '実際のSlackデータに基づく' : 'デモデータを表示中';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isRealData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            データ品質: {dataCompleteness}%
          </div>
          
          {lastSyncTime && (
            <div className="text-sm text-gray-600">
              最終更新: {lastSyncTime.toLocaleTimeString('ja-JP')}
            </div>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={syncStatus === 'syncing'}
          className={`px-3 py-1 text-sm rounded-lg flex items-center ${
            syncStatus === 'syncing'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          <svg 
            className={`w-4 h-4 mr-1 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          再同期
        </button>
      </div>
    </div>
  );
};

// Notificationコンポーネント
interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getNotificationColor = () => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg border ${getNotificationColor()} shadow-lg z-50 max-w-md`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const TeamsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  
  // 実データ管理用のstate
  const [isRealData, setIsRealData] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [dataCompleteness, setDataCompleteness] = useState(0);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchRealTeams = async () => {
    try {
      setSyncStatus('syncing');
      setIsLoading(true);
      
      const result: RealDataTeamResult = await realDataTeamService.fetchRealTeams();
      
      setTeams(result.teams);
      setSummary(result.summary);
      setIsRealData(result.isRealData);
      setSyncStatus(result.syncStatus);
      setLastSyncTime(result.lastSyncTime);
      setDataCompleteness(result.dataCompleteness);
      
      setNotification({
        message: result.isRealData 
          ? 'Slackデータからチーム情報を生成しました' 
          : 'デモデータを表示中です',
        type: result.isRealData ? 'success' : 'info'
      });
      
    } catch (error) {
      console.error('Failed to fetch team data:', error);
      setSyncStatus('error');
      setNotification({
        message: 'チームデータの読み込みに失敗しました',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTeams();
    
    // 5分間隔で自動更新
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchRealTeams();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">チームデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 通知 */}
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">チーム管理</h1>
              <p className="text-gray-600 mt-1">組織内のチーム情報を管理</p>
            </div>
            <button
              onClick={() => router.push('/teams/create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新規チーム作成
            </button>
          </div>

          {/* データソースインジケーター */}
          <DataSourceIndicator
            isRealData={isRealData}
            syncStatus={syncStatus}
            lastSyncTime={lastSyncTime}
            dataCompleteness={dataCompleteness}
            onRefresh={fetchRealTeams}
          />

          {/* 統計サマリー */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 transform hover:scale-105 transition-transform">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総チーム数</p>
                  <p className="text-2xl font-bold text-gray-900">{summary?.totalTeams || teams.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 transform hover:scale-105 transition-transform">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">アクティブチーム</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary?.activeTeams || teams.filter(t => t.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 transform hover:scale-105 transition-transform">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総メンバー数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary?.totalMembers || teams.reduce((sum, team) => sum + team.memberCount, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 transform hover:scale-105 transition-transform">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">平均健全性</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary?.averageHealthScore || Math.round(teams.filter(t => t.status === 'active').reduce((sum, team) => sum + team.healthScore, 0) / teams.filter(t => t.status === 'active').length)}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:scale-105 animate-slide-up"
              onClick={() => router.push(`/teams/${team.id}`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{team.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{team.description}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(team.status)}`}>
                      {getStatusText(team.status)}
                    </span>
                    {isRealData && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        実データ
                      </span>
                    )}
                  </div>
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

                    {/* 健全性メトリクス（実データ対応） */}
                    {team.metrics && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">健全性メトリクス</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">コミュニケーション</span>
                            <span className={getHealthScoreColor(team.metrics.communication)}>
                              {team.metrics.communication}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">生産性</span>
                            <span className={getHealthScoreColor(team.metrics.productivity)}>
                              {team.metrics.productivity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">満足度</span>
                            <span className={getHealthScoreColor(team.metrics.satisfaction)}>
                              {team.metrics.satisfaction}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">コラボレーション</span>
                            <span className={getHealthScoreColor(team.metrics.collaboration)}>
                              {team.metrics.collaboration}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* トレンド表示（実データ対応） */}
                    {team.trends && (
                      <div className="mb-4">
                        <div className="flex space-x-2 text-xs">
                          {team.trends.improving.length > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                              ↗ 改善中
                            </span>
                          )}
                          {team.trends.declining.length > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                              ↘ 要注意
                            </span>
                          )}
                          {team.trends.stable.length > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              → 安定
                            </span>
                          )}
                        </div>
                      </div>
                    )}

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
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    詳細を見る
                  </button>
                  {user?.role === 'admin' && team.status !== 'archived' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // 編集機能（実装予定）
                      }}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
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
          <div className="text-center py-12 animate-fade-in">
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