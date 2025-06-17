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
  BarChart3  // ← この行を追加
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
  // 新機能フィールド
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

// 4サービス設定（拡張版）
const services: ServiceConfig[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'チームのやり取りを分析して、コミュニケーションの活発度を測定',
    icon: MessageSquare,
    color: 'bg-purple-600',
    authUrl: '/api/auth/signin/slack',
    isNextAuth: true,
    features: ['メッセージのやり取り分析', 'チャンネルの活用状況', 'メンバーの参加度', 'リアクションの傾向'],
    priority: 'high'
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'コミュニティの活動状況とメンバー同士の交流を分析',
    icon: Users,
    color: 'bg-indigo-600',
    authUrl: '/api/auth/signin/discord',
    isNextAuth: true,
    features: ['サーバーの活動状況', 'ボイスチャットの利用', 'コミュニティの健全性'],
    priority: 'medium'
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: '会議やチャットでのチームワークを分析して、協力関係を把握',
    icon: Building2,
    color: 'bg-blue-600',
    authUrl: '/api/auth/signin/azure-ad',
    isNextAuth: true,
    features: ['会議の参加状況', 'チャットでのやり取り', 'ファイルの共有状況', 'スケジュールの連携'],
    priority: 'high'
  },
  {
    id: 'google',
    name: 'Google Meet',
    description: 'オンライン会議の参加状況とスケジュール管理を分析',
    icon: Video,
    color: 'bg-red-600',
    authUrl: '/api/auth/signin/google',
    isNextAuth: true,
    features: ['会議の参加状況', 'カレンダーとの連携', '参加者の活動度', '時間の使い方分析'],
    priority: 'high'
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
  variant?: 'default' | 'success' | 'destructive' | 'secondary';
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    destructive: "bg-red-100 text-red-800",
    secondary: "bg-gray-100 text-gray-800"
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

  // 統計計算関数（この1つだけ残す）
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

 // 並行データ取得の最適化
  const fetchIntegrationsOptimized = useCallback(async (): Promise<void> => {
    if (!session?.user?.id) return

    try {
      setError(null)
      console.log('🚀 統合状態の並行取得開始')
      
      // 並行でデータ取得（エラーハンドリング強化）
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

      // 統合情報処理（改善されたエラーハンドリング）
      if (integrationsResult.status === 'fulfilled') {
        const integrationsResponse = integrationsResult.value as Response
        if (integrationsResponse.ok) {
          try {
            const contentType = integrationsResponse.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
              const data = await integrationsResponse.json()
              
              // 拡張情報付きで設定
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
              // フォールバック: 空の統合リスト
              setIntegrations([])
            }
          } catch (parseError) {
            console.warn('JSON解析エラー:', parseError)
            // フォールバック: 空の統合リスト
            setIntegrations([])
          }
        } else {
          console.warn('統合API応答エラー:', integrationsResponse.status, integrationsResponse.statusText)
          // フォールバック: 空の統合リスト
          setIntegrations([])
        }
      } else {
        console.warn('統合API取得失敗:', integrationsResult.reason)
        setIntegrations([])
      }

      // 統計情報処理（改善されたエラーハンドリング）
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
              // フォールバック統計計算
              calculatedStats = calculateStats(enhancedIntegrations)
            }
          } catch (parseError) {
            console.warn('統計JSON解析エラー:', parseError)
            calculatedStats = calculateStats(enhancedIntegrations)
          }
        } else {
          // フォールバック統計計算
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
      // より具体的なエラーメッセージ
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('サーバーに接続できません。ネットワーク接続を確認してください。')
      } else {
        setError('統合情報の取得に失敗しました。しばらく待ってから再試行してください。')
      }
      
      // フォールバック状態設定
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

// リアルタイム更新
useEffect(() => {
  if (session?.user?.id) {
    fetchIntegrationsOptimized()
    
    if (realTimeUpdates) {
      const interval = setInterval(fetchIntegrationsOptimized, 30000) // 30秒間隔
      return () => clearInterval(interval)
    }
  }
  
  // 全てのコードパスで戻り値を返すように修正
  return undefined
}, [session?.user?.id, realTimeUpdates, fetchIntegrationsOptimized])

  // OAuth成功後の処理
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    
    if (success === 'true') {
      setTimeout(() => {
        fetchIntegrationsOptimized()
      }, 1000)
      
      // URLクリーンアップ
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    } else if (error) {
      setError(`認証エラー: ${error}`)
    }
  }, [fetchIntegrationsOptimized])

  // サービス接続状態チェック（最適化版）
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

  // 接続処理（進捗表示付き）
  const handleConnect = useCallback(async (service: ServiceConfig) => {
    const progressId = `${service.id}-${Date.now()}`
    
    // 進捗状態初期化
    setConnectionProgress(prev => [...prev, {
      serviceId: service.id,
      step: 'auth',
      progress: 10,
      message: '認証を開始しています...'
    }])
    
    try {
      // 進捗更新: トークン取得
      setConnectionProgress(prev => prev.map(p => 
        p.serviceId === service.id 
          ? { ...p, step: 'token', progress: 30, message: 'トークンを取得中...' }
          : p
      ))
      
      // Teams・Slack専用の直接認証
      if (service.id === 'teams') {
        window.location.href = `/api/teams-auth?callbackUrl=${encodeURIComponent('/integrations?success=true')}`
        return
      }
      
      if (service.id === 'slack') {
        window.location.href = `/api/slack-auth?callbackUrl=${encodeURIComponent('/integrations?success=true')}`
        return
      }
      
      // 進捗更新: 検証
      setConnectionProgress(prev => prev.map(p => 
        p.serviceId === service.id 
          ? { ...p, step: 'validation', progress: 60, message: '接続を検証中...' }
          : p
      ))
      
      // 他のサービス（NextAuth使用）
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

  // 統合解除（確認ダイアログ付き）
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

  // 手動更新
  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await fetchIntegrationsOptimized()
  }, [fetchIntegrationsOptimized])

  // メモ化された計算値
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">認証が必要です</h1>
          <p className="text-gray-600 mb-6">統合管理にはログインが必要です</p>
          <button
            onClick={() => signIn()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Shield className="h-4 w-4" />
            ログイン
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
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

         {/* 統合状況サマリー（4サービス版） */}
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
      
      {/* 統計グリッド */}
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
      
      {/* 全体進捗 */}
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

        {/* 接続進捗表示 */}
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

      {/* サービス一覧（シンプル版） */}
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
          {/* サービスヘッダー（シンプル版） */}
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
                  <Badge variant={service.priority === 'high' ? 'destructive' : 'secondary'}>
                    {service.priority === 'high' ? 'おすすめ' : 'お好みで'}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm">
                  {service.description}
                </p>
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

          {/* 接続詳細情報（簡略版） */}
          {serviceStatus.integration && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
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
                    連携する
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

        {/* 認証状況表示 */}
        {session && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 mb-2">
                    認証済みユーザー
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-600 font-medium">ユーザー:</span>
                      <div className="text-green-700">
                        {session.user?.name || session.user?.email}
                      </div>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">プロバイダー:</span>
                      <div className="text-green-700">
                        {(session as any).provider || 'NextAuth'}
                      </div>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">セッション開始:</span>
                      <div className="text-green-700">
                        {new Date((session as any).expires || Date.now()).toLocaleString('ja-JP')}
                      </div>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">統合権限:</span>
                      <div className="text-green-700">フル権限</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

       {/* ガイダンス */}
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

        {/* 高度な統合オプション */}
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
        {/* フッター情報 */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span>LinkSense MVP v1.0</span>
            <span>•</span>
            <span>統合管理システム</span>
            <span>•</span>
            <span>リアルタイム監視対応</span>
          </div>
          <p>
            サポートが必要な場合は、
            <a href="mailto:support@linksense.app" className="text-blue-600 hover:text-blue-800">
              support@linksense.app
            </a>
            までお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  )
}