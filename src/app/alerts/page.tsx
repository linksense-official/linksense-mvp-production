'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// アラート型定義
interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  team: string;
  timestamp: Date;
  isRead: boolean;
  category: string;
}

// フィルター状態型定義
interface FilterState {
  severity: string;
  status: string;
  team: string;
  category: string;
  searchQuery: string;
}

// 通知状態型定義
interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

// モックアラートデータ
const mockAlerts: Alert[] = [
  {
    id: '1',
    title: 'チーム健全性スコア低下',
    message: 'マーケティングチームのコミュニケーション頻度が過去1週間で30%低下しています。チームメンバー間の連携に問題が生じている可能性があります。定期的なチームミーティングの頻度を増やし、コミュニケーションツールの活用状況を確認することを推奨します。',
    severity: 'high',
    team: 'マーケティング',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    isRead: false,
    category: 'コミュニケーション'
  },
  {
    id: '2', 
    title: '残業時間増加傾向',
    message: '開発チームの平均残業時間が先月比20%増加しています。プロジェクトの進行状況とワークライフバランスの確認が必要です。タスクの優先順位の見直しや、必要に応じてリソースの追加配置を検討してください。',
    severity: 'medium',
    team: '開発',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
    category: 'ワークライフバランス'
  },
  {
    id: '3',
    title: '新メンバー適応状況良好',
    message: '営業チームの新入社員の適応スコアが良好です。オンボーディングプロセスが効果的に機能しており、メンターシップ制度も順調に進んでいます。この成功事例を他チームにも展開することを検討してください。',
    severity: 'low',
    team: '営業',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: true,
    category: 'オンボーディング'
  },
  {
    id: '4',
    title: 'プロジェクト遅延リスク',
    message: 'デザインチームのタスク進行率から納期遅延の可能性があります。現在のペースでは予定より1週間程度の遅延が予想されます。クライアントとの調整や、追加リソースの投入を早急に検討する必要があります。',
    severity: 'high',
    team: 'デザイン',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    isRead: false,
    category: 'プロジェクト管理'
  },
  {
    id: '5',
    title: 'チーム満足度向上',
    message: 'カスタマーサポートチームの満足度スコアが15%向上しました。新しい研修プログラムとツール導入の効果が現れています。継続的な改善により、さらなる向上が期待できます。',
    severity: 'low',
    team: 'カスタマーサポート',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    isRead: true,
    category: 'チーム満足度'
  },
  {
    id: '6',
    title: 'ミーティング時間過多',
    message: '人事チームの週間ミーティング時間が推奨値を25%超過しています。効率的な会議運営の見直しを推奨します。アジェンダの事前共有や、必要に応じて参加者の絞り込みを行うことで改善が期待できます。',
    severity: 'medium',
    team: '人事',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    isRead: false,
    category: '生産性'
  }
];

// 時間フォーマット関数
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

// 詳細な日時フォーマット関数
const formatDetailedDateTime = (timestamp: Date): string => {
  return timestamp.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
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
    // 明示的に undefined を返す
    return undefined;
  }, [notification.show, onClose]);

  if (!notification.show) return null;

  const typeConfig = {
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '✅' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'ℹ️' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '⚠️' },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '❌' }
  };

  const config = typeConfig[notification.type] || typeConfig.info;

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${config.bg} ${config.border} ${config.text} shadow-lg`}>
      <div className="flex items-center space-x-2">
        <span>{config.icon}</span>
        <span>{notification.message}</span>
        <button
          onClick={onClose}
          className={`ml-2 ${config.text} hover:opacity-70 transition-opacity`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// アラート詳細モーダルコンポーネント
interface AlertModalProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onTakeAction: (alert: Alert, action: string) => void;
}

const AlertModal = ({ alert, isOpen, onClose, onMarkAsRead, onTakeAction }: AlertModalProps) => {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // モーダル表示時にスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !alert) return null;

  const severityConfig = {
    high: { 
      bg: 'bg-red-50', 
      border: 'border-red-200', 
      text: 'text-red-700',
      icon: '🚨',
      label: '高重要度',
      labelColor: 'bg-red-100 text-red-800'
    },
    medium: { 
      bg: 'bg-yellow-50', 
      border: 'border-yellow-200', 
      text: 'text-yellow-700',
      icon: '⚠️',
      label: '中重要度',
      labelColor: 'bg-yellow-100 text-yellow-800'
    },
    low: { 
      bg: 'bg-blue-50', 
      border: 'border-blue-200', 
      text: 'text-blue-700',
      icon: 'ℹ️',
      label: '低重要度',
      labelColor: 'bg-blue-100 text-blue-800'
    }
  };

  const config = severityConfig[alert.severity];

  // 推奨アクション
  const getRecommendedActions = (alert: Alert) => {
    switch (alert.category) {
      case 'コミュニケーション':
        return [
          'チームミーティングを設定',
          'コミュニケーションツール確認',
          '1on1面談を実施'
        ];
      case 'ワークライフバランス':
        return [
          'タスク優先度を見直し',
          'リソース追加を検討',
          'ワークロード分析'
        ];
      case 'プロジェクト管理':
        return [
          'プロジェクト計画見直し',
          'クライアント調整',
          'リソース再配分'
        ];
      case '生産性':
        return [
          '会議効率化施策',
          'プロセス改善',
          'ツール活用促進'
        ];
      default:
        return [
          '状況を継続監視',
          'チームと相談',
          '詳細分析を実施'
        ];
    }
  };

  const recommendedActions = getRecommendedActions(alert);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      {/* オーバーレイ */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      {/* モーダルコンテンツ */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
          {/* ヘッダー */}
          <div className={`${config.bg} ${config.border} border-b px-6 py-4`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-3xl animate-bounce-gentle">{config.icon}</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{alert.title}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.labelColor}`}>
                      {config.label}
                    </span>
                    <span className="text-sm text-gray-600">{alert.team}チーム</span>
                    <span className="text-sm text-gray-600">{alert.category}</span>
                    {!alert.isRead && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                        未読
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 duration-300"
                aria-label="モーダルを閉じる"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="px-6 py-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-6">
              {/* メッセージ */}
              <div className="animate-slide-up">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">詳細情報</h3>
                <p className="text-gray-700 leading-relaxed">{alert.message}</p>
              </div>

              {/* タイムスタンプ情報 */}
              <div className="bg-gray-50 rounded-lg p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h4 className="font-medium text-gray-900 mb-2">発生情報</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">発生日時:</span>
                    <div className="font-medium">{formatDetailedDateTime(alert.timestamp)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">経過時間:</span>
                    <div className="font-medium">{formatTimeAgo(alert.timestamp)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">対象チーム:</span>
                    <div className="font-medium">{alert.team}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">ステータス:</span>
                    <div className="font-medium">
                      {alert.isRead ? (
                        <span className="text-green-600">既読</span>
                      ) : (
                        <span className="text-blue-600">未読</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 推奨アクション */}
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h4 className="font-medium text-gray-900 mb-3">推奨アクション</h4>
                <div className="space-y-2">
                  {recommendedActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => onTakeAction(alert, action)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm transform hover:-translate-y-0.5"
                      style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">{action}</span>
                        <svg className="w-4 h-4 text-gray-400 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 影響レベル */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <h4 className="font-medium text-yellow-800 mb-2">影響レベル</h4>
                <div className="text-sm text-yellow-700">
                  {alert.severity === 'high' && '即座の対応が必要です。チーム全体に大きな影響を与える可能性があります。'}
                  {alert.severity === 'medium' && '近日中の対応を推奨します。放置すると問題が拡大する可能性があります。'}
                  {alert.severity === 'low' && '時間のあるときに対応してください。継続的な改善に役立ちます。'}
                </div>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {!alert.isRead && (
                  <button
                    onClick={() => {
                      onMarkAsRead(alert.id);
                      onClose();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    既読にして閉じる
                  </button>
                )}
                <button
                  onClick={() => onTakeAction(alert, '詳細分析を実施')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  対応開始
                </button>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// フィルターコンポーネント
interface AlertFilterProps {
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
  alertCounts: {
    total: number;
    unread: number;
    high: number;
    medium: number;
    low: number;
    filtered: number;
  };
  teams: string[];
  categories: string[];
}

const AlertFilter = ({ filter, onFilterChange, alertCounts, teams, categories }: AlertFilterProps) => {
  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    onFilterChange({
      ...filter,
      [key]: value
    });
  }, [filter, onFilterChange]);

  const resetFilters = useCallback(() => {
    onFilterChange({
      severity: 'all',
      status: 'all',
      team: 'all',
      category: 'all',
      searchQuery: ''
    });
  }, [onFilterChange]);

  const isFiltered = filter.severity !== 'all' || filter.status !== 'all' || 
                    filter.team !== 'all' || filter.category !== 'all' || 
                    filter.searchQuery !== '';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 animate-slide-up">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">フィルター</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            表示中: <span className="font-semibold text-blue-600 animate-number-change">{alertCounts.filtered}</span> / {alertCounts.total}件
          </div>
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-all duration-200 transform hover:scale-105"
            >
              リセット
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 検索バー */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            検索
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="タイトル・メッセージで検索..."
              value={filter.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 重要度フィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            重要度
          </label>
          <select
            value={filter.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="all">すべて</option>
            <option value="high">🚨 高重要度 ({alertCounts.high})</option>
            <option value="medium">⚠️ 中重要度 ({alertCounts.medium})</option>
            <option value="low">ℹ️ 低重要度 ({alertCounts.low})</option>
          </select>
        </div>

        {/* ステータスフィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ステータス
          </label>
          <select
            value={filter.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="all">すべて</option>
            <option value="unread">未読のみ ({alertCounts.unread})</option>
            <option value="read">既読のみ</option>
          </select>
        </div>

        {/* チームフィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            チーム
          </label>
          <select
            value={filter.team}
            onChange={(e) => handleFilterChange('team', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="all">すべて</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
      </div>

      {/* カテゴリフィルター（2行目） */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          カテゴリ
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('category', 'all')}
            className={`px-3 py-1 text-sm rounded-full transition-all duration-200 transform hover:scale-105 ${
              filter.category === 'all'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            すべて
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => handleFilterChange('category', category)}
              className={`px-3 py-1 text-sm rounded-full transition-all duration-200 transform hover:scale-105 ${
                filter.category === category
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* アクティブフィルター表示 */}
      {isFiltered && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-slide-down">
          <div className="text-sm text-gray-600 mb-2">アクティブフィルター:</div>
          <div className="flex flex-wrap gap-2">
            {filter.severity !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-slide-in">
                重要度: {filter.severity === 'high' ? '高' : filter.severity === 'medium' ? '中' : '低'}
                <button
                  onClick={() => handleFilterChange('severity', 'all')}
                  className="ml-1 text-red-600 hover:text-red-800 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {filter.status !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-slide-in">
                ステータス: {filter.status === 'unread' ? '未読' : '既読'}
                <button
                  onClick={() => handleFilterChange('status', 'all')}
                  className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {filter.team !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-slide-in">
                チーム: {filter.team}
                <button
                  onClick={() => handleFilterChange('team', 'all')}
                  className="ml-1 text-green-600 hover:text-green-800 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {filter.category !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800  animate-slide-in">
                カテゴリ: {filter.category}
                <button
                  onClick={() => handleFilterChange('category', 'all')}
                  className="ml-1 text-purple-600 hover:text-purple-800 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {filter.searchQuery && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-slide-in">
                検索: "{filter.searchQuery}"
                <button
                  onClick={() => handleFilterChange('searchQuery', '')}
                  className="ml-1 text-yellow-600 hover:text-yellow-800 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// アラートカードコンポーネント
interface AlertCardProps {
  alert: Alert;
  onMarkAsRead: (id: string) => void;
  onClick: (alert: Alert) => void;
  index: number;
}

const AlertCard = ({ alert, onMarkAsRead, onClick, index }: AlertCardProps) => {
  const severityConfig = {
    high: { 
      bg: 'bg-red-50', 
      border: 'border-l-red-500', 
      icon: '🚨',
      label: '高',
      labelColor: 'bg-red-100 text-red-800'
    },
    medium: { 
      bg: 'bg-yellow-50', 
      border: 'border-l-yellow-500', 
      icon: '⚠️',
      label: '中',
      labelColor: 'bg-yellow-100 text-yellow-800'
    },
    low: { 
      bg: 'bg-blue-50', 
      border: 'border-l-blue-500', 
      icon: 'ℹ️',
      label: '低',
      labelColor: 'bg-blue-100 text-blue-800'
    }
  };

  const config = severityConfig[alert.severity];

  return (
    <div 
      className={`
        bg-white ${config.border} border-l-4 border border-gray-200 rounded-lg p-4 
        hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1
        ${!alert.isRead ? 'shadow-md ring-1 ring-blue-200' : 'shadow-sm'}
        animate-slide-up
      `}
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => onClick(alert)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          <div className="text-2xl animate-bounce-gentle">{config.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                {alert.title}
              </h3>
              {!alert.isRead && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap animate-pulse">
                  未読
                </span>
              )}
            </div>
          </div>
        </div>
        
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.labelColor} whitespace-nowrap ml-2`}>
          {config.label}重要度
        </span>
      </div>

      <div className="mb-4">
        <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
          {alert.message}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{alert.team}</span>
          <span>{alert.category}</span>
          <span>{formatTimeAgo(alert.timestamp)}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {!alert.isRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(alert.id);
              }}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              既読
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(alert);
            }}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            詳細
          </button>
        </div>
      </div>
    </div>
  );
};

// メインコンポーネント
export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });
  const [filter, setFilter] = useState<FilterState>({
    severity: 'all',
    status: 'all',
    team: 'all',
    category: 'all',
    searchQuery: ''
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

  // アラートデータの初期化
  useEffect(() => {
    const initializeAlerts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 実際のAPIコールをシミュレート
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const sortedAlerts = [...mockAlerts].sort((a, b) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        );
        setAlerts(sortedAlerts);
        showNotification('アラートデータを読み込みました', 'success');
      } catch (err) {
        setError('アラートデータの読み込みに失敗しました');
        showNotification('データの読み込みに失敗しました', 'error');
      } finally {
        setLoading(false);
      }
    };

    initializeAlerts();
  }, [showNotification]);

  // フィルタリングされたアラート
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // 重要度フィルター
      if (filter.severity !== 'all' && alert.severity !== filter.severity) {
        return false;
      }

      // ステータスフィルター
      if (filter.status === 'unread' && alert.isRead) {
        return false;
      }
      if (filter.status === 'read' && !alert.isRead) {
        return false;
      }

      // チームフィルター
      if (filter.team !== 'all' && alert.team !== filter.team) {
        return false;
      }

      // カテゴリフィルター
      if (filter.category !== 'all' && alert.category !== filter.category) {
        return false;
      }

      // 検索フィルター
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const titleMatch = alert.title.toLowerCase().includes(query);
        const messageMatch = alert.message.toLowerCase().includes(query);
        if (!titleMatch && !messageMatch) {
          return false;
        }
      }

      return true;
    });
  }, [alerts, filter]);

  // 既読マーク機能
  const handleMarkAsRead = useCallback((alertId: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
    
    // モーダルで表示中のアラートも更新
    if (selectedAlert && selectedAlert.id === alertId) {
      setSelectedAlert({ ...selectedAlert, isRead: true });
    }

    showNotification('アラートを既読にしました', 'success');
  }, [selectedAlert, showNotification]);

  // アラート詳細表示
  const handleAlertClick = useCallback((alert: Alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
    
    // 未読の場合は自動的に既読にする
    if (!alert.isRead) {
      handleMarkAsRead(alert.id);
    }
  }, [handleMarkAsRead]);

  // モーダルを閉じる
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedAlert(null);
  }, []);

  // アクション実行
  const handleTakeAction = useCallback((alert: Alert, action: string) => {
    console.log(`アクション実行: ${action} for alert ${alert.id}`);
    
    showNotification(`アクションを実行しました: ${action}`, 'success');
    
    // モーダルを閉じる
    handleCloseModal();
  }, [showNotification, handleCloseModal]);

  // 統計情報計算
  const alertCounts = useMemo(() => ({
    total: alerts.length,
    unread: alerts.filter(a => !a.isRead).length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
    filtered: filteredAlerts.length
  }), [alerts, filteredAlerts]);

  // ユニークなチーム・カテゴリ取得
  const teams = useMemo(() => 
    Array.from(new Set(alerts.map(alert => alert.team))).sort(), 
    [alerts]
  );
  
  const categories = useMemo(() => 
    Array.from(new Set(alerts.map(alert => alert.category))).sort(), 
    [alerts]
  );

  // エラー状態
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-4xl text-red-500 mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ローディング状態
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">読み込み中...</h2>
            <p className="text-gray-600">アラートデータを取得しています</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6 pb-16">
        {/* ページヘッダー */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slide-down">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">アラート管理</h1>
              <p className="text-gray-600 mt-1">チーム健全性に関するアラートを管理します</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 animate-number-change">{alertCounts.total}</div>
                <div className="text-sm text-gray-600">総数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 animate-number-change">{alertCounts.unread}</div>
                <div className="text-sm text-gray-600">未読</div>
              </div>
            </div>
          </div>
        </div>

        {/* 重要度別統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-slide-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">🚨</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">高重要度</div>
                <div className="text-2xl font-bold text-red-600 animate-number-change">{alertCounts.high}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-slide-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">⚠️</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">中重要度</div>
                <div className="text-2xl font-bold text-yellow-600 animate-number-change">{alertCounts.medium}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-slide-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">ℹ️</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">低重要度</div>
                <div className="text-2xl font-bold text-blue-600 animate-number-change">{alertCounts.low}</div>
              </div>
            </div>
          </div>
        </div>

        {/* フィルターコンポーネント */}
        <AlertFilter
          filter={filter}
          onFilterChange={setFilter}
          alertCounts={alertCounts}
          teams={teams}
          categories={categories}
        />

        {/* アラート一覧セクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                アラート一覧 (<span className="animate-number-change">{filteredAlerts.length}</span>件)
              </h2>
              <div className="text-sm text-gray-500">
                最新順
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="text-4xl text-gray-300 mb-4">📭</div>
                <p className="text-gray-500">
                  {filter.severity !== 'all' || filter.status !== 'all' || filter.team !== 'all' || filter.category !== 'all' || filter.searchQuery
                    ? 'フィルター条件に一致するアラートがありません'
                    : '現在アラートはありません'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert, index) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onMarkAsRead={handleMarkAsRead}
                    onClick={handleAlertClick}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-8"></div>
      </div>

      {/* アラート詳細モーダル */}
      <AlertModal
        alert={selectedAlert}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMarkAsRead={handleMarkAsRead}
        onTakeAction={handleTakeAction}
      />

      {/* 通知コンポーネント */}
      <Notification
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
}