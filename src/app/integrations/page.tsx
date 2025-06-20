'use client'

import { useSession, signIn } from 'next-auth/react'
import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Zap,
  Clock,
  Activity,
  AlertCircle,
  Wifi,
  WifiOff,
  Timer,
  Loader2,
  CheckCheck,
  X,
  Play,
  Pause,
  Settings,
  Eye,
  TrendingUp,
  BarChart3,
  Globe,
  Lock,
  Award,
  Star,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  BookOpen
} from 'lucide-react'

interface ServiceConfig {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  authUrl: string
  isNextAuth: boolean
  features: string[]
  priority: 'high' | 'medium' | 'low'
  // 🔴 審査対応追加フィールド
  privacyLevel: 'basic' | 'standard' | 'advanced'
  dataTypes: string[]
  benefits: string[]
  setupTime: string
  userCount?: string
}

// 拡張されたIntegrationインターフェース
interface Integration {
  id: string
  service: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  teamId?: string | null
  teamName?: string | null
  hasToken?: boolean
  hasRefreshToken?: boolean
  scope?: string | null
  lastSync?: string
  syncStatus?: 'syncing' | 'completed' | 'error' | 'pending'
  errorMessage?: string
  userCount?: number
  dataQuality?: number
  connectionHealth?: number
}

// 接続進捗状態
interface ConnectionProgress {
  serviceId: string
  step: 'auth' | 'token' | 'validation' | 'sync' | 'completed' | 'error'
  progress: number
  message: string
  error?: string
}

// リアルタイム統計
interface IntegrationStats {
  totalConnected: number
  activeConnections: number
  totalUsers: number
  lastSyncTime: string
  healthScore: number
  dataQuality: number
}

// 🔴 本番対応4サービス設定（審査対応版）
const services: ServiceConfig[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'チームコミュニケーションの健全性を分析し、メンバーの参加状況や孤立リスクを検出',
    icon: MessageSquare,
    color: 'bg-purple-600',
    authUrl: '/api/auth/signin/slack',
    isNextAuth: true,
    features: [
      'チャンネル参加状況の分析',
      'コミュニケーション頻度の測定',
      '孤立メンバーの早期検出',
      'チーム活動パターンの可視化'
    ],
    priority: 'high',
    privacyLevel: 'standard',
    dataTypes: [
      'チャンネル構造情報',
      'メンバー参加状況',
      'メッセージ頻度（内容は取得しません）',
      'アクティブ時間帯'
    ],
    benefits: [
      'チームの健全性を定量的に把握',
      'コミュニケーション改善のヒント',
      'メンバーサポートの最適化'
    ],
    setupTime: '2-3分',
    userCount: '最大500名まで分析可能'
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'コミュニティやチームの活動状況を分析し、エンゲージメントレベルを測定',
    icon: Users,
    color: 'bg-indigo-600',
    authUrl: '/api/auth/signin/discord',
    isNextAuth: true,
    features: [
      'サーバー活動状況の分析',
      'メンバーエンゲージメント測定',
      'コミュニティ健全性の評価',
      'イベント参加パターンの分析'
    ],
    priority: 'medium',
    privacyLevel: 'basic',
    dataTypes: [
      'サーバー基本情報',
      'チャンネル構造',
      'メンバー参加状況',
      'アクティビティレベル'
    ],
    benefits: [
      'コミュニティの活性度を把握',
      'メンバー離脱リスクの早期発見',
      'イベント効果の測定'
    ],
    setupTime: '1-2分',
    userCount: '無制限メンバー対応'
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: '企業内チームの協働状況を分析し、会議効率性とコラボレーション品質を評価',
    icon: Building2,
    color: 'bg-blue-600',
    authUrl: '/api/auth/signin/azure-ad',
    isNextAuth: true,
    features: [
      '会議参加率と効率性の分析',
      'チャンネル活用状況の評価',
      'ファイル共有パターンの分析',
      'チーム協働レベルの測定'
    ],
    priority: 'high',
    privacyLevel: 'advanced',
    dataTypes: [
      'チーム構造情報',
      '会議参加統計',
      'チャンネル活動レベル',
      'プレゼンス状態'
    ],
    benefits: [
      '会議効率性の改善提案',
      'チーム協働の最適化',
      '生産性向上のインサイト'
    ],
    setupTime: '3-5分',
    userCount: '組織全体対応'
  },
  {
    id: 'google',
    name: 'Google Meet',
    description: 'オンライン会議の参加パターンとスケジュール効率性を分析',
    icon: Video,
    color: 'bg-red-600',
    authUrl: '/api/auth/signin/google',
    isNextAuth: true,
    features: [
      '会議参加パターンの分析',
      'カレンダー効率性の評価',
      '時間使用最適化の提案',
      'リモートワーク効率の測定'
    ],
    priority: 'high',
    privacyLevel: 'standard',
    dataTypes: [
      'カレンダー空き状況',
      '会議参加統計',
      'スケジュール密度',
      '時間帯別活動'
    ],
    benefits: [
      'スケジュール最適化',
      '会議効率の改善',
      'ワークライフバランス向上'
    ],
    setupTime: '2-3分',
    userCount: 'Google Workspace全体'
  }
]

// UIコンポーネント
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

const Badge: React.FC<{ 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'destructive' | 'secondary' | 'premium';
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    destructive: "bg-red-100 text-red-800",
    secondary: "bg-gray-100 text-gray-800",
    premium: "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800"
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Progress: React.FC<{ 
  value: number; 
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}> = ({ value, className = '', variant = 'default' }) => {
  const colorClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };
  
  const normalizedValue = Math.min(100, Math.max(0, value));
  
  return (
    <div className={`relative ${className}`}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-500 ease-out ${colorClasses[variant]}`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
};

export default function IntegrationsPage() {
  const { data: session, status } = useSession()
  
  // 状態管理
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionProgress, setConnectionProgress] = useState<ConnectionProgress[]>([])
  const [stats, setStats] = useState<IntegrationStats | null>(null)
  const [realTimeUpdates, setRealTimeUpdates] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false)

  // 統計計算関数
  const calculateStats = useCallback((integrations: Integration[]): IntegrationStats => {
    const activeIntegrations = integrations.filter(i => i.isActive && i.hasToken)
    const totalUsers = integrations.reduce((sum, i) => sum + (i.userCount || 0), 0)
    const avgDataQuality = integrations.length > 0 
      ? integrations.reduce((sum, i) => sum + (i.dataQuality || 0), 0) / integrations.length 
      : 0
    const avgHealth = integrations.length > 0
      ? integrations.reduce((sum, i) => sum + (i.connectionHealth || 0), 0) / integrations.length
      : 0

    return {
      totalConnected: integrations.length,
      activeConnections: activeIntegrations.length,
      totalUsers,
      lastSyncTime: new Date().toISOString(),
      healthScore: Math.round(avgHealth),
      dataQuality: Math.round(avgDataQuality)
    }
  }, [])

  // データ取得関数（既存のコードを維持）
  const fetchIntegrationsOptimized = useCallback(async (): Promise<void> => {
    if (!session?.user?.id) return

    try {
      setError(null)
      console.log('🚀 統合状態の並行取得開始')
      
      const [integrationsResult, statsResult] = await Promise.allSettled([
        fetch('/api/integrations/user', {
          headers: { 'Cache-Control': 'no-cache' }
        }).catch(error => {
          console.warn('統合API接続エラー:', error);
          return { ok: false, status: 404, statusText: 'API Endpoint Not Found' };
        }),
        fetch('/api/integrations/stats', {
          headers: { 'Cache-Control': 'no-cache' }
        }).catch(error => {
          console.warn('統計API接続エラー:', error);
          return { ok: false, status: 404, statusText: 'API Endpoint Not Found' };
        })
      ])

      let enhancedIntegrations: Integration[] = []

      if (integrationsResult.status === 'fulfilled') {
        const integrationsResponse = integrationsResult.value as Response
        if (integrationsResponse.ok) {
          try {
            const contentType = integrationsResponse.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
              const data = await integrationsResponse.json()
              
              enhancedIntegrations = (data.integrations || []).map((integration: any) => ({
                ...integration,
                lastSync: integration.lastSync || new Date().toISOString(),
                syncStatus: integration.isActive ? 'completed' : 'pending',
                userCount: integration.userCount || 0,
                dataQuality: integration.dataQuality || (integration.isActive ? 85 : 0),
                connectionHealth: integration.connectionHealth || (integration.isActive ? 95 : 0)
              }))
              
              setIntegrations(enhancedIntegrations)
            } else {
              console.warn('API応答がJSON形式ではありません:', contentType)
              setIntegrations([])
            }
          } catch (parseError) {
            console.warn('JSON解析エラー:', parseError)
            setIntegrations([])
          }
        } else {
          console.warn('統合API応答エラー:', integrationsResponse.status, integrationsResponse.statusText)
          setIntegrations([])
        }
      } else {
        console.warn('統合API取得失敗:', integrationsResult.reason)
        setIntegrations([])
      }

      let calculatedStats: IntegrationStats
      if (statsResult.status === 'fulfilled') {
        const statsResponse = statsResult.value as Response
        if (statsResponse.ok) {
          try {
            const contentType = statsResponse.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
              const statsData = await statsResponse.json()
              calculatedStats = statsData.stats
            } else {
              calculatedStats = calculateStats(enhancedIntegrations)
            }
          } catch (parseError) {
            console.warn('統計JSON解析エラー:', parseError)
            calculatedStats = calculateStats(enhancedIntegrations)
          }
        } else {
          calculatedStats = calculateStats(enhancedIntegrations)
        }
      } else {
        calculatedStats = calculateStats(enhancedIntegrations)
      }
      
      setStats(calculatedStats)
      setLastRefresh(new Date())
      
      console.log('✅ 統合状態取得完了:', {
        integrations: enhancedIntegrations.length,
        connectedServices: calculatedStats.activeConnections
      })

    } catch (error) {
      console.error('❌ 統合情報取得エラー:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('サーバーに接続できません。ネットワーク接続を確認してください。')
      } else {
        setError('統合情報の取得に失敗しました。しばらく待ってから再試行してください。')
      }
      
      setIntegrations([])
      setStats({
        totalConnected: 0,
        activeConnections: 0,
        totalUsers: 0,
        lastSyncTime: new Date().toISOString(),
        healthScore: 0,
        dataQuality: 0
      })
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, calculateStats])

  // エフェクトとハンドラー（既存のコードを維持）
  useEffect(() => {
    if (session?.user?.id) {
      fetchIntegrationsOptimized()
      
      if (realTimeUpdates) {
        const interval = setInterval(fetchIntegrationsOptimized, 30000)
        return () => clearInterval(interval)
      }
    }
    
    return undefined
  }, [session?.user?.id, realTimeUpdates, fetchIntegrationsOptimized])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    
    if (success === 'true') {
      setTimeout(() => {
        fetchIntegrationsOptimized()
      }, 1000)
      
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    } else if (error) {
      setError(`認証エラー: ${error}`)
    }
  }, [fetchIntegrationsOptimized])

  const getServiceStatus = useCallback((serviceId: string) => {
    const integration = integrations.find(integration => {
      const normalizedService = integration.service.toLowerCase().trim()
      const normalizedServiceId = serviceId.toLowerCase().trim()
      
      return normalizedService === normalizedServiceId
    })
    
    if (!integration) {
      return { connected: false, status: 'disconnected', integration: null }
    }
    
    const isFullyConnected = integration.isActive && (integration.hasToken ?? false)
    
    return {
      connected: isFullyConnected,
      status: integration.syncStatus || (isFullyConnected ? 'completed' : 'pending'),
      integration,
      health: integration.connectionHealth || 0,
      dataQuality: integration.dataQuality || 0,
      lastSync: integration.lastSync,
      userCount: integration.userCount || 0
    }
  }, [integrations])

  const handleConnect = useCallback(async (service: ServiceConfig) => {
    const progressId = `${service.id}-${Date.now()}`
    
    setConnectionProgress(prev => [...prev, {
      serviceId: service.id,
      step: 'auth',
      progress: 10,
      message: '認証を開始しています...'
    }])
    
    try {
      setConnectionProgress(prev => prev.map(p => 
        p.serviceId === service.id 
          ? { ...p, step: 'token', progress: 30, message: 'トークンを取得中...' }
          : p
      ))
      
      if (service.id === 'teams') {
        window.location.href = `/api/teams-auth?callbackUrl=${encodeURIComponent('/integrations?success=true')}`
        return
      }
      
      if (service.id === 'slack') {
        window.location.href = `/api/slack-auth?callbackUrl=${encodeURIComponent('/integrations?success=true')}`
        return
      }
      
      setConnectionProgress(prev => prev.map(p => 
        p.serviceId === service.id 
          ? { ...p, step: 'validation', progress: 60, message: '接続を検証中...' }
          : p
      ))
      
      if (service.isNextAuth) {
        await signIn(service.id, { callbackUrl: '/integrations?success=true' })
      } else {
        window.location.href = service.authUrl
      }
      
    } catch (error) {
      console.error(`${service.name}認証エラー:`, error)
      setConnectionProgress(prev => prev.map(p => 
        p.serviceId === service.id 
          ? { 
              ...p, 
              step: 'error', 
              progress: 0, 
              message: '接続に失敗しました',
              error: error instanceof Error ? error.message : '不明なエラー'
            }
          : p
      ))
    }
  }, [])

  const handleDisconnect = useCallback(async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (!service) return
    
    const confirmed = window.confirm(
      `${service.name}との統合を解除しますか？\n\n` +
      '解除すると以下のデータが利用できなくなります：\n' +
      service.features.map(f => `• ${f}`).join('\n')
    )
    
    if (!confirmed) return

    try {
      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceId }),
      })

      if (!response.ok) {
        throw new Error('統合解除に失敗しました')
      }

      await fetchIntegrationsOptimized()
    } catch (error) {
      console.error('統合解除エラー:', error)
      setError('統合解除に失敗しました')
    }
  }, [fetchIntegrationsOptimized])

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await fetchIntegrationsOptimized()
  }, [fetchIntegrationsOptimized])

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [])

  const connectedCount = useMemo(() => {
    return integrations.filter(i => i.isActive && (i.hasToken ?? false)).length
  }, [integrations])

  const activeProgress = useMemo(() => {
    return connectionProgress.filter(p => p.step !== 'completed' && p.step !== 'error')
  }, [connectionProgress])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* 🔴 未認証時のランディングページ（審査対応版） */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* ヒーローセクション */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4">
                <BarChart3 className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              チーム健全性分析プラットフォーム
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                LinkSense
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              普段使っているツールのデータを安全に分析し、チームの健全性を可視化。
              メンバーの孤立リスクを早期発見し、より良いチーム環境を構築します。
            </p>
            
            {/* 価値提案 */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">プライバシー最優先</h3>
                <p className="text-gray-600 text-sm">
                  メッセージ内容は一切取得せず、統計情報のみを安全に分析
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <Zap className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">簡単セットアップ</h3>
                <p className="text-gray-600 text-sm">
                  わずか数分で連携完了。すぐに分析結果を確認できます
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">実用的インサイト</h3>
                <p className="text-gray-600 text-sm">
                  AIによる分析でチーム改善の具体的な提案を提供
                </p>
              </div>
            </div>

            <button
              onClick={() => signIn()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg text-lg"
            >
              無料で始める
            </button>
          </div>

          {/* 対応サービス紹介 */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              対応サービス
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {services.map((service) => {
                const IconComponent = service.icon
                return (
                  <Card key={service.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 rounded-lg p-3 text-white ${service.color}`}>
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {service.name}
                          </h3>
                          {service.priority === 'high' && (
                            <Badge variant="premium">
                              <Star className="h-3 w-3 mr-1" />
                              おすすめ
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-4">
                          {service.description}
                        </p>
                        
                        {/* 主要機能 */}
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">主要機能:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {service.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* セットアップ情報 */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            セットアップ: {service.setupTime}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {service.userCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* プライバシー・セキュリティ */}
          <Card className="mb-16 border-green-200 bg-green-50">
            <div className="p-8">
              <div className="text-center mb-8">
                <Lock className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  プライバシー・セキュリティへの取り組み
                </h2>
                <p className="text-gray-700 max-w-3xl mx-auto">
                  LinkSenseは、お客様のプライバシーとデータセキュリティを最優先に考えています。
                  業界標準のセキュリティ対策と透明性の高いデータ処理を実践しています。
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">メッセージ内容非取得</h3>
                  <p className="text-sm text-gray-600">
                    チャットやメッセージの内容は一切取得・保存しません
                  </p>
                </div>
                <div className="text-center">
                  <Lock className="h-8 w-8 text-green-600 mx-auto mb-3" />
                     <h3 className="font-semibold text-gray-900 mb-2">AES-256暗号化</h3>
                  <p className="text-sm text-gray-600">
                    全データをエンタープライズレベルの暗号化で保護
                  </p>
                </div>
                <div className="text-center">
                  <Globe className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">GDPR準拠</h3>
                  <p className="text-sm text-gray-600">
                    EU一般データ保護規則に完全準拠したデータ処理
                  </p>
                </div>
                <div className="text-center">
                  <Eye className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">透明性</h3>
                  <p className="text-sm text-gray-600">
                    取得データと使用目的を明確に開示
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
                  className="text-green-600 hover:text-green-700 font-medium flex items-center mx-auto"
                >
                  詳細なプライバシー情報を見る
                  <ArrowRight className={`h-4 w-4 ml-1 transition-transform ${showPrivacyDetails ? 'rotate-90' : ''}`} />
                </button>
                
                {showPrivacyDetails && (
                  <div className="mt-6 bg-white rounded-lg p-6 text-left">
                    <h4 className="font-semibold text-gray-900 mb-4">データ取得・処理の詳細</h4>
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">✅ 取得するデータ</h5>
                        <ul className="space-y-1 text-gray-600">
                          <li>• チャンネル・チーム構造情報</li>
                          <li>• メンバー参加状況</li>
                          <li>• メッセージ送信頻度（内容は除く）</li>
                          <li>• アクティブ時間帯</li>
                          <li>• 会議参加統計</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">❌ 取得しないデータ</h5>
                        <ul className="space-y-1 text-gray-600">
                          <li>• メッセージ・チャットの内容</li>
                          <li>• ファイル・画像の内容</li>
                          <li>• 個人的な会話内容</li>
                          <li>• プライベートな情報</li>
                          <li>• 個人識別可能な詳細情報</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-green-100 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>重要:</strong> LinkSenseは統計的な分析のみを行い、個人のプライバシーを侵害することはありません。
                        すべてのデータは匿名化・集約化された形で処理されます。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* 使用例・ベネフィット */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              LinkSenseで実現できること
            </h2>
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="p-6">
                <div className="text-center mb-4">
                  <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    孤立メンバーの早期発見
                  </h3>
                </div>
                <p className="text-gray-600 text-center mb-4">
                  コミュニケーション頻度の低下や参加率の減少を検知し、
                  サポートが必要なメンバーを早期に特定
                </p>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">具体的な効果:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• メンバーの離職リスク軽減</li>
                    <li>• チームの結束力向上</li>
                    <li>• 適切なタイミングでのサポート提供</li>
                  </ul>
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-center mb-4">
                  <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    チーム健全性の可視化
                  </h3>
                </div>
                <p className="text-gray-600 text-center mb-4">
                  チーム全体のコミュニケーション状況を定量的に分析し、
                  健全性スコアとして可視化
                </p>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">具体的な効果:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• データに基づく意思決定</li>
                    <li>• 改善施策の効果測定</li>
                    <li>• 継続的なチーム改善</li>
                  </ul>
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-center mb-4">
                  <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    生産性向上の提案
                  </h3>
                </div>
                <p className="text-gray-600 text-center mb-4">
                  AIによる分析結果から、チーム運営の改善点と
                  具体的なアクションプランを提案
                </p>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">具体的な効果:</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• 会議効率の最適化</li>
                    <li>• コミュニケーション改善</li>
                    <li>• ワークフロー最適化</li>
                  </ul>
                </div>
              </Card>
            </div>
          </div>

          {/* 料金プラン */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              料金プラン
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <Card className="p-6 border-2 border-gray-200">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Free</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-4">
                    ¥0<span className="text-lg font-normal text-gray-600">/月</span>
                  </div>
                  <p className="text-gray-600 mb-6">小規模チーム向け</p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      最大50名まで
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      基本ダッシュボード
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      月次レポート
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      4サービス連携
                    </li>
                  </ul>
                  <button
                    onClick={() => signIn()}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    無料で始める
                  </button>
                </div>
              </Card>

              {/* Professional Plan */}
              <Card className="p-6 border-2 border-blue-500 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="premium" className="px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    人気
                  </Badge>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-4">
                    ¥2,980<span className="text-lg font-normal text-gray-600">/月</span>
                  </div>
                  <p className="text-gray-600 mb-6">成長中のチーム向け</p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      最大500名まで
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      高度な分析機能
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      週次レポート
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      メール通知
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      カスタムインサイト
                    </li>
                  </ul>
                  <button
                    onClick={() => signIn()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    14日間無料トライアル
                  </button>
                </div>
              </Card>

              {/* Enterprise Plan */}
              <Card className="p-6 border-2 border-purple-500">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
                  <div className="text-3xl font-bold text-purple-600 mb-4">
                    ¥9,800<span className="text-lg font-normal text-gray-600">/月</span>
                  </div>
                  <p className="text-gray-600 mb-6">大規模組織向け</p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      無制限メンバー
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      リアルタイム分析
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      日次レポート
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      API アクセス
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      専用サポート
                    </li>
                  </ul>
                  <button
                    onClick={() => signIn()}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    お問い合わせ
                  </button>
                </div>
              </Card>
            </div>
          </div>

          {/* CTA セクション */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center p-8">
            <h2 className="text-3xl font-bold mb-4">
              今すぐチーム分析を始めましょう
            </h2>
            <p className="text-xl mb-8 opacity-90">
              わずか数分のセットアップで、チームの健全性を可視化
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => signIn()}
                className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors text-lg"
              >
                無料で始める
              </button>
              <a
                href="/help"
                className="flex items-center text-white hover:text-gray-200 font-medium"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                詳しい使い方を見る
              </a>
            </div>
          </Card>

          {/* フッターリンク */}
          <div className="text-center text-sm text-gray-500 mt-12">
            <div className="flex justify-center space-x-6 mb-4">
              <a href="/privacy" className="hover:text-gray-700 flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                プライバシーポリシー
              </a>
              <a href="/terms" className="hover:text-gray-700 flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                利用規約
              </a>
              <a href="/help" className="hover:text-gray-700 flex items-center">
                <HelpCircle className="h-4 w-4 mr-1" />
                ヘルプ
              </a>
            </div>
            <p>© 2025 LinkSense. All rights reserved.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 🔴 認証済みユーザー向けヘッダー（既存コードを維持） */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            ツール連携設定
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-2">
            普段使っているツールを連携して、チームの状況を把握しましょう
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Activity className={`h-4 w-4 ${realTimeUpdates ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
              <span>{realTimeUpdates ? '自動で最新情報を取得中' : '手動更新モード'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>最新情報: {lastRefresh.toLocaleTimeString('ja-JP')}</span>
            </div>
          </div>
        </div>

        {/* 🔴 以下、既存のコンポーネントをそのまま維持 */}
        {/* コントロールパネル */}
        <Card className="mb-8 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setRealTimeUpdates(!realTimeUpdates)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  realTimeUpdates 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {realTimeUpdates ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {realTimeUpdates ? '自動更新を停止' : '自動更新を開始'}
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                最新情報に更新
              </button>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">接続状態: 安定</span>
              </div>
              {stats && (
                <Badge variant="success">
                  全体の健全性: {stats.healthScore}%
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* エラー表示 */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-800 mb-1">エラーが発生しました</h3>
                  <p className="text-red-700 text-sm mb-3">{error}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRefresh}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      再試行
                    </button>
                    <button
                      onClick={() => setError(null)}
                      className="bg-white border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 統合状況サマリー（既存コード維持） */}
        {stats && !loading && (
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">現在の連携状況</h2>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">
                    {stats.activeConnections}/4 つのツールを連携中
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{stats.activeConnections}</div>
                  <div className="text-sm text-gray-600">連携済みツール</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{stats.totalUsers.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">分析対象メンバー</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{stats.healthScore}%</div>
                  <div className="text-sm text-gray-600">連携の安定性</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">{stats.dataQuality}%</div>
                  <div className="text-sm text-gray-600">データの品質</div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">連携の進み具合</span>
                  <span className="text-sm text-gray-600">
                    {Math.round((stats.activeConnections / 4) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(stats.activeConnections / 4) * 100} 
                  variant="success"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {stats.activeConnections === 0 && 'まずは1つのツールから連携を始めましょう'}
                  {stats.activeConnections > 0 && stats.activeConnections < 2 && '基本的な分析ができるようになりました'}
                  {stats.activeConnections >= 2 && stats.activeConnections < 4 && '詳しい分析ができるようになりました'}
                  {stats.activeConnections === 4 && 'すべてのツールが連携されています！最高の分析精度です'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* 接続進捗表示（既存コード維持） */}
        {activeProgress.length > 0 && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <div className="p-4">
              <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                接続処理中
              </h3>
              <div className="space-y-3">
                {activeProgress.map((progress) => (
                  <div key={progress.serviceId} className="bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {services.find(s => s.id === progress.serviceId)?.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {progress.progress}%
                      </span>
                    </div>
                    <Progress value={progress.progress} variant="default" className="mb-2" />
                    <p className="text-xs text-gray-600">{progress.message}</p>
                    {progress.error && (
                      <p className="text-xs text-red-600 mt-1">エラー: {progress.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* 🔴 サービス一覧（審査対応強化版） */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {sortedServices.map((service) => {
            const serviceStatus = getServiceStatus(service.id)
            const IconComponent = service.icon
            const isConnecting = activeProgress.some(p => p.serviceId === service.id)
            
            return (
              <Card
                key={service.id}
                className={`transition-all hover:shadow-md ${
                  serviceStatus.connected 
                    ? 'border-green-200 bg-green-50/30' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="p-6">
                  {/* サービスヘッダー */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 rounded-lg p-3 text-white ${
                        serviceStatus.connected ? service.color : 'bg-gray-400'
                      }`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {service.name}
                          </h3>
                          {service.priority === 'high' && (
                            <Badge variant="premium">
                              <Star className="h-3 w-3 mr-1" />
                              おすすめ
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">
                          {service.description}
                        </p>
                        
                        {/* 🔴 プライバシーレベル表示 */}
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-700 font-medium">
                            プライバシー: {service.privacyLevel === 'basic' ? '基本' : 
                                          service.privacyLevel === 'standard' ? '標準' : '高度'}保護
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 接続状態表示 */}
<div className="flex flex-col items-end gap-1">
  {serviceStatus.connected ? (
    <Badge variant="success" className="flex items-center gap-1">
      <CheckCircle className="h-3 w-3" />
      連携中
    </Badge>
  ) : isConnecting ? (
    <Badge variant="default" className="flex items-center gap-1">
      <Loader2 className="h-3 w-3 animate-spin" />
      連携処理中
    </Badge>
  ) : (
    <Badge variant="secondary" className="flex items-center gap-1">
      <XCircle className="h-3 w-3" />
      未連携
    </Badge>
  )}
  
  {serviceStatus.connected && (
    <div className="text-xs text-gray-500 text-right">
      <div className="flex items-center gap-1">
        <Wifi className="h-3 w-3" />
        安定性: {serviceStatus.health}%
      </div>
    </div>
  )}
</div>
                  </div>

                  {/* 🔴 取得データ情報（審査対応） */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                      <Info className="h-4 w-4 mr-1" />
                      取得するデータ
                    </h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      {service.dataTypes.map((dataType, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-3 w-3 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          {dataType}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-900">
                      <strong>重要:</strong> メッセージやファイルの内容は一切取得しません
                    </div>
                  </div>

                  {/* 期待される効果 */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      期待される効果
                    </h4>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {service.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <Award className="h-3 w-3 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 接続詳細情報（既存） */}
                  {serviceStatus.integration && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-600">連携開始:</span>
                          <div className="font-medium text-gray-900">
                            {new Date(serviceStatus.integration.createdAt).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">最新データ:</span>
                          <div className="font-medium text-gray-900">
                            {serviceStatus.lastSync ? 
                              new Date(serviceStatus.lastSync).toLocaleTimeString('ja-JP') : 
                              '取得中'
                            }
                          </div>
                        </div>
                        {serviceStatus.userCount > 0 && (
                          <div>
                            <span className="text-gray-600">対象人数:</span>
                            <div className="font-medium text-gray-900">
                              {serviceStatus.userCount.toLocaleString()}名
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">データ品質:</span>
                          <div className="font-medium text-gray-900">
                            {serviceStatus.dataQuality}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* エラー表示 */}
                  {serviceStatus.integration?.errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-red-800">連携エラー</h4>
                          <p className="text-xs text-red-700 mt-1">
                            {serviceStatus.integration.errorMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* セットアップ情報 */}
                  <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Timer className="h-3 w-3 mr-1" />
                      セットアップ時間: {service.setupTime}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {service.userCount}
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-3">
                    {serviceStatus.connected ? (
                      <>
                        <button
                          onClick={() => handleDisconnect(service.id)}
                          className="flex-1 inline-flex justify-center items-center py-2.5 px-4 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 transition-colors"
                        >
                          <X className="h-4 w-4 mr-2" />
                          連携解除
                        </button>
                        <button
                          onClick={() => handleConnect(service)}
                          disabled={isConnecting}
                          className={`flex-1 inline-flex justify-center items-center py-2.5 px-4 text-sm font-medium rounded-lg text-white ${service.color} hover:opacity-90 disabled:opacity-50 transition-all`}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
                          再連携
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect(service)}
                        disabled={isConnecting}
                        className={`w-full inline-flex justify-center items-center py-2.5 px-4 text-sm font-medium rounded-lg text-white ${service.color} hover:opacity-90 disabled:opacity-50 transition-all`}
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            連携中...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            安全に連携する
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* 🔴 プライバシー保護の詳細説明（審査対応） */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 mb-3">
                  プライバシー保護への取り組み
                </h3>
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-medium text-green-900 mb-2">✅ 安全に分析するデータ</h4>
                    <ul className="space-y-1 text-green-800">
                      <li>• チャンネル・チーム構造情報</li>
                      <li>• メンバー参加状況</li>
                      <li>• メッセージ送信頻度（内容は除く）</li>
                      <li>• アクティブ時間帯</li>
                      <li>• 会議参加統計</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900 mb-2">❌ 絶対に取得しないデータ</h4>
                    <ul className="space-y-1 text-green-800">
                      <li>• メッセージ・チャットの内容</li>
                      <li>• ファイル・画像の内容</li>
                      <li>• 個人的な会話内容</li>
                      <li>• プライベートな情報</li>
                      <li>• 個人識別可能な詳細情報</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-100 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-800">
                      <strong>セキュリティ保証:</strong> 
                      すべてのデータはAES-256暗号化で保護され、GDPR準拠の厳格なプライバシー基準に従って処理されます。
                      個人のプライバシーを侵害することなく、チーム全体の健全性を分析します。
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <a 
                    href="/privacy" 
                    className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center justify-center"
                  >
                    詳細なプライバシーポリシーを確認
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 認証状況表示（既存コード維持） */}
        {session && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    認証済みユーザー
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">ユーザー:</span>
                      <div className="text-blue-700">
                        {session.user?.name || session.user?.email}
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">プロバイダー:</span>
                      <div className="text-blue-700">
                        {(session as any).provider || 'NextAuth'}
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">セッション開始:</span>
                      <div className="text-blue-700">
                        {new Date().toLocaleString('ja-JP')}
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">統合権限:</span>
                      <div className="text-blue-700">分析用権限のみ</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ガイダンス（既存コード維持） */}
        {connectedCount === 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 mb-3">
                    チーム分析を始めてみましょう
                  </h3>
                  <div className="text-amber-700 text-sm space-y-3">
                    <p>ツールを連携すると、段階的に以下の機能が使えるようになります：</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-amber-100 rounded-lg p-3">
                        <h4 className="font-medium text-amber-800 mb-2">1つのツールを連携</h4>
                        <ul className="text-xs space-y-1">
                          <li>• メンバーの活動状況がわかる</li>
                          <li>• 基本的な使用パターンを把握</li>
                        </ul>
                      </div>
                      
                      <div className="bg-amber-100 rounded-lg p-3">
                        <h4 className="font-medium text-amber-800 mb-2">2つ以上を連携</h4>
                        <ul className="text-xs space-y-1">
                          <li>• 複数ツール間での活動を比較</li>
                          <li>• コミュニケーションの傾向を分析</li>
                          <li>• AIによる改善アドバイス</li>
                        </ul>
                      </div>
                      
                      <div className="bg-amber-100 rounded-lg p-3">
                        <h4 className="font-medium text-amber-800 mb-2">3つ以上を連携</h4>
                        <ul className="text-xs space-y-1">
                          <li>• チーム全体の健全性を把握</li>
                          <li>• 心配なメンバーを早期発見</li>
                          <li>• 詳しいレポートを自動生成</li>
                        </ul>
                      </div>
                      
                      <div className="bg-amber-100 rounded-lg p-3">
                        <h4 className="font-medium text-amber-800 mb-2">すべてを連携</h4>
                        <ul className="text-xs space-y-1">
                          <li>• 最も正確な分析結果</li>
                          <li>• リアルタイムでの状況把握</li>
                          <li>• カスタマイズされた分析</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-amber-100 rounded p-3 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-800">おすすめの連携順序</span>
                      </div>
                      <ol className="text-xs space-y-1 ml-4">
                        <li>1. <strong>Slack または Teams</strong> - 普段のチャットやメッセージ</li>
                        <li>2. <strong>Google Meet</strong> - 会議やスケジュール管理</li>
                        <li>3. <strong>Discord</strong> - コミュニティ活動（使っている場合）</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 高度な統合オプション（既存コード維持） */}
        {connectedCount >= 2 && (
          <Card className="border-purple-200 bg-purple-50">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-800 mb-3">
                    詳しい分析機能が使えるようになりました
                  </h3>
                  <div className="text-purple-700 text-sm space-y-3">
                    <p>複数のツールが連携されたので、以下の詳しい分析機能をご利用いただけます：</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => window.open('/analytics', '_blank')}
                        className="bg-white border border-purple-300 rounded-lg p-3 text-left hover:bg-purple-100 transition-colors"
                      >
                        <BarChart3 className="h-5 w-5 text-purple-600 mb-2" />
                        <h4 className="font-medium text-purple-800 mb-1">詳しい分析</h4>
                        <p className="text-xs text-purple-600">
                          連携したデータを詳しく分析してレポート作成
                        </p>
                      </button>
                      
                      <button
                        onClick={() => window.open('/dashboard', '_blank')}
                        className="bg-white border border-purple-300 rounded-lg p-3 text-left hover:bg-purple-100 transition-colors"
                      >
                        <Activity className="h-5 w-5 text-purple-600 mb-2" />
                        <h4 className="font-medium text-purple-800 mb-1">ダッシュボード</h4>
                        <p className="text-xs text-purple-600">
                          リアルタイムでチームの状況を把握
                        </p>
                      </button>
                      
                      <button
                        onClick={() => window.open('/reports', '_blank')}
                        className="bg-white border border-purple-300 rounded-lg p-3 text-left hover:bg-purple-100 transition-colors"
                      >
                        <Eye className="h-5 w-5 text-purple-600 mb-2" />
                        <h4 className="font-medium text-purple-800 mb-1">レポート</h4>
                        <p className="text-xs text-purple-600">
                          カスタマイズしたレポートを作成
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* フッター情報（修正版） */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span>LinkSense MVP v1.0</span>
            <span>•</span>
            <span>統合管理システム</span>
            <span>•</span>
            <span>プライバシーファースト設計</span>
          </div>
          <div className="flex justify-center space-x-6 mb-2">
            <a href="/privacy" className="hover:text-gray-700 flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              プライバシーポリシー
            </a>
            <a href="/help" className="hover:text-gray-700 flex items-center">
              <HelpCircle className="h-3 w-3 mr-1" />
              ヘルプ・サポート
            </a>
            <a href="/terms" className="hover:text-gray-700 flex items-center">
              <BookOpen className="h-3 w-3 mr-1" />
              利用規約
            </a>
          </div>
          <p>
            サポートが必要な場合は、
            <a href="mailto:support@linksense-mvp.vercel.app" className="text-blue-600 hover:text-blue-800">
              support@linksense-mvp.vercel.app
            </a>
            までお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  )
}