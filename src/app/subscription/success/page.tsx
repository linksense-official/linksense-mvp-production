// src/app/subscription/success/page.tsx - Suspense対応版
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';

interface SessionDetails {
  sessionId: string;
  customerEmail: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
}

// ローディングコンポーネント
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">決済情報を確認中...</h2>
        <p className="text-gray-600">少々お待ちください</p>
      </div>
    </div>
  );
}

// メインコンポーネント（useSearchParams使用）
function SubscriptionSuccessContent() {
  const [loading, setLoading] = useState(true);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      // セッションIDがない場合はサブスクリプションページにリダイレクト
      router.push('/subscription');
      return;
    }

    if (!isAuthenticated) {
      // 認証されていない場合はログインページにリダイレクト
      router.push('/login');
      return;
    }

    // セッション詳細を取得（オプション）
    fetchSessionDetails();
  }, [sessionId, isAuthenticated, router]);

  const fetchSessionDetails = async () => {
    if (!sessionId) return;

    try {
      // 実際のStripe実装では、セッション詳細を取得するAPIを呼び出し
      // 現在はモックデータで代用
      await new Promise(resolve => setTimeout(resolve, 1500)); // リアルな読み込み時間

      // モックセッション詳細
      const mockSessionDetails: SessionDetails = {
        sessionId,
        customerEmail: user?.email || '',
        planName: 'Professional Plan',
        amount: 2980,
        currency: 'jpy',
        status: 'complete'
      };

      setSessionDetails(mockSessionDetails);
      console.log('✅ Session details retrieved:', mockSessionDetails);
    } catch (err) {
      console.error('❌ Session details retrieval failed:', err);
      setError('決済情報の確認に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.push('/dashboard');
  };

  const handleViewSubscription = () => {
    router.push('/subscription');
  };

  // ローディング状態
  if (loading) {
    return <LoadingFallback />;
  }

  // エラー状態
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          
          <div className="space-y-3">
            <Link 
              href="/subscription"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              サブスクリプション管理へ
            </Link>
            <Link 
              href="/dashboard"
              className="block w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              ダッシュボードへ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 成功状態
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* メインカード */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center relative overflow-hidden">
            {/* 成功装飾 */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
            
            {/* 成功アイコン */}
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce-gentle">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              {/* 成功エフェクト */}
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-4 border-green-200 animate-ping"></div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🎉 お申し込み完了！
            </h1>
            
            <p className="text-lg text-gray-700 mb-2">
              LinkSenseプランへのお申し込み<br />
              ありがとうございます！
            </p>
            
            <p className="text-sm text-gray-500 mb-8">
              すぐにすべての機能をご利用いただけます
            </p>

            {/* セッション詳細 */}
            {sessionDetails && (
              <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-3 text-center">📋 お申し込み詳細</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">プラン:</span>
                    <span className="font-medium text-gray-900">{sessionDetails.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">金額:</span>
                    <span className="font-medium text-gray-900">¥{sessionDetails.amount.toLocaleString()}/月</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">メールアドレス:</span>
                    <span className="font-medium text-gray-900">{sessionDetails.customerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">セッションID:</span>
                    <span className="font-mono text-xs text-gray-600">{sessionDetails.sessionId.substring(0, 20)}...</span>
                  </div>
                </div>
              </div>
            )}

            {/* 次のステップ */}
            <div className="bg-blue-50 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2">📧 次のステップ</h3>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• 確認メールを送信しました</li>
                <li>• 請求書は月末に発行されます</li>
                <li>• いつでもプラン変更・キャンセル可能</li>
                <li>• サポートが必要な場合はお気軽にお問い合わせください</li>
              </ul>
            </div>
            
            {/* アクションボタン */}
            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg transform hover:scale-105"
              >
                📊 ダッシュボードで分析開始
              </button>
              
              <button
                onClick={handleViewSubscription}
                className="w-full border-2 border-blue-600 text-blue-600 py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                ⚙️ サブスクリプション管理
              </button>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Link 
                  href="/members"
                  className="text-center bg-green-50 text-green-700 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                >
                  👥 チーム分析
                </Link>
                <Link 
                  href="/reports"
                  className="text-center bg-purple-50 text-purple-700 py-2 px-4 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                >
                  📈 レポート作成
                </Link>
              </div>
            </div>

            {/* フッター情報 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                ご質問やサポートが必要な場合は<br />
                <a href="mailto:support@linksense.jp" className="text-blue-600 hover:underline">support@linksense.jp</a> までお問い合わせください
              </p>
            </div>
          </div>

          {/* 追加情報カード */}
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">🚀 今すぐ始められること</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-3">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-medium text-gray-900 text-sm">リアルタイム分析</h4>
                <p className="text-xs text-gray-600 mt-1">チーム健全性の即座確認</p>
              </div>
              <div className="p-3">
                <div className="text-2xl mb-2">🤖</div>
                <h4 className="font-medium text-gray-900 text-sm">AI予測レポート</h4>
                <p className="text-xs text-gray-600 mt-1">将来のリスク予測</p>
              </div>
              <div className="p-3">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-medium text-gray-900 text-sm">カスタム設定</h4>
                <p className="text-xs text-gray-600 mt-1">組織に合わせた調整</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// メインエクスポート（Suspense境界で囲む）
export default function SubscriptionSuccess() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}