'use client';

import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  MapPin, 
  Clock, 
  Shield, 
  AlertTriangle, 
  X, 
  RefreshCw,
  LogOut 
} from 'lucide-react';

interface SessionInfo {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  device: string;
  browser: string;
  isCurrentSession: boolean;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
}

interface SessionData {
  sessions: SessionInfo[];
  currentSessionId: string;
  totalSessions: number;
}

const SessionManager: React.FC = () => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // セッションデータの取得
  const fetchSessions = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/sessions');
      
      if (response.ok) {
        const data = await response.json();
        setSessionData(data);
        setError(null);
      } else {
        setError('セッション情報の取得に失敗しました');
      }
    } catch (err) {
      setError('セッション情報の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    fetchSessions();
  }, []);

  // セッション終了
  const terminateSession = async (sessionId: string): Promise<void> => {
    try {
      setActionLoading(sessionId);
      
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          action: 'terminate-session'
        })
      });

      if (response.ok) {
        await fetchSessions(); // セッション一覧を更新
        alert('セッションを終了しました');
      } else {
        alert('セッションの終了に失敗しました');
      }
    } catch (err) {
      alert('エラーが発生しました');
    } finally {
      setActionLoading(null);
    }
  };

  // 他のセッションをすべて終了
  const terminateAllOthers = async (): Promise<void> => {
    if (!confirm('他のすべてのセッションを終了しますか？')) {
      return;
    }

    try {
      setActionLoading('all-others');
      
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'terminate-all-others'
        })
      });

      if (response.ok) {
        await fetchSessions();
        alert('他のすべてのセッションを終了しました');
      } else {
        alert('セッションの終了に失敗しました');
      }
    } catch (err) {
      alert('エラーが発生しました');
    } finally {
      setActionLoading(null);
    }
  };

  // すべてのセッションを終了
  const terminateAllSessions = async (): Promise<void> => {
    if (!confirm('すべてのセッションを終了しますか？現在のセッションからもログアウトされます。')) {
      return;
    }

    try {
      setActionLoading('all');
      
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'terminate-all'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.shouldLogout) {
          alert('すべてのセッションを終了しました。ログインページにリダイレクトします。');
          window.location.href = '/login';
        }
      } else {
        alert('セッションの終了に失敗しました');
      }
    } catch (err) {
      alert('エラーが発生しました');
    } finally {
      setActionLoading(null);
    }
  };

  // デバイスアイコンの取得
  const getDeviceIcon = (device: string): React.ReactNode => {
    switch (device) {
      case 'モバイル':
        return <Smartphone className="w-5 h-5 text-blue-600" />;
      case 'タブレット':
        return <Tablet className="w-5 h-5 text-green-600" />;
      default:
        return <Monitor className="w-5 h-5 text-gray-600" />;
    }
  };

  // 日時フォーマット
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  // 相対時間表示
  const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'たった今';
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    return `${diffDays}日前`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">セッション情報を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">エラー</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4">
              <button
                onClick={fetchSessions}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="text-center p-8 text-gray-500">
        セッション情報がありません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">アクティブセッション</h2>
          <p className="text-sm text-gray-600">
            現在ログインしているデバイスとセッションを管理します
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchSessions}
            disabled={!!actionLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
            更新
          </button>
          <button
            onClick={terminateAllOthers}
            disabled={!!actionLoading}
            className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
          >
            {actionLoading === 'all-others' ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            他のセッションを終了
          </button>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm font-medium text-blue-900">
                アクティブセッション: {sessionData.totalSessions}
              </div>
              <div className="text-xs text-blue-700">
                現在のセッション: {sessionData.currentSessionId}
              </div>
            </div>
          </div>
          <button
            onClick={terminateAllSessions}
            disabled={!!actionLoading}
            className="inline-flex items-center px-3 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
          >
            {actionLoading === 'all' ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <X className="w-3 h-3 mr-1" />
            )}
            すべて終了
          </button>
        </div>
      </div>

      {/* セッション一覧 */}
      <div className="space-y-4">
        {sessionData.sessions.map((session) => (
          <div
            key={session.id}
            className={`border rounded-lg p-4 ${
              session.isCurrentSession
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getDeviceIcon(session.device)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {session.browser} on {session.device}
                    </h3>
                    {session.isCurrentSession && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        現在のセッション
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{session.location} ({session.ipAddress})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>最終アクティビティ: {getRelativeTime(session.lastActivity)}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      開始: {formatDate(session.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                {!session.isCurrentSession && (
                  <button
                    onClick={() => terminateSession(session.id)}
                    disabled={actionLoading === session.id}
                    className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                  >
                    {actionLoading === session.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sessionData.sessions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900">アクティブセッションなし</h3>
          <p className="text-sm text-gray-500">現在アクティブなセッションがありません。</p>
        </div>
      )}
    </div>
  );
};

export default SessionManager;