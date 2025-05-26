'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { AlertDetail, Comment } from '../../../types/api';

const AlertDetailPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAlertDetail = async () => {
      setIsLoading(true);
      
      // モックデータ
      const mockAlert: AlertDetail = {
        id: params.id as string,
        title: 'チーム開発部のストレスレベル上昇',
        message: '開発部メンバーの平均ストレスレベルが過去1週間で15%上昇しています。',
        severity: 'high',
        timestamp: '2025-05-26T10:30:00Z',
        isRead: false,
        description: `開発部チームにおいて、複数のメンバーのストレスレベルが継続的に上昇しています。
        主な要因として、プロジェクトの締切プレッシャー、技術的課題の複雑化、
        コミュニケーション不足が挙げられます。早急な対応が必要です。`,
        affectedMembers: ['田中太郎', '佐藤花子', '山田次郎'],
        relatedMetrics: [
          { name: 'ストレスレベル', value: 75, change: 15 },
          { name: 'コミュニケーション頻度', value: 45, change: -20 },
          { name: 'タスク完了率', value: 68, change: -12 }
        ],
        timeline: [
          { timestamp: '2025-05-26T10:30:00Z', action: 'アラート生成', user: 'システム' },
          { timestamp: '2025-05-25T14:20:00Z', action: 'ストレス値急上昇検知', user: 'システム' },
          { timestamp: '2025-05-24T09:15:00Z', action: '初期警告発生', user: 'システム' }
        ],
        recommendations: [
          '1対1ミーティングの実施',
          'タスクの優先順位見直し',
          'チームビルディング活動の企画',
          '技術サポート体制の強化'
        ]
      };

      const mockComments: Comment[] = [
        {
          id: '1',
          userId: 'manager1',
          userName: '田中マネージャー',
          content: '明日の朝一でチームミーティングを設定します。',
          timestamp: '2025-05-26T11:00:00Z',
          userAvatar: '/api/placeholder/32/32'
        },
        {
          id: '2',
          userId: 'admin1',
          userName: '管理者',
          content: 'HR部門と連携して対応策を検討中です。',
          timestamp: '2025-05-26T11:30:00Z',
          userAvatar: '/api/placeholder/32/32'
        }
      ];

      setTimeout(() => {
        setAlert(mockAlert);
        setComments(mockComments);
        setIsLoading(false);
      }, 500);
    };

    if (params.id) {
      fetchAlertDetail();
    }
    return undefined;
  }, [params.id]);

  const handleMarkAsRead = () => {
    if (alert) {
      setAlert({ ...alert, isRead: true });
    }
  };

  const handleAddComment = () => {
    if (newComment.trim() && user) {
      const comment: Comment = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        content: newComment,
        timestamp: new Date().toISOString(),
        userAvatar: user.avatar || '/api/placeholder/32/32' // デフォルト値を提供
      };
      setComments([...comments, comment]);
      setNewComment('');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">アラートが見つかりません</h2>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
              アラート一覧に戻る
            </button>
            <div className="flex space-x-3">
              {!alert.isRead && (
                <button
                  onClick={handleMarkAsRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  既読にする
                </button>
              )}
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                エクスポート
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(alert.severity)}`}>
                    {alert.severity === 'high' ? '高' : alert.severity === 'medium' ? '中' : '低'}
                  </span>
                  <span className="ml-3 text-sm text-gray-500">
                    {new Date(alert.timestamp).toLocaleString('ja-JP')}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{alert.title}</h1>
                <p className="text-gray-600">{alert.message}</p>
              </div>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: '概要' },
              { id: 'metrics', label: 'メトリクス' },
              { id: 'timeline', label: 'タイムライン' },
              { id: 'comments', label: 'コメント' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">詳細説明</h3>
                  <p className="text-gray-700 leading-relaxed">{alert.description}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">推奨対応策</h3>
                  <ul className="space-y-3">
                    {alert.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">関連メトリクス</h3>
                <div className="space-y-4">
                  {alert.relatedMetrics.map((metric, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{metric.name}</span>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-gray-900 mr-2">{metric.value}%</span>
                          <span className={`text-sm font-medium ${
                            metric.change > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {metric.change > 0 ? '+' : ''}{metric.change}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            metric.value >= 70 ? 'bg-red-500' : metric.value >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${metric.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">タイムライン</h3>
                <div className="space-y-4">
                  {alert.timeline.map((event, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-3 h-3 bg-blue-600 rounded-full mt-2 mr-4"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{event.action}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleString('ja-JP')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">実行者: {event.user}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">コメント</h3>
                
                {/* コメント投稿フォーム */}
                <div className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="コメントを入力してください..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      投稿
                    </button>
                  </div>
                </div>

                {/* コメント一覧 */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <img
                        src={comment.userAvatar}
                        alt={comment.userName}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{comment.userName}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.timestamp).toLocaleString('ja-JP')}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">影響を受けるメンバー</h3>
              <div className="space-y-3">
                {alert.affectedMembers.map((member, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                    <span className="text-gray-900">{member}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  ミーティング設定
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  HR部門に連絡
                </button>
                <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                  エスカレーション
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDetailPage;