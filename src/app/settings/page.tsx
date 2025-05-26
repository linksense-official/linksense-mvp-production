'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import mockApi from '@/lib/mockApi';
import { UserSettings, NotificationSettings, PrivacySettings, APIResponse } from '@/types/api';

const SettingsPage: React.FC = () => {
  const { user, updateUser, isAuthenticated, isLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'general'>('notifications');

  // 設定データの初期化
  useEffect(() => {
    if (user?.settings) {
      setSettings(user.settings);
    } else {
      // デフォルト設定
      setSettings({
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          weeklyReports: true,
          criticalAlerts: true,
          teamUpdates: false
        },
        privacy: {
          shareAnalytics: true,
          anonymizeData: false,
          dataRetention: true,
          exportData: true
        },
        theme: 'light',
        language: 'ja',
        timezone: 'Asia/Tokyo'
      });
    }
  }, [user]);

  // 通知設定の変更
  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    if (settings) {
      setSettings({
        ...settings,
        notifications: {
          ...settings.notifications,
          [key]: value
        }
      });
    }
  };

  // プライバシー設定の変更
  const handlePrivacyChange = (key: keyof PrivacySettings, value: boolean) => {
    if (settings) {
      setSettings({
        ...settings,
        privacy: {
          ...settings.privacy,
          [key]: value
        }
      });
    }
  };

  // 一般設定の変更
  const handleGeneralChange = (key: keyof Pick<UserSettings, 'theme' | 'language' | 'timezone'>, value: string) => {
    if (settings) {
      setSettings({
        ...settings,
        [key]: value
      });
    }
  };

  // 設定の保存
  const handleSave = async () => {
    if (!settings || !user) return;

    try {
      setSaving(true);
      setMessage(null);

      const response: APIResponse<UserSettings> = await mockApi.updateUserSettings(user.id, settings);

      if (response.success && response.data) {
        // ユーザー情報を更新
        updateUser({
          ...user,
          settings: response.data
        });

        setMessage({ type: 'success', text: '設定が正常に保存されました' });
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || '設定の保存に失敗しました';
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      console.error('設定保存エラー:', error);
      setMessage({ type: 'error', text: '設定の保存中にエラーが発生しました' });
    } finally {
      setSaving(false);
    }
  };

  // メッセージの自動消去
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">設定を読み込み中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">設定</h1>
          <p className="mt-2 text-gray-600">
            チーム健全性分析ツールの各種設定を管理します
          </p>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          {/* タブナビゲーション */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'notifications', name: '通知設定', icon: '🔔' },
                { id: 'privacy', name: 'プライバシー', icon: '🔒' },
                { id: 'general', name: '一般設定', icon: '⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 通知設定タブ */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">通知設定</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    チーム健全性に関する通知の受信設定を管理します
                  </p>
                </div>

                <div className="space-y-4">
                  {/* メール通知 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">メール通知</h4>
                      <p className="text-sm text-gray-500">
                        重要なアラートや更新情報をメールで受信します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationChange('emailNotifications', !settings.notifications.emailNotifications)}
                      className={`${
                        settings.notifications.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.notifications.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                  {/* プッシュ通知 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">プッシュ通知</h4>
                      <p className="text-sm text-gray-500">
                        ブラウザでリアルタイム通知を受信します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationChange('pushNotifications', !settings.notifications.pushNotifications)}
                      className={`${
                        settings.notifications.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.notifications.pushNotifications ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                  {/* 週次レポート */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">週次レポート</h4>
                      <p className="text-sm text-gray-500">
                        チーム健全性の週次サマリーレポートを受信します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationChange('weeklyReports', !settings.notifications.weeklyReports)}
                      className={`${
                        settings.notifications.weeklyReports ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.notifications.weeklyReports ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                  {/* 緊急アラート */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">緊急アラート</h4>
                      <p className="text-sm text-gray-500">
                        バーンアウトリスクなどの緊急アラートを即座に受信します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationChange('criticalAlerts', !settings.notifications.criticalAlerts)}
                      className={`${
                        settings.notifications.criticalAlerts ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.notifications.criticalAlerts ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                  {/* チーム更新情報 */}
                  <div className="flex items-center justify-between py-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">チーム更新情報</h4>
                      <p className="text-sm text-gray-500">
                        チームメンバーの追加・削除などの更新情報を受信します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationChange('teamUpdates', !settings.notifications.teamUpdates)}
                      className={`${
                        settings.notifications.teamUpdates ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.notifications.teamUpdates ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* プライバシー設定タブ */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">プライバシー設定</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    データの共有とプライバシーに関する設定を管理します
                  </p>
                </div>

                <div className="space-y-4">
                  {/* 分析データの共有 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">分析データの共有</h4>
                      <p className="text-sm text-gray-500">
                        サービス改善のため、匿名化された分析データの共有を許可します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrivacyChange('shareAnalytics', !settings.privacy.shareAnalytics)}
                      className={`${
                        settings.privacy.shareAnalytics ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.privacy.shareAnalytics ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                  {/* データの匿名化 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">データの匿名化</h4>
                      <p className="text-sm text-gray-500">
                        レポートや分析で個人を特定できないよう、データを匿名化します
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrivacyChange('anonymizeData', !settings.privacy.anonymizeData)}
                      className={`${
                        settings.privacy.anonymizeData ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.privacy.anonymizeData ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                  {/* データ保持期間の設定 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">データ保持期間の設定</h4>
                      <p className="text-sm text-gray-500">
                        プランに応じたデータ保持期間の設定を有効にします
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrivacyChange('dataRetention', !settings.privacy.dataRetention)}
                      className={`${
                        settings.privacy.dataRetention ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.privacy.dataRetention ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>

                  {/* データエクスポート */}
                  <div className="flex items-center justify-between py-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">データエクスポート</h4>
                      <p className="text-sm text-gray-500">
                        チーム健全性データのエクスポート機能を有効にします
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrivacyChange('exportData', !settings.privacy.exportData)}
                      className={`${
                        settings.privacy.exportData ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span
                        className={`${
                          settings.privacy.exportData ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>
                </div>

                {/* データ削除セクション */}
                <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800 mb-2">データの削除</h4>
                  <p className="text-sm text-red-600 mb-4">
                    アカウントに関連するすべてのデータを完全に削除します。この操作は取り消せません。
                  </p>
                  <button
                    type="button"
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                    onClick={() => {
                      if (confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。')) {
                        alert('データ削除機能は開発中です');
                      }
                    }}
                  >
                    すべてのデータを削除
                  </button>
                </div>
              </div>
            )}

            {/* 一般設定タブ */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">一般設定</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    アプリケーションの表示や動作に関する設定を管理します
                  </p>
                </div>

                <div className="space-y-6">
                  {/* テーマ設定 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      テーマ
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => handleGeneralChange('theme', e.target.value as 'light' | 'dark' | 'system')}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="light">ライトテーマ</option>
                      <option value="dark">ダークテーマ</option>
                      <option value="system">システム設定に従う</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      アプリケーションの表示テーマを選択します
                    </p>
                  </div>

                  {/* 言語設定 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      言語
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleGeneralChange('language', e.target.value as 'ja' | 'en')}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="ja">日本語</option>
                      <option value="en">English</option>
                    </select>
                     <p className="mt-1 text-sm text-gray-500">
                      アプリケーションの表示言語を選択します
                    </p>
                  </div>

                  {/* タイムゾーン設定 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      タイムゾーン
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleGeneralChange('timezone', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      レポートや通知の時刻表示に使用するタイムゾーンを選択します
                    </p>
                  </div>
                </div>

                {/* アカウント情報 */}
                <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">アカウント情報</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ユーザーID:</span>
                      <span className="text-sm font-medium text-gray-900">{user?.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">メールアドレス:</span>
                      <span className="text-sm font-medium text-gray-900">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ロール:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {user?.role === 'admin' ? '管理者' : 
                         user?.role === 'manager' ? 'マネージャー' : 'メンバー'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">部署:</span>
                      <span className="text-sm font-medium text-gray-900">{user?.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">登録日:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ja-JP') : '不明'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 保存ボタン */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`${
                  saving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center space-x-2`}
              >
                {saving && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{saving ? '保存中...' : '設定を保存'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;