'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsData {
  overview: {
    totalMembers: number;
    activeTeams: number;
    avgHealthScore: number;
    trendDirection: 'up' | 'down' | 'stable';
  };
  healthTrends: {
    month: string;
    overall: number;
    stress: number;
    satisfaction: number;
    engagement: number;
  }[];
  departmentComparison: {
    department: string;
    healthScore: number;
    memberCount: number;
    change: number;
  }[];
  riskFactors: {
    factor: string;
    impact: 'high' | 'medium' | 'low';
    affectedMembers: number;
    description: string;
  }[];
  predictions: {
    metric: string;
    current: number;
    predicted: number;
    confidence: number;
    timeframe: string;
  }[];
  heatmapData: {
    day: string;
    hour: number;
    value: number;
  }[];
}

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [dateRange, setDateRange] = useState('30days');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      
      // モックデータ
      const mockData: AnalyticsData = {
        overview: {
          totalMembers: 26,
          activeTeams: 5,
          avgHealthScore: 78,
          trendDirection: 'down'
        },
        healthTrends: [
          { month: '1月', overall: 82, stress: 45, satisfaction: 88, engagement: 85 },
          { month: '2月', overall: 80, stress: 48, satisfaction: 86, engagement: 82 },
          { month: '3月', overall: 79, stress: 52, satisfaction: 84, engagement: 80 },
          { month: '4月', overall: 76, stress: 58, satisfaction: 82, engagement: 78 },
          { month: '5月', overall: 78, stress: 55, satisfaction: 85, engagement: 75 }
        ],
        departmentComparison: [
          { department: '開発部', healthScore: 78, memberCount: 8, change: -5 },
          { department: 'デザイン部', healthScore: 85, memberCount: 5, change: 3 },
          { department: 'マーケティング部', healthScore: 72, memberCount: 6, change: -2 },
          { department: 'QA部', healthScore: 88, memberCount: 4, change: 5 },
          { department: 'インフラ部', healthScore: 82, memberCount: 3, change: 1 }
        ],
        riskFactors: [
          {
            factor: '高ストレスレベル',
            impact: 'high',
            affectedMembers: 8,
            description: '開発部メンバーの60%がストレス値70以上'
          },
          {
            factor: 'コミュニケーション不足',
            impact: 'medium',
            affectedMembers: 12,
            description: 'リモートワークでの情報共有遅延'
          },
          {
            factor: 'ワークライフバランス',
            impact: 'medium',
            affectedMembers: 6,
            description: '残業時間の増加傾向'
          },
          {
            factor: 'スキル不足',
            impact: 'low',
            affectedMembers: 4,
            description: '新技術への適応課題'
          }
        ],
        predictions: [
          {
            metric: '全体健全性スコア',
            current: 78,
            predicted: 75,
            confidence: 85,
            timeframe: '1ヶ月後'
          },
          {
            metric: 'ストレスレベル',
            current: 55,
            predicted: 62,
            confidence: 78,
            timeframe: '2週間後'
          },
          {
            metric: 'エンゲージメント',
            current: 75,
            predicted: 72,
            confidence: 72,
            timeframe: '1ヶ月後'
          }
        ],
        heatmapData: [
          { day: '月', hour: 9, value: 85 },
          { day: '月', hour: 10, value: 92 },
          { day: '月', hour: 11, value: 88 },
          { day: '月', hour: 14, value: 75 },
          { day: '月', hour: 15, value: 82 },
          { day: '火', hour: 9, value: 90 },
          { day: '火', hour: 10, value: 95 },
          { day: '火', hour: 11, value: 85 },
          { day: '火', hour: 14, value: 78 },
          { day: '火', hour: 15, value: 80 },
          // ... 他の曜日・時間のデータ
        ]
      };

      setTimeout(() => {
        setAnalyticsData(mockData);
        setIsLoading(false);
      }, 1000);
    };

    fetchAnalyticsData();
    return undefined;
  }, [dateRange]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>;
      case 'down':
        return <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>;
      default:
        return <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">高度な分析データを処理中...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">データの読み込みに失敗しました</h2>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">高度なアナリティクス</h1>
              <p className="text-gray-600 mt-1">組織の健全性に関する詳細な分析と予測</p>
            </div>
            <div className="flex space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7days">過去7日</option>
                <option value="30days">過去30日</option>
                <option value="90days">過去90日</option>
                <option value="1year">過去1年</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                レポート出力
              </button>
            </div>
          </div>

          {/* 概要カード */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総メンバー数</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalMembers}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">アクティブチーム</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.activeTeams}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">平均健全性スコア</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-gray-900 mr-2">{analyticsData.overview.avgHealthScore}</p>
                    {getTrendIcon(analyticsData.overview.trendDirection)}
                  </div>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">リスク要因</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.riskFactors.filter(r => r.impact === 'high').length}
                  </p>
                  <p className="text-xs text-gray-500">高リスク</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: '概要' },
              { id: 'trends', label: 'トレンド分析' },
              { id: 'departments', label: '部署比較' },
              { id: 'risks', label: 'リスク分析' },
              { id: 'predictions', label: 'AI予測' },
              { id: 'heatmap', label: 'ヒートマップ' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* コンテンツエリア */}
        {activeView === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">健全性トレンド（5ヶ月）</h3>
              <div className="h-80 flex items-end justify-between space-x-4">
                {analyticsData.healthTrends.map((trend, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span>全体</span>
                        <span className="font-medium">{trend.overall}%</span>
                      </div>
                      <div
                        className="bg-blue-500 rounded"
                        style={{ height: `${(trend.overall / 100) * 200}px` }}
                      ></div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span>満足度</span>
                        <span className="font-medium">{trend.satisfaction}%</span>
                      </div>
                      <div
                        className="bg-green-500 rounded"
                        style={{ height: `${(trend.satisfaction / 100) * 200}px` }}
                      ></div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span>ストレス</span>
                        <span className="font-medium">{trend.stress}%</span>
                      </div>
                      <div
                        className="bg-red-500 rounded"
                        style={{ height: `${(trend.stress / 100) * 200}px` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{trend.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'departments' && (
          <div className="space-y-6">
            {analyticsData.departmentComparison.map((dept, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{dept.department}</h3>
                    <p className="text-sm text-gray-600">{dept.memberCount}名</p>
                  </div>
                  <div className="text-right">
                     <div className="text-2xl font-bold text-gray-900">{dept.healthScore}</div>
                    <div className={`text-sm font-medium ${dept.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dept.change >= 0 ? '+' : ''}{dept.change}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      dept.healthScore >= 80 ? 'bg-green-500' :
                      dept.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dept.healthScore}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'risks' && (
          <div className="space-y-4">
            {analyticsData.riskFactors.map((risk, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">{risk.factor}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getImpactColor(risk.impact)}`}>
                        {risk.impact === 'high' ? '高リスク' : risk.impact === 'medium' ? '中リスク' : '低リスク'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{risk.description}</p>
                    <p className="text-sm text-gray-500">影響を受けるメンバー: {risk.affectedMembers}名</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                    詳細分析
                  </button>
                  <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">
                    対策提案
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'predictions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI予測分析</h3>
              <div className="space-y-4">
                {analyticsData.predictions.map((prediction, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{prediction.metric}</h4>
                      <span className="text-sm text-gray-500">{prediction.timeframe}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{prediction.current}</div>
                        <div className="text-sm text-gray-600">現在</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          prediction.predicted < prediction.current ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {prediction.predicted}
                        </div>
                        <div className="text-sm text-gray-600">予測値</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{prediction.confidence}%</div>
                        <div className="text-sm text-gray-600">信頼度</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${prediction.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'heatmap' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">活動ヒートマップ</h3>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-8 gap-1 min-w-full">
                <div></div>
                {['9時', '10時', '11時', '12時', '13時', '14時', '15時', '16時'].map((hour) => (
                  <div key={hour} className="text-center text-sm font-medium text-gray-600 p-2">
                    {hour}
                  </div>
                ))}
                {['月', '火', '水', '木', '金'].map((day) => (
                  <React.Fragment key={day}>
                    <div className="text-sm font-medium text-gray-600 p-2">{day}</div>
                    {[9, 10, 11, 12, 13, 14, 15, 16].map((hour) => {
                      const dataPoint = analyticsData.heatmapData.find(d => d.day === day && d.hour === hour);
                      const value = dataPoint?.value || Math.floor(Math.random() * 100);
                      return (
                        <div
                          key={`${day}-${hour}`}
                          className="w-12 h-12 rounded flex items-center justify-center text-xs font-medium"
                          style={{
                            backgroundColor: `rgba(59, 130, 246, ${value / 100})`,
                            color: value > 50 ? 'white' : 'black'
                          }}
                          title={`${day}曜日 ${hour}時: ${value}%`}
                        >
                          {value}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>低活動</span>
              <div className="flex space-x-1">
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((opacity) => (
                  <div
                    key={opacity}
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
                  ></div>
                ))}
              </div>
              <span>高活動</span>
            </div>
          </div>
        )}

        {activeView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">主要メトリクス推移</h3>
              <div className="space-y-4">
                {analyticsData.healthTrends.slice(-3).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-600">{trend.month}</span>
                    <div className="flex space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-blue-600">{trend.overall}%</div>
                        <div className="text-xs text-gray-500">全体</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-600">{trend.satisfaction}%</div>
                        <div className="text-xs text-gray-500">満足度</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-red-600">{trend.stress}%</div>
                        <div className="text-xs text-gray-500">ストレス</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">緊急対応が必要な項目</h3>
              <div className="space-y-3">
                {analyticsData.riskFactors.filter(r => r.impact === 'high').map((risk, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium text-red-900">{risk.factor}</div>
                      <div className="text-sm text-red-700">{risk.affectedMembers}名に影響</div>
                    </div>
                    <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                      対応
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;