'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface ReportDetail {
  id: string;
  title: string;
  team: string;
  period: string;
  generatedAt: string;
  summary: {
    overallScore: number;
    trend: 'up' | 'down' | 'stable';
    keyFindings: string[];
  };
  metrics: {
    name: string;
    value: number;
    target: number;
    trend: number;
    status: 'good' | 'warning' | 'critical';
  }[];
  insights: {
    category: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendations: string[];
  }[];
  charts: {
    type: 'line' | 'bar' | 'pie';
    title: string;
    data: any[];
  }[];
}

const ReportDetailPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('summary');

  useEffect(() => {
    const fetchReportDetail = async () => {
      setIsLoading(true);
      
      // モックデータ
      const mockReport: ReportDetail = {
        id: params.id as string,
        title: '開発チーム健全性レポート',
        team: '開発部',
        period: '2025年5月',
        generatedAt: '2025-05-26T12:00:00Z',
        summary: {
          overallScore: 78,
          trend: 'down',
          keyFindings: [
            'ストレスレベルが前月比15%上昇',
            'コミュニケーション頻度が20%減少',
            'プロジェクト満足度は安定',
            '技術スキル向上意欲は高水準維持'
          ]
        },
        metrics: [
          { name: 'チーム満足度', value: 82, target: 85, trend: -3, status: 'warning' },
          { name: 'ストレスレベル', value: 68, target: 50, trend: 15, status: 'critical' },
          { name: 'コミュニケーション', value: 75, target: 80, trend: -5, status: 'warning' },
          { name: 'ワークライフバランス', value: 79, target: 75, trend: 2, status: 'good' },
          { name: 'スキル成長', value: 88, target: 80, trend: 8, status: 'good' }
        ],
        insights: [
          {
            category: 'ストレス管理',
            title: 'プロジェクト締切によるプレッシャー増加',
            description: '複数のプロジェクトの締切が重なり、チームメンバーのストレスレベルが上昇しています。特に新機能開発とバグ修正の並行作業が負担となっています。',
            impact: 'high',
            recommendations: [
              'プロジェクトの優先順位を再評価',
              'タスクの分散と負荷調整',
              'リラクゼーション時間の確保'
            ]
          },
          {
            category: 'コミュニケーション',
            title: 'リモートワークでの情報共有課題',
            description: 'リモートワーク環境下で、非公式なコミュニケーションが減少し、情報共有に遅れが生じています。',
            impact: 'medium',
            recommendations: [
              'オンライン雑談時間の設定',
              '定期的な1on1ミーティング',
              'チャットツールの活用促進'
            ]
          }
        ],
        charts: [
          {
            type: 'line',
            title: 'ストレスレベル推移',
            data: [
              { month: '1月', value: 45 },
              { month: '2月', value: 48 },
              { month: '3月', value: 52 },
              { month: '4月', value: 58 },
              { month: '5月', value: 68 }
            ]
          }
        ]
      };

      setTimeout(() => {
        setReport(mockReport);
        setIsLoading(false);
      }, 500);
    };

    if (params.id) {
      fetchReportDetail();
    }
    return undefined;
  }, [params.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">レポートが見つかりません</h2>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            戻る
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
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              レポート一覧に戻る
            </button>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                PDFエクスポート
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                共有
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{report.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>チーム: {report.team}</span>
                  <span>期間: {report.period}</span>
                  <span>生成日: {new Date(report.generatedAt).toLocaleString('ja-JP')}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{report.summary.overallScore}</div>
                <div className="text-sm text-gray-600">総合スコア</div>
                <div className={`inline-flex items-center mt-1 ${
                  report.summary.trend === 'up' ? 'text-green-600' :
                  report.summary.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {report.summary.trend === 'up' ? '↗' : report.summary.trend === 'down' ? '↘' : '→'}
                  <span className="ml-1 text-sm">
                    {report.summary.trend === 'up' ? '上昇' :
                     report.summary.trend === 'down' ? '下降' : '安定'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'summary', label: 'サマリー' },
              { id: 'metrics', label: 'メトリクス' },
              { id: 'insights', label: 'インサイト' },
              { id: 'charts', label: 'チャート' }
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* コンテンツ */}
        {activeSection === 'summary' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">主要な発見事項</h3>
            <ul className="space-y-3">
              {report.summary.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <span className="text-gray-700">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeSection === 'metrics' && (
          <div className="space-y-6">
            {report.metrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{metric.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(metric.status)}`}>
                    {metric.status === 'good' ? '良好' : metric.status === 'warning' ? '注意' : '危険'}
                  </span>
                </div>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{metric.value}%</div>
                    <div className="text-sm text-gray-600">目標: {metric.target}%</div>
                  </div>
                  <div className={`text-right ${metric.trend > 0 ? 'text-red-600' : metric.trend < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    <div className="text-lg font-semibold">
                      {metric.trend > 0 ? '+' : ''}{metric.trend}%
                    </div>
                    <div className="text-sm">前月比</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      metric.status === 'good' ? 'bg-green-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(metric.value, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'insights' && (
          <div className="space-y-6">
            {report.insights.map((insight, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium mr-3">
                        {insight.category}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${getImpactColor(insight.impact)}`}></div>
                      <span className="ml-2 text-sm text-gray-600 capitalize">{insight.impact} Impact</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{insight.title}</h3>
                    <p className="text-gray-700 mb-4">{insight.description}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">推奨アクション:</h4>
                  <ul className="space-y-2">
                    {insight.recommendations.map((rec, recIndex) => (
                      <li key={recIndex} className="flex items-start">
                        <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'charts' && (
          <div className="space-y-6">
            {report.charts.map((chart, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{chart.title}</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  {chart.type === 'line' && (
                    <div className="w-full h-full p-4">
                      <svg className="w-full h-full" viewBox="0 0 400 200">
                        <polyline
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="2"
                          points={chart.data.map((point, i) => 
                            `${(i / (chart.data.length - 1)) * 350 + 25},${175 - (point.value / 100) * 150}`
                          ).join(' ')}
                        />
                        {chart.data.map((point, i) => (
                          <g key={i}>
                            <circle
                              cx={(i / (chart.data.length - 1)) * 350 + 25}
                              cy={175 - (point.value / 100) * 150}
                              r="4"
                              fill="#3B82F6"
                            />
                            <text
                              x={(i / (chart.data.length - 1)) * 350 + 25}
                              y="195"
                              textAnchor="middle"
                              className="text-xs fill-gray-600"
                            >
                              {point.month}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetailPage;