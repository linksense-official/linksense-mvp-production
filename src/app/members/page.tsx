'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
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

interface UnifiedUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  service: string;
  role?: string;
  department?: string;
  lastActivity?: string;
  isActive: boolean;
  activityScore: number;
  communicationScore: number;
  isolationRisk: 'low' | 'medium' | 'high';
  metadata: {
    messageCount?: number;
    meetingCount?: number;
    responseTime?: number;
    workingHours?: string;
    timezone?: string;
    joinDate?: string;
  };
}

interface TeamHealthMetrics {
  totalMembers: number;
  activeMembers: number;
  healthScore: number;
  isolationRisks: {
    high: number;
    medium: number;
    low: number;
  };
  serviceDistribution: Record<string, number>;
  lastUpdated: string;
}

interface RiskAnalysis {
  summary: {
    total: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
  recommendations: Array<{
    priority: string;
    action: string;
    targets: string[];
    reason: string;
  }>;
  trends: {
    improving: number;
    declining: number;
    stable: number;
  };
}

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

  // リアルデータ取得
  const fetchRealData = async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 リアルデータ取得開始')
      
      const response = await fetch('/api/integrations/data')
      
      if (!response.ok) {
        throw new Error(`データ取得エラー: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data.users || [])
        setTeamHealth(data.data.teamHealth || null)
        setRiskAnalysis(data.data.riskAnalysis || null)
        setLastUpdated(data.data.metadata?.dataFreshness || new Date().toISOString())
        
        console.log('✅ リアルデータ取得成功:', {
          userCount: data.data.users?.length || 0,
          healthScore: data.data.teamHealth?.healthScore || 0
        })
      } else {
        throw new Error(data.error || 'データ取得に失敗しました')
      }
    } catch (error) {
      console.error('❌ データ取得エラー:', error)
      setError(error instanceof Error ? error.message : 'データ取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRealData()
  }, [isAuthenticated])

  // フィルタリング処理
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRisk = riskFilter === 'all' || user.isolationRisk === riskFilter
    const matchesService = serviceFilter === 'all' || user.service.includes(serviceFilter)
    
    return matchesSearch && matchesRisk && matchesService
  })

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

  // CSV エクスポート
  const exportToCSV = () => {
    const csvData = filteredUsers.map(user => ({
      名前: user.name,
      メール: showSensitiveData ? user.email : '***',
      部署: user.department,
      サービス: user.service,
      活動スコア: user.activityScore,
      コミュニケーションスコア: user.communicationScore,
      離職リスク: user.isolationRisk,
      最終活動: user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : '不明',
      アクティブ: user.isActive ? 'はい' : 'いいえ'
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `team_members_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
              <p className="text-gray-600">リアルデータを取得中...</p>
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

                    {/* 詳細情報 */}
                    {member.metadata.workingHours && (
                      <div className="mt-2 text-xs text-gray-500">
                        勤務地: {member.metadata.workingHours}
                      </div>
                    )}
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
      </div>
    </div>
  )
}