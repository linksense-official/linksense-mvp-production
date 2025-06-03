'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  KeyRound,
  Smartphone,
  ArrowLeft,
  Building2,
  Users,
  Settings,
  Globe,
  Clock,
  Fingerprint,
  Info
} from 'lucide-react';

// エンタープライズ型定義
interface TwoFactorData {
  userId: string;
  email: string;
  requiresTwoFactor: boolean;
  backupCodesAvailable?: boolean;
  deviceTrusted?: boolean;
}

interface SecurityContext {
  loginAttempts: number;
  lastAttempt: Date | null;
  isLocked: boolean;
  lockoutDuration: number;
  deviceFingerprint: string;
}

interface LoginMetrics {
  startTime: Date;
  provider?: string;
  twoFactorRequired: boolean;
  deviceType: string;
  userAgent: string;
}

// セキュリティ設定
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15分
  PASSWORD_MIN_LENGTH: 8,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30分
  DEVICE_TRUST_DURATION: 30 * 24 * 60 * 60 * 1000 // 30日
};

// エンタープライズUIコンポーネント
const EnterpriseCard: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  variant?: 'default' | 'elevated' | 'security';
}> = ({ children, className = '', variant = 'default' }) => {
  const baseClasses = 'bg-white rounded-xl overflow-hidden transition-all duration-300';
  const variantClasses = {
    default: 'shadow-lg border border-gray-100',
    elevated: 'shadow-xl border border-gray-50',
    security: 'shadow-2xl border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50'
  };
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

const SecurityBadge: React.FC<{ 
  type: 'secure' | 'verified' | 'enterprise' | 'warning';
  children: React.ReactNode;
}> = ({ type, children }) => {
  const configs = {
    secure: 'bg-green-50 text-green-700 border-green-200',
    verified: 'bg-blue-50 text-blue-700 border-blue-200',
    enterprise: 'bg-purple-50 text-purple-700 border-purple-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200'
  };
  
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${configs[type]}`}>
      {children}
    </div>
  );
};

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; color?: string }> = ({ 
  size = 'md', 
  color = 'text-blue-600' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8'
  };
  
  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${color}`} />
  );
};

// メインログインコンポーネント
const EnterpriseLoginPage: React.FC = () => {
  // 基本状態管理
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null);
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  
  // セキュリティ状態管理
  const [securityContext, setSecurityContext] = useState<SecurityContext>({
    loginAttempts: 0,
    lastAttempt: null,
    isLocked: false,
    lockoutDuration: 0,
    deviceFingerprint: ''
  });
  
  const [loginMetrics] = useState<LoginMetrics>({
    startTime: new Date(),
    twoFactorRequired: false,
    deviceType: typeof window !== 'undefined' ? (window.innerWidth < 768 ? 'mobile' : 'desktop') : 'unknown',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
  });

  // フック
  const { 
    isAuthenticated, 
    isLoading, 
    login, 
    verifyTwoFactor, 
    requiresTwoFactor 
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLパラメータ
  const verified = searchParams.get('verified');
  const reset = searchParams.get('reset');
  const errorParam = searchParams.get('error');
  const sessionExpired = searchParams.get('sessionExpired');

  // デバイスフィンガープリント生成
  const generateDeviceFingerprint = useCallback((): string => {
    if (typeof window === 'undefined') return 'server';
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      window.navigator.userAgent,
      window.navigator.language,
      window.screen.width,
      window.screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).slice(0, 32);
  }, []);

  // セキュリティ初期化
  useEffect(() => {
    const deviceFingerprint = generateDeviceFingerprint();
    setSecurityContext(prev => ({ ...prev, deviceFingerprint }));
  }, [generateDeviceFingerprint]);

  // 認証チェックとリダイレクト
  useEffect(() => {
    if (!isLoading && isAuthenticated && !requiresTwoFactor) {
      console.log('認証済みユーザーをダッシュボードにリダイレクトしています');
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, requiresTwoFactor, router]);

  // メッセージ処理
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    
    if (verified === 'true') {
      setError(null);
      console.log('メールアドレス認証が完了しました');
      timer = setTimeout(() => {
        // URLパラメータをクリア
        const url = new URL(window.location.href);
        url.searchParams.delete('verified');
        window.history.replaceState({}, '', url.toString());
      }, 5000);
    }
    
    if (reset === 'success') {
      setError(null);
      console.log('パスワードリセットが完了しました');
    }

    if (sessionExpired === 'true') {
      setError('セッションの有効期限が切れました。再度ログインしてください。');
      console.log('セッション期限切れによるログアウト');
    }

   // OAuth エラーハンドリング強化（Microsoft365対応）
if (errorParam) {
  const errorMessages: Record<string, string> = {
    // 既存のエラー
    'OAuthSignin': 'ソーシャルログインサービスに接続できませんでした。しばらく時間をおいて再度お試しください。',
    'OAuthCallback': 'ソーシャルログインの認証プロセスでエラーが発生しました。',
    'OAuthCreateAccount': 'アカウントの作成に失敗しました。このメールアドレスは既に使用されている可能性があります。',
    'EmailCreateAccount': 'このメールアドレスは既に別のアカウントで使用されています。',
    'Callback': '認証処理中にシステムエラーが発生しました。システム管理者にお問い合わせください。',
    'OAuthAccountNotLinked': 'このメールアドレスは既に別の認証方法で登録されています。元の方法でログインしてください。',
    'EmailSignin': 'メール認証リンクが無効または期限切れです。',
    'CredentialsSignin': 'メールアドレスまたはパスワードが正しくありません。',
    'SessionRequired': 'このページにアクセスするにはログインが必要です。',
    'AccessDenied': 'アクセスが拒否されました。アカウントの権限を確認してください。',
    'Verification': 'メール認証が必要です。受信箱を確認してください。',
    
    // 新しいエラー（Microsoft365 & メール認証対応）
    'TwoFactorRequired': '2要素認証が必要です。認証アプリで生成されたコードを入力してください。',
    'EmailVerificationRequired': 'メールアドレスの認証が必要です。受信箱を確認して認証リンクをクリックしてください。認証メールを再送信しました。',
    'NoEmail': 'ソーシャルログインからメールアドレスを取得できませんでした。別の方法でログインしてください。',
    'DatabaseError': 'データベース接続エラーが発生しました。しばらく時間をおいて再度お試しください。',
    'CallbackError': '認証コールバック処理中にエラーが発生しました。再度ログインを試してください。',
    
    // Microsoft365 特有のエラー
    'AzureADError': 'Microsoft 365認証でエラーが発生しました。組織の管理者にお問い合わせください。',
    'GraphAPIError': 'Microsoft Graph APIでエラーが発生しました。しばらく時間をおいて再度お試しください。',
    'TenantError': '組織のテナント設定に問題があります。システム管理者にお問い合わせください。'
  };
  
  const errorMessage = errorMessages[errorParam] || '認証エラーが発生しました。再度お試しください。';
  setError(errorMessage);
  console.error(`認証エラー: ${errorParam}`, { errorMessage, timestamp: new Date().toISOString() });
  
  // 特定のエラーに対する追加アクション
  if (errorParam === 'EmailVerificationRequired') {
    // メール認証が必要な場合の特別な表示（後で実装予定）
    console.log('メール認証が必要 - 認証メール再送信済み');
  }
}
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [verified, reset, errorParam, sessionExpired]);

  // セキュリティチェック
  const checkSecurityLockout = useCallback((): boolean => {
    const now = new Date();
    if (securityContext.isLocked && securityContext.lastAttempt) {
      const timeSinceLast = now.getTime() - securityContext.lastAttempt.getTime();
      if (timeSinceLast < SECURITY_CONFIG.LOCKOUT_DURATION) {
        const remainingTime = Math.ceil((SECURITY_CONFIG.LOCKOUT_DURATION - timeSinceLast) / 60000);
        setError(`セキュリティロックアウト中です。${remainingTime}分後に再試行してください。`);
        return true;
      } else {
        // ロックアウト解除
        setSecurityContext(prev => ({
          ...prev,
          isLocked: false,
          loginAttempts: 0,
          lastAttempt: null
        }));
      }
    }
    return false;
  }, [securityContext]);

  // ログイン試行回数管理
  const handleLoginAttempt = useCallback((success: boolean) => {
    const now = new Date();
    if (success) {
      setSecurityContext(prev => ({
        ...prev,
        loginAttempts: 0,
        lastAttempt: null,
        isLocked: false
      }));
      console.log('ログイン成功 - セキュリティカウンターをリセット');
    } else {
      setSecurityContext(prev => {
        const newAttempts = prev.loginAttempts + 1;
        const shouldLock = newAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
        
        console.log(`ログイン失敗 - 試行回数: ${newAttempts}/${SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS}`);
        
        if (shouldLock) {
          console.log('セキュリティロックアウトを実行');
        }
        
        return {
          ...prev,
          loginAttempts: newAttempts,
          lastAttempt: now,
          isLocked: shouldLock
        };
      });
    }
  }, []);

  // メインログイン処理
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (checkSecurityLockout()) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log('エンタープライズログイン処理を開始', {
        email,
        deviceFingerprint: securityContext.deviceFingerprint,
        timestamp: new Date().toISOString()
      });

      const result = await login(email, password);
      
      if (result.success) {
        handleLoginAttempt(true);
        console.log('ログイン成功 - ダッシュボードにリダイレクト');
        router.push('/dashboard');
      } else if (result.requiresTwoFactor && result.userId) {
        handleLoginAttempt(true);
        setTwoFactorData({
          userId: result.userId,
          email: email,
          requiresTwoFactor: true,
          backupCodesAvailable: true,
          deviceTrusted: false
        });
        setShowTwoFactor(true);
        console.log('2要素認証が必要です');
      } else {
        handleLoginAttempt(false);
        setError(result.error || 'ログインに失敗しました。認証情報を確認してください。');
      }
    } catch (error) {
      handleLoginAttempt(false);
      console.error('ログイン処理エラー:', error);
      setError('ログイン処理中にシステムエラーが発生しました。しばらく時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // 2FA認証処理
  const handleTwoFactorSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!twoFactorData || !twoFactorCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      console.log('2要素認証を実行中', {
        userId: twoFactorData.userId,
        isBackupCode,
        rememberDevice,
        deviceFingerprint: securityContext.deviceFingerprint
      });

      const result = await verifyTwoFactor(
        twoFactorData.userId, 
        twoFactorCode.trim(), 
        isBackupCode
      );

      if (result.success) {
        console.log('2要素認証成功 - ダッシュボードにリダイレクト');
        router.push('/dashboard');
      } else {
        setError(result.error || '認証コードが正しくありません。再度お試しください。');
        setTwoFactorCode('');
        console.log('2要素認証失敗');
      }
    } catch (error) {
      console.error('2要素認証エラー:', error);
      setError('認証処理中にエラーが発生しました。再度お試しください。');
      setTwoFactorCode('');
    } finally {
      setLoading(false);
    }
  };

  // ソーシャルログイン処理強化（GitHubを除外）
  const handleSocialLogin = async (provider: 'google' | 'azure-ad'): Promise<void> => {
    setSocialLoading(provider);
    setError(null);

    try {
      console.log(`${provider}ソーシャルログインを開始`, {
        provider,
        deviceFingerprint: securityContext.deviceFingerprint,
        timestamp: new Date().toISOString()
      });

      const result = await signIn(provider, {
        callbackUrl: '/dashboard',
        redirect: false
      });

      if (result?.error) {
        console.error(`${provider}ログインエラー:`, result.error);
        setError(`${getProviderDisplayName(provider)}ログインに失敗しました。再度お試しください。`);
      } else if (result?.url) {
        console.log(`${provider}ログイン成功 - リダイレクト中`);
        window.location.href = result.url;
      }
    } catch (error) {
      console.error(`${provider}ログイン例外:`, error);
      setError(`${getProviderDisplayName(provider)}ログイン中にエラーが発生しました。`);
    } finally {
      setSocialLoading(null);
    }
  };

  // プロバイダー表示名（GitHubを除外）
  const getProviderDisplayName = (provider: string): string => {
    const names: Record<string, string> = {
      'google': 'Google',
      'azure-ad': 'Microsoft'
    };
    return names[provider] || provider;
  };

  // デモアカウントログイン強化
  const handleDemoLogin = async (demoEmail: string, demoPassword: string, role: string): Promise<void> => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError(null);

    try {
      console.log(`デモアカウントログイン開始: ${role}`, {
        email: demoEmail,
        role,
        timestamp: new Date().toISOString()
      });

      const result = await login(demoEmail, demoPassword);
      
      if (result.success) {
        console.log(`デモアカウント(${role})ログイン成功`);
        router.push('/dashboard');
      } else if (result.requiresTwoFactor && result.userId) {
        setTwoFactorData({
          userId: result.userId,
          email: demoEmail,
          requiresTwoFactor: true,
          backupCodesAvailable: true,
          deviceTrusted: false
        });
        setShowTwoFactor(true);
        console.log(`デモアカウント(${role})で2要素認証が必要`);
      } else {
        setError(result.error || `デモアカウント(${role})ログインに失敗しました`);
      }
    } catch (error) {
      console.error(`デモアカウント(${role})ログインエラー:`, error);
      setError('デモアカウントログイン中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 2FA状態リセット
  const resetTwoFactor = (): void => {
    setShowTwoFactor(false);
    setTwoFactorData(null);
    setTwoFactorCode('');
    setIsBackupCode(false);
    setRememberDevice(false);
    setError(null);
    console.log('2要素認証状態をリセット');
  };

  // パスワード強度チェック
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const configs = [
      { label: '非常に弱い', color: 'bg-red-500' },
      { label: '弱い', color: 'bg-orange-500' },
      { label: '普通', color: 'bg-yellow-500' },
      { label: '強い', color: 'bg-blue-500' },
      { label: '非常に強い', color: 'bg-green-500' }
    ];

    return { strength, ...configs[Math.min(strength, 4)] };
  };

  // 認証チェック中の表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center" data-testid="loading-screen">
        <EnterpriseCard variant="elevated" className="p-8 text-center max-w-md">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <LoadingSpinner size="lg" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">認証状態確認中</h3>
              <p className="text-gray-600">セキュアな接続を確立しています</p>
            </div>
            <SecurityBadge type="secure">
              <Shield className="h-3 w-3 mr-1" />
              エンタープライズセキュリティ
            </SecurityBadge>
          </div>
        </EnterpriseCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" data-testid="login-page">
      {/* ヘッダー */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LinkSense</h1>
                <p className="text-xs text-gray-600">エンタープライズチーム健全性分析</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <SecurityBadge type="enterprise">
                <Shield className="h-3 w-3 mr-1" />
                SOC2準拠
              </SecurityBadge>
              <SecurityBadge type="secure">
                <Lock className="h-3 w-3 mr-1" />
                256bit暗号化
              </SecurityBadge>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-32">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="login-title">
              {showTwoFactor ? 'セキュリティ認証' : 'セキュアログイン'}
            </h2>
            <p className="text-gray-600" data-testid="login-subtitle">
              {showTwoFactor 
                ? '2要素認証でアカウントを保護しています' 
                : '統合ワークスペース分析プラットフォームにアクセス'
              }
            </p>
            {!showTwoFactor && (
              <div className="flex items-center justify-center space-x-4 mt-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Globe className="h-4 w-4 mr-1" />
                  8プラットフォーム統合
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  リアルタイム分析
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <EnterpriseCard variant={showTwoFactor ? 'security' : 'elevated'} data-testid="login-form-container">
            <div className="px-8 py-10">
              {/* 成功メッセージ */}
              {verified === 'true' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="success-message-verified">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                    <div>
                      <h3 className="text-sm font-semibold text-green-800 mb-1">
                        メールアドレス認証完了
                      </h3>
                      <p className="text-sm text-green-700">
                        アカウントの認証が正常に完了しました。セキュアログインを実行してください。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {reset === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="success-message-reset">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                    <div>
                      <h3 className="text-sm font-semibold text-green-800 mb-1">
                        パスワードリセット完了
                      </h3>
                      <p className="text-sm text-green-700">
                        新しいパスワードが設定されました。セキュアログインを実行してください。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {sessionExpired === 'true' && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-amber-500 mt-0.5 mr-3" />
                    <div>
                      <h3 className="text-sm font-semibold text-amber-800 mb-1">
                        セッション期限切れ
                      </h3>
                      <p className="text-sm text-amber-700">
                        セキュリティのため自動ログアウトされました。再度ログインしてください。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* エラーメッセージ */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="error-message">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-800 mb-1">
                        {showTwoFactor ? 'セキュリティ認証エラー' : 'ログインエラー'}
                      </h3>
                      <p className="text-sm text-red-700">{error}</p>
                      {securityContext.loginAttempts > 0 && !showTwoFactor && (
                        <p className="text-xs text-red-600 mt-2">
                          試行回数: {securityContext.loginAttempts}/{SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!showTwoFactor ? (
                // メインログインフォーム
                <>
                  {/* ソーシャルログイン（GitHubを削除） */}
                  <div className="space-y-3 mb-8" data-testid="social-login-section">
                    <div className="text-center mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">エンタープライズSSO</h3>
                      <p className="text-xs text-gray-500">組織のアイデンティティプロバイダーでログイン</p>
                    </div>

                    {[
                      { 
                        provider: 'google' as const, 
                        name: 'Google Workspace', 
                        icon: (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        )
                      },
                      { 
                        provider: 'azure-ad' as const, 
                        name: 'Microsoft 365', 
                        icon: (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#F25022" d="M0 0h11.377v11.372H0z"/>
                            <path fill="#7FBA00" d="M12.623 0H24v11.372H12.623z"/>
                            <path fill="#00A4EF" d="M0 12.628h11.377V24H0z"/>
                            <path fill="#FFB900" d="M12.623 12.628H24V24H12.623z"/>
                          </svg>
                        )
                      }
                    ].map(({ provider, name, icon }) => (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => handleSocialLogin(provider)}
                        disabled={loading || socialLoading !== null}
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        data-testid={`${provider}-login-button`}
                      >
                        {socialLoading === provider ? (
                          <LoadingSpinner size="sm" color="text-gray-600" />
                        ) : (
                          icon
                        )}
                        <span className="ml-3">
                          {socialLoading === provider ? `${name}で認証中...` : `${name}でログイン`}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* 区切り線 */}
                  <div className="relative mb-8" data-testid="divider-or">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">または認証情報でログイン</span>
                    </div>
                  </div>

                  {/* メールログインフォーム */}
                  <form className="space-y-6" onSubmit={handleSubmit} data-testid="email-login-form">
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        メールアドレス
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
                          placeholder="your@company.com"
                          data-testid="email-input"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <Fingerprint className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                        パスワード
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
                          placeholder="パスワードを入力"
                          data-testid="password-input"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {password && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">パスワード強度:</span>
                            <span className={`font-medium ${getPasswordStrength(password).strength >= 3 ? 'text-green-600' : 'text-amber-600'}`}>
                              {getPasswordStrength(password).label}
                            </span>
                          </div>
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${getPasswordStrength(password).color}`}
                              style={{ width: `${(getPasswordStrength(password).strength / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <a 
                          href="/reset-password" 
                          className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200" 
                          data-testid="forgot-password-link"
                        >
                          パスワードを忘れた方
                        </a>
                      </div>
                      <div className="text-sm">
                        <a 
                          href="/security" 
                          className="font-medium text-gray-600 hover:text-gray-500 transition-colors duration-200"
                        >
                          セキュリティ設定
                        </a>
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={loading || socialLoading !== null || securityContext.isLocked}
                        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all duration-200 ${
                          loading || socialLoading !== null || securityContext.isLocked
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl'
                        }`}
                        data-testid="email-login-submit-button"
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="sm" color="text-white" />
                            <span className="ml-2">セキュア認証中...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-5 w-5 mr-2" />
                            セキュアログイン
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* デモアカウント */}
                  <div className="mt-8" data-testid="demo-accounts-section">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500 font-medium">デモアカウント体験</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { email: 'demo@company.com', password: 'demo123', role: 'デモユーザー', icon: Users, description: '基本機能を体験' },
                        { email: 'admin@company.com', password: 'admin123', role: '管理者', icon: Settings, description: '管理機能を体験' },
                        { email: 'manager@company.com', password: 'manager123', role: 'マネージャー', icon: Building2, description: 'チーム管理を体験' }
                      ].map(({ email, password, role, icon: Icon, description }) => (
                        <button
                          key={email}
                          type="button"
                          onClick={() => handleDemoLogin(email, password, role)}
                          disabled={loading || socialLoading !== null}
                          className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          data-testid={`demo-${role.toLowerCase()}-login-button`}
                        >
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mr-3">
                              <Icon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-medium text-gray-900">{role}</div>
                              <div className="text-xs text-gray-500">{description}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">{email}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
                        <div className="text-xs text-blue-700">
                          <p className="font-medium mb-1">デモアカウントについて</p>
                          <p>実際のワークスペースデータを模擬した環境で、LinkSenseの全機能をお試しいただけます。</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600">
                      アカウントをお持ちでない方は{' '}
                      <a 
                        href="/register" 
                        className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200" 
                        data-testid="register-link"
                      >
                        新規登録
                      </a>
                    </p>
                  </div>
                </>
              ) : (
                // 2FA認証フォーム
                <div className="space-y-6" data-testid="two-factor-form">
                  <div className="text-center">
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <KeyRound className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">2要素認証</h3>
                    <p className="text-sm text-gray-600 mb-4" data-testid="two-factor-email-display">
                      {twoFactorData?.email} でログイン中
                    </p>
                    <SecurityBadge type="secure">
                      <Shield className="h-3 w-3 mr-1" />
                      アカウント保護中
                    </SecurityBadge>
                  </div>

                  <form onSubmit={handleTwoFactorSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="twoFactorCode" className="block text-sm font-semibold text-gray-700 mb-2">
                          {isBackupCode ? 'バックアップコード' : '認証コード'}
                        </label>
                        <div className="relative">
                          <input
                            id="twoFactorCode"
                            name="twoFactorCode"
                            type="text"
                            required
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest font-mono"
                            placeholder={isBackupCode ? 'バックアップコード' : '000000'}
                            maxLength={isBackupCode ? 10 : 6}
                            data-testid="two-factor-code-input"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <Smartphone className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {!isBackupCode && (
                        <div className="flex items-center">
                          <input
                            id="rememberDevice"
                            name="rememberDevice"
                            type="checkbox"
                            checked={rememberDevice}
                            onChange={(e) => setRememberDevice(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="rememberDevice" className="ml-2 block text-sm text-gray-700">
                            このデバイスを30日間信頼する
                          </label>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setIsBackupCode(!isBackupCode)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                          data-testid="toggle-backup-code-button"
                        >
                          {isBackupCode ? (
                            <>
                              <Smartphone className="h-4 w-4 inline mr-1" />
                              認証アプリを使用
                            </>
                          ) : (
                            <>
                              <KeyRound className="h-4 w-4 inline mr-1" />
                              バックアップコードを使用
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !twoFactorCode.trim()}
                        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all duration-200 ${
                          loading || !twoFactorCode.trim()
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg hover:shadow-xl'
                        }`}
                        data-testid="two-factor-submit-button"
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="sm" color="text-white" />
                            <span className="ml-2">認証中...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-5 w-5 mr-2" />
                            セキュリティ認証
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={resetTwoFactor}
                      className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-500 transition-colors duration-200"
                      data-testid="two-factor-back-button"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      ログイン画面に戻る
                    </button>
                  </div>

                  {/* 2FAヘルプ */}
                  <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">認証アプリについて</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      Google Authenticator、Microsoft Authenticator、Authyなどの認証アプリで生成された6桁のコードを入力してください。
                    </p>
                    <p className="text-xs text-gray-500">
                      認証アプリにアクセスできない場合は、バックアップコードをご利用ください。
                    </p>
                  </div>
                </div>
              )}
            </div>
          </EnterpriseCard>
        </div>

        {/* セキュリティ情報フッター */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
            <div className="flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              SOC2 Type II準拠
            </div>
            <div className="flex items-center">
              <Lock className="h-3 w-3 mr-1" />
              AES-256暗号化
            </div>
            <div className="flex items-center">
              <Globe className="h-3 w-3 mr-1" />
              GDPR対応
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            © 2024 LinkSense. エンタープライズセキュリティでチームを保護
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseLoginPage;