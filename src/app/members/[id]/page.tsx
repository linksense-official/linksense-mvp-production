'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface MemberDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  joinDate: string;
  avatar: string;
  status: 'active' | 'inactive' | 'on-leave';
  healthScore: number;
  metrics: {
    stress: number;
    satisfaction: number;
    engagement: number;
    workload: number;
    communication: number;
  };
  recentActivity: {
    date: string;
    action: string;
    details: string;
  }[];
  skills: string[];
  projects: {
    name: string;
    role: string;
    status: 'active' | 'completed' | 'on-hold';
    completion: number;
  }[];
  goals: {
    title: string;
    description: string;
    progress: number;
    dueDate: string;
    status: 'on-track' | 'at-risk' | 'completed';
  }[];
  feedback: {
    date: string;
    from: string;
    type: 'positive' | 'constructive' | 'neutral';
    content: string;
  }[];
}

const MemberDetailPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchMemberDetail = async () => {
      setIsLoading(true);
      
      // モックデータ
      const mockMember: MemberDetail = {
        id: params.id as string,
        name: '田中太郎',
        email: 'tanaka@company.com',
        role: 'シニアエンジニア',
        department: '開発部',
        joinDate: '2022-04-01',
        avatar: '/api/placeholder/100/100',
        status: 'active',
        healthScore: 78,
        metrics: {
          stress: 68,
          satisfaction: 82,
          engagement: 75,
          workload: 85,
          communication: 70
        },
        recentActivity: [
          { date: '2025-05-26', action: 'プロジェクト完了', details: 'ユーザー認証機能の実装を完了' },
          { date: '2025-05-25', action: 'ミーティング参加', details: 'スプリント計画ミーティングに参加' },
          { date: '2025-05-24', action: 'コードレビュー', details: '3件のプルリクエストをレビュー' },
          { date: '2025-05-23', action: '技術文書作成', details: 'API設計書を更新' }
        ],
        skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
        projects: [
          { name: 'ユーザー管理システム', role: 'リードエンジニア', status: 'active', completion: 75 },
          { name: 'モバイルアプリAPI', role: 'バックエンド開発', status: 'completed', completion: 100 },
          { name: 'データ分析基盤', role: 'アーキテクト', status: 'on-hold', completion: 30 }
        ],
        goals: [
          {
            title: 'AWS認定取得',
            description: 'AWS Solutions Architect Associate認定の取得',
            progress: 60,
            dueDate: '2025-07-31',
            status: 'on-track'
          },
          {
            title: 'チームリーダーシップ向上',
            description: 'ジュニアメンバーのメンタリング強化',
            progress: 40,
            dueDate: '2025-08-31',
            status: 'at-risk'
          }
        ],
        feedback: [
          {
            date: '2025-05-20',
            from: '佐藤マネージャー',
            type: 'positive',
            content: '技術的な問題解決能力が非常に高く、チームの技術レベル向上に貢献している。'
          },
          {
            date: '2025-05-15',
            from: '山田リーダー',
            type: 'constructive',
            content: 'コミュニケーションをもう少し積極的に取ることで、さらにチームに貢献できると思います。'
          }
        ]
      };

      setTimeout(() => {
        setMember(mockMember);
        setIsLoading(false);
      }, 500);
    };

    if (params.id) {
      fetchMemberDetail();
    }
    return undefined;
  }, [params.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'on-leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'アクティブ';
      case 'inactive': return '非アクティブ';
      case 'on-leave': return '休暇中';
      default: return '不明';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-green-100 text-green-800';
      case 'at-risk': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'constructive': return 'bg-yellow-100 text-yellow-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">メンバーが見つかりません</h2>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* メインコンテンツエリア */}
      <div className="pb-24"> {/* ✨ 下部マージンを追加 */}
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* ヘッダー */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  メンバー一覧に戻る
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push(`/members/${member.id}/edit`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    編集
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    1on1予約
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start space-x-6">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">{member.name}</h1>
                        <p className="text-gray-600 mb-2">{member.role} • {member.department}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900 mb-1">{member.healthScore}</div>
                        <div className="text-sm text-gray-600 mb-2">健全性スコア</div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(member.status)}`}>
                          {getStatusText(member.status)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">入社日:</span>
                        <span className="ml-2 text-gray-900">{new Date(member.joinDate).toLocaleDateString('ja-JP')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">在籍期間:</span>
                        <span className="ml-2 text-gray-900">
                          {Math.floor((new Date().getTime() - new Date(member.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365))}年
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* タブナビゲーション */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8 overflow-x-auto"> {/* ✨ 横スクロール対応 */}
                {[
                  { id: 'overview', label: '概要' },
                  { id: 'metrics', label: 'メトリクス' },
                  { id: 'projects', label: 'プロジェクト' },
                  { id: 'goals', label: '目標' },
                  { id: 'feedback', label: 'フィードバック' },
                  { id: 'activity', label: '活動履歴' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* タブコンテンツ */}
            <div className="mb-8"> {/* ✨ 下部マージンを追加 */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">スキル</h3>
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">最近の活動</h3>
                    <div className="space-y-3">
                      {member.recentActivity.slice(0, 4).map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{activity.action}</span>
                              <span className="text-sm text-gray-500">{activity.date}</span>
                            </div>
                            <p className="text-sm text-gray-600">{activity.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'metrics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(member.metrics).map(([key, value]) => (
                    <div key={key} className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {key === 'stress' ? 'ストレス' :
                           key === 'satisfaction' ? '満足度' :
                           key === 'engagement' ? 'エンゲージメント' :
                           key === 'workload' ? 'ワークロード' :
                           key === 'communication' ? 'コミュニケーション' : key}
                        </h3>
                        <span className="text-2xl font-bold text-gray-900">{value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            value >= 80 ? 'bg-green-500' :
                            value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {value >= 80 ? '良好' : value >= 60 ? '普通' : '要注意'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="space-y-4">
                  {member.projects.map((project, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                          <p className="text-gray-600">{project.role}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProjectStatusColor(project.status)}`}>
                          {project.status === 'active' ? 'アクティブ' :
                           project.status === 'completed' ? '完了' : '保留中'}
                        </span>
                      </div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-gray-600">進捗</span>
                        <span className="text-sm font-medium text-gray-900">{project.completion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${project.completion}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'goals' && (
                <div className="space-y-4">
                  {member.goals.map((goal, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mr-3">{goal.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGoalStatusColor(goal.status)}`}>
                              {goal.status === 'on-track' ? '順調' :
                               goal.status === 'at-risk' ? 'リスク有' : '完了'}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{goal.description}</p>
                          <div className="text-sm text-gray-500">
                            期限: {new Date(goal.dueDate).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      </div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-gray-600">進捗</span>
                        <span className="text-sm font-medium text-gray-900">{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            goal.status === 'on-track' ? 'bg-green-500' :
                            goal.status === 'at-risk' ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'feedback' && (
                <div className="space-y-4">
                  {member.feedback.map((fb, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium mr-3 ${getFeedbackTypeColor(fb.type)}`}>
                            {fb.type === 'positive' ? 'ポジティブ' :
                             fb.type === 'constructive' ? '建設的' : '中立'}
                          </span>
                          <span className="text-sm text-gray-600">from {fb.from}</span>
                        </div>
                        <span className="text-sm text-gray-500">{new Date(fb.date).toLocaleDateString('ja-JP')}</span>
                      </div>
                      <p className="text-gray-700">{fb.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">活動履歴</h3>
                  <div className="space-y-4">
                    {member.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-b-0">
                        <div className="flex-shrink-0 w-3 h-3 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{activity.action}</span>
                            <span className="text-sm text-gray-500">{activity.date}</span>
                          </div>
                          <p className="text-gray-600">{activity.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✨ 固定フッターボタン */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            戻る
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/members/${member.id}/edit`)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              編集
            </button>
            
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.456L3 21l2.456-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
              1on1予約
            </button>
            
            <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              レポート
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailPage;