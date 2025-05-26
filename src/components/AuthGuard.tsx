'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

// ローディングコンポーネント
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600 text-sm">認証情報を確認中...</p>
    </div>
  </div>
);

// 未認証時のリダイレクトコンポーネント
const LoginRedirect: React.FC<{ redirectTo: string }> = ({ redirectTo }) => {
  const router = useRouter();

  useEffect(() => {
    router.push(redirectTo);
  }, [router, redirectTo]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 text-sm">ログインページにリダイレクト中...</p>
      </div>
    </div>
  );
};

// 認証済みユーザーのリダイレクトコンポーネント
const DashboardRedirect: React.FC<{ redirectTo: string }> = ({ redirectTo }) => {
  const router = useRouter();

  useEffect(() => {
    router.push(redirectTo);
  }, [router, redirectTo]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 text-sm">ダッシュボードにリダイレクト中...</p>
      </div>
    </div>
  );
};

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo,
  fallback,
}) => {
  const { user, isAuthenticated, isLoading, error } = useAuth();
  const router = useRouter();

  // ローディング中の表示
  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  // エラーが発生した場合の処理
  if (error && requireAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              認証エラー
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {error || '認証に失敗しました。再度ログインしてください。'}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              ログインページへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 認証が必要なページで未認証の場合
  if (requireAuth && !isAuthenticated) {
    const loginUrl = redirectTo || '/login';
    return <LoginRedirect redirectTo={loginUrl} />;
  }

  // 認証が不要なページで認証済みの場合（ログイン・登録ページなど）
  if (!requireAuth && isAuthenticated) {
    const dashboardUrl = redirectTo || '/dashboard';
    return <DashboardRedirect redirectTo={dashboardUrl} />;
  }

  // 条件を満たしている場合は子コンポーネントを表示
  return <>{children}</>;
};

export default AuthGuard;

// 特定用途向けのラッパーコンポーネント
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard requireAuth={true}>
    {children}
  </AuthGuard>
);

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard requireAuth={false}>
    {children}
  </AuthGuard>
);

export const GuestOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard requireAuth={false} redirectTo="/dashboard">
    {children}
  </AuthGuard>
);