'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 認証が不要なページ（ヘッダー/サイドバーを表示しない）
  const publicPages = [
    '/login',
    '/register',
    '/reset-password',
    '/verify-email',
    '/pricing',
    '/'
  ];

  // 現在のページが認証不要ページかチェック
  const isPublicPage = publicPages.includes(pathname);

  // 認証中の場合は何も表示しない
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 認証不要ページまたは未認証の場合は、レイアウトなしで表示
  if (isPublicPage || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // 認証済みの場合は、ヘッダー/サイドバー付きレイアウトで表示
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <Header />

      <div className="flex">
        {/* サイドバー */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onToggle={toggleSidebar}
        />

        {/* メインコンテンツエリア */}
        <main className="flex-1 min-h-screen lg:ml-64">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>

      {/* モバイル用オーバーレイ */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;