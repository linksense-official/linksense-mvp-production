'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Shield, Copy, Download, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface TwoFAState {
  status: 'idle' | 'loading' | 'setup' | 'enabling' | 'enabled' | 'disabling' | 'error';
  message: string;
}

interface SetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export default function TwoFactorAuthPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [twoFAState, setTwoFAState] = useState<TwoFAState>({
    status: 'idle',
    message: ''
  });
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const startSetup = async () => {
    setTwoFAState({ status: 'loading', message: '2FA設定を準備しています...' });

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        setSetupData(data);
        setTwoFAState({ status: 'setup', message: '' });
      } else {
        setTwoFAState({
          status: 'error',
          message: data.error || '2FA設定の準備に失敗しました'
        });
      }
    } catch (error) {
      console.error('2FA設定エラー:', error);
      setTwoFAState({
        status: 'error',
        message: 'サーバーエラーが発生しました'
      });
    }
  };

  const enableTwoFA = async () => {
    if (!setupData || !verificationCode) {
      setTwoFAState({
        status: 'error',
        message: '認証コードを入力してください'
      });
      return;
    }

    setTwoFAState({ status: 'enabling', message: '2FAを有効化しています...' });

    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: setupData.secret,
          token: verificationCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsEnabled(true);
        setTwoFAState({
          status: 'enabled',
          message: '2要素認証が有効になりました！'
        });
        setShowBackupCodes(true);
      } else {
        setTwoFAState({
          status: 'error',
          message: data.error || '2FA有効化に失敗しました'
        });
      }
    } catch (error) {
      console.error('2FA有効化エラー:', error);
      setTwoFAState({
        status: 'error',
        message: 'サーバーエラーが発生しました'
      });
    }
  };

  const disableTwoFA = async () => {
    const code = useBackupCode ? backupCode : verificationCode;
    
    if (!code) {
      setTwoFAState({
        status: 'error',
        message: '認証コードまたはバックアップコードを入力してください'
      });
      return;
    }

    setTwoFAState({ status: 'disabling', message: '2FAを無効化しています...' });

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(useBackupCode ? { backupCode: code } : { token: code })
      });

      const data = await response.json();

      if (response.ok) {
        setIsEnabled(false);
        setSetupData(null);
        setVerificationCode('');
        setBackupCode('');
        setTwoFAState({
          status: 'idle',
          message: '2要素認証が無効になりました'
        });
      } else {
        setTwoFAState({
          status: 'error',
          message: data.error || '2FA無効化に失敗しました'
        });
      }
    } catch (error) {
      console.error('2FA無効化エラー:', error);
      setTwoFAState({
        status: 'error',
        message: 'サーバーエラーが発生しました'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setTwoFAState({
      ...twoFAState,
      message: 'クリップボードにコピーしました'
    });
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;

    const content = `LinkSense 2要素認証 バックアップコード

生成日時: ${new Date().toLocaleString('ja-JP')}

以下のバックアップコードを安全な場所に保管してください。
各コードは一度のみ使用可能です。

${setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

注意事項:
- これらのコードは認証アプリが利用できない場合の緊急用です
- 各コードは一度使用すると無効になります
- 第三者に知られないよう安全に保管してください
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'linksense-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = () => {
    switch (twoFAState.status) {
      case 'loading':
      case 'enabling':
      case 'disabling':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      case 'enabled':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Shield className="h-6 w-6 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (twoFAState.status) {
      case 'enabled':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'loading':
      case 'enabling':
      case 'disabling':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">2要素認証設定</h1>
          <p className="mt-2 text-gray-600">
            アカウントのセキュリティを強化するために2要素認証を設定しましょう
          </p>
        </div>

        {/* ステータスメッセージ */}
        {twoFAState.message && (
          <Card>
            <CardContent className="pt-6">
              <div className={`flex items-center space-x-3 ${getStatusColor()}`}>
                {getStatusIcon()}
                <p className="font-medium">{twoFAState.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

           {/* メインコンテンツ - 初期状態 */}
        {!isEnabled && !setupData && (twoFAState.status === 'idle' || twoFAState.status === 'error') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>2要素認証を有効にする</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {twoFAState.status === 'error' && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-red-800 text-sm font-medium">{twoFAState.message}</p>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">2要素認証とは？</h3>
                <p className="text-blue-800 text-sm">
                  パスワードに加えて、スマートフォンの認証アプリで生成される6桁のコードを入力することで、
                  アカウントのセキュリティを大幅に向上させることができます。
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">必要なもの:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Google Authenticator、Authy、1Password等の認証アプリ</li>
                  <li>• スマートフォンまたはタブレット</li>
                </ul>
              </div>

              <Button 
                onClick={startSetup}
                disabled={false}
                className="w-full"
              >
                2要素認証を設定する
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ローディング状態の表示 */}
        {!isEnabled && twoFAState.status === 'loading' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">2FA設定を準備しています...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* セットアップフェーズ - QRコードと認証コード入力 */}
        {setupData && twoFAState.status === 'setup' && !isEnabled && (
          <div className="space-y-6">
            {/* QRコード */}
            <Card>
              <CardHeader>
                <CardTitle>ステップ 1: QRコードをスキャン</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <img 
                    src={setupData.qrCode} 
                    alt="2FA QR Code"
                    className="mx-auto border rounded-lg"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  認証アプリでこのQRコードをスキャンしてください
                </p>
                
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowManualEntry(!showManualEntry)}
                    className="text-sm"
                  >
                    {showManualEntry ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        手動入力キーを隠す
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        手動入力キーを表示
                      </>
                    )}
                  </Button>
                </div>

                {showManualEntry && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">手動入力用キー:</p>
                    <div className="flex items-center space-x-2">
                      <code className="bg-white px-2 py-1 rounded text-sm font-mono flex-1">
                        {setupData.manualEntryKey}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(setupData.manualEntryKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 認証コード入力 */}
            <Card>
              <CardHeader>
                <CardTitle>ステップ 2: 認証コードを入力</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="verification-code" className="text-sm font-medium">
                    認証アプリに表示される6桁のコード
                  </label>
                  <input
                    id="verification-code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Button
                  onClick={enableTwoFA}
                  disabled={verificationCode.length !== 6}
                  className="w-full"
                >
                  2要素認証を有効にする
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 有効化処理中の表示 */}
        {twoFAState.status === 'enabling' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">2要素認証を有効化しています...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* バックアップコード表示 */}
        {setupData && showBackupCodes && twoFAState.status === 'enabled' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">
                <CheckCircle className="inline mr-2 h-5 w-5" />
                設定完了！バックアップコードを保存
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-800 mb-2">重要：バックアップコードを保存してください</h3>
                <p className="text-yellow-700 text-sm">
                  認証アプリが利用できない場合の緊急用コードです。安全な場所に保管してください。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {setupData.backupCodes.map((code, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-center font-mono text-sm">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(setupData.backupCodes.join('\n'))}
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  コピー
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadBackupCodes}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  ダウンロード
                </Button>
              </div>

              <Button
                onClick={() => setShowBackupCodes(false)}
                className="w-full"
              >
                完了
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 2FA有効時の管理画面 */}
        {isEnabled && !showBackupCodes && twoFAState.status !== 'disabling' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">
                <Shield className="inline mr-2 h-5 w-5" />
                2要素認証が有効です
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800 text-sm">
                  アカウントは2要素認証で保護されています。ログイン時にはパスワードに加えて認証コードの入力が必要です。
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">2要素認証を無効にする</h3>
                <p className="text-sm text-gray-600 mb-4">
                  2要素認証を無効にするには、認証アプリのコードまたはバックアップコードを入力してください。
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="radio"
                      id="use-app"
                      checked={!useBackupCode}
                      onChange={() => setUseBackupCode(false)}
                      className="text-blue-600"
                    />
                    <label htmlFor="use-app" className="text-sm">認証アプリのコード</label>
                    
                    <input
                      type="radio"
                      id="use-backup"
                      checked={useBackupCode}
                      onChange={() => setUseBackupCode(true)}
                      className="text-blue-600"
                    />
                    <label htmlFor="use-backup" className="text-sm">バックアップコード</label>
                  </div>

                  {useBackupCode ? (
                    <input
                      type="text"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value)}
                      placeholder="バックアップコードを入力"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6桁のコードを入力"
                      maxLength={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-center font-mono tracking-widest"
                    />
                  )}

                  <Button
                    onClick={disableTwoFA}
                    disabled={(!useBackupCode && verificationCode.length !== 6) || (useBackupCode && !backupCode)}
                    variant="destructive"
                    className="w-full"
                  >
                    2要素認証を無効にする
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 無効化処理中の表示 */}
        {twoFAState.status === 'disabling' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">2要素認証を無効化しています...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 戻るボタン */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => router.push('/settings')}
          >
            設定ページに戻る
          </Button>
        </div>
      </div>
    </div>
  );
}