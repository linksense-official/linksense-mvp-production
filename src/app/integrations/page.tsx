'use client'

import { useSession, signIn } from 'next-auth/react'
import { useState } from 'react'

interface ServiceConfig {
  id: string
  name: string
  description: string
  icon: string
  color: string
  authUrl: string
  isNextAuth: boolean
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

  const handleConnect = async (service: ServiceConfig) => {
  setConnecting(service.id)
  
  try {
    if (service.isNextAuth) {
      await signIn(service.id, { callbackUrl: '/integrations' })
    } else if (service.id === 'chatwork') {
  // ChatWork OAuth認証（直接リダイレクト）
  window.location.href = service.authUrl;
} else {
      window.location.href = service.authUrl
    }
  } catch (error) {
    console.error(`${service.name}認証エラー:`, error)
    setConnecting(null)
  }
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

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 rounded-full p-3 ${service.color} text-white`}>
                  <span className="text-2xl">{service.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {service.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {service.isNextAuth ? 'NextAuth統合' : 'カスタム実装'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
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
              </div>
            </div>
          ))}
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
          </div>
        </div>
      </div>
    </div>
  )
}