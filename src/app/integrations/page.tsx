'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'connecting';
  healthScore?: number;
  lastSync?: string;
  dataPoints?: number;
  market: 'global' | 'japan' | 'us';
  category: 'chat' | 'video' | 'collaboration' | 'project';
}

const IntegrationsPage = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [marketFilter, setMarketFilter] = useState<string>('all');

  useEffect(() => {
    const fetchIntegrations = async () => {
      setIsLoading(true);
      
      // 日米主要コミュニケーションツール統合
      const mockIntegrations: Integration[] = [
        // グローバル主要ツール
        {
          id: 'slack',
          name: 'Slack',
          description: 'グローバル標準のチームコミュニケーション',
          status: 'connected',
          healthScore: 78,
          lastSync: '2025-05-28T12:00:00Z',
          dataPoints: 1250,
          market: 'global',
          category: 'chat'
        },
        {
          id: 'teams',
          name: 'Microsoft Teams',
          description: 'Microsoft 365統合ビデオ会議・チャット',
          status: 'disconnected',
          market: 'global',
          category: 'video'
        },
        {
          id: 'zoom',
          name: 'Zoom',
          description: 'ビデオ会議・ウェビナープラットフォーム',
          status: 'disconnected',
          market: 'global',
          category: 'video'
        },
        {
          id: 'google-meet',
          name: 'Google Meet',
          description: 'Google Workspace統合ビデオ会議',
          status: 'disconnected',
          market: 'global',
          category: 'video'
        },
        {
          id: 'discord',
          name: 'Discord',
          description: 'ゲーミング・クリエイター向けコミュニケーション',
          status: 'disconnected',
          market: 'global',
          category: 'chat'
        },
        
        // アメリカ主要ツール
        {
          id: 'webex',
          name: 'Cisco Webex',
          description: 'エンタープライズ向けビデオ会議',
          status: 'disconnected',
          market: 'us',
          category: 'video'
        },
        {
          id: 'gotomeeting',
          name: 'GoToMeeting',
          description: 'シンプルなビデオ会議ソリューション',
          status: 'disconnected',
          market: 'us',
          category: 'video'
        },
        {
          id: 'ringcentral',
          name: 'RingCentral',
          description: 'クラウド統合コミュニケーション',
          status: 'disconnected',
          market: 'us',
          category: 'chat'
        },
        {
          id: 'workplace',
          name: 'Workplace from Meta',
          description: 'Facebook風企業向けSNS',
          status: 'disconnected',
          market: 'us',
          category: 'collaboration'
        },
        {
          id: 'mattermost',
          name: 'Mattermost',
          description: 'オープンソース企業チャット',
          status: 'disconnected',
          market: 'us',
          category: 'chat'
        },
        
        // 日本主要ツール
        {
          id: 'chatwork',
          name: 'ChatWork',
          description: '日本企業導入率No.1ビジネスチャット',
          status: 'disconnected',
          market: 'japan',
          category: 'chat'
        },
        {
          id: 'line-works',
          name: 'LINE WORKS',
          description: 'LINEライクなビジネスコミュニケーション',
          status: 'disconnected',
          market: 'japan',
          category: 'chat'
        },
        {
          id: 'cybozu',
          name: 'サイボウズ Office',
          description: '日本企業向けグループウェア',
          status: 'disconnected',
          market: 'japan',
          category: 'collaboration'
        }
      ];

      setTimeout(() => {
        setIntegrations(mockIntegrations);
        setIsLoading(false);
      }, 500);
    };

    fetchIntegrations();
  }, []);

  const filteredIntegrations = integrations.filter(integration => {
    if (marketFilter === 'all') return true;
    return integration.market === marketFilter;
  });

  const handleConnect = async (integration: Integration) => {
    setIntegrations(prev => 
      prev.map(int => 
        int.id === integration.id 
          ? { ...int, status: 'connecting' }
          : int
      )
    );

    if (integration.id === 'slack') {
      window.location.href = '/api/auth/slack';
    } else {
      setTimeout(() => {
        setIntegrations(prev => 
          prev.map(int => 
            int.id === integration.id 
              ? { 
                  ...int, 
                  status: 'connected',
                  healthScore: Math.floor(Math.random() * 30) + 70,
                  lastSync: new Date().toISOString(),
                  dataPoints: Math.floor(Math.random() * 1000) + 500
                }
              : int
          )
        );
      }, 2000);
    }
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(prev => 
      prev.map(int => 
        int.id === integrationId 
          ? { 
              ...int, 
              status: 'disconnected', 
              healthScore: undefined,
              lastSync: undefined, 
              dataPoints: undefined 
            }
          : int
      )
    );
  };

  const showIntegrationDetails = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const totalHealthScore = integrations
    .filter(i => i.healthScore)
    .reduce((sum, i) => sum + (i.healthScore || 0), 0);
  const avgHealthScore = connectedCount > 0 ? Math.round(totalHealthScore / connectedCount) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">グローバル コミュニケーション統合</h1>
          <p className="text-gray-600">日本・アメリカ・グローバル市場の主要ツールと連携</p>
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{connectedCount}</div>
            <div className="text-sm text-gray-600">接続済み</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{avgHealthScore}%</div>
            <div className="text-sm text-gray-600">健全性スコア</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {integrations.reduce((sum, i) => sum + (i.dataPoints || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">データポイント</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{integrations.length}</div>
            <div className="text-sm text-gray-600">対応ツール</div>
          </div>
        </div>

        {/* マーケットフィルター（マーク削除） */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setMarketFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                marketFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              すべて ({integrations.length})
            </button>
            <button
              onClick={() => setMarketFilter('global')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                marketFilter === 'global' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              グローバル ({integrations.filter(i => i.market === 'global').length})
            </button>
            <button
              onClick={() => setMarketFilter('us')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                marketFilter === 'us' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              アメリカ ({integrations.filter(i => i.market === 'us').length})
            </button>
            <button
              onClick={() => setMarketFilter('japan')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                marketFilter === 'japan' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              日本 ({integrations.filter(i => i.market === 'japan').length})
            </button>
          </div>
        </div>

        {/* 統合リスト（マーク表示削除） */}
        <div className="space-y-4">
          {filteredIntegrations.map((integration) => (
            <div key={integration.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                
                {/* 左側：サービス情報（マーク削除） */}
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{integration.name}</h3>
                      <p className="text-gray-600 text-sm">{integration.description}</p>
                    </div>
                    
                    {/* ステータス */}
                    <div className="flex items-center space-x-2">
                      {integration.status === 'connected' && (
                        <span className="flex items-center text-green-600 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          接続済み
                        </span>
                      )}
                      {integration.status === 'connecting' && (
                        <span className="flex items-center text-yellow-600 text-sm">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                          接続中...
                        </span>
                      )}
                      {integration.status === 'disconnected' && (
                        <span className="flex items-center text-gray-400 text-sm">
                          <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                          未接続
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 接続済みの場合の詳細情報 */}
                  {integration.status === 'connected' && (
                    <div className="mt-3 flex items-center space-x-6 text-sm text-gray-600">
                      {integration.healthScore && (
                        <span>健全性: <strong className="text-green-600">{integration.healthScore}%</strong></span>
                      )}
                      {integration.dataPoints && (
                        <span>データ: <strong>{integration.dataPoints.toLocaleString()}</strong>件</span>
                      )}
                      {integration.lastSync && (
                        <span>最終同期: {new Date(integration.lastSync).toLocaleString('ja-JP')}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* 右側：アクションボタン */}
                <div className="flex items-center space-x-3">
                  {integration.status === 'connected' ? (
                    <>
                      <button
                        onClick={() => showIntegrationDetails(integration)}
                        className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        詳細
                      </button>
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="px-3 py-1 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        切断
                      </button>
                    </>
                  ) : integration.status === 'connecting' ? (
                    <button 
                      disabled
                      className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded text-sm cursor-not-allowed"
                    >
                      接続中...
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => showIntegrationDetails(integration)}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        詳細
                      </button>
                      <button
                        onClick={() => handleConnect(integration)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        接続
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 詳細モーダル（マーク削除） */}
        {showDetails && selectedIntegration && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedIntegration.name} 詳細
                  </h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">分析内容</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {selectedIntegration.category === 'chat' && (
                        <>
                          <p>• メッセージ頻度・応答時間の分析</p>
                          <p>• チャンネル/グループ参加率・活性度</p>
                          <p>• 感情分析（ポジティブ/ネガティブ）</p>
                          <p>• 孤立メンバーの検知</p>
                        </>
                      )}
                      {selectedIntegration.category === 'video' && (
                        <>
                          <p>• 会議参加率・発言時間分析</p>
                          <p>• カメラ・マイク利用状況</p>
                          <p>• 会議疲労度指標</p>
                          <p>• エンゲージメント測定</p>
                        </>
                      )}
                      {selectedIntegration.category === 'collaboration' && (
                        <>
                          <p>• ファイル共有・共同編集状況</p>
                          <p>• プロジェクト参加率</p>
                          <p>• コラボレーション活性度</p>
                          <p>• 情報共有パターン</p>
                        </>
                      )}
                      {selectedIntegration.category === 'project' && (
                        <>
                          <p>• タスク完了率・負荷分析</p>
                          <p>• プロジェクト進捗監視</p>
                          <p>• チーム効率性指標</p>
                          <p>• ワークロードバランス</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">市場での位置づけ</h4>
                    <div className="text-sm text-gray-600">
                      {selectedIntegration.market === 'global' && (
                        <p>世界中で広く使用されているグローバル標準ツール。多国籍企業や国際的なチームに最適です。</p>
                      )}
                      {selectedIntegration.market === 'us' && (
                        <p>アメリカ市場で主要なツール。アメリカ進出や現地企業との連携に重要です。</p>
                      )}
                      {selectedIntegration.market === 'japan' && (
                        <p>日本企業での導入実績が豊富。日本の業務スタイルに最適化されています。</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">接続方法</h4>
                    <div className="text-sm text-gray-600">
                      <p>OAuth認証または API トークンを使用して安全に接続します。プライバシーを保護しながら必要な分析データのみを収集します。</p>
                    </div>
                  </div>

                  {selectedIntegration.status === 'disconnected' && (
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          setShowDetails(false);
                          handleConnect(selectedIntegration);
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                      >
                        {selectedIntegration.name} と接続
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsPage;