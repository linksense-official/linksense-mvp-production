'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface Message {
  user_id: string;
  text: string;
  timestamp: string;
  channel_id: string;
}

interface SlackData {
  users: User[];
  messages: Message[];
}

interface InteractionData {
  fromUser: string;
  toUser: string;
  count: number;
}

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useState<SlackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 認証チェック
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      if (isLoggedIn === 'true') {
        setIsAuthenticated(true);
      } else {
        window.location.href = '/login';
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/mockSlackData.json');
        if (!response.ok) {
          throw new Error('データの取得に失敗しました');
        }
        const slackData: SlackData = await response.json();
        setData(slackData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 関係性分析
  const analysisData = useMemo(() => {
    if (!data) return null;

    const interactions: InteractionData[] = [];
    const userActivity = new Map<string, number>();

    // 各ユーザーの活動度を初期化
    data.users.forEach(user => {
      userActivity.set(user.id, 0);
    });

    // メッセージを分析
    data.messages.forEach(message => {
      // 送信者の活動度を増加
      userActivity.set(message.user_id, (userActivity.get(message.user_id) || 0) + 1);

      // メンション（@U01形式）を抽出
      const mentions = message.text.match(/@U\d+/g) || [];
      mentions.forEach(mention => {
        const mentionedUserId = mention.substring(1); // @を除去
        if (mentionedUserId !== message.user_id) {
          // 既存のインタラクションを探す
          const existingInteraction = interactions.find(
            i => i.fromUser === message.user_id && i.toUser === mentionedUserId
          );
          
          if (existingInteraction) {
            existingInteraction.count++;
          } else {
            interactions.push({
              fromUser: message.user_id,
              toUser: mentionedUserId,
              count: 1
            });
          }
        }
      });
    });

    // 孤立リスクユーザーを特定（活動度が低い）
    const isolatedUsers = Array.from(userActivity.entries())
      .filter(([userId, activity]) => activity < 2)
      .map(([userId]) => userId);

    return {
      interactions,
      userActivity: Array.from(userActivity.entries()),
      isolatedUsers
    };
  }, [data]);

  // 認証チェック中
if (authLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">認証を確認中...</p>
      </div>
    </div>
  );
}

// 認証されていない場合
if (!isAuthenticated) {
  return null;
}

// 既存のif (loading)の部分はそのまま

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">LinkSense</h1>
            </div>
            
            {/* ユーザー情報とログアウト */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {typeof window !== 'undefined' && localStorage.getItem('userEmail')}
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('isLoggedIn');
                  localStorage.removeItem('userEmail');
                  window.location.href = '/login';
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="mt-2 text-gray-600">
            チームの関係性とコミュニケーション状況を可視化しています
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 関係性分析 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🔗 関係性分析
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">検出されたインタラクション</h3>
                  {analysisData?.interactions.length === 0 ? (
                    <p className="text-blue-700">直接的なメンションが検出されませんでした。</p>
                  ) : (
                    <div className="space-y-2">
                      {analysisData?.interactions.map((interaction, index) => {
                        const fromUser = data?.users.find(u => u.id === interaction.fromUser);
                        const toUser = data?.users.find(u => u.id === interaction.toUser);
                        return (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded">
                            <span className="text-blue-900">
                              {fromUser?.name} → {toUser?.name}
                            </span>
                            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-sm">
                              {interaction.count}回
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 孤立リスクアラート */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                ⚠️ 孤立リスクアラート
              </h2>
              {analysisData?.isolatedUsers.length === 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">良好な状態</h4>
                    <p className="text-sm text-gray-600">孤立リスクは検出されていません。</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-800">注意が必要</h4>
                      <p className="text-sm text-gray-600">活動の少ないメンバーがいます。</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {analysisData?.isolatedUsers.map(userId => {
                      const user = data?.users.find(u => u.id === userId);
                      return (
                        <div key={userId} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                          <img 
                            src={user?.avatar} 
                            alt={user?.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{user?.name}</p>
                            <p className="text-sm text-gray-600">活動頻度が低下</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ユーザー活動度ランキング */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📊 ユーザー活動度ランキング
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysisData?.userActivity
              .sort(([,a], [,b]) => b - a)
              .map(([userId, activity]) => {
                const user = data?.users.find(u => u.id === userId);
                return (
                  <div key={userId} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <img 
                      src={user?.avatar} 
                      alt={user?.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user?.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min((activity / 3) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{activity}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">チームメンバー</dt>
                  <dd className="text-lg font-medium text-gray-900">{data?.users.length}人</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">総メッセージ数</dt>
                  <dd className="text-lg font-medium text-gray-900">{data?.messages.length}件</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">インタラクション</dt>
                  <dd className="text-lg font-medium text-gray-900">{analysisData?.interactions.length}件</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">孤立リスク</dt>
                  <dd className="text-lg font-medium text-gray-900">{analysisData?.isolatedUsers.length}人</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        {/* 1on1推奨ペア */}
        <div className="mt-8 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            💬 1on1推奨ペア
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.users.map(user1 => 
              data.users
                .filter(user2 => user1.id !== user2.id)
                .filter(user2 => {
                  // インタラクションがないペアを探す
                  const hasInteraction = analysisData?.interactions.some(
                    i => (i.fromUser === user1.id && i.toUser === user2.id) ||
                         (i.fromUser === user2.id && i.toUser === user1.id)
                  );
                  return !hasInteraction && user1.id < user2.id; // 重複を避ける
                })
                .slice(0, 1) // 1つのペアのみ表示
                .map(user2 => (
                  <div key={`${user1.id}-${user2.id}`} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user1.avatar} 
                          alt={user1.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="font-medium text-gray-900">{user1.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-sm text-blue-600 font-medium">1on1推奨</span>
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{user2.name}</span>
                        <img 
                          src={user2.avatar} 
                          alt={user2.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      要検討
                    </div>
                  </div>
                ))
            ).flat().slice(0, 3)} {/* 最大3ペア表示 */}
          </div>
          
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-green-800 text-sm">
              <strong>推奨アクション:</strong> 上記のペアは最近コミュニケーションが少ないため、1on1ミーティングを検討してください。
            </p>
              {/* サブスクリプション情報 */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">現在のプラン</h2>
              <p className="text-sm text-gray-600">LinkSenseをより活用しませんか？</p>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              フリープラン
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* フリープラン（現在） */}
            <div className="bg-white rounded-lg border-2 border-green-200 p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">フリープラン</h3>
                <div className="text-3xl font-bold text-gray-900">¥0<span className="text-base font-normal text-gray-500">/月</span></div>
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium mt-2">現在のプラン</div>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  最大10名のチーム
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  基本的な関係性分析
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  7日間のデータ保持
                </li>
                <li className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 text-gray-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  高度な分析機能
                </li>
              </ul>
            </div>

            {/* プロプラン */}
            <div className="bg-white rounded-lg border-2 border-blue-500 p-6 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 text-sm font-medium rounded-full">おすすめ</span>
              </div>
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">プロプラン</h3>
                <div className="text-3xl font-bold text-gray-900">¥2,980<span className="text-base font-normal text-gray-500">/月</span></div>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  最大50名のチーム
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  高度な分析ダッシュボード
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  30日間のデータ保持
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Slack/Zoom API連携
                </li>
              </ul>
              <button 
                onClick={() => alert('プロプランへのアップグレード機能（デモ）')}
                className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                アップグレード
              </button>
            </div>

            {/* エンタープライズプラン */}
            <div className="bg-white rounded-lg border-2 border-gray-300 p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">エンタープライズ</h3>
                <div className="text-3xl font-bold text-gray-900">¥9,800<span className="text-base font-normal text-gray-500">/月</span></div>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  無制限のチームサイズ
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AI予測分析
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  1年間のデータ保持
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  優先サポート
                </li>
              </ul>
              <button 
                onClick={() => alert('エンタープライズプランのお問い合わせ（デモ）')}
                className="w-full py-2 px-4 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                お問い合わせ
              </button>
            </div>
          </div>
        </div>
          </div>
        </div>
      </main>
    </div>
  );
}