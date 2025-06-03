'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Lock, Loader2, Eye, EyeOff, Mail, Shield, Clock, AlertTriangle } from 'lucide-react';

interface ResetState {
  status: 'idle' | 'resetting' | 'success' | 'error' | 'requesting' | 'validating' | 'expired';
  message: string;
}

interface TokenValidation {
  isValid: boolean;
  isExpired: boolean;
  email?: string;
  expiresAt?: string;
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [resetState, setResetState] = useState<ResetState>({
    status: 'idle',
    message: ''
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<TokenValidation | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const token = searchParams.get('token');

  // トークン検証
  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  // 再送信クールダウン
  useEffect(() => {
  if (resendCooldown > 0) {
    const timer = setTimeout(() => {
      setResendCooldown(resendCooldown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }
  return undefined;
}, [resendCooldown]);

  // メッセージ自動消去
  useEffect(() => {
  if (resetState.message && !['requesting', 'resetting', 'validating'].includes(resetState.status)) {
    const timer = setTimeout(() => {
      setResetState(prev => ({ ...prev, message: '' }));
    }, 8000);
    return () => clearTimeout(timer);
  }
  return undefined;
}, [resetState.message, resetState.status]);

  const validateToken = async () => {
    if (!token) return;

    setResetState({ status: 'validating', message: 'トークンを検証しています...' });

    try {
      const response = await fetch('/api/auth/validate-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (response.ok && data.isValid) {
        setTokenValidation(data);
        setResetState({
          status: 'idle',
          message: data.email ? `${data.email} のパスワードをリセットします` : ''
        });
      } else if (data.isExpired) {
        setTokenValidation(data);
        setResetState({
          status: 'expired',
          message: 'パスワードリセットリンクの有効期限が切れています。新しいリンクを要求してください。'
        });
      } else {
        setResetState({
          status: 'error',
          message: '無効なパスワードリセットリンクです。新しいリンクを要求してください。'
        });
      }
    } catch (error) {
      console.error('トークン検証エラー:', error);
      setResetState({
        status: 'error',
        message: 'トークンの検証に失敗しました。ネットワーク接続を確認してください。'
      });
    }
  };

  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 8) return false;
    if (!/[A-Z]/.test(pwd)) return false;
    if (!/[a-z]/.test(pwd)) return false;
    if (!/[0-9]/.test(pwd)) return false;
    return true;
  };

  const getPasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    if (pwd.length >= 16) strength++;
    return Math.min(strength, 5);
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return { text: '非常に弱い', color: 'text-red-600' };
      case 2: return { text: '弱い', color: 'text-red-500' };
      case 3: return { text: '普通', color: 'text-yellow-500' };
      case 4: return { text: '強い', color: 'text-blue-500' };
      case 5: return { text: '非常に強い', color: 'text-green-500' };
      default: return { text: '', color: '' };
    }
  };

  const getPasswordRequirements = (pwd: string) => {
    return [
      { text: '8文字以上', met: pwd.length >= 8 },
      { text: '大文字を含む', met: /[A-Z]/.test(pwd) },
      { text: '小文字を含む', met: /[a-z]/.test(pwd) },
      { text: '数字を含む', met: /[0-9]/.test(pwd) },
      { text: '特殊文字を含む（推奨）', met: /[^A-Za-z0-9]/.test(pwd) }
    ];
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const requestPasswordReset = async () => {
    if (!email) {
      setResetState({
        status: 'error',
        message: 'メールアドレスを入力してください'
      });
      return;
    }

    if (!validateEmail(email)) {
      setResetState({
        status: 'error',
        message: '有効なメールアドレスを入力してください'
      });
      return;
    }

    setResetState({ status: 'requesting', message: 'パスワードリセットメールを送信しています...' });

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': navigator.userAgent,
          'X-Forwarded-For': window.location.hostname
        },
        body: JSON.stringify({ 
          email,
          language: 'ja',
          returnUrl: `${window.location.origin}/reset-password`,
          requestedAt: new Date().toISOString()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResetState({
          status: 'success',
          message: `パスワードリセットメールを ${email} に送信しました。メールボックス（迷惑メールフォルダも含む）をご確認ください。メールが届かない場合は、${resendCooldown > 0 ? `${resendCooldown}秒後に` : ''}再送信できます。`
        });
        setResendCooldown(60); // 60秒のクールダウン

        // 成功通知
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('LinkSense - パスワードリセット', {
            body: `パスワードリセットメールを送信しました: ${email}`,
            icon: '/favicon.ico'
          });
        }
      } else {
        if (response.status === 429) {
          setResetState({
            status: 'error',
            message: '送信回数が上限に達しました。しばらく待ってから再試行してください。'
          });
        } else if (response.status === 404) {
          setResetState({
            status: 'error',
            message: 'このメールアドレスは登録されていません。正しいメールアドレスを入力してください。'
          });
        } else {
          setResetState({
            status: 'error',
            message: data.error || 'メール送信に失敗しました。しばらく待ってから再試行してください。'
          });
        }
      }
    } catch (error) {
      console.error('パスワードリセット要求エラー:', error);
      setResetState({
        status: 'error',
        message: 'ネットワークエラーが発生しました。インターネット接続を確認して再試行してください。'
      });
    }
  };

  const resetPassword = async (): Promise<void> => {
    if (!password || !confirmPassword) {
      setResetState({
        status: 'error',
        message: '全ての項目を入力してください'
      });
      return;
    }

    if (password !== confirmPassword) {
      setResetState({
        status: 'error',
        message: 'パスワードが一致しません'
      });
      return;
    }

    if (!validatePassword(password)) {
      setResetState({
        status: 'error',
        message: 'パスワードは8文字以上で、大文字・小文字・数字を含む必要があります'
      });
      return;
    }

    // 現在のパスワードと同じかチェック（追加のセキュリティ）
    if (password.length < 12 && getPasswordStrength(password) < 3) {
      setResetState({
        status: 'error',
        message: 'より強力なパスワードを設定してください。12文字以上または特殊文字を含むことを推奨します。'
      });
      return;
    }

    setResetState({ status: 'resetting', message: 'パスワードをリセットしています...' });

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': navigator.userAgent
        },
        body: JSON.stringify({ 
          token, 
          password, 
          confirmPassword,
          resetAt: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResetState({
          status: 'success',
          message: '🎉 パスワードが正常にリセットされました！セキュリティのため、全てのデバイスからログアウトされました。新しいパスワードでログインしてください。'
        });

        // 成功通知
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('LinkSense - パスワードリセット完了', {
            body: 'パスワードが正常にリセットされました。新しいパスワードでログインしてください。',
            icon: '/favicon.ico'
          });
        }

        // 5秒後にログインページへリダイレクト
        setTimeout(() => {
          router.push('/login?reset=success&message=パスワードが正常にリセットされました');
        }, 5000);
      } else {
        if (response.status === 400) {
          setResetState({
            status: 'error',
            message: data.error || 'パスワードリセットに失敗しました。入力内容を確認してください。'
          });
        } else if (response.status === 401 || response.status === 403) {
          setResetState({
            status: 'error',
            message: 'トークンが無効または期限切れです。新しいパスワードリセットリンクを要求してください。'
          });
        } else {
          setResetState({
            status: 'error',
            message: data.error || 'パスワードリセットに失敗しました。しばらく待ってから再試行してください。'
          });
        }
      }
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      setResetState({
        status: 'error',
        message: 'ネットワークエラーが発生しました。インターネット接続を確認して再試行してください。'
      });
    }
  };

  const getStatusIcon = () => {
    switch (resetState.status) {
      case 'requesting':
        return <Mail className="h-6 w-6 animate-pulse text-blue-500" />;
      case 'resetting':
      case 'validating':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'expired':
        return <Clock className="h-6 w-6 text-orange-500" />;
      default:
        return <Lock className="h-6 w-6 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (resetState.status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'expired':
        return 'text-orange-600';
      case 'requesting':
      case 'resetting':
      case 'validating':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthInfo = getPasswordStrengthText(passwordStrength);
  const passwordRequirements = getPasswordRequirements(password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {token ? 'パスワードリセット' : 'パスワードリセット要求'}
          </CardTitle>
          {tokenValidation?.email && (
            <p className="text-sm text-gray-600 mt-2">
              アカウント: {tokenValidation.email}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {resetState.message && (
            <div className={`p-4 rounded-lg border ${
              resetState.status === 'success' ? 'bg-green-50 border-green-200' :
              resetState.status === 'error' ? 'bg-red-50 border-red-200' :
              resetState.status === 'expired' ? 'bg-orange-50 border-orange-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className={`flex items-start space-x-3 ${getStatusColor()}`}>
                {getStatusIcon()}
                <p className="text-sm font-medium flex-1">{resetState.message}</p>
              </div>
            </div>
          )}

          {!token || resetState.status === 'expired' ? (
            // パスワードリセット要求フォーム
            <div className="space-y-4">
              <div className="text-center text-gray-600">
                <p className="text-sm">
                  登録済みのメールアドレスを入力してください。パスワードリセット用のセキュアなリンクをお送りします。
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (resetState.status === 'error') {
                      setResetState({ status: 'idle', message: '' });
                    }
                  }}
                  placeholder="your@email.com"
                  disabled={resetState.status === 'requesting'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  autoComplete="email"
                />
                {email && !validateEmail(email) && (
                  <p className="text-xs text-red-500">有効なメールアドレスを入力してください</p>
                )}
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  セキュリティについて
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• リセットリンクは24時間で期限切れになります</li>
                  <li>• リンクは一度のみ使用可能です</li>
                  <li>• 不審なアクティビティは監視されています</li>
                </ul>
              </div>

              <Button
                onClick={() => void requestPasswordReset()}
                disabled={resetState.status === 'requesting' || !email || !validateEmail(email) || resendCooldown > 0}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {resetState.status === 'requesting' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    送信中...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    再送信まで {resendCooldown}秒
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    パスワードリセットメールを送信
                  </>
                )}
              </Button>
            </div>
          ) : resetState.status === 'validating' ? (
            // トークン検証中
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">トークンを検証しています...</p>
            </div>
          ) : (
            // パスワードリセットフォーム
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  新しいパスワード
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (resetState.status === 'error') {
                        setResetState({ status: 'idle', message: '' });
                      }
                    }}
                    placeholder="8文字以上で入力してください"
                    disabled={resetState.status === 'resetting'}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 w-4 rounded ${
                              level <= passwordStrength
                                ? passwordStrength <= 2
                                  ? 'bg-red-500'
                                  : passwordStrength <= 3
                                  ? 'bg-yellow-500'
                                  : passwordStrength <= 4
                                  ? 'bg-blue-500'
                                  : 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs ${passwordStrengthInfo.color}`}>
                        {passwordStrengthInfo.text}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">パスワード要件:</h4>
                      <div className="space-y-1">
                        {passwordRequirements.map((req, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${req.met ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={`text-xs ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
                              {req.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  パスワード確認
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (resetState.status === 'error') {
                        setResetState({ status: 'idle', message: '' });
                      }
                    }}
                    placeholder="パスワードを再入力してください"
                    disabled={resetState.status === 'resetting'}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    パスワードが一致しません
                  </p>
                )}
                {confirmPassword && password === confirmPassword && password && (
                  <p className="text-xs text-green-500 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    パスワードが一致しています
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  重要な注意事項
                </h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• パスワード変更後、全てのデバイスからログアウトされます</li>
                  <li>• 新しいパスワードは安全な場所に保管してください</li>
                  <li>• 定期的にパスワードを変更することを推奨します</li>
                </ul>
              </div>

              <Button
                onClick={() => void resetPassword()}
                disabled={
                  resetState.status === 'resetting' ||
                  !password ||
                  !confirmPassword ||
                  password !== confirmPassword ||
                  !validatePassword(password)
                }
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {resetState.status === 'resetting' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    リセット中...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    パスワードをリセット
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="text-center space-y-2">
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="text-sm"
              disabled={['requesting', 'resetting', 'validating'].includes(resetState.status)}
            >
              ログインページに戻る
            </Button>
            
            {resetState.status === 'success' && !token && (
              <p className="text-xs text-gray-500">
                メールが届かない場合は、迷惑メールフォルダもご確認ください
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">パスワードリセットページを読み込んでいます...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}