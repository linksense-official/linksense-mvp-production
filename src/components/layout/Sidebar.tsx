'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isDarkMode?: boolean;
  isCollapsed?: boolean;
  onCollapse?: () => void;
}

interface MenuItem {
  id: string;
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
  category: 'main' | 'analytics' | 'management' | 'settings';
  keywords: string[];
  isFavorite?: boolean;
  isNew?: boolean;
  description?: string;
  shortcut?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  items: MenuItem[];
  isExpanded: boolean;
}

// エンタープライズグレードアイコンコンポーネント
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const ChartBarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const DocumentReportIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CreditCardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const PuzzlePieceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
  </svg>
);

const QuestionMarkCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle, 
  isDarkMode = false,
  isCollapsed = false,
  onCollapse 
}) => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    main: true,
    analytics: true,
    management: true,
    settings: false
  });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuItemsRef = useRef<HTMLAnchorElement[]>([]);

  // エンタープライズメニュー項目定義
  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'dashboard',
      name: 'ダッシュボード',
      href: '/dashboard',
      icon: HomeIcon,
      category: 'main',
      keywords: ['ダッシュボード', 'ホーム', 'メイン', 'dashboard', 'home'],
      description: 'チーム健全性の概要とリアルタイム分析',
      shortcut: 'Ctrl+1'
    },
    {
      id: 'analytics',
      name: '分析',
      href: '/analytics',
      icon: ChartBarIcon,
      category: 'analytics',
      keywords: ['分析', 'アナリティクス', 'データ', 'analytics', 'data'],
      description: 'AI駆動の詳細分析とインサイト',
      shortcut: 'Ctrl+2',
      isNew: true
    },
    {
      id: 'alerts',
      name: 'アラート',
      href: '/alerts',
      icon: ExclamationTriangleIcon,
      badge: 3,
      category: 'main',
      keywords: ['アラート', '警告', '通知', 'alerts', 'notifications'],
      description: 'リアルタイムアラートと通知管理',
      shortcut: 'Ctrl+3'
    },
    {
      id: 'reports',
      name: 'レポート',
      href: '/reports',
      icon: DocumentReportIcon,
      category: 'analytics',
      keywords: ['レポート', '報告書', 'reports', 'documents'],
      description: 'カスタマイズ可能なレポート生成',
      shortcut: 'Ctrl+4'
    },
    {
      id: 'members',
      name: 'チームメンバー',
      href: '/members',
      icon: UsersIcon,
      category: 'management',
      keywords: ['メンバー', 'チーム', 'ユーザー', 'members', 'team', 'users'],
      description: 'チームメンバーの管理と権限設定',
      shortcut: 'Ctrl+5'
    },
    {
      id: 'integrations',
      name: '統合設定',
      href: '/integrations',
      icon: PuzzlePieceIcon,
      category: 'settings',
      keywords: ['統合', '連携', 'integrations', 'connections'],
      description: '外部サービスとの統合管理',
      shortcut: 'Ctrl+6'
    },
    {
      id: 'subscription',
      name: 'サブスクリプション',
      href: '/subscription',
      icon: CreditCardIcon,
      category: 'management',
      keywords: ['サブスクリプション', '料金', '請求', 'subscription', 'billing'],
      description: 'プランと請求情報の管理',
      shortcut: 'Ctrl+7'
    },
    {
      id: 'settings',
      name: '設定',
      href: '/settings',
      icon: CogIcon,
      category: 'settings',
      keywords: ['設定', '構成', 'settings', 'configuration'],
      description: 'システム設定とカスタマイズ',
      shortcut: 'Ctrl+8'
    },
    {
      id: 'help',
      name: 'ヘルプ',
      href: '/help',
      icon: QuestionMarkCircleIcon,
      category: 'settings',
      keywords: ['ヘルプ', 'サポート', 'help', 'support'],
      description: 'ドキュメントとサポート情報',
      shortcut: 'Ctrl+9'
    }
  ], []);

  // カテゴリ別メニュー構成
  const menuCategories: MenuCategory[] = useMemo(() => [
    {
      id: 'main',
      name: 'メイン',
      icon: HomeIcon,
      items: menuItems.filter(item => item.category === 'main'),
      isExpanded: expandedCategories.main
    },
    {
      id: 'analytics',
      name: '分析・レポート',
      icon: ChartBarIcon,
      items: menuItems.filter(item => item.category === 'analytics'),
      isExpanded: expandedCategories.analytics
    },
    {
      id: 'management',
      name: '管理',
      icon: UsersIcon,
      items: menuItems.filter(item => item.category === 'management'),
      isExpanded: expandedCategories.management
    },
    {
      id: 'settings',
      name: '設定・サポート',
      icon: CogIcon,
      items: menuItems.filter(item => item.category === 'settings'),
      isExpanded: expandedCategories.settings
    }
  ], [menuItems, expandedCategories]);

  // 検索フィルタリング
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    
    const query = searchQuery.toLowerCase();
    return menuItems.filter(item => 
      item.keywords.some(keyword => keyword.toLowerCase().includes(query)) ||
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  }, [menuItems, searchQuery]);

  // アクティブルート判定
  const isActiveRoute = useCallback((href: string) => {
    return pathname === href;
  }, [pathname]);

  // お気に入り管理
  const toggleFavorite = useCallback((itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  // 最近のアクセス履歴更新
  const updateRecentItems = useCallback((itemId: string) => {
    setRecentItems(prev => {
      const filtered = prev.filter(id => id !== itemId);
      return [itemId, ...filtered].slice(0, 5);
    });
  }, []);

  // カテゴリ展開/折りたたみ
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  // アイテムクリックハンドラー
  const handleItemClick = useCallback((itemId: string) => {
    updateRecentItems(itemId);
    
    // モバイルでメニューアイテムをクリックした時にサイドバーを閉じる
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggle();
    }
  }, [onToggle, updateRecentItems]);

  // キーボードナビゲーション
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const visibleItems = searchQuery ? filteredItems : menuItems;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % visibleItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev <= 0 ? visibleItems.length - 1 : prev - 1);
        break;
      case 'Enter':
        if (focusedIndex >= 0 && focusedIndex < visibleItems.length) {
          const item = visibleItems[focusedIndex];
          handleItemClick(item.id);
        }
        break;
      case 'Escape':
        setSearchQuery('');
        setFocusedIndex(-1);
        searchInputRef.current?.blur();
        break;
      case '/':
        if (!searchQuery) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
        break;
    }
  }, [searchQuery, filteredItems, menuItems, focusedIndex, handleItemClick]);

  // ショートカットキー処理
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          e.preventDefault();
          const targetItem = menuItems[num - 1];
          if (targetItem) {
            window.location.href = targetItem.href;
          }
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [menuItems]);

  // フォーカス管理
  useEffect(() => {
  if (focusedIndex >= 0 && menuItemsRef.current[focusedIndex]) {
    menuItemsRef.current[focusedIndex].focus();
  }
}, [focusedIndex]);

  // お気に入りアイテム
  const favoriteItems = useMemo(() => 
    menuItems.filter(item => favorites.includes(item.id)),
    [menuItems, favorites]
  );

  // 最近のアイテム
  const recentMenuItems = useMemo(() => 
    recentItems.map(id => menuItems.find(item => item.id === id)).filter(Boolean) as MenuItem[],
    [recentItems, menuItems]
  );

  return (
    <>
      {/* サイドバー */}
      <aside
        className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] bg-gradient-to-b transition-all duration-300 ease-in-out transform border-r ${
          isDarkMode
            ? 'from-gray-900 via-gray-800 to-gray-900 border-gray-700 text-white'
            : 'from-white via-gray-50 to-white border-gray-200 text-gray-900'
        } ${
          isCollapsed ? 'w-16' : 'w-80'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        role="navigation"
        aria-label="メインナビゲーション"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="flex flex-col h-full">
          {/* サイドバーヘッダー */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          } lg:hidden`}>
            <h2 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              メニュー
            </h2>
            <button
              onClick={onToggle}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label="サイドバーを閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 検索バー */}
          {!isCollapsed && (
            <div className="p-4 border-b border-opacity-20">
              <div className="relative">
                <SearchIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="メニューを検索... (/ でフォーカス)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  aria-label="メニュー検索"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    aria-label="検索をクリア"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ナビゲーションメニュー */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            <div className="p-4 space-y-6">
              {/* お気に入りセクション */}
              {!isCollapsed && favoriteItems.length > 0 && !searchQuery && (
                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    お気に入り
                  </h3>
                  <div className="space-y-1">
                    {favoriteItems.map((item) => (
                      <MenuItemComponent
                        key={`fav-${item.id}`}
                        item={item}
                        isActive={isActiveRoute(item.href)}
                        isDarkMode={isDarkMode}
                        isCollapsed={isCollapsed}
                        isFavorite={true}
                        onToggleFavorite={toggleFavorite}
                        onClick={() => handleItemClick(item.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 最近のアクセス */}
              {!isCollapsed && recentMenuItems.length > 0 && !searchQuery && (
                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    最近のアクセス
                  </h3>
                  <div className="space-y-1">
                    {recentMenuItems.slice(0, 3).map((item) => (
                      <MenuItemComponent
                        key={`recent-${item.id}`}
                        item={item}
                        isActive={isActiveRoute(item.href)}
                        isDarkMode={isDarkMode}
                        isCollapsed={isCollapsed}
                        isFavorite={favorites.includes(item.id)}
                        onToggleFavorite={toggleFavorite}
                        onClick={() => handleItemClick(item.id)}
                        isCompact={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 検索結果 */}
              {searchQuery ? (
                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    検索結果 ({filteredItems.length})
                  </h3>
                  <div className="space-y-1">
                    {filteredItems.map((item, index) => (
                      <MenuItemComponent
                        key={`search-${item.id}`}
                        item={item}
                        isActive={isActiveRoute(item.href)}
                        isDarkMode={isDarkMode}
                        isCollapsed={isCollapsed}
                        isFavorite={favorites.includes(item.id)}
                        onToggleFavorite={toggleFavorite}
                        onClick={() => handleItemClick(item.id)}
                        isFocused={index === focusedIndex}
                        ref={(el) => {
  if (el) {
    menuItemsRef.current[index] = el;
  }
}}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* カテゴリ別メニュー */
                menuCategories.map((category) => (
                  <div key={category.id}>
                    {!isCollapsed && (
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className={`flex items-center justify-between w-full text-left text-xs font-semibold uppercase tracking-wider mb-3 transition-colors ${
                          isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
                        }`}
                        aria-expanded={category.isExpanded}
                        aria-controls={`category-${category.id}`}
                      >
                        <span className="flex items-center">
                          <category.icon className="w-4 h-4 mr-2" />
                          {category.name}
                        </span>
                        <ChevronDownIcon 
                          className={`w-4 h-4 transition-transform duration-200 ${
                            category.isExpanded ? 'transform rotate-180' : ''
                          }`} 
                        />
                      </button>
                    )}
                    
                    <div 
                      id={`category-${category.id}`}
                      className={`space-y-1 transition-all duration-200 overflow-hidden ${
                        !isCollapsed && category.isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      } ${isCollapsed ? 'max-h-none opacity-100' : ''}`}
                    >
                      {category.items.map((item) => (
                        <MenuItemComponent
                          key={item.id}
                          item={item}
                          isActive={isActiveRoute(item.href)}
                          isDarkMode={isDarkMode}
                          isCollapsed={isCollapsed}
                          isFavorite={favorites.includes(item.id)}
                          onToggleFavorite={toggleFavorite}
                          onClick={() => handleItemClick(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </nav>

          {/* サイドバーフッター */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {!isCollapsed ? (
              <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30' 
                  : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50'
              }`}>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">LS</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    LinkSense
                  </p>
                  <p className={`text-xs truncate ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    チーム健全性分析
                  </p>
                </div>
                {onCollapse && (
                  <button
                    onClick={onCollapse}
                    className={`p-1 rounded transition-colors ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-label="サイドバーを折りたたむ"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">LS</span>
                </div>
              </div>
            )}
          </div>

          {/* 折りたたみ時の展開ボタン */}
          {isCollapsed && onCollapse && (
            <div className="absolute -right-3 top-1/2 transform -translate-y-1/2">
              <button
                onClick={onCollapse}
                className={`p-1 rounded-full shadow-lg border transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' 
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                aria-label="サイドバーを展開"
              >
                <ChevronRightIcon className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* モバイル用のサイドバートグルボタン */}
      <button
        onClick={onToggle}
        className={`fixed top-20 left-4 z-40 p-2 rounded-lg shadow-lg border transition-all duration-300 lg:hidden ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700' 
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
        } ${
          isOpen ? 'translate-x-80' : 'translate-x-0'
        }`}
        aria-label={isOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
};

// メニューアイテムコンポーネント
interface MenuItemComponentProps {
  item: MenuItem;
  isActive: boolean;
  isDarkMode: boolean;
  isCollapsed: boolean;
  isFavorite: boolean;
  onToggleFavorite: (itemId: string) => void;
  onClick: () => void;
  isFocused?: boolean;
  isCompact?: boolean;
}

const MenuItemComponent = React.forwardRef<HTMLAnchorElement, MenuItemComponentProps>(
  ({ 
    item, 
    isActive, 
    isDarkMode, 
    isCollapsed, 
    isFavorite, 
    onToggleFavorite, 
    onClick,
    isFocused = false,
    isCompact = false
  }, ref) => {
    const Icon = item.icon;

    return (
      <div className="relative group">
        <Link
          ref={ref}
          href={item.href}
          onClick={onClick}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
            isCollapsed ? 'justify-center' : 'justify-start'
          } ${
            isActive
              ? isDarkMode
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-2 border-blue-600 shadow-sm'
              : isDarkMode
                ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          } ${
            isFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
          }`}
          aria-current={isActive ? 'page' : undefined}
          aria-describedby={`${item.id}-description`}
          title={isCollapsed ? item.name : undefined}
        >
          <Icon
            className={`transition-colors ${
              isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
            } ${
              isActive
                ? isDarkMode ? 'text-white' : 'text-blue-600'
                : isDarkMode ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-400 group-hover:text-gray-600'
            }`}
          />
          
          {!isCollapsed && (
            <>
              <span className="flex-1 truncate">{item.name}</span>
              
              <div className="flex items-center space-x-1">
                {/* 新機能バッジ */}
                {item.isNew && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    NEW
                  </span>
                )}
                
                {/* 通知バッジ */}
                {item.badge && item.badge > 0 && (
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    isDarkMode 
                      ? 'bg-red-600 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                
                {/* お気に入りボタン */}
                {!isCompact && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                      isFavorite 
                        ? 'text-yellow-500 hover:text-yellow-600' 
                        : isDarkMode 
                          ? 'text-gray-400 hover:text-yellow-500' 
                          : 'text-gray-400 hover:text-yellow-500'
                    }`}
                    aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
                  >
                    <StarIcon className="w-4 h-4" />
                  </button>
                )}
                
                {/* アクティブ状態のインジケーター */}
                {isActive && (
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    isDarkMode ? 'bg-white' : 'bg-blue-600'
                  }`} />
                )}
              </div>
            </>
          )}
        </Link>

        {/* 折りたたみ時のツールチップ */}
        {isCollapsed && (
          <div className={`absolute left-full ml-2 px-3 py-2 text-sm rounded-lg shadow-lg z-50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
            isDarkMode 
              ? 'bg-gray-800 text-white border border-gray-600' 
              : 'bg-white text-gray-900 border border-gray-200'
          }`}>
            <div className="font-medium">{item.name}</div>
            {item.description && (
              <div className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {item.description}
              </div>
            )}
            {item.shortcut && (
              <div className={`text-xs mt-1 font-mono ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {item.shortcut}
              </div>
            )}
          </div>
        )}

        {/* 説明文（スクリーンリーダー用） */}
        <div id={`${item.id}-description`} className="sr-only">
          {item.description}
          {item.shortcut && ` ショートカット: ${item.shortcut}`}
        </div>
      </div>
    );
  }
);

MenuItemComponent.displayName = 'MenuItemComponent';

export default Sidebar;