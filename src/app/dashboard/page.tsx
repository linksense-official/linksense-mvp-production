'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import mockApi from '@/lib/mockApi';
import { DashboardStats, TeamMember, HealthAlert, APIResponse } from '@/types/api';

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || isLoading) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 並行してデータを取得
        const [statsResponse, membersResponse, alertsResponse] = await Promise.all([
          mockApi.getDashboardStats(),
          mockApi.getTeamMembers(),
          mockApi.getHealthAlerts()
        ]);

        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        }

        if (membersResponse.success && membersResponse.data) {
          setTeamMembers(membersResponse.data);
        }

        if (alertsResponse.success && alertsResponse.data) {
          setAlerts(alertsResponse.data);
        }

      } catch (err) {
        console.error('ダッシュボードデータ取得エラー:', err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, isLoading]);

  // 健全性スコアの色を取得
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // アラートの重要度色を取得
  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // バーンアウトリスクの色を取得
  const getBurnoutRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">ダッシュボードを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-red-800">エラーが発生しました</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">データが見つかりません</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">チーム健全性ダッシュボード</h1>
          <p className="mt-2 text-gray-600">
            チーム全体の健全性とウェルビーイングの状況を確認できます
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 総合健全性スコア */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    チーム健全性スコア
                  </dt>
                  <dd className={`text-lg font-medium ${getHealthScoreColor(stats.averageHealthScore)}`}>
                    {stats.averageHealthScore}/100
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* アクティブメンバー */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    アクティブメンバー
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeMembers}/{stats.totalMembers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* リスクメンバー */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    要注意メンバー
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {stats.atRiskMembers}人
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* チーム満足度 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    チーム満足度
                  </dt>
                  <dd className={`text-lg font-medium ${getHealthScoreColor(stats.teamSatisfaction)}`}>
                    {stats.teamSatisfaction}/100
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 最新アラート */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  最新のアラート
                </h3>
                {stats.recentAlerts && stats.recentAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`border rounded-lg p-4 ${getAlertSeverityColor(alert.severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{alert.title}</h4>
                            <p className="text-sm mt-1">{alert.description}</p>
                            <div className="flex items-center mt-2 text-xs space-x-4">
                              <span>👤 {alert.memberName}</span>
                              <span>🏢 {alert.department}</span>
                              <span>📅 {new Date(alert.createdAt).toLocaleDateString('ja-JP')}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {alert.severity === 'critical' ? '緊急' :
                               alert.severity === 'high' ? '高' :
                               alert.severity === 'medium' ? '中' : '低'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">アラートはありません</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      現在、緊急のアラートはありません。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 部署別健全性 */}
          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  部署別健全性
                </h3>
                <div className="space-y-4">
                  {stats.departmentBreakdown.map((dept) => (
                    <div key={dept.department} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{dept.department}</h4>
                        <p className="text-xs text-gray-500">{dept.memberCount}人</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              dept.averageScore >= 80 ? 'bg-green-600' :
                              dept.averageScore >= 60 ? 'bg-yellow-600' :
                              dept.averageScore >= 40 ? 'bg-orange-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${dept.averageScore}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getHealthScoreColor(dept.averageScore)}`}>
                          {dept.averageScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* トレンド */}
            <div className="bg-white shadow rounded-lg mt-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  先月比トレンド
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">健全性スコア</span>
                    <div className="flex items-center">
                      {stats.trends.healthScoreChange >= 0 ? (
                        <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-sm font-medium ${
                        stats.trends.healthScoreChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stats.trends.healthScoreChange > 0 ? '+' : ''}{stats.trends.healthScoreChange}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">エンゲージメント</span>
                    <div className="flex items-center">
                      {stats.trends.engagementChange >= 0 ? (
                        <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-sm font-medium ${
                        stats.trends.engagementChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stats.trends.engagementChange > 0 ? '+' : ''}{stats.trends.engagementChange}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ストレスレベル</span>
                    <div className="flex items-center">
                      {stats.trends.stressChange <= 0 ? (
                        <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-sm font-medium ${
                        stats.trends.stressChange <= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stats.trends.stressChange > 0 ? '+' : ''}{stats.trends.stressChange}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* チームメンバー一覧 */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                チームメンバー健全性
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        メンバー
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        部署
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        健全性スコア
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ストレスレベル
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        バーンアウトリスク
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最終更新
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {member.name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* ✅ 修正: healthMetrics の undefined チェック追加 */}
                          {member.healthMetrics ? (
                            <span className={`text-sm font-medium ${getHealthScoreColor(member.healthMetrics.overallScore)}`}>
                              {member.healthMetrics.overallScore}/100
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">データなし</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* ✅ 修正: healthMetrics の undefined チェック追加 */}
                          {member.healthMetrics ? (
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    member.healthMetrics.stressLevel >= 80 ? 'bg-red-600' :
                                    member.healthMetrics.stressLevel >= 60 ? 'bg-orange-600' :
                                    member.healthMetrics.stressLevel >= 40 ? 'bg-yellow-600' : 'bg-green-600'
                                  }`}
                                  style={{ width: `${member.healthMetrics.stressLevel}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{member.healthMetrics.stressLevel}%</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">データなし</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* ✅ 修正: healthMetrics の undefined チェック追加 */}
                          {member.healthMetrics ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBurnoutRiskColor(member.healthMetrics.burnoutRisk)}`}>
                              {member.healthMetrics.burnoutRisk === 'high' ? '高' :
                               member.healthMetrics.burnoutRisk === 'medium' ? '中' : '低'}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">データなし</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {/* ✅ 修正: healthMetrics の undefined チェック追加 */}
                          {member.healthMetrics ? (
                            new Date(member.healthMetrics.lastUpdated).toLocaleDateString('ja-JP')
                          ) : (
                            '未更新'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;