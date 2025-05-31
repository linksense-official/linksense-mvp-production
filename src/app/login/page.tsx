'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/app/contexts/AuthContext';

interface TwoFactorData {
  userId: string;
  email: string;
  requiresTwoFactor: boolean;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null);
  const [isBackupCode, setIsBackupCode] = useState(false);
  const { 
    isAuthenticated, 
    isLoading, 
    login, 
    verifyTwoFactor, 
    requiresTwoFactor 
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL パラメータからメッセージを取得
  const verified = searchParams.get('verified');
  const reset = searchParams.get('reset');
  const errorParam = searchParams.get('error');

  // 既にログイン済みの場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (!isLoading && isAuthenticated && !requiresTwoFactor) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, requiresTwoFactor, router]);

  // 成功メッセージの表示
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    
    if (verified === 'true') {
      setError(null);
      timer = setTimeout(() => {
        // メッセージをクリア
      }, 5000);
    }
    
    if (reset === 'success') {
      setError(null);
    }

    // OAuth エラーハンドリング
    if (errorParam) {
      switch (errorParam) {
        case 'OAuthSignin':
          setError('ソーシャルログインでエラーが発生しました。再度お試しください。');
          break;
        case 'OAuthCallback':
          setError('ソーシャルログインの認証に失敗しました。');
          break;
        case 'OAuthCreateAccount':
          setError('アカウントの作成に失敗しました。');
          break;
        case 'EmailCreateAccount':
          setError('そのメールアドレスは既に別のアカウントで使用されています。');
          break;
        case 'Callback':
          setError('認証処理中にエラーが発生しました。');
          break;
        case 'OAuthAccountNotLinked':
          setError('そのメールアドレスは既に別の方法でログインされています。元の方法でログインしてください。');
          break;
        case 'EmailSignin':
          setError('メール認証に失敗しました。');
          break;
        case 'CredentialsSignin':
          setError('メールアドレスまたはパスワードが正しくありません。');
          break;
        case 'SessionRequired':
          setError('このページにアクセスするにはログインが必要です。');
          break;
        default:
          setError('認証エラーが発生しました。再度お試しください。');
      }
    }
    
    // 常にクリーンアップ関数を返す
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [verified, reset, errorParam]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // AuthContextの新しいlogin APIを使用
      const result = await login(email, password);
      
      if (result.success) {
        // ログイン成功、ダッシュボードへリダイレクト
        router.push('/dashboard');
      } else if (result.requiresTwoFactor && result.userId) {
        // 2FA認証が必要
        setTwoFactorData({
          userId: result.userId,
          email: email,
          requiresTwoFactor: true
        });
        setShowTwoFactor(true);
      } else {
        // ログイン失敗
        setError(result.error || 'ログインに失敗しました');
      }
    } catch (err) {
      setError('ログイン処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!twoFactorData || !twoFactorCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // AuthContextの2FA検証APIを使用
      const result = await verifyTwoFactor(
        twoFactorData.userId, 
        twoFactorCode.trim(), 
        isBackupCode
      );

      if (result.success) {
        // 2FA認証成功、ダッシュボードへリダイレクト
        router.push('/dashboard');
      } else {
        // 2FA認証失敗
        setError(result.error || '認証に失敗しました');
        setTwoFactorCode('');
      }
    } catch (err) {
      setError('認証処理中にエラーが発生しました');
      setTwoFactorCode('');
    } finally {
      setLoading(false);
    }
  };

  // ソーシャルログイン処理
  const handleSocialLogin = async (provider: 'google' | 'github' | 'azure-ad'): Promise<void> => {
    setSocialLoading(provider);
    setError(null);

    try {
      const result = await signIn(provider, {
        callbackUrl: '/dashboard',
        redirect: false
      });

      if (result?.error) {
        setError(`${getProviderName(provider)}ログインに失敗しました: ${result.error}`);
      } else if (result?.url) {
        // 成功時は自動的にリダイレクトされる
        window.location.href = result.url;
      }
    } catch (err) {
      setError(`${getProviderName(provider)}ログイン中にエラーが発生しました`);
    } finally {
      setSocialLoading(null);
    }
  };

  // プロバイダー名の取得
  const getProviderName = (provider: string): string => {
    switch (provider) {
      case 'google': return 'Google';
      case 'github': return 'GitHub';
      case 'azure-ad': return 'Microsoft';
      default: return provider;
    }
  };

  // デモアカウントでのログイン
  const handleDemoLogin = async (demoEmail: string, demoPassword: string): Promise<void> => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError(null);

    try {
      const result = await login(demoEmail, demoPassword);
      
      if (result.success) {
        router.push('/dashboard');
      } else if (result.requiresTwoFactor && result.userId) {
        // デモアカウントで2FAが有効な場合
        setTwoFactorData({
          userId: result.userId,
          email: demoEmail,
          requiresTwoFactor: true
        });
        setShowTwoFactor(true);
      } else {
        setError(result.error || 'デモアカウントログインに失敗しました');
      }
    } catch (err) {
      setError('ログイン処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const resetTwoFactor = (): void => {
    setShowTwoFactor(false);
    setTwoFactorData(null);
    setTwoFactorCode('');
    setIsBackupCode(false);
    setError(null);
  };

  // 認証チェック中の表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="loading-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" data-testid="loading-spinner"></div>
          <p className="mt-4 text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8" data-testid="login-page">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900" data-testid="login-title">
          {showTwoFactor ? '2要素認証' : 'LinkSense にログイン'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600" data-testid="login-subtitle">
          {showTwoFactor ? '認証アプリのコードを入力してください' : 'チーム健全性分析ツール'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10" data-testid="login-form-container">
          {/* 成功メッセージ */}
          {verified === 'true' && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4" data-testid="success-message-verified">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    メール認証完了
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    メールアドレスの認証が完了しました。ログインしてください。
                  </div>
                </div>
              </div>
            </div>
          )}

          {reset === 'success' && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4" data-testid="success-message-reset">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    パスワードリセット完了
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    パスワードが正常にリセットされました。新しいパスワードでログインしてください。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4" data-testid="error-message">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {showTwoFactor ? '認証エラー' : 'ログインエラー'}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showTwoFactor ? (
            // 通常のログインフォーム
            <>
              {/* ソーシャルログインボタン */}
              <div className="space-y-3 mb-6" data-testid="social-login-section">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading || socialLoading !== null}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="google-login-button"
                >
                  {socialLoading === 'google' ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" data-testid="google-loading-spinner">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" data-testid="google-icon">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {socialLoading === 'google' ? 'Googleでログイン中...' : 'Googleでログイン'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  disabled={loading || socialLoading !== null}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="github-login-button"
                >
                  {socialLoading === 'github' ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" data-testid="github-loading-spinner">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24" data-testid="github-icon">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  )}
                  {socialLoading === 'github' ? 'GitHubでログイン中...' : 'GitHubでログイン'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('azure-ad')}
                  disabled={loading || socialLoading !== null}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="microsoft-login-button"
                >
                  {socialLoading === 'azure-ad' ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" data-testid="microsoft-loading-spinner">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" data-testid="microsoft-icon">
                      <path fill="#F25022" d="M0 0h11.377v11.372H0z"/>
                      <path fill="#7FBA00" d="M12.623 0H24v11.372H12.623z"/>
                      <path fill="#00A4EF" d="M0 12.628h11.377V24H0z"/>
                      <path fill="#FFB900" d="M12.623 12.628H24V24H12.623z"/>
                    </svg>
                  )}
                  {socialLoading === 'azure-ad' ? 'Microsoftでログイン中...' : 'Microsoftでログイン'}
                </button>
              </div>

              {/* 区切り線 */}
              <div className="relative mb-6" data-testid="divider-or">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">または</span>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit} data-testid="email-login-form">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    メールアドレス
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="your@email.com"
                      data-testid="email-input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    パスワード
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="パスワード"
                      data-testid="password-input"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <a href="/reset-password" className="font-medium text-blue-600 hover:text-blue-500" data-testid="forgot-password-link">
                      パスワードを忘れた方
                    </a>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading || socialLoading !== null}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      loading || socialLoading !== null
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                    data-testid="email-login-submit-button"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" data-testid="email-login-loading-spinner">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ログイン中...
                      </div>
                    ) : (
                      'メールアドレスでログイン'
                    )}
                  </button>
                </div>
              </form>

              {/* デモアカウント */}
              <div className="mt-6" data-testid="demo-accounts-section">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">デモアカウント</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('demo@company.com', 'demo123')}
                    disabled={loading || socialLoading !== null}
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="demo-login-button"
                  >
                    <span>デモユーザー</span>
                    <span className="ml-2 text-xs text-gray-400">(demo@company.com)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('admin@company.com', 'admin123')}
                    disabled={loading || socialLoading !== null}
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="admin-demo-login-button"
                  >
                    <span>管理者</span>
                     <span className="ml-2 text-xs text-gray-400">(admin@company.com)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('manager@company.com', 'manager123')}
                    disabled={loading || socialLoading !== null}
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="manager-demo-login-button"
                  >
                    <span>マネージャー</span>
                    <span className="ml-2 text-xs text-gray-400">(manager@company.com)</span>
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  アカウントをお持ちでない方は{' '}
                  <a href="/register" className="font-medium text-blue-600 hover:text-blue-500" data-testid="register-link">
                    新規登録
                  </a>
                </p>
              </div>
            </>
          ) : (
            // 2FA認証フォーム
            <form className="space-y-6" onSubmit={handleTwoFactorSubmit} data-testid="two-factor-form">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4" data-testid="two-factor-email-display">
                  {twoFactorData?.email} でログインしています
                </p>
              </div>

              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700">
                  {isBackupCode ? 'バックアップコード' : '認証コード'}
                </label>
                <div className="mt-1">
                  <input
                    id="twoFactorCode"
                    name="twoFactorCode"
                    type="text"
                    required
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg tracking-widest"
                    placeholder={isBackupCode ? 'バックアップコードを入力' : '6桁のコードを入力'}
                    maxLength={isBackupCode ? 10 : 6}
                    data-testid="two-factor-code-input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsBackupCode(!isBackupCode)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  data-testid="toggle-backup-code-button"
                >
                  {isBackupCode ? '認証アプリを使用' : 'バックアップコードを使用'}
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !twoFactorCode.trim()}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading || !twoFactorCode.trim()
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                  data-testid="two-factor-submit-button"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" data-testid="two-factor-loading-spinner">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      認証中...
                    </div>
                  ) : (
                    '認証'
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resetTwoFactor}
                  className="text-sm font-medium text-gray-600 hover:text-gray-500"
                  data-testid="two-factor-back-button"
                >
                  ← 戻る
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;