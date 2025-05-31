'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

interface ResetState {
  status: 'idle' | 'resetting' | 'success' | 'error' | 'requesting';
  message: string;
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
  const token = searchParams.get('token');

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return false;
    return true;
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return { text: '弱い', color: 'text-red-500' };
      case 2: return { text: '普通', color: 'text-yellow-500' };
      case 3: return { text: '良い', color: 'text-blue-500' };
      case 4:
      case 5: return { text: '強い', color: 'text-green-500' };
      default: return { text: '', color: '' };
    }
  };

  const requestPasswordReset = async () => {
    if (!email) {
      setResetState({
        status: 'error',
        message: 'メールアドレスを入力してください'
      });
      return;
    }

    setResetState({ status: 'requesting', message: 'パスワードリセットメールを送信しています...' });

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setResetState({
          status: 'success',
          message: 'パスワードリセットメールを送信しました。メールボックスをご確認ください。'
        });
      } else {
        setResetState({
          status: 'error',
          message: data.error || 'メール送信に失敗しました'
        });
      }
    } catch (error) {
      console.error('パスワードリセット要求エラー:', error);
      setResetState({
        status: 'error',
        message: 'サーバーエラーが発生しました。もう一度お試しください。'
      });
    }
  };

  const resetPassword = async () => {
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
        message: 'パスワードは8文字以上で入力してください'
      });
      return;
    }

    setResetState({ status: 'resetting', message: 'パスワードをリセットしています...' });

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setResetState({
          status: 'success',
          message: 'パスワードが正常にリセットされました。ログインページに移動します...'
        });

        setTimeout(() => {
          router.push('/login?reset=success');
        }, 3000);
      } else {
        setResetState({
          status: 'error',
          message: data.error || 'パスワードリセットに失敗しました'
        });
      }
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      setResetState({
        status: 'error',
        message: 'サーバーエラーが発生しました。もう一度お試しください。'
      });
    }
  };

  const getStatusIcon = () => {
    switch (resetState.status) {
      case 'requesting':
      case 'resetting':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
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
      case 'requesting':
      case 'resetting':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthInfo = getPasswordStrengthText(passwordStrength);

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
        </CardHeader>

        <CardContent className="space-y-6">
          {resetState.message && (
            <div className={`text-center ${getStatusColor()}`}>
              <p className="text-sm font-medium">{resetState.message}</p>
            </div>
          )}

          {!token ? (
            // パスワードリセット要求フォーム
            <div className="space-y-4">
              <div className="text-center text-gray-600">
                <p className="text-sm">
                  登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={resetState.status === 'requesting'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <Button
                onClick={requestPasswordReset}
                disabled={resetState.status === 'requesting' || !email}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {resetState.status === 'requesting' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  'パスワードリセットメールを送信'
                )}
              </Button>
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8文字以上で入力してください"
                    disabled={resetState.status === 'resetting'}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="パスワードを再入力してください"
                    disabled={resetState.status === 'resetting'}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  <p className="text-xs text-red-500">パスワードが一致しません</p>
                )}
              </div>

              <Button
                onClick={resetPassword}
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
                  'パスワードをリセット'
                )}
              </Button>
            </div>
          )}

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="text-sm"
            >
              ログインページに戻る
            </Button>
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
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}