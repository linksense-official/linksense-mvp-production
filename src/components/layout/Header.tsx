'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../app/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, Bell, Settings, User, LogOut, Shield, Zap, 
  Moon, Sun, Monitor, Wifi, WifiOff, Activity, Clock,
  ChevronDown, Command, AlertTriangle, CheckCircle,
  Info, AlertCircle, X, MoreHorizontal, Filter,
  Globe, Lock, Smartphone, Mail, Calendar, Star,
  TrendingUp, BarChart3, Users, Award, Target
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'system' | 'team' | 'alert' | 'update' | 'security';
  metadata?: {
    teamId?: string;
    alertLevel?: number;
    affectedUsers?: number;
  };
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'page' | 'team' | 'report' | 'user' | 'setting';
  url: string;
  icon: React.ReactNode;
  category: string;
  lastAccessed?: string;
}

interface HeaderState {
  isUserMenuOpen: boolean;
  isNotificationOpen: boolean;
  isSearchOpen: boolean;
  isCommandPaletteOpen: boolean;
  searchQuery: string;
  theme: 'light' | 'dark' | 'system';
  isOnline: boolean;
  currentTime: Date;
  unreadNotifications: number;
  criticalAlerts: number;
}

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [headerState, setHeaderState] = useState<HeaderState>({
    isUserMenuOpen: false,
    isNotificationOpen: false,
    isSearchOpen: false,
    isCommandPaletteOpen: false,
    searchQuery: '',
    theme: 'light',
    isOnline: navigator.onLine,
    currentTime: new Date(),
    unreadNotifications: 0,
    criticalAlerts: 0
  });

  const [profileImageError, setProfileImageError] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // リアルタイム通知データ（実際の実装ではAPIから取得）
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: '🚨 緊急: チーム健全性低下',
      message: 'プロダクト開発チームの健全性スコアが65%に低下しました。即座の対応が必要です。',
      type: 'error',
      timestamp: '5分前',
      isRead: false,
      actionUrl: '/alerts',
      priority: 'critical',
      category: 'alert',
      metadata: { teamId: 'team-1', alertLevel: 3, affectedUsers: 12 }
    },
    {
      id: '2',
      title: '✅ レポート生成完了',
      message: '月次チーム健全性レポートが正常に生成されました。ダウンロード可能です。',
      type: 'success',
      timestamp: '1時間前',
      isRead: false,
      actionUrl: '/reports',
      priority: 'medium',
      category: 'system'
    },
    {
      id: '3',
      title: '🔄 システム更新完了',
      message: 'LinkSenseが新機能を含むバージョン2.1.0にアップデートされました。',
      type: 'info',
      timestamp: '3時間前',
      isRead: false,
      actionUrl: '/dashboard',
      priority: 'low',
      category: 'update'
    },
    {
      id: '4',
      title: '👥 新メンバー追加',
      message: '田中太郎さんがマーケティングチームに追加されました。',
      type: 'info',
      timestamp: '1日前',
      isRead: true,
      actionUrl: '/members',
      priority: 'low',
      category: 'team'
    },
    {
      id: '5',
      title: '🔐 セキュリティアップデート',
      message: 'セキュリティパッチが適用されました。システムは安全に保護されています。',
      type: 'info',
      timestamp: '2日前',
      isRead: true,
      actionUrl: '/settings',
      priority: 'medium',
      category: 'security'
    }
  ]);

  // 検索結果データ
  const searchResults: SearchResult[] = useMemo(() => [
    {
      id: '1',
      title: 'ダッシュボード',
      description: 'チーム健全性の概要とリアルタイム分析',
      type: 'page',
      url: '/dashboard',
      icon: <BarChart3 className="h-4 w-4" />,
      category: 'ナビゲーション',
      lastAccessed: '今日'
    },
    {
      id: '2',
      title: 'チーム分析',
      description: '詳細なチームパフォーマンス分析',
      type: 'page',
      url: '/analytics',
      icon: <TrendingUp className="h-4 w-4" />,
      category: 'ナビゲーション'
    },
    {
      id: '3',
      title: 'プロダクト開発チーム',
      description: '15名のメンバー、健全性スコア: 78%',
      type: 'team',
      url: '/teams/product',
      icon: <Users className="h-4 w-4" />,
      category: 'チーム'
    },
    {
      id: '4',
      title: '統合設定',
      description: '外部サービスとの連携設定',
      type: 'setting',
      url: '/integrations',
      icon: <Settings className="h-4 w-4" />,
      category: '設定'
    },
    {
      id: '5',
      title: '月次レポート',
      description: '2024年5月のチーム健全性レポート',
      type: 'report',
      url: '/reports/monthly',
      icon: <Award className="h-4 w-4" />,
      category: 'レポート'
    }
  ], []);

  // フィルタリングされた検索結果
  const filteredSearchResults = useMemo(() => {
    if (!headerState.searchQuery.trim()) return searchResults.slice(0, 5);
    
    const query = headerState.searchQuery.toLowerCase();
    return searchResults.filter(result => 
      result.title.toLowerCase().includes(query) ||
      result.description.toLowerCase().includes(query) ||
      result.category.toLowerCase().includes(query)
    );
  }, [headerState.searchQuery, searchResults]);

  // 未読通知数の計算
  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    const critical = notifications.filter(n => !n.isRead && n.priority === 'critical').length;
    
    setHeaderState(prev => ({
      ...prev,
      unreadNotifications: unread,
      criticalAlerts: critical
    }));
  }, [notifications]);

  // 現在時刻の更新
  useEffect(() => {
    const timer = setInterval(() => {
      setHeaderState(prev => ({ ...prev, currentTime: new Date() }));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // ネットワーク状態監視
  useEffect(() => {
    const handleOnline = () => setHeaderState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setHeaderState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // クリック外側検出
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setHeaderState(prev => ({ ...prev, isUserMenuOpen: false }));
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setHeaderState(prev => ({ ...prev, isNotificationOpen: false }));
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setHeaderState(prev => ({ ...prev, isSearchOpen: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K で検索を開く
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setHeaderState(prev => ({ ...prev, isSearchOpen: true, isCommandPaletteOpen: true }));
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      
      // Cmd/Ctrl + / でコマンドパレットを開く
      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault();
        setHeaderState(prev => ({ ...prev, isCommandPaletteOpen: true }));
      }
      
      // Escape でメニューを閉じる
      if (event.key === 'Escape') {
        setHeaderState(prev => ({
          ...prev,
          isUserMenuOpen: false,
          isNotificationOpen: false,
          isSearchOpen: false,
          isCommandPaletteOpen: false
        }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // テーマ設定の復元
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('linksense-theme') as 'light' | 'dark' | 'system';
      if (savedTheme) {
        setHeaderState(prev => ({ ...prev, theme: savedTheme }));
      }
    }
  }, []);

  // ログアウト処理
  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      if (window.confirm('ログアウトしますか？')) {
        await logout();
        
        // 成功通知
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('LinkSense - ログアウト完了', {
            body: 'ログアウトしました。またのご利用をお待ちしております。',
            icon: '/favicon.ico'
          });
        }
        
        router.push('/login?logout=success');
      }
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  }, [logout, router]);

  // メニュー切り替え
  const toggleUserMenu = useCallback((): void => {
    setHeaderState(prev => ({
      ...prev,
      isUserMenuOpen: !prev.isUserMenuOpen,
      isNotificationOpen: false,
      isSearchOpen: false
    }));
  }, []);

  const toggleNotifications = useCallback((): void => {
    setHeaderState(prev => ({
      ...prev,
      isNotificationOpen: !prev.isNotificationOpen,
      isUserMenuOpen: false,
      isSearchOpen: false
    }));
  }, []);

  const toggleSearch = useCallback((): void => {
    setHeaderState(prev => ({ ...prev, isSearchOpen: !prev.isSearchOpen }));
    if (!headerState.isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [headerState.isSearchOpen]);

  // テーマ切り替え
  const toggleTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setHeaderState(prev => ({ ...prev, theme: newTheme }));
    localStorage.setItem('linksense-theme', newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // 通知操作
  const markAsRead = useCallback((notificationId: string): void => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback((): void => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  }, []);

  const deleteNotification = useCallback((notificationId: string): void => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  }, []);

  const handleNotificationClick = useCallback((notification: Notification): void => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setHeaderState(prev => ({ ...prev, isNotificationOpen: false }));
    }
  }, [markAsRead, router]);

  // 検索処理
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setHeaderState(prev => ({ ...prev, searchQuery: e.target.value }));
  }, []);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    router.push(result.url);
    setHeaderState(prev => ({ 
      ...prev, 
      isSearchOpen: false, 
      searchQuery: '',
      isCommandPaletteOpen: false 
    }));
  }, [router]);

  // 通知アイコン取得
  const getNotificationIcon = useCallback((type: string, priority: string) => {
    const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center";
    const iconClasses = "w-4 h-4";
    
    if (priority === 'critical') {
      return (
        <div className={`${baseClasses} bg-red-100 border-2 border-red-300 animate-pulse`}>
          <AlertTriangle className={`${iconClasses} text-red-700`} />
        </div>
      );
    }

    switch (type) {
      case 'warning':
        return (
          <div className={`${baseClasses} bg-yellow-100`}>
            <AlertCircle className={`${iconClasses} text-yellow-600`} />
          </div>
        );
      case 'error':
        return (
          <div className={`${baseClasses} bg-red-100`}>
            <AlertTriangle className={`${iconClasses} text-red-600`} />
          </div>
        );
      case 'success':
        return (
          <div className={`${baseClasses} bg-green-100`}>
            <CheckCircle className={`${iconClasses} text-green-600`} />
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-blue-100`}>
            <Info className={`${iconClasses} text-blue-600`} />
          </div>
        );
    }
  }, []);

  // 優先度カラー取得
  const getPriorityColor = useCallback((priority: string): string => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  }, []);

  // イニシャル取得
  const getInitials = useCallback((name: string): string => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }, []);

  // カテゴリアイコン取得
  const getCategoryIcon = useCallback((category: string) => {
    switch (category) {
      case 'system': return <Settings className="h-3 w-3" />;
      case 'team': return <Users className="h-3 w-3" />;
      case 'alert': return <AlertTriangle className="h-3 w-3" />;
      case 'update': return <Zap className="h-3 w-3" />;
      case 'security': return <Shield className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  }, []);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左側: ロゴ、検索、現在時刻 */}
            <div className="flex items-center space-x-4 flex-1">
              {/* ロゴ */}
              <Link 
                href="/dashboard" 
                className="flex items-center space-x-3 hover:opacity-80 transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <span className="text-white font-bold text-lg">LS</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">LinkSense</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    {headerState.currentTime.toLocaleString('ja-JP', { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </Link>

              {/* 検索バー */}
              <div className="hidden md:flex flex-1 max-w-lg" ref={searchRef}>
                <div className="relative w-full">
                  <button
                    onClick={toggleSearch}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Search className="h-4 w-4 mr-3" />
                    <span className="flex-1 text-left">検索... </span>
                    <div className="flex items-center space-x-1 text-xs">
                      <kbd className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300">
                        <Command className="h-3 w-3 inline" />
                      </kbd>
                      <kbd className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300">
                        K
                      </kbd>
                    </div>
                  </button>

                  {/* 検索ドロップダウン */}
                  {headerState.isSearchOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
                      {/* 検索入力 */}
                      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={headerState.searchQuery}
                            onChange={handleSearchChange}
                            placeholder="ページ、チーム、レポートを検索..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* 検索結果 */}
                      <div className="max-h-80 overflow-y-auto">
                        {filteredSearchResults.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">検索結果が見つかりません</p>
                          </div>
                        ) : (
                          <div className="py-2">
                            {filteredSearchResults.map((result) => (
                              <button
                                key={result.id}
                                onClick={() => handleSearchSelect(result)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                                    {result.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {result.title}
                                      </p>
                                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                                        {result.category}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {result.description}
                                    </p>
                                    {result.lastAccessed && (
                                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        最終アクセス: {result.lastAccessed}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 検索フッター */}
                      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>ヒント: Cmd+K で素早く検索</span>
                          <div className="flex items-center space-x-2">
                            <span>ESC</span>
                            <span>閉じる</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 右側: ステータス、通知、ユーザーメニュー */}
            <div className="flex items-center space-x-3">
              {/* ネットワーク状態 */}
              <div className="hidden sm:flex items-center">
                {headerState.isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
              </div>

              {/* テーマ切り替え */}
              <button
                onClick={() => toggleTheme(headerState.theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="テーマ切り替え"
              >
                {headerState.theme === 'dark' ? 
                  <Sun className="h-5 w-5" /> : 
                  <Moon className="h-5 w-5" />
                }
              </button>

              {/* 通知アイコン */}
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={toggleNotifications}
                  className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="通知を表示"
                >
                  <Bell className="w-5 h-5" />
                  
                  {/* 通知バッジ */}
                  {headerState.unreadNotifications > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs text-white font-medium ${
                      headerState.criticalAlerts > 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                    }`}>
                      {headerState.unreadNotifications > 99 ? '99+' : headerState.unreadNotifications}
                    </span>
                  )}
                </button>

                {/* 通知パネル */}
                {headerState.isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-[32rem] overflow-hidden">
                    {/* ヘッダー */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">通知</h3>
                        {headerState.unreadNotifications > 0 && (
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full">
                            {headerState.unreadNotifications}件未読
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {headerState.unreadNotifications > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                          >
                            すべて既読
                          </button>
                        )}
                        <button
                          onClick={() => setHeaderState(prev => ({ ...prev, isNotificationOpen: false }))}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* 通知フィルター */}
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center space-x-2 text-xs">
                        <Filter className="h-3 w-3 text-gray-400" />
                        <button className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                          すべて
                        </button>
                        <button className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                          緊急
                        </button>
                        <button className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                          チーム
                        </button>
                        <button className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                          システム
                        </button>
                      </div>
                    </div>

                    {/* 通知リスト */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                          <p className="text-sm font-medium">通知はありません</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">新しい通知があるとここに表示されます</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-l-4 ${
                              !notification.isRead ? getPriorityColor(notification.priority) : 'border-l-gray-200 dark:border-l-gray-600'
                            }`}
                          >
                            <div className="flex space-x-3">
                              {getNotificationIcon(notification.type, notification.priority)}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center space-x-2">
                                    <p className={`text-sm text-gray-900 dark:text-white ${
                                      !notification.isRead ? 'font-semibold' : 'font-medium'
                                    }`}>
                                      {notification.title}
                                    </p>
                                    <div className="flex items-center space-x-1">
                                      <div className="text-gray-400 dark:text-gray-500">
                                        {getCategoryIcon(notification.category)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-2">
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                      }}
                                      className="text-gray-400 hover:text-red-500 transition-colors"
                                      aria-label="通知を削除"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex justify-between items-center mt-2">
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {notification.timestamp}
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    {notification.priority === 'critical' && (
                                      <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full font-medium">
                                        緊急
                                      </span>
                                    )}
                                    {notification.metadata?.affectedUsers && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {notification.metadata.affectedUsers}名に影響
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* フッター */}
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex justify-between items-center">
                        <Link
                          href="/alerts"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                          onClick={() => setHeaderState(prev => ({ ...prev, isNotificationOpen: false }))}
                        >
                          すべてのアラートを表示 →
                        </Link>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>リアルタイム更新</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ユーザーメニュー */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-3 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="ユーザーメニューを開く"
                >
                  {/* プロフィール画像またはアバター */}
                  <div className="relative">
                    <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                      <span className="text-white text-sm font-semibold">
                        {getInitials(user?.name || 'User')}
                      </span>
                    </div>
                    
                    {/* オンライン状態インジケーター */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900"></div>
                  </div>

                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {user?.name || 'ユーザー'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.role || 'メンバー'}
                    </p>
                  </div>

                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>

                {/* ユーザードロップダウンメニュー */}
                {headerState.isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {/* ユーザー情報ヘッダー */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {getInitials(user?.name || 'User')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user?.name || 'ユーザー'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.email || 'user@example.com'}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                              オンライン
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* メニューアイテム */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setHeaderState(prev => ({ ...prev, isUserMenuOpen: false }))}
                      >
                        <div className="flex items-center space-x-3">
                          <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span>プロフィール</span>
                        </div>
                      </Link>

                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setHeaderState(prev => ({ ...prev, isUserMenuOpen: false }))}
                      >
                        <div className="flex items-center space-x-3">
                          <Settings className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span>設定</span>
                        </div>
                      </Link>

                      <Link
                        href="/subscription"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setHeaderState(prev => ({ ...prev, isUserMenuOpen: false }))}
                      >
                        <div className="flex items-center space-x-3">
                          <Star className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span>サブスクリプション</span>
                        </div>
                      </Link>

                      <Link
                        href="/help"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setHeaderState(prev => ({ ...prev, isUserMenuOpen: false }))}
                      >
                        <div className="flex items-center space-x-3">
                          <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span>ヘルプ・サポート</span>
                        </div>
                      </Link>
                    </div>

                    {/* テーマ設定 */}
                    <div className="border-t border-gray-100 dark:border-gray-700 py-2">
                      <div className="px-4 py-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">テーマ設定</p>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={() => toggleTheme('light')}
                            className={`p-2 rounded text-xs flex flex-col items-center space-y-1 transition-colors ${
                              headerState.theme === 'light' 
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <Sun className="h-3 w-3" />
                            <span>ライト</span>
                          </button>
                          <button
                            onClick={() => toggleTheme('dark')}
                            className={`p-2 rounded text-xs flex flex-col items-center space-y-1 transition-colors ${
                              headerState.theme === 'dark' 
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <Moon className="h-3 w-3" />
                            <span>ダーク</span>
                          </button>
                          <button
                            onClick={() => toggleTheme('system')}
                            className={`p-2 rounded text-xs flex flex-col items-center space-y-1 transition-colors ${
                              headerState.theme === 'system' 
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <Monitor className="h-3 w-3" />
                            <span>システム</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ログアウト */}
                    <div className="border-t border-gray-100 dark:border-gray-700 mt-1">
                      <button
                        onClick={() => void handleLogout()}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <LogOut className="w-4 h-4" />
                          <span>ログアウト</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* モバイル検索バー */}
        <div className="md:hidden px-4 pb-3">
          <button
            onClick={toggleSearch}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <Search className="h-4 w-4 mr-3" />
            <span className="flex-1 text-left">検索...</span>
          </button>
        </div>
      </header>

      {/* 背景オーバーレイ（メニューが開いている時） */}
      {(headerState.isUserMenuOpen || headerState.isNotificationOpen || headerState.isSearchOpen) && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-10 backdrop-blur-sm"
          onClick={() => {
            setHeaderState(prev => ({
              ...prev,
              isUserMenuOpen: false,
              isNotificationOpen: false,
              isSearchOpen: false
            }));
          }}
        />
      )}

      {/* コマンドパレット（全画面オーバーレイ） */}
      {headerState.isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setHeaderState(prev => ({ ...prev, isCommandPaletteOpen: false }))}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={headerState.searchQuery}
                  onChange={handleSearchChange}
                  placeholder="コマンドを検索..."
                  className="w-full pl-10 pr-4 py-3 border-0 bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
              {filteredSearchResults.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSearchSelect(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                >
                  <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                    {result.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {result.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {result.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-600 dark:text-gray-300">
                      ↵
                    </kbd>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;