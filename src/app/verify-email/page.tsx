'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Mail, Loader2 } from 'lucide-react';

interface VerificationState {
  status: 'idle' | 'verifying' | 'success' | 'error' | 'resending';
  message: string;
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verificationState, setVerificationState] = useState<VerificationState>({
    status: 'idle',
    message: ''
  });
  const [email, setEmail] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setVerificationState({ status: 'verifying', message: 'メールアドレスを認証しています...' });

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken })
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationState({
          status: 'success',
          message: 'メールアドレスの認証が完了しました！ログインページに移動します...'
        });

        setTimeout(() => {
          router.push('/login?verified=true');
        }, 3000);
      } else {
        setVerificationState({
          status: 'error',
          message: data.error || 'メール認証に失敗しました'
        });
      }
    } catch (error) {
      console.error('メール認証エラー:', error);
      setVerificationState({
        status: 'error',
        message: 'サーバーエラーが発生しました。もう一度お試しください。'
      });
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) {
      setVerificationState({
        status: 'error',
        message: 'メールアドレスを入力してください'
      });
      return;
    }

    setVerificationState({ status: 'resending', message: '認証メールを再送信しています...' });

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationState({
          status: 'success',
          message: '認証メールを再送信しました。メールボックスをご確認ください。'
        });
      } else {
        setVerificationState({
          status: 'error',
          message: data.error || 'メール送信に失敗しました'
        });
      }
    } catch (error) {
      console.error('メール再送信エラー:', error);
      setVerificationState({
        status: 'error',
        message: 'サーバーエラーが発生しました。もう一度お試しください。'
      });
    }
  };

  const getStatusIcon = () => {
    switch (verificationState.status) {
      case 'verifying':
      case 'resending':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Mail className="h-6 w-6 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (verificationState.status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'verifying':
      case 'resending':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            メールアドレス認証
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {verificationState.message && (
            <div className={`text-center ${getStatusColor()}`}>
              <p className="text-sm font-medium">{verificationState.message}</p>
            </div>
          )}

          {!token && (
            <div className="space-y-4">
              <div className="text-center text-gray-600">
                <p className="text-sm">
                  認証メールを再送信するには、メールアドレスを入力してください。
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
                  disabled={verificationState.status === 'resending'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <Button
                onClick={resendVerificationEmail}
                disabled={verificationState.status === 'resending' || !email}
                className="w-full"
              >
                {verificationState.status === 'resending' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    再送信中...
                  </>
                ) : (
                  '認証メールを再送信'
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}