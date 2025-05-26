'use client';

import React, { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';

// カスタム通知の型定義（ブラウザのNotification型と区別するため）
interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

const PWAControls: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isStandalone,
    isSupported,
    install,
    checkInstallability,
  } = usePWA();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [installing, setInstalling] = useState(false);

  // PWAインストール処理
  const handleInstallApp = async () => {
    if (!isInstallable) {
      return;
    }

    try {
      setInstalling(true);
      await install();
    } catch (error) {
      console.error('PWAインストールエラー:', error);
      showNotification('インストールに失敗しました', 'error');
    } finally {
      setInstalling(false);
    }
  };

  // 通知許可の要求
  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      showNotification('このブラウザは通知をサポートしていません', 'warning');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        showNotification('通知が有効になりました', 'success');
      } else {
        showNotification('通知の許可が拒否されました', 'warning');
      }
    } catch (error) {
      console.error('通知許可エラー:', error);
      showNotification('通知の有効化に失敗しました', 'error');
    }
  };

  // 通知の無効化
  const disableNotifications = () => {
    setNotificationsEnabled(false);
    showNotification('通知が無効になりました', 'info');
  };

  // 通知表示
  const showNotification = (message: string, type: AppNotification['type'] = 'info') => {
    const notification: AppNotification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date().toISOString(),
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // 最大5件まで保持

    // ブラウザ通知（許可されている場合）
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('LinkSense', {
        body: message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
      });
    }

    // 5秒後に自動削除
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // アラート系の通知（LinkSenseに適した内容に変更）
  const showIsolationAlert = () => {
    showNotification('リンクの分析データが更新されました', 'info');
  };

  const showOverworkAlert = () => {
    showNotification('月間のクリック数が目標を達成しました！', 'success');
  };

  const showSentimentAlert = () => {
    showNotification('新しいコンバージョンが発生しました', 'success');
  };

  const showTeamHealthAlert = () => {
    showNotification('リンクのパフォーマンスレポートが準備できました', 'info');
  };

  // 全通知クリア
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // PWAサポートされていない場合は何も表示しない
  if (!isSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-4">
      {/* 通知一覧 */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`max-w-sm bg-white rounded-lg shadow-lg border-l-4 p-4 ${
                notification.type === 'success' ? 'border-green-500' :
                notification.type === 'warning' ? 'border-yellow-500' :
                notification.type === 'error' ? 'border-red-500' :
                'border-blue-500'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && (
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {notification.type === 'warning' && (
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {notification.type === 'error' && (
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {notification.type === 'info' && (
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString('ja-JP')}
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PWAコントロールパネル */}
      <div className="bg-white rounded-lg shadow-lg border p-4 max-w-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">PWA設定</h3>
        
        <div className="space-y-3">
          {/* PWAインストール */}
          {!isStandalone && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">アプリインストール</h4>
              {isInstallable ? (
                <button
                  onClick={handleInstallApp}
                  disabled={installing}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {installing ? 'インストール中...' : 'アプリをインストール'}
                </button>
              ) : (
                <div className="text-sm text-gray-500">
                  {isInstalled ? 'インストール済み' : 'インストール不可'}
                </div>
              )}
            </div>
          )}

          {/* 通知設定 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">通知設定</h4>
            <div className="flex space-x-2">
              {!notificationsEnabled ? (
                <button
                  onClick={enableNotifications}
                  className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  通知を有効化
                </button>
              ) : (
                <button
                  onClick={disableNotifications}
                  className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  通知を無効化
                </button>
              )}
            </div>
          </div>

          {/* テスト通知 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">テスト通知</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={showIsolationAlert}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 transition-colors"
              >
                分析更新
              </button>
              <button
                onClick={showOverworkAlert}
                className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs hover:bg-green-200 transition-colors"
              >
                目標達成
              </button>
              <button
                onClick={showSentimentAlert}
                className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs hover:bg-yellow-200 transition-colors"
              >
                コンバージョン
              </button>
              <button
                onClick={showTeamHealthAlert}
                className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs hover:bg-purple-200 transition-colors"
              >
                レポート
              </button>
            </div>
          </div>

          {/* 通知クリア */}
          {notifications.length > 0 && (
            <div>
              <button
                onClick={clearAllNotifications}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
              >
                全通知をクリア
              </button>
            </div>
          )}

          {/* PWA状態表示 */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>インストール可能: {isInstallable ? '○' : '×'}</div>
            <div>インストール済み: {isInstalled ? '○' : '×'}</div>
            <div>スタンドアロン: {isStandalone ? '○' : '×'}</div>
            <div>PWAサポート: {isSupported ? '○' : '×'}</div>
            <div>通知許可: {notificationsEnabled ? '○' : '×'}</div>
          </div>

          {/* 更新確認 */}
          <div>
            <button
              onClick={checkInstallability}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              状態を更新
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAControls;