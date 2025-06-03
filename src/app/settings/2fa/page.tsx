'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Shield, Copy, Download, Eye, EyeOff, Loader2, Smartphone, Key, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface TwoFAState {
  status: 'idle' | 'loading' | 'setup' | 'enabling' | 'enabled' | 'disabling' | 'error' | 'qr-error' | 'regenerating';
  message: string;
}

interface SetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  manualEntryKey: string;
  issuer: string;
  accountName: string;
}

export default function TwoFactorAuthPage() {
  const { user, isAuthenticated } = useAuth();
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
  const [currentStep, setCurrentStep] = useState(1);
  const [qrCodeRetryCount, setQrCodeRetryCount] = useState(0);
  const [isQrCodeLoaded, setIsQrCodeLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // 2FA状態の初期確認
    checkTwoFAStatus();
  }, [isAuthenticated, router]);

  // メッセージ自動消去
  useEffect(() => {
  if (twoFAState.message && !['loading', 'enabling', 'disabling', 'regenerating'].includes(twoFAState.status)) {
    const timer = setTimeout(() => {
      setTwoFAState(prev => ({ ...prev, message: '' }));
    }, 5000);
    return () => clearTimeout(timer);
  }
  return undefined;
}, [twoFAState.message, twoFAState.status]);

  const checkTwoFAStatus = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/2fa/status', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsEnabled(data.enabled || false);
      }
    } catch (error) {
      console.error('2FA状態確認エラー:', error);
    }
  };

  const generateQRCode = async (retryAttempt = 0): Promise<void> => {
    try {
      const accountName = user?.email || 'user@linksense.app';
      const issuer = 'LinkSense';
      
      // より確実なQRコード生成のための詳細パラメータ
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          accountName,
          issuer,
          retryAttempt,
          qrCodeSize: 256,
          errorCorrectionLevel: 'M'
        })
      });

      const data = await response.json();

      if (response.ok && data.qrCode) {
        // QRコードの有効性を検証
        const isValidQR = await validateQRCode(data.qrCode);
        if (isValidQR) {
          setSetupData({
            ...data,
            accountName,
            issuer
          });
          setIsQrCodeLoaded(true);
          setTwoFAState({ status: 'setup', message: '' });
          setCurrentStep(1);
          return;
        } else {
          throw new Error('QRコードの検証に失敗しました');
        }
      } else {
        throw new Error(data.error || 'QRコード生成に失敗しました');
      }
    } catch (error) {
      console.error('QRコード生成エラー:', error);
      
      if (retryAttempt < 3) {
        setQrCodeRetryCount(retryAttempt + 1);
        setTwoFAState({ 
          status: 'regenerating', 
          message: `QRコードを再生成しています... (${retryAttempt + 1}/3)` 
        });
        
        // 指数バックオフで再試行
        setTimeout(() => {
          void generateQRCode(retryAttempt + 1);
        }, Math.pow(2, retryAttempt) * 1000);
        return;
      }
      
      setTwoFAState({
        status: 'qr-error',
        message: 'QRコードの生成に失敗しました。手動入力をご利用ください。'
      });
      setShowManualEntry(true);
    }
  };

  const validateQRCode = async (qrCodeDataUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // QRコードが適切なサイズと形式かチェック
        const isValid = img.width > 0 && img.height > 0 && 
                       qrCodeDataUrl.startsWith('data:image/') &&
                       qrCodeDataUrl.includes('otpauth://totp/');
        resolve(isValid);
      };
      img.onerror = () => resolve(false);
      img.src = qrCodeDataUrl;
    });
  };

  const startSetup = async (): Promise<void> => {
    setTwoFAState({ status: 'loading', message: '2FA設定を準備しています...' });
    setQrCodeRetryCount(0);
    setIsQrCodeLoaded(false);
    
    await generateQRCode();
  };

  const regenerateQRCode = async (): Promise<void> => {
    setTwoFAState({ status: 'regenerating', message: 'QRコードを再生成しています...' });
    setIsQrCodeLoaded(false);
    await generateQRCode();
  };

  const enableTwoFA = async (): Promise<void> => {
    if (!setupData || !verificationCode) {
      setTwoFAState({
        status: 'error',
        message: '6桁の認証コードを入力してください'
      });
      return;
    }

    if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
      setTwoFAState({
        status: 'error',
        message: '認証コードは6桁の数字である必要があります'
      });
      return;
    }

    setTwoFAState({ status: 'enabling', message: '2FAを有効化しています...' });

    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          secret: setupData.secret,
          token: verificationCode,
          accountName: setupData.accountName,
          issuer: setupData.issuer
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsEnabled(true);
        setCurrentStep(3);
        setTwoFAState({
          status: 'enabled',
          message: '🎉 2要素認証が正常に有効になりました！'
        });
        setShowBackupCodes(true);
        
        // 成功を示すブラウザ通知
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('LinkSense - 2FA有効化完了', {
            body: '2要素認証が正常に設定されました。バックアップコードを安全に保管してください。',
            icon: '/favicon.ico'
          });
        }
      } else {
        setTwoFAState({
          status: 'error',
          message: data.error || '認証コードが正しくありません。認証アプリで最新のコードを確認してください。'
        });
      }
    } catch (error) {
      console.error('2FA有効化エラー:', error);
      setTwoFAState({
        status: 'error',
        message: 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
      });
    }
  };

  const disableTwoFA = async (): Promise<void> => {
    const code = useBackupCode ? backupCode : verificationCode;
    
    if (!code) {
      setTwoFAState({
        status: 'error',
        message: useBackupCode ? 'バックアップコードを入力してください' : '6桁の認証コードを入力してください'
      });
      return;
    }

    if (!useBackupCode && (code.length !== 6 || !/^\d{6}$/.test(code))) {
      setTwoFAState({
        status: 'error',
        message: '認証コードは6桁の数字である必要があります'
      });
      return;
    }

    setTwoFAState({ status: 'disabling', message: '2FAを無効化しています...' });

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(useBackupCode ? { backupCode: code } : { token: code })
      });

      const data = await response.json();

      if (response.ok) {
        setIsEnabled(false);
        setSetupData(null);
        setVerificationCode('');
        setBackupCode('');
        setShowBackupCodes(false);
        setCurrentStep(1);
        setTwoFAState({
          status: 'idle',
          message: '2要素認証が無効になりました'
        });
      } else {
        setTwoFAState({
          status: 'error',
          message: data.error || '認証に失敗しました。コードを確認してください。'
        });
      }
    } catch (error) {
      console.error('2FA無効化エラー:', error);
      setTwoFAState({
        status: 'error',
        message: 'ネットワークエラーが発生しました'
      });
    }
  };

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setTwoFAState({
        ...twoFAState,
        message: '📋 クリップボードにコピーしました'
      });
    } catch (error) {
      console.error('クリップボードエラー:', error);
      setTwoFAState({
        ...twoFAState,
        message: 'コピーに失敗しました。手動で選択してコピーしてください。'
      });
    }
  };

  const downloadBackupCodes = (): void => {
    if (!setupData) return;

    const content = `LinkSense 2要素認証 バックアップコード

=================================================
重要：このファイルは安全な場所に保管してください
=================================================

アカウント: ${setupData.accountName}
生成日時: ${new Date().toLocaleString('ja-JP')}

バックアップコード:
${setupData.backupCodes.map((code, index) => `${String(index + 1).padStart(2, '0')}. ${code}`).join('\n')}

=================================================
注意事項:
=================================================
• これらのコードは認証アプリが利用できない場合の緊急用です
• 各コードは一度使用すると無効になります
• 第三者に知られないよう安全に保管してください
• コードを使用した場合は、新しいバックアップコードを生成することをお勧めします

LinkSense - リモートワーク特化型チーム健全性分析SaaS
https://linksense-mvp.vercel.app
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linksense-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTwoFAState({
      ...twoFAState,
      message: '💾 バックアップコードがダウンロードされました'
    });
  };

  const getStatusIcon = () => {
    switch (twoFAState.status) {
      case 'loading':
      case 'enabling':
      case 'disabling':
      case 'regenerating':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      case 'enabled':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
      case 'qr-error':
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
      case 'qr-error':
        return 'text-red-600';
      case 'loading':
      case 'enabling':
      case 'disabling':
      case 'regenerating':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressSteps = () => {
    const steps = [
      { number: 1, title: 'QRコードスキャン', completed: currentStep > 1 },
      { number: 2, title: '認証コード入力', completed: currentStep > 2 },
      { number: 3, title: 'バックアップコード保存', completed: isEnabled }
    ];
    return steps;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">認証状態を確認しています...</p>
        </div>
      </div>
    );
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
          {user?.email && (
            <p className="mt-1 text-sm text-gray-500">
              アカウント: {user.email}
            </p>
          )}
        </div>

        {/* プログレスステップ */}
        {setupData && !isEnabled && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {getProgressSteps().map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      step.completed ? 'bg-green-500 text-white' : 
                      currentStep === step.number ? 'bg-blue-500 text-white' : 
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {step.completed ? <CheckCircle className="h-4 w-4" /> : step.number}
                    </div>
                    <span className={`ml-2 text-sm ${
                      step.completed || currentStep === step.number ? 'font-medium' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                    {index < getProgressSteps().length - 1 && (
                      <div className={`mx-4 h-0.5 w-12 ${
                        step.completed ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <Smartphone className="mr-2 h-4 w-4" />
                  2要素認証とは？
                </h3>
                <p className="text-blue-800 text-sm">
                  パスワードに加えて、スマートフォンの認証アプリで生成される6桁のコードを入力することで、
                  アカウントのセキュリティを大幅に向上させることができます。
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium flex items-center">
                  <Key className="mr-2 h-4 w-4" />
                  必要なもの:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <Smartphone className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm font-medium">スマートフォン</p>
                    <p className="text-xs text-gray-600">またはタブレット</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <Key className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium">認証アプリ</p>
                    <p className="text-xs text-gray-600">Google Authenticator等</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <Shield className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <p className="text-sm font-medium">安全な保管場所</p>
                    <p className="text-xs text-gray-600">バックアップコード用</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">推奨認証アプリ</h4>
                    <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                      <li>• Google Authenticator (無料)</li>
                      <li>• Microsoft Authenticator (無料)</li>
                      <li>• Authy (無料・バックアップ機能付き)</li>
                      <li>• 1Password (有料・統合管理)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => void startSetup()}
                disabled={false}
                className="w-full"
                size="lg"
              >
                <Shield className="mr-2 h-4 w-4" />
                2要素認証を設定する
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ローディング状態の表示 */}
        {!isEnabled && ['loading', 'regenerating'].includes(twoFAState.status) && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">{twoFAState.message}</p>
                {twoFAState.status === 'regenerating' && (
                  <p className="text-sm text-gray-500 mt-2">
                    より確実なQRコードを生成しています...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* セットアップフェーズ - QRコードと認証コード入力 */}
        {setupData && ['setup', 'qr-error'].includes(twoFAState.status) && !isEnabled && (
          <div className="space-y-6">
            {/* QRコード */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>ステップ 1: QRコードをスキャン</span>
                  {twoFAState.status !== 'qr-error' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void regenerateQRCode()}
                      disabled={twoFAState.status === 'regenerating'}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      再生成
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {twoFAState.status === 'qr-error' ? (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <h3 className="font-medium text-red-800">QRコード生成エラー</h3>
                    </div>
                    <p className="text-red-700 text-sm mb-3">
                      QRコードの生成に失敗しました。以下の手動入力キーをご利用ください。
                    </p>
                    <Button
                      onClick={() => void regenerateQRCode()}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      QRコードを再試行
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white rounded-lg shadow-sm border">
                      {isQrCodeLoaded ? (
                        <img 
                          src={setupData.qrCode} 
                          alt="2FA QR Code"
                          className="mx-auto"
                          style={{ width: '256px', height: '256px' }}
                          onError={() => {
                            setIsQrCodeLoaded(false);
                            setTwoFAState({
                              status: 'qr-error',
                              message: 'QRコードの読み込みに失敗しました'
                            });
                          }}
                        />
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      認証アプリでこのQRコードをスキャンしてください
                    </p>
                  </div>
                )}
                
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
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="text-sm font-medium mb-3 flex items-center">
                      <Key className="mr-2 h-4 w-4" />
                      手動入力用情報:
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-600">アカウント名:</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="bg-white px-2 py-1 rounded text-sm font-mono flex-1 border">
                            {setupData.accountName}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void copyToClipboard(setupData.accountName)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-600">発行者:</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="bg-white px-2 py-1 rounded text-sm font-mono flex-1 border">
                            {setupData.issuer}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void copyToClipboard(setupData.issuer)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-600">秘密キー:</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="bg-white px-2 py-1 rounded text-sm font-mono flex-1 border break-all">
                            {setupData.manualEntryKey}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void copyToClipboard(setupData.manualEntryKey)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-800">
                          <strong>手動設定手順:</strong><br />
                        1. 認証アプリで「手動入力」または「キーを入力」を選択<br />
                        2. アカウント名と発行者を入力<br />
                        3. 秘密キーを正確に入力（スペースは無視してください）<br />
                        4. 時間ベース（TOTP）を選択して保存
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!isQrCodeLoaded && twoFAState.status !== 'qr-error'}
                    className="mt-4"
                  >
                    次のステップへ進む
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 認証コード入力 */}
            {currentStep >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>ステップ 2: 認証コードを入力</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      認証アプリの設定が完了しましたか？
                    </h4>
                    <p className="text-green-700 text-sm">
                      認証アプリに表示される6桁のコードを入力して設定を完了してください。
                      コードは30秒ごとに更新されます。
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="verification-code" className="text-sm font-medium">
                      認証アプリに表示される6桁のコード
                    </label>
                    <input
                      id="verification-code"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                        // エラーメッセージをクリア
                        if (twoFAState.status === 'error') {
                          setTwoFAState({ status: 'setup', message: '' });
                        }
                      }}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoComplete="off"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      コードが表示されない場合は、認証アプリの設定を確認してください
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      className="flex-1"
                    >
                      前のステップに戻る
                    </Button>
                    <Button
                      onClick={() => void enableTwoFA()}
                      disabled={verificationCode.length !== 6 || twoFAState.status === 'enabling'}
                      className="flex-1"
                    >
                      {twoFAState.status === 'enabling' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          有効化中...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          2要素認証を有効にする
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 有効化処理中の表示 */}
        {twoFAState.status === 'enabling' && !isEnabled && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">2要素認証を有効化しています...</p>
                <p className="text-sm text-gray-500 mt-2">
                  認証コードを検証しています。しばらくお待ちください。
                </p>
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
                <h3 className="font-semibold text-yellow-800 mb-2 flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  重要：バックアップコードを保存してください
                </h3>
                <p className="text-yellow-700 text-sm">
                  認証アプリが利用できない場合の緊急用コードです。安全な場所に保管してください。
                  各コードは一度のみ使用可能です。
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-3 text-center">バックアップコード</h4>
                <div className="grid grid-cols-2 gap-2">
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded text-center font-mono text-sm border hover:bg-gray-100 transition-colors">
                      <span className="text-xs text-gray-500 block">{String(index + 1).padStart(2, '0')}</span>
                      <span className="font-medium">{code}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => void copyToClipboard(setupData.backupCodes.join('\n'))}
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  全てコピー
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadBackupCodes}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  ファイル保存
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">保管に関する推奨事項</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• パスワードマネージャーに保存</li>
                  <li>• 印刷して金庫や安全な場所に保管</li>
                  <li>• デジタルファイルは暗号化して保存</li>
                  <li>• 複数の場所にバックアップを作成</li>
                  <li>• 家族や信頼できる人と共有（必要に応じて）</li>
                </ul>
              </div>

              <Button
                onClick={() => {
                  setShowBackupCodes(false);
                  setTwoFAState({
                    status: 'enabled',
                    message: '🎉 2要素認証の設定が完了しました！アカウントのセキュリティが向上しました。'
                  });
                }}
                className="w-full"
                size="lg"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                設定を完了する
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 2FA有効時の管理画面 */}
        {isEnabled && !showBackupCodes && !['disabling', 'loading', 'regenerating'].includes(twoFAState.status) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">
                <Shield className="inline mr-2 h-5 w-5" />
                2要素認証が有効です
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-800">アカウントが保護されています</h3>
                    <p className="text-green-700 text-sm mt-1">
                      アカウントは2要素認証で保護されています。ログイン時にはパスワードに加えて認証コードの入力が必要です。
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">セキュリティステータス</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✅ 2要素認証: 有効</li>
                    <li>✅ バックアップコード: 生成済み</li>
                    <li>✅ 認証アプリ: 連携済み</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">次のステップ</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• バックアップコードの安全な保管</li>
                    <li>• 定期的なアクセスログの確認</li>
                    <li>• パスワードの定期的な更新</li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 text-red-600 flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  2要素認証を無効にする
                </h3>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
                  <p className="text-red-800 text-sm">
                    <strong>警告:</strong> 2要素認証を無効にすると、アカウントのセキュリティが低下します。
                    本当に必要な場合のみ無効にしてください。
                  </p>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  2要素認証を無効にするには、認証アプリのコードまたはバックアップコードを入力してください。
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="use-app"
                        checked={!useBackupCode}
                        onChange={() => {
                          setUseBackupCode(false);
                          setBackupCode('');
                          setVerificationCode('');
                        }}
                        className="text-blue-600"
                      />
                      <label htmlFor="use-app" className="ml-2 text-sm">認証アプリのコード</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="use-backup"
                        checked={useBackupCode}
                        onChange={() => {
                          setUseBackupCode(true);
                          setVerificationCode('');
                          setBackupCode('');
                        }}
                        className="text-blue-600"
                      />
                      <label htmlFor="use-backup" className="ml-2 text-sm">バックアップコード</label>
                    </div>
                  </div>

                  {useBackupCode ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">バックアップコード</label>
                      <input
                        type="text"
                        value={backupCode}
                        onChange={(e) => {
                          setBackupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                          if (twoFAState.status === 'error') {
                            setTwoFAState({ status: 'enabled', message: '' });
                          }
                        }}
                        placeholder="XXXXXXXX"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono tracking-wider"
                      />
                      <p className="text-xs text-gray-500">
                        8文字のバックアップコードを入力してください
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">認証コード</label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setVerificationCode(value);
                          if (twoFAState.status === 'error') {
                            setTwoFAState({ status: 'enabled', message: '' });
                          }
                        }}
                        placeholder="123456"
                        maxLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-center font-mono tracking-widest"
                      />
                      <p className="text-xs text-gray-500">
                        認証アプリに表示される6桁のコードを入力してください
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => void disableTwoFA()}
                    disabled={
                      (!useBackupCode && verificationCode.length !== 6) || 
                      (useBackupCode && backupCode.length < 8) ||
                      twoFAState.status === 'disabling'
                    }
                    variant="destructive"
                    className="w-full"
                  >
                    {twoFAState.status === 'disabling' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        無効化中...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        2要素認証を無効にする
                      </>
                    )}
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
                <p className="text-sm text-gray-500 mt-2">
                  認証を検証しています。しばらくお待ちください。
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 戻るボタン */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => router.push('/settings')}
            disabled={['loading', 'enabling', 'disabling', 'regenerating'].includes(twoFAState.status)}
          >
            設定ページに戻る
          </Button>
        </div>
      </div>
    </div>
  );
}