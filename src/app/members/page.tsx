'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { UnifiedUser, TeamHealthMetrics, RiskAnalysis } from '@/types/unified-user'
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  MessageSquare,
  Calendar,
  Shield,
  Eye,
  EyeOff,
  Filter,
  Search,
  Download,
  RefreshCw,
  Heart,
  UserCheck,
  UserX,
  Clock,
  Mail,
  Phone
} from 'lucide-react'

export default function MembersPage() {
  const { user, isAuthenticated } = useAuth()
  const [users, setUsers] = useState<UnifiedUser[]>([])
  const [teamHealth, setTeamHealth] = useState<TeamHealthMetrics | null>(null)
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  
  // フィルター・検索状態
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [showSensitiveData, setShowSensitiveData] = useState(false)

  // リアルデータ取得（最適化版）
  const fetchRealData = async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 最適化データ取得開始')
      
      // タイムアウト設定（30秒）
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const response = await fetch('/api/integrations/data', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`データ取得エラー: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // データ検証とフィルタリング
        const validUsers = (data.data.users || []).filter((user: any) => 
          user && user.id && user.name && user.service
        )
        
        setUsers(validUsers)
        setTeamHealth(data.data.teamHealth || null)
        setRiskAnalysis(data.data.riskAnalysis || null)
        setLastUpdated(data.data.metadata?.dataFreshness || new Date().toISOString())
        
        console.log('✅ 最適化データ取得成功:', {
          userCount: validUsers.length,
          healthScore: data.data.teamHealth?.healthScore || 0,
          processingTime: data.data.metadata?.processingStats?.totalProcessingTime || 0
        })
        
        // パフォーマンス警告
        const processingTime = data.data.metadata?.processingStats?.totalProcessingTime || 0
        if (processingTime > 20000) {
          console.warn(`⚠️ 処理時間が長いです: ${processingTime}ms`)
        }
        
      } else {
        throw new Error(data.error || 'データ取得に失敗しました')
      }
    } catch (error) {
      console.error('❌ データ取得エラー:', error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('データ取得がタイムアウトしました。しばらく待ってから再試行してください。')
        } else {
          setError(error.message)
        }
      } else {
        setError('データ取得に失敗しました')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRealData()
  }, [isAuthenticated])

  // フィルタリング処理（最適化版）
  const filteredUsers = useMemo(() => {
    if (!users.length) return []
    
    return users.filter(user => {
      // 検索フィルター（大文字小文字を区別しない）
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.department?.toLowerCase().includes(searchLower) ||
          user.role?.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }
      
      // リスクフィルター
      if (riskFilter !== 'all' && user.isolationRisk !== riskFilter) {
        return false
      }
      
      // サービスフィルター
      if (serviceFilter !== 'all') {
        const userServices = user.service.toLowerCase().split(',').map(s => s.trim())
        if (!userServices.includes(serviceFilter.toLowerCase())) {
          return false
        }
      }
      
      return true
    })
  }, [users, searchTerm, riskFilter, serviceFilter])

  // リスクレベル別の色とアイコン
  const getRiskStyle = (risk: string) => {
    switch (risk) {
      case 'high':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-800',
          icon: AlertTriangle,
          label: '高リスク'
        }
      case 'medium':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: TrendingDown,
          label: '中リスク'
        }
      default:
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          badge: 'bg-green-100 text-green-800',
          icon: TrendingUp,
          label: '低リスク'
        }
    }
  }

  // サービスアイコン取得
  const getServiceIcon = (service: string) => {
    if (service.includes('slack')) return '💬'
    if (service.includes('teams')) return '📞'
    if (service.includes('google')) return '📧'
    if (service.includes('discord')) return '🎮'
    if (service.includes('chatwork')) return '💼'
    return '🔗'
  }

   // CSV エクスポート（最適化版）
  const exportToCSV = useCallback(() => {
    if (!filteredUsers.length) {
      alert('エクスポートするデータがありません')
      return
    }
    
    try {
      console.log('📊 CSV エクスポート開始:', filteredUsers.length, '件')
      
      const csvData = filteredUsers.map(user => ({
        名前: user.name || '',
        メール: showSensitiveData ? (user.email || '') : '***',
        部署: user.department || '',
        サービス: user.service || '',
        役割: user.role || '',
        活動スコア: user.activityScore || 0,
        コミュニケーションスコア: user.communicationScore || 0,
        離職リスク: user.isolationRisk || '',
        関係性: user.relationshipType || '',
        関係性強度: user.relationshipStrength || 0,
        最終活動: user.lastActivity ? new Date(user.lastActivity).toLocaleDateString('ja-JP') : '不明',
        アクティブ: user.isActive ? 'はい' : 'いいえ',
        処理モード: user.metadata?.processingMode || '標準'
      }))

      // CSVヘッダーとデータを結合
      const headers = Object.keys(csvData[0])
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // カンマやダブルクォートを含む値をエスケープ
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ].join('\n')

      // BOMを追加してExcelでの文字化けを防ぐ
      const bom = '\uFEFF'
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
      
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `team_members_optimized_${timestamp}.csv`
      
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // メモリクリーンアップ
      URL.revokeObjectURL(url)
      
      console.log('✅ CSV エクスポート完了:', filename)
      
    } catch (error) {
      console.error('❌ CSV エクスポートエラー:', error)
      alert('CSVエクスポートに失敗しました')
    }
  }, [filteredUsers, showSensitiveData])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">認証が必要です</h1>
          <p className="text-gray-600">チームメンバー情報にアクセスするにはログインしてください</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                チームメンバー分析
              </h1>
              <p className="mt-2 text-gray-600">
                リアルタイムデータに基づく離職リスク分析とチーム健全性評価
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showSensitiveData 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showSensitiveData ? '個人情報を隠す' : '個人情報を表示'}
              </button>
              <button
                onClick={fetchRealData}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                更新
              </button>
            </div>
          </div>

          {lastUpdated && (
            <p className="text-sm text-gray-500">
              最終更新: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-red-800 font-medium">データ取得エラー</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button
                  onClick={fetchRealData}
                  className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        )}

        {/* チーム健全性サマリー */}
        {teamHealth && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総メンバー数</p>
                  <p className="text-2xl font-bold text-gray-900">{teamHealth.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">アクティブメンバー</p>
                  <p className="text-2xl font-bold text-green-600">{teamHealth.activeMembers}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">チーム健全性</p>
                  <p className="text-2xl font-bold text-indigo-600">{teamHealth.healthScore}%</p>
                </div>
                <Heart className="h-8 w-8 text-indigo-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">高リスク者</p>
                  <p className="text-2xl font-bold text-red-600">{teamHealth.isolationRisks.high}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* 離職リスク分析 */}
        {riskAnalysis && riskAnalysis.recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              推奨アクション
            </h2>
            <div className="space-y-4">
              {riskAnalysis.recommendations.map((rec, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  rec.priority === 'high' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        rec.priority === 'high' ? 'text-red-800' : 'text-yellow-800'
                      }`}>
                        {rec.action}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        rec.priority === 'high' ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                        {rec.reason}
                      </p>
                      <div className="mt-2">
                        <p className={`text-sm font-medium ${
                          rec.priority === 'high' ? 'text-red-800' : 'text-yellow-800'
                        }`}>
                          対象者: {showSensitiveData ? rec.targets.join(', ') : `${rec.targets.length}名`}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      rec.priority === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rec.priority === 'high' ? '緊急' : '要注意'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* フィルター・検索 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="名前、メール、部署で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全リスクレベル</option>
              <option value="high">高リスク</option>
              <option value="medium">中リスク</option>
              <option value="low">低リスク</option>
            </select>

            {teamHealth && (
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全サービス</option>
                {Object.keys(teamHealth.serviceDistribution).map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            )}

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              CSV出力
            </button>
          </div>
        </div>

        {/* メンバー一覧 */}
         {loading ? (
          <div className="bg-white rounded-lg shadow p-12">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <div className="space-y-2">
                <p className="text-gray-600 font-medium">最適化データを取得中...</p>
                <p className="text-gray-500 text-sm">各サービスから並行してデータを取得しています</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">メンバーが見つかりません</h3>
              <p className="text-gray-600">
                {users.length === 0 
                  ? 'サービス統合を行ってデータを取得してください' 
                  : '検索条件に一致するメンバーがいません'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUsers.map((member) => {
              const riskStyle = getRiskStyle(member.isolationRisk)
              const RiskIcon = riskStyle.icon

              return (
                <div
                  key={member.id}
                  className={`bg-white rounded-lg shadow border-2 transition-all duration-200 hover:shadow-lg ${riskStyle.bg}`}
                >
                  <div className="p-6">
                    {/* ヘッダー */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                            member.isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {member.name}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {member.department || '部署未設定'}
                          </p>
                        </div>
                      </div>
                      
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${riskStyle.badge}`}>
                        <RiskIcon className="h-3 w-3" />
                        {riskStyle.label}
                      </span>
                    </div>

                    {/* 連絡先情報 */}
                    {showSensitiveData && member.email && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      </div>
                    )}

                    {/* スコア */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">活動</span>
                          <span className="text-sm font-bold text-gray-900">{member.activityScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              member.activityScore >= 80 ? 'bg-green-500' :
                              member.activityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${member.activityScore}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">交流</span>
                          <span className="text-sm font-bold text-gray-900">{member.communicationScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              member.communicationScore >= 80 ? 'bg-green-500' :
                              member.communicationScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${member.communicationScore}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* サービス情報 */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">利用サービス</p>
                      <div className="flex flex-wrap gap-2">
                        {member.service.split(',').map((service, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            <span>{getServiceIcon(service.trim())}</span>
                            {service.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 最終活動 */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>最終活動</span>
                      </div>
                      <span>
                        {member.lastActivity 
                          ? new Date(member.lastActivity).toLocaleDateString()
                          : '不明'
                        }
                      </span>
                    </div>

                      {/* 詳細情報（最適化版） */}
                    <div className="mt-2 space-y-1">
                      {member.metadata?.workingHours && (
                        <div className="text-xs text-gray-500">
                          勤務地: {member.metadata.workingHours}
                        </div>
                      )}
                         {member.metadata?.processingMode && (
                        <div className="text-xs text-blue-500">
                          処理モード: {member.metadata.processingMode}
                        </div>
                      )}
                      {member.metadata?.processingTime && (
                        <div className="text-xs text-gray-400">
                          取得時間: {member.metadata.processingTime}ms
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* フッター統計 */}
        {filteredUsers.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">表示中の統計</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
                <p className="text-sm text-gray-600">表示メンバー</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {filteredUsers.filter(u => u.isolationRisk === 'low').length}
                </p>
                <p className="text-sm text-gray-600">低リスク</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredUsers.filter(u => u.isolationRisk === 'medium').length}
                </p>
                <p className="text-sm text-gray-600">中リスク</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {filteredUsers.filter(u => u.isolationRisk === 'high').length}
                </p>
                <p className="text-sm text-gray-600">高リスク</p>
              </div>
            </div>
          </div>
        )}
          {/* パフォーマンス統計（最適化版） */}
        {filteredUsers.length > 0 && lastUpdated && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              パフォーマンス統計
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                <p className="text-2xl font-bold text-blue-600">
                    {users.filter(u => u.metadata?.processingMode === 'optimized').length}
                </p>
                <p className="text-sm text-gray-600">最適化処理</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                   {users.filter(u => u.metadata?.processingTime && u.metadata.processingTime < 5000).length}
                </p>
                <p className="text-sm text-gray-600">高速取得(&lt;5s)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {users.filter(u => u.metadata?.processingMode === 'fallback').length}
                </p>
                <p className="text-sm text-gray-600">フォールバック</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(users.map(u => u.service.split(',').map(s => s.trim())).flat()).size}
                </p>
                <p className="text-sm text-gray-600">統合サービス</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                最終更新: {new Date(lastUpdated).toLocaleString('ja-JP')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}