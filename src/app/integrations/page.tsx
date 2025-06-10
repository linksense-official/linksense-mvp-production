'use client'

import { useSession, signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Video,
  MessageSquare,
  Users,
  Building2,
  Shield,
  Zap
} from 'lucide-react'

interface ServiceConfig {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  authUrl: string
  isNextAuth: boolean
}

interface Integration {
  id: string
  service: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 🎯 Phase 1対象の4サービスのみ
const services: ServiceConfig[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'チームコミュニケーション分析',
    icon: MessageSquare,
    color: 'bg-purple-600',
    authUrl: '/api/auth/signin/slack',
    isNextAuth: true,
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'ゲーミングコミュニティ分析',
    icon: Users,
    color: 'bg-indigo-600',
    authUrl: '/api/auth/signin/discord',
    isNextAuth: true,
  },
  {
    id: 'azure-ad',
    name: 'Microsoft Teams',
    description: 'ビジネスコラボレーション分析',
    icon: Building2,
    color: 'bg-blue-600',
    authUrl: '/api/auth/signin/azure-ad',
    isNextAuth: true,
  },
  {
    id: 'google',
    name: 'Google Meet',
    description: 'ビデオ会議・カレンダー統合分析',
    icon: Video,
    color: 'bg-red-600',
    authUrl: '/api/auth/signin/google',
    isNextAuth: true,
  }
]

export default function IntegrationsPage() {
  const { data: session, status } = useSession()
  const [connecting, setConnecting] = useState<string | null>(null)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 統合状態を取得
  const fetchIntegrations = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch('/api/integrations/user')
      
      if (!response.ok) {
        throw new Error('統合情報の取得に失敗しました')
      }

      const data = await response.json()
      setIntegrations(data.integrations || [])
      setError(null)
    } catch (error) {
      console.error('統合情報取得エラー:', error)
      setError(error instanceof Error ? error.message : '統合情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // セッション確立時に統合状態を取得
  useEffect(() => {
    if (session?.user?.id) {
      fetchIntegrations()
    }
  }, [session?.user?.id])

  // URL パラメータで成功メッセージを表示
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    
    if (success === 'true') {
      setTimeout(() => {
        fetchIntegrations()
      }, 1000)
    } else if (error) {
      console.log('🔍 エラーを検出:', error)
    }
  }, [])

  // サービスが統合済みかチェック
const isServiceConnected = (serviceId: string): boolean => {
  console.log(`🔍 ${serviceId} の接続状況チェック中...`);
  
  const matchingIntegrations = integrations.filter(integration => {
    const normalizedService = integration.service.toLowerCase().trim();
    const normalizedServiceId = serviceId.toLowerCase().trim();
    
    console.log(`  比較: "${normalizedService}" vs "${normalizedServiceId}"`);
    
    // 完全一致
    if (normalizedService === normalizedServiceId) {
      console.log(`  ✅ 完全一致: ${integration.isActive}`);
      return integration.isActive;
    }
    
    // Google関連の特別処理
    if (serviceId === 'google') {
      const isGoogleService = normalizedService === 'google' || 
                             normalizedService === 'google-meet' || 
                             normalizedService === 'google_meet';
      if (isGoogleService) {
        console.log(`  ✅ Google関連一致: ${integration.isActive}`);
        return integration.isActive;
      }
    }
    
    // Teams関連の特別処理
    if (serviceId === 'azure-ad') {
      const isTeamsService = normalizedService === 'azure-ad' || 
                             normalizedService === 'azure_ad' || 
                             normalizedService === 'teams';
      if (isTeamsService) {
        console.log(`  ✅ Teams関連一致: ${integration.isActive}`);
        return integration.isActive;
      }
    }
    
    return false;
  });
  
  const isConnected = matchingIntegrations.length > 0;
  console.log(`🔍 ${serviceId} 最終結果: ${isConnected ? '✅ 接続済み' : '❌ 未接続'}`);
  
  return isConnected;
}

  // 統合解除
  const handleDisconnect = async (serviceId: string) => {
    try {
      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service: serviceId }),
      })

      if (!response.ok) {
        throw new Error('統合解除に失敗しました')
      }

      await fetchIntegrations()
    } catch (error) {
      console.error('統合解除エラー:', error)
      alert('統合解除に失敗しました')
    }
  }

  const handleConnect = async (service: ServiceConfig) => {
    setConnecting(service.id)
    
    try {
      if (service.isNextAuth) {
        await signIn(service.id, { callbackUrl: '/integrations?success=true' })
      } else {
        window.location.href = service.authUrl
      }
    } catch (error) {
      console.error(`${service.name}認証エラー:`, error)
      setConnecting(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">認証が必要です</h1>
          <p className="text-gray-600 mb-6">統合管理にはログインが必要です</p>
          <button
            onClick={() => signIn()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            ログイン
          </button>
        </div>
      </div>
    )
  }

  const connectedCount = integrations.filter(i => i.isActive).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LinkSense MVP
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            サービス統合管理
          </p>
          <p className="text-sm text-gray-500">
            4つのサービスを統合してチーム分析を開始
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800 mb-1">エラーが発生しました</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={fetchIntegrations}
                  className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 統合状況サマリー */}
        {!loading && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">統合状況</h2>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-600">
                  {connectedCount}/4 接続済み
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {services.map((service) => {
                const isConnected = isServiceConnected(service.id)
                const IconComponent = service.icon
                return (
                  <div key={service.id} className="text-center">
                    <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center transition-all ${
                      isConnected ? service.color : 'bg-gray-200'
                    }`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-medium text-gray-900 mb-1">{service.name}</p>
                    <div className="flex items-center justify-center gap-1">
                      {isConnected ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                        {isConnected ? '接続済み' : '未接続'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700 font-medium">
                  {connectedCount === 0 && 'サービスを接続して統合分析を開始しましょう'}
                  {connectedCount > 0 && connectedCount < 2 && `${connectedCount}個のサービスが接続済み。追加接続で分析精度が向上します`}
                  {connectedCount >= 2 && connectedCount < 4 && `${connectedCount}個のサービスが接続済み。包括的な分析が利用可能です`}
                  {connectedCount === 4 && '全サービスが接続済み！最高精度の統合分析をお楽しみください'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* サービス一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {services.map((service) => {
            const isConnected = isServiceConnected(service.id)
            const integration = integrations.find(i => i.service === service.id)
            const IconComponent = service.icon
            
            return (
              <div
                key={service.id}
                className={`bg-white rounded-lg border shadow-sm transition-all hover:shadow-md ${
                  isConnected 
                    ? 'border-green-200 bg-green-50/30' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 rounded-lg p-3 text-white ${
                      isConnected ? service.color : 'bg-gray-400'
                    }`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {service.name}
                        </h3>
                        {isConnected && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            接続済み
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <Zap className="h-3 w-3 mr-1" />
                          NextAuth統合
                        </span>
                      </div>
                      {integration && (
                        <p className="text-xs text-gray-500">
                          接続日時: {new Date(integration.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => handleDisconnect(service.id)}
                          className="flex-1 inline-flex justify-center items-center py-2.5 px-4 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 transition-colors"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          切断
                        </button>
                        <button
                          onClick={() => handleConnect(service)}
                          disabled={connecting === service.id}
                          className={`flex-1 inline-flex justify-center items-center py-2.5 px-4 text-sm font-medium rounded-lg text-white ${service.color} hover:opacity-90 disabled:opacity-50 transition-all`}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${connecting === service.id ? 'animate-spin' : ''}`} />
                          再接続
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect(service)}
                        disabled={connecting === service.id}
                        className={`w-full inline-flex justify-center items-center py-2.5 px-4 text-sm font-medium rounded-lg text-white ${service.color} hover:opacity-90 disabled:opacity-50 transition-all`}
                      >
                        {connecting === service.id ? (
                          <>
                            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                            接続中...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            連携する
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 認証状況表示 */}
        {session && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 mb-2">
                  認証済みユーザー
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-green-700">
                    ユーザー: {session.user?.name || session.user?.email}
                  </p>
                  <p className="text-green-600 text-xs">
                    プロバイダー: {(session as any).provider || 'NextAuth'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 使い方ガイド */}
        {connectedCount === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 mb-3">
                  統合分析を開始しましょう
                </h3>
                <div className="text-amber-700 text-sm space-y-3">
                  <p>サービスを接続することで以下の機能が利用可能になります：</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>チーム健全性の自動分析</li>
                    <li>コミュニケーションパターンの可視化</li>
                    <li>AI による改善提案</li>
                    <li>詳細なレポート生成</li>
                  </ul>
                  <p className="font-medium bg-amber-100 rounded p-3 mt-4">
                    💡 推奨：主要なサービス（Slack、Teams、Google Meet）から接続を開始してください
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}