'use client'

import { useSession, signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { 
  RefreshCw, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Video,
  MessageSquare,
  Users,
  Calendar,
  Phone,
  Building2,
  Zap,
  Shield
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

const services: ServiceConfig[] = [
  {
    id: 'google',
    name: 'Google Meet',
    description: 'ビデオ会議・カレンダー統合',
    icon: Video,
    color: 'bg-blue-500',
    authUrl: '/api/auth/signin/google',
    isNextAuth: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'チームコミュニケーション',
    icon: MessageSquare,
    color: 'bg-purple-500',
    authUrl: '/api/auth/signin/slack',
    isNextAuth: true,
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'ゲーミングコミュニティ',
    icon: Users,
    color: 'bg-indigo-500',
    authUrl: '/api/auth/signin/discord',
    isNextAuth: true,
  },
  {
    id: 'azure-ad',
    name: 'Microsoft Teams',
    description: 'ビジネスコラボレーション',
    icon: Building2,
    color: 'bg-blue-600',
    authUrl: '/api/auth/signin/azure-ad',
    isNextAuth: true,
  },
  {
    id: 'chatwork',
    name: 'ChatWork',
    description: 'ビジネスチャット',
    icon: Calendar,
    color: 'bg-orange-500',
    authUrl: '/api/auth/chatwork',
    isNextAuth: false,
  },
    {
  id: 'lineworks',
  name: 'LINE WORKS',
  description: 'ビジネス向けLINE',
  icon: Phone,
  color: 'bg-green-500',
 authUrl: '/api/auth/lineworksauth', 
  isNextAuth: false, // カスタム認証として設定
},
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
    if (urlParams.get('success') === 'true') {
      // 成功時に統合状態を再取得
      setTimeout(() => {
        fetchIntegrations()
      }, 1000)
    }
  }, [])

  // サービスが統合済みかチェック
  const isServiceConnected = (serviceId: string): boolean => {
    return integrations.some(integration => 
      integration.service === serviceId && integration.isActive
    )
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

      // 統合状態を再取得
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
      } else if (service.id === 'chatwork') {
        window.location.href = service.authUrl
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">認証が必要です</h1>
          <p className="text-gray-600 mb-8">統合管理にはログインが必要です</p>
          <button
            onClick={() => signIn()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
          >
            ログイン
          </button>
        </div>
      </div>
    )
  }

  const connectedCount = integrations.filter(i => i.isActive).length

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">
            LinkSense MVP - サービス統合管理
          </h1>
          <p className="mt-4 text-base sm:text-xl text-gray-600">
            6つのサービスを統合してコミュニケーションを効率化
          </p>
          <div className="mt-2 text-xs sm:text-sm text-gray-500">
            環境: {process.env.NODE_ENV || 'development'} | 
            現在時刻: {new Date().toLocaleString()}
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mt-6 sm:mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-medium text-red-800 mb-2">
                  エラー
                </h3>
                <p className="text-red-700 text-sm sm:text-base">{error}</p>
                <button
                  onClick={fetchIntegrations}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 統合状況サマリー */}
        {!loading && (
          <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">統合状況</h2>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm sm:text-base font-medium text-green-600">
                  {connectedCount}/6 接続済み
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
              {services.map((service) => {
                const isConnected = isServiceConnected(service.id)
                const IconComponent = service.icon
                return (
                  <div key={service.id} className="text-center">
                    <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-full mx-auto mb-2 flex items-center justify-center transition-colors ${
                      isConnected ? service.color : 'bg-gray-200'
                    }`}>
                      <IconComponent className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{service.name}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {isConnected ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-400" />
                      )}
                      <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                        {isConnected ? '接続済み' : '未接続'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700">
                  {connectedCount === 0 && 'サービスを接続して統合分析を開始しましょう'}
                  {connectedCount > 0 && connectedCount < 3 && `${connectedCount}個のサービスが接続済み。追加接続で分析精度が向上します`}
                  {connectedCount >= 3 && connectedCount < 6 && `${connectedCount}個のサービスが接続済み。包括的な分析が利用可能です`}
                  {connectedCount === 6 && '全サービスが接続済み！最高精度の統合分析をお楽しみください'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const isConnected = isServiceConnected(service.id)
            const integration = integrations.find(i => i.service === service.id)
            const IconComponent = service.icon
            
            return (
              <div
                key={service.id}
                className={`relative rounded-lg border px-4 sm:px-6 py-4 sm:py-5 shadow-sm transition-all duration-200 ${
                  isConnected 
                    ? 'border-green-300 bg-green-50 hover:border-green-400' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 rounded-full p-2 sm:p-3 text-white transition-colors ${
                    isConnected ? service.color : 'bg-gray-400'
                  }`}>
                    <IconComponent className="h-5 sm:h-6 w-5 sm:w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900">
                        {service.name}
                      </h3>
                      {isConnected && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          接続済み
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        service.isNextAuth ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {service.isNextAuth ? (
                          <>
                            <Zap className="h-3 w-3 mr-1" />
                            NextAuth統合
                          </>
                        ) : (
                          <>
                            <Settings className="h-3 w-3 mr-1" />
                            カスタム実装
                          </>
                        )}
                      </span>
                    </div>
                    {integration && (
                      <p className="text-xs text-gray-400 mt-2">
                        接続日時: {new Date(integration.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
  {isConnected ? (
    <>
      <button
        onClick={() => handleDisconnect(service.id)}
        className="flex-1 inline-flex justify-center items-center py-2 px-4 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
      >
        <XCircle className="h-4 w-4 mr-2" />
        切断
      </button>
      <button
        onClick={() => handleConnect(service)}
        disabled={connecting === service.id}
        className={`flex-1 inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${service.color} hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200`}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${connecting === service.id ? 'animate-spin' : ''}`} />
        再接続
      </button>
    </>
  ) : (
    <button
      onClick={() => handleConnect(service)}
      disabled={connecting === service.id}
      className={`w-full inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${service.color} hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200`}
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
            )
          })}
        </div>

        {/* 認証状況表示 */}
        {session && (
          <div className="mt-6 sm:mt-8 bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-medium text-green-800 mb-2">
                  認証済みユーザー
                </h3>
                <div className="space-y-1 text-sm sm:text-base">
                  <p className="text-green-700">
                    ユーザー: {session.user?.name || session.user?.email}
                  </p>
                  <p className="text-green-600 text-xs sm:text-sm">
                    ユーザーID: {(session.user as any)?.id || 'N/A'}
                  </p>
                  <p className="text-green-600 text-xs sm:text-sm">
                    プロバイダー: {(session as any).provider || 'NextAuth'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 本番環境情報 */}
        <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-medium text-blue-800 mb-2">
                システム情報
              </h3>
              <div className="text-blue-700 text-xs sm:text-sm space-y-1">
                <p>NEXTAUTH_URL: {process.env.NEXTAUTH_URL || '未設定'}</p>
                <p>NODE_ENV: {process.env.NODE_ENV || '未設定'}</p>
                <p>現在のURL: {typeof window !== 'undefined' ? window.location.href : 'サーバーサイド'}</p>
                <p>統合情報読み込み: {loading ? '読み込み中...' : `${integrations.length}件取得済み`}</p>
                <p>接続済みサービス: {connectedCount}/{services.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 使い方ガイド */}
        {connectedCount === 0 && (
          <div className="mt-6 sm:mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-medium text-yellow-800 mb-2">
                  統合分析を開始しましょう
                </h3>
                <div className="text-yellow-700 text-sm sm:text-base space-y-2">
                  <p>サービスを接続することで以下の機能が利用可能になります：</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>チーム健全性の自動分析</li>
                    <li>コミュニケーションパターンの可視化</li>
                    <li>AI による改善提案</li>
                    <li>詳細なレポート生成</li>
                  </ul>
                  <p className="mt-3 font-medium">
                    まずは主要なサービス（Slack、Teams、Google Meet）から接続を開始することを推奨します。
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