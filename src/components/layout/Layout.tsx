'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import { 
  Shield, AlertTriangle, Wifi, WifiOff, Loader2, 
  RefreshCw, Settings, Bell, HelpCircle, Zap,
  Monitor, Moon, Sun, Palette, Globe, Lock,
  Activity, TrendingUp, Users, BarChart3
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

interface LayoutState {
  isSidebarOpen: boolean;
  isOffline: boolean;
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  notifications: number;
  connectionStatus: 'online' | 'offline' | 'reconnecting';
  lastActivity: Date;
  performanceMode: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [layoutState, setLayoutState] = useState<LayoutState>({
    isSidebarOpen: false,
    isOffline: false,
    theme: 'light',
    sidebarCollapsed: false,
    notifications: 0,
    connectionStatus: 'online',
    lastActivity: new Date(),
    performanceMode: false
  });

  const [errorState, setErrorState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
    errorId: ''
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  // 認証が不要なページ（ヘッダー/サイドバーを表示しない）
  const publicPages = useMemo(() => [
    '/login',
    '/register',
    '/reset-password',
    '/verify-email',
    '/pricing',
    '/terms',
    '/privacy',
    '/about',
    '/contact',
    '/'
  ], []);

  // 現在のページが認証不要ページかチェック
  const isPublicPage = useMemo(() => {
    return publicPages.some(page => pathname === page || pathname.startsWith(page + '/'));
  }, [pathname, publicPages]);

  // ネットワーク状態監視
  useEffect(() => {
    const handleOnline = () => {
      setLayoutState(prev => ({ 
        ...prev, 
        isOffline: false, 
        connectionStatus: 'online' 
      }));
    };

    const handleOffline = () => {
      setLayoutState(prev => ({ 
        ...prev, 
        isOffline: true, 
        connectionStatus: 'offline' 
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初期状態設定
    setLayoutState(prev => ({ 
      ...prev, 
      isOffline: !navigator.onLine,
      connectionStatus: navigator.onLine ? 'online' : 'offline'
    }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ローカルストレージからの設定復元
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('linksense-theme') as 'light' | 'dark' | 'system';
        const savedSidebarState = localStorage.getItem('linksense-sidebar-collapsed');
        const savedPerformanceMode = localStorage.getItem('linksense-performance-mode');

        setLayoutState(prev => ({
          ...prev,
          theme: savedTheme || 'light',
          sidebarCollapsed: savedSidebarState === 'true',
          performanceMode: savedPerformanceMode === 'true'
        }));

        // テーマ適用
        if (savedTheme === 'dark' || (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('設定の復元に失敗しました:', error);
        setIsInitialized(true);
      }
    }
  }, []);

  // アクティビティ追跡
  useEffect(() => {
    const updateActivity = () => {
      setLayoutState(prev => ({ ...prev, lastActivity: new Date() }));
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  // システムテーマ変更監視
  useEffect(() => {
  if (layoutState.theme !== 'system') return;
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}, [layoutState.theme]);

  // サイドバー切り替え
  const toggleSidebar = useCallback(() => {
    setLayoutState(prev => {
      const newState = { ...prev, isSidebarOpen: !prev.isSidebarOpen };
      
      // モバイルでない場合は、サイドバーの折りたたみ状態も更新
      if (window.innerWidth >= 1024) {
        newState.sidebarCollapsed = !prev.sidebarCollapsed;
        localStorage.setItem('linksense-sidebar-collapsed', String(newState.sidebarCollapsed));
      }
      
      return newState;
    });
  }, []);

  // テーマ切り替え
  const toggleTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setLayoutState(prev => ({ ...prev, theme: newTheme }));
    localStorage.setItem('linksense-theme', newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // system
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // パフォーマンスモード切り替え
  const togglePerformanceMode = useCallback(() => {
    setLayoutState(prev => {
      const newPerformanceMode = !prev.performanceMode;
      localStorage.setItem('linksense-performance-mode', String(newPerformanceMode));
      return { ...prev, performanceMode: newPerformanceMode };
    });
  }, []);

  // エラー回復
  const recoverFromError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorId: ''
    });
    
    // ページリロードまたはダッシュボードにリダイレクト
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // エラー境界
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setErrorState({
        hasError: true,
        error: new Error(event.message),
        errorId: `error_${Date.now()}`
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setErrorState({
        hasError: true,
        error: new Error(String(event.reason)),
        errorId: `promise_${Date.now()}`
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + B でサイドバー切り替え
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
      
      // Ctrl/Cmd + D でダークモード切り替え
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        toggleTheme(layoutState.theme === 'dark' ? 'light' : 'dark');
      }
      
      // Escape でモーダル等を閉じる
      if (event.key === 'Escape') {
        setLayoutState(prev => ({ ...prev, isSidebarOpen: false }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [layoutState.theme, toggleSidebar, toggleTheme]);

  // エラー状態の表示
  if (errorState.hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            予期しないエラーが発生しました
          </h2>
          
          <p className="text-gray-600 mb-6">
            申し訳ございません。システムで問題が発生しました。
            下記のボタンをクリックして復旧をお試しください。
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <h4 className="text-sm font-medium text-gray-900 mb-2">エラー詳細:</h4>
            <p className="text-xs text-gray-600 font-mono">
              ID: {errorState.errorId}
            </p>
            {errorState.error && (
              <p className="text-xs text-gray-600 mt-1">
                {errorState.error.message}
              </p>
            )}
          </div>
          
          <div className="space-y-3">
            <button
              onClick={recoverFromError}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              復旧を試行
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ページを再読み込み
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              問題が続く場合は、サポートチームまでお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 初期化中の表示
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto absolute top-0"></div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">LinkSense</h3>
            <p className="text-gray-600 mb-4">システムを初期化中...</p>
            
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1 text-green-600" />
                <span>セキュア接続</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-1 text-yellow-600" />
                <span>高速ロード</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 認証不要ページまたは未認証の場合は、レイアウトなしで表示
  if (isPublicPage || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* オフライン通知 */}
        {layoutState.isOffline && (
          <div className="bg-orange-600 text-white px-4 py-2 text-center text-sm">
            <div className="flex items-center justify-center">
              <WifiOff className="h-4 w-4 mr-2" />
              オフライン状態です。接続を確認してください。
            </div>
          </div>
        )}
        
        {children}
      </div>
    );
  }

  // 認証済みの場合は、ヘッダー/サイドバー付きレイアウトで表示
  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      layoutState.theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* オフライン通知 */}
      {layoutState.isOffline && (
        <div className="bg-orange-600 text-white px-4 py-2 text-center text-sm relative z-50">
          <div className="flex items-center justify-center">
            <WifiOff className="h-4 w-4 mr-2" />
            <span>オフライン状態です。一部機能が制限されます。</span>
            {layoutState.connectionStatus === 'reconnecting' && (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            )}
          </div>
        </div>
      )}

      {/* パフォーマンスモード通知 */}
      {layoutState.performanceMode && (
        <div className="bg-blue-600 text-white px-4 py-1 text-center text-xs">
          <div className="flex items-center justify-center">
            <Activity className="h-3 w-3 mr-1" />
            パフォーマンスモード有効
          </div>
        </div>
      )}

      {/* ヘッダー - 既存のpropsのみ使用 */}
      <Header />

      <div className="flex">
        {/* サイドバー - 既存のpropsのみ使用 */}
        <Sidebar 
          isOpen={layoutState.isSidebarOpen} 
          onToggle={toggleSidebar}
        />

        {/* メインコンテンツエリア */}
        <main className={`flex-1 min-h-screen transition-all duration-300 ${
          layoutState.sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}>
          <div className="w-full">
            {/* ブレッドクラム */}
            {!isPublicPage && (
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <span>LinkSense</span>
                    <span className="mx-2">/</span>
                    <span className="capitalize">
                      {pathname.split('/').filter(Boolean).join(' / ')}
                    </span>
                  </div>
                  
                  {/* 右側の状態表示 */}
                  <div className="flex items-center space-x-4">
                    {/* テーマ切り替えボタン */}
                    <button
                      onClick={() => toggleTheme(layoutState.theme === 'dark' ? 'light' : 'dark')}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                      aria-label="テーマ切り替え"
                    >
                      {layoutState.theme === 'dark' ? 
                        <Sun className="h-4 w-4" /> : 
                        <Moon className="h-4 w-4" />
                      }
                    </button>

                    {/* パフォーマンスモード切り替え */}
                    <button
                      onClick={togglePerformanceMode}
                      className={`p-2 transition-colors ${
                        layoutState.performanceMode 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                      }`}
                      aria-label="パフォーマンスモード切り替え"
                    >
                      <Zap className="h-4 w-4" />
                    </button>

                    {/* 接続状態表示 */}
                    <div className="flex items-center">
                      {layoutState.isOffline ? (
                        <WifiOff className="h-4 w-4 text-red-500" />
                      ) : (
                        <Wifi className="h-4 w-4 text-green-500" />
                      )}
                    </div>

                    {/* 通知表示 */}
                    {layoutState.notifications > 0 && (
                      <div className="relative">
                        <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center">
                          {layoutState.notifications > 9 ? '9+' : layoutState.notifications}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* メインコンテンツ */}
            <div className={`${layoutState.performanceMode ? '' : 'transition-all duration-200'}`}>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* モバイル用オーバーレイ */}
      {layoutState.isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden transition-opacity duration-300"
          onClick={() => setLayoutState(prev => ({ ...prev, isSidebarOpen: false }))}
          role="button"
          tabIndex={0}
          aria-label="サイドバーを閉じる"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setLayoutState(prev => ({ ...prev, isSidebarOpen: false }));
            }
          }}
        />
      )}

      {/* フローティングアクションボタン（モバイル用） */}
      <div className="fixed bottom-6 right-6 lg:hidden z-30">
        <div className="flex flex-col space-y-3">
          {/* クイック設定 */}
          <button
            onClick={() => toggleTheme(layoutState.theme === 'dark' ? 'light' : 'dark')}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            aria-label="テーマ切り替え"
          >
            {layoutState.theme === 'dark' ? 
              <Sun className="h-5 w-5" /> : 
              <Moon className="h-5 w-5" />
            }
          </button>

          {/* 通知 */}
          {layoutState.notifications > 0 && (
            <button
              className="bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors relative"
              aria-label={`${layoutState.notifications}件の通知`}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs font-bold text-gray-900 rounded-full h-5 w-5 flex items-center justify-center">
                {layoutState.notifications > 9 ? '9+' : layoutState.notifications}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ステータスバー（デバッグ用 - 開発環境でのみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white text-xs px-4 py-2 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>環境: {process.env.NODE_ENV}</span>
              <span>テーマ: {layoutState.theme}</span>
              <span>接続: {layoutState.connectionStatus}</span>
              <span>最終アクティビティ: {layoutState.lastActivity.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              {layoutState.performanceMode && (
                <span className="bg-blue-600 px-2 py-1 rounded text-xs">パフォーマンス</span>
              )}
              {layoutState.isOffline && (
                <span className="bg-red-600 px-2 py-1 rounded text-xs">オフライン</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;