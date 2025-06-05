'use client'

import { useSession, signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface ServiceConfig {
  id: string
  name: string
  description: string
  icon: string
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
    icon: '📹',
    color: 'bg-blue-500',
    authUrl: '/api/auth/signin/google',
    isNextAuth: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'チームコミュニケーション',
    icon: '💬',
    color: 'bg-purple-500',
    authUrl: '/api/auth/signin/slack',
    isNextAuth: true,
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'ゲーミングコミュニティ',
    icon: '🎮',
    color: 'bg-indigo-500',
    authUrl: '/api/auth/signin/discord',
    isNextAuth: true,
  },
  {
    id: 'azure-ad',
    name: 'Microsoft Teams',
    description: 'ビジネスコラボレーション',
    icon: '🏢',
    color: 'bg-blue-600',
    authUrl: '/api/auth/signin/azure-ad',
    isNextAuth: true,
  },
  {
    id: 'chatwork',
    name: 'ChatWork',
    description: 'ビジネスチャット',
    icon: '💼',
    color: 'bg-orange-500',
    authUrl: '/api/auth/chatwork',
    isNextAuth: false,
  },
  {
    id: 'line-works',
    name: 'LINE WORKS',
    description: 'ビジネス向けLINE',
    icon: '📞',
    color: 'bg-green-500',
    authUrl: '/api/auth/line-works',
    isNextAuth: false,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">認証が必要です</h1>
          <p className="text-gray-600 mb-8">統合管理にはログインが必要です</p>
          <button
            onClick={() => signIn()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            ログイン
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            LinkSense MVP - サービス統合管理
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            6つのサービスを統合してコミュニケーションを効率化
          </p>
          <div className="mt-2 text-sm text-gray-500">
            環境: {process.env.NODE_ENV || 'development'} | 
            現在時刻: {new Date().toLocaleString()}
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              エラー
            </h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchIntegrations}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              再試行
            </button>
          </div>
        )}

        {/* 統合状況サマリー */}
        {!loading && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">統合状況</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {services.map((service) => {
                const isConnected = isServiceConnected(service.id)
                return (
                  <div key={service.id} className="text-center">
                    <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      isConnected ? service.color : 'bg-gray-200'
                    }`}>
                      <span className="text-white text-xl">{service.icon}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{service.name}</p>
                    <p className={`text-xs ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                      {isConnected ? '接続済み' : '未接続'}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                {integrations.filter(i => i.isActive).length} / {services.length} サービスが接続されています
              </p>
            </div>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const isConnected = isServiceConnected(service.id)
            const integration = integrations.find(i => i.service === service.id)
            
            return (
              <div
                key={service.id}
                className={`relative rounded-lg border px-6 py-5 shadow-sm transition-all duration-200 ${
                  isConnected 
                    ? 'border-green-300 bg-green-50 hover:border-green-400' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 rounded-full p-3 text-white ${
                    isConnected ? service.color : 'bg-gray-400'
                  }`}>
                    <span className="text-2xl">{service.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900">
                      {service.name}
                      {isConnected && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          接続済み
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {service.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {service.isNextAuth ? 'NextAuth統合' : 'カスタム実装'}
                    </p>
                    {integration && (
                      <p className="text-xs text-gray-400 mt-1">
                        接続日時: {new Date(integration.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleDisconnect(service.id)}
                        className="flex-1 inline-flex justify-center py-2 px-4 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                      >
                        切断
                      </button>
                      <button
                        onClick={() => handleConnect(service)}
                        disabled={connecting === service.id}
                        className={`flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${service.color} hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200`}
                      >
                        再接続
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(service)}
                      disabled={connecting === service.id}
                      className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${service.color} hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200`}
                    >
                      {connecting === service.id ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          接続中...
                        </>
                      ) : (
                        '連携する'
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
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-800 mb-2">
              認証済みユーザー
            </h3>
            <p className="text-green-700">
              ユーザー: {session.user?.name || session.user?.email}
            </p>
            <p className="text-green-600 text-sm">
              ユーザーID: {(session.user as any)?.id || 'N/A'}
            </p>
            <p className="text-green-600 text-sm">
              プロバイダー: {(session as any).provider || 'NextAuth'}
            </p>
          </div>
        )}

        {/* 本番環境情報 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            本番環境情報
          </h3>
          <div className="text-blue-700 text-sm space-y-1">
            <p>NEXTAUTH_URL: {process.env.NEXTAUTH_URL || '未設定'}</p>
            <p>NODE_ENV: {process.env.NODE_ENV || '未設定'}</p>
            <p>現在のURL: {typeof window !== 'undefined' ? window.location.href : 'サーバーサイド'}</p>
            <p>統合情報読み込み: {loading ? '読み込み中...' : `${integrations.length}件取得済み`}</p>
          </div>
        </div>
      </div>
    </div>
  )
}