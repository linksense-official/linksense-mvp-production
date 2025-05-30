// src/components/TeamsTestPanel.tsx
// Microsoft Teams統合テストパネル
// LinkSense MVP Teams統合完全版

'use client';

import React, { useState, useEffect } from 'react';

interface TeamsTestResult {
  status: string;
  healthCheck: {
    overall: 'healthy' | 'warning' | 'error';
    checks: Array<{
      name: string;
      status: 'pass' | 'warn' | 'fail';
      message: string;
    }>;
  };
  oauthValidation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  testOAuthURL: string;
  recommendations: string[];
}

const TeamsTestPanel: React.FC = () => {
  const [testResult, setTestResult] = useState<TeamsTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTeamsTest = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔷 Teams統合テスト開始...');
      
      const response = await fetch('/api/teams/test');
      
      if (!response.ok) {
        throw new Error(`テストAPI呼び出し失敗: ${response.status}`);
      }

      const result = await response.json();
      setTestResult(result);
      
      console.log('✅ Teams統合テスト完了:', result.healthCheck.overall);

    } catch (err) {
      console.error('❌ Teams統合テストエラー:', err);
      setError(err instanceof Error ? err.message : 'テストでエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const openTestOAuthURL = () => {
    if (testResult?.testOAuthURL) {
      window.open(testResult.testOAuthURL, '_blank');
    }
  };

  // コンポーネント初期化時にテスト実行
  useEffect(() => {
    runTeamsTest();
  }, []);

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🔷</span>
          <h3 className="text-lg font-medium text-gray-900">Microsoft Teams統合テスト</h3>
        </div>
        <button
          onClick={runTeamsTest}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            loading
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>テスト中...</span>
            </div>
          ) : (
            '再テスト'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-800">テストエラー</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {testResult && (
        <div className="space-y-4">
          {/* 全体的な健全性状態 */}
          <div className={`p-4 rounded-md border ${
            testResult.healthCheck.overall === 'healthy' 
              ? 'bg-green-50 border-green-200'
              : testResult.healthCheck.overall === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {testResult.healthCheck.overall === 'healthy' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : testResult.healthCheck.overall === 'warning' ? (
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h4 className={`text-sm font-medium ${
                  testResult.healthCheck.overall === 'healthy' 
                    ? 'text-green-800'
                    : testResult.healthCheck.overall === 'warning'
                    ? 'text-yellow-800'
                    : 'text-red-800'
                }`}>
                  Teams統合の状態: {
                    testResult.healthCheck.overall === 'healthy' ? '正常' :
                    testResult.healthCheck.overall === 'warning' ? '警告' : 'エラー'
                  }
                </h4>
              </div>
            </div>
          </div>

          {/* 詳細チェック結果 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-3">詳細チェック結果</h4>
            <div className="space-y-2">
              {testResult.healthCheck.checks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      check.status === 'pass' ? 'bg-green-400' :
                      check.status === 'warn' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700">{check.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{check.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* OAuth設定状態 */}
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">OAuth設定状態</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">設定の有効性:</span>
                <span className={`text-sm font-medium ${
                  testResult.oauthValidation.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {testResult.oauthValidation.isValid ? '有効' : '無効'}
                </span>
              </div>
              
              {testResult.oauthValidation.errors.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-red-600 font-medium">エラー:</span>
                  <ul className="text-xs text-red-600 ml-2">
                    {testResult.oauthValidation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
               {testResult.oauthValidation.warnings.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-yellow-600 font-medium">警告:</span>
                  <ul className="text-xs text-yellow-600 ml-2">
                    {testResult.oauthValidation.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* OAuth認証テスト */}
          <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-purple-900">OAuth認証テスト</h4>
              <button
                onClick={openTestOAuthURL}
                disabled={!testResult.oauthValidation.isValid}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  testResult.oauthValidation.isValid
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
              >
                OAuth認証をテスト
              </button>
            </div>
            <p className="text-xs text-purple-700">
              このボタンをクリックすると、新しいタブでMicrosoft Teams OAuth認証フローが開始されます。
            </p>
          </div>

          {/* 推奨事項 */}
          {testResult.recommendations.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">推奨事項</h4>
              <ul className="space-y-1">
                {testResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamsTestPanel;