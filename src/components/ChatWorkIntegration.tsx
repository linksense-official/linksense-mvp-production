'use client';

import { useState } from 'react';

interface ChatWorkIntegrationProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function ChatWorkIntegration({ onSuccess, onError }: ChatWorkIntegrationProps) {
  const [apiToken, setApiToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async () => {
    if (!apiToken.trim()) {
      onError?.('APIトークンを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/chatwork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiToken: apiToken.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setIsConnected(true);
        setApiToken(''); // セキュリティのためクリア
        onSuccess?.();
      } else {
        onError?.(result.error || 'ChatWork統合に失敗しました');
      }
    } catch (error) {
      onError?.('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/chatwork', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setIsConnected(false);
        onSuccess?.();
      } else {
        onError?.('ChatWork統合の削除に失敗しました');
      }
    } catch (error) {
      onError?.('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">CW</span>
        </div>
        <div>
          <h3 className="font-medium">ChatWork</h3>
          <p className="text-sm text-gray-600">
            {isConnected ? '接続済み' : 'APIトークンで接続'}
          </p>
        </div>
      </div>

      {!isConnected ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              ChatWork APIトークン
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="APIトークンを入力してください"
              className="w-full px-3 py-2 border rounded-md"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              <a 
                href="https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                APIトークンの取得方法
              </a>
            </p>
          </div>
          <button
            onClick={handleConnect}
            disabled={isLoading || !apiToken.trim()}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
          >
            {isLoading ? '接続中...' : 'ChatWorkに接続'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✅ ChatWorkに正常に接続されました
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading ? '削除中...' : '接続を削除'}
          </button>
        </div>
      )}
    </div>
  );
}