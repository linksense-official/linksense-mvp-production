// src/app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // クライアントサイドでマウントされたことを確認
  useEffect(() => {
    setMounted(true);
  }, []);

  // リダイレクト処理
  useEffect(() => {
    if (mounted && !isLoading) {
      console.log('HomePage: リダイレクト処理開始', {
        isAuthenticated,
        isLoading,
        mounted,
        user
      });

      if (isAuthenticated) {
        console.log('HomePage: 認証済み - ダッシュボードにリダイレクト');
        router.replace('/dashboard');
      } else {
        console.log('HomePage: 未認証 - ログインページにリダイレクト');
        router.replace('/login');
      }
    }
  }, [mounted, isAuthenticated, isLoading, router, user]);

  // デバッグ情報をコンソールに出力
  useEffect(() => {
    console.log('HomePage状態:', {
      isAuthenticated,
      isLoading,
      mounted,
      user
    });
  }, [isAuthenticated, isLoading, mounted, user]);

  // マウント前またはローディング中の表示
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!mounted ? 'アプリケーションを初期化中...' : 'LinkSense を読み込み中...'}
          </p>
          <div className="mt-2 text-xs text-gray-400">
            マウント: {mounted ? 'Yes' : 'No'} | 
            認証状態: {isAuthenticated ? '認証済み' : '未認証'} | 
            ローディング: {isLoading ? 'Yes' : 'No'}
            {user && ` | ユーザー: ${user.name}`}
          </div>
        </div>
      </div>
    );
  }

  // リダイレクト中の表示
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
        </div>
        <p className="mt-4 text-gray-600">
          {isAuthenticated ? 'ダッシュボードに移動中...' : 'ログインページに移動中...'}
        </p>
        <div className="mt-2 text-xs text-gray-400">
          認証状態: {isAuthenticated ? '認証済み' : '未認証'}
          {user && ` | ユーザー: ${user.name}`}
        </div>
      </div>
    </div>
  );
}