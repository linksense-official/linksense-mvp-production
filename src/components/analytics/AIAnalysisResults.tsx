// src/components/analytics/AIAnalysisResults.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Brain, 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  RefreshCw,
  CheckCircle,
  Clock,
  Target,
  Lightbulb
} from 'lucide-react';

interface AIAnalysisResult {
  id: string;
  type: 'productivity' | 'communication' | 'burnout' | 'team_dynamics' | 'comprehensive';
  insights: {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    riskFactors: Array<{
      factor: string;
      severity: 'low' | 'medium' | 'high';
      impact: string;
      mitigation: string;
    }>;
    opportunities: Array<{
      area: string;
      potential: string;
      implementation: string;
    }>;
  };
  metrics: {
    confidenceScore: number;
    dataQualityScore: number;
    analysisDepth: number;
  };
  generatedAt: Date;
  dataSource: {
    services: string[];
    messageCount: number;
    meetingCount: number;
    timeRange: {
      start: Date;
      end: Date;
    };
  };
}

interface AIAnalysisResultsProps {
  className?: string;
}

const Card: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void; // onClick プロパティを追加
}> = ({ children, className = '', onClick }) => (
  <div 
    className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 ${className}`}>
    {children}
  </p>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

export const AIAnalysisResults: React.FC<AIAnalysisResultsProps> = ({ className = '' }) => {
  const [analysisResults, setAnalysisResults] = useState<{ [key: string]: AIAnalysisResult }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<string>('comprehensive');

  // AI分析実行
  const runAnalysis = async (analysisType: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-analysis/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ analysisType })
      });

      if (!response.ok) {
        throw new Error(`AI分析エラー: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setAnalysisResults(prev => ({
          ...prev,
          [analysisType]: data.analysis
        }));
      } else {
        throw new Error(data.error || 'AI分析に失敗しました');
      }

    } catch (err) {
      console.error('AI分析エラー:', err);
      setError(err instanceof Error ? err.message : 'AI分析に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // バッチ分析実行
  const runBatchAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-analysis/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analyses: ['comprehensive', 'productivity', 'burnout', 'team_dynamics']
        })
      });

      if (!response.ok) {
        throw new Error(`バッチ分析エラー: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setAnalysisResults(data.results);
        if (data.errors) {
          console.warn('一部の分析でエラーが発生:', data.errors);
        }
      } else {
        throw new Error(data.error || 'バッチ分析に失敗しました');
      }

    } catch (err) {
      console.error('バッチ分析エラー:', err);
      setError(err instanceof Error ? err.message : 'バッチ分析に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 分析タイプ設定
  const analysisTypes = [
    {
      id: 'comprehensive',
      name: '包括分析',
      icon: Brain,
      description: '6サービス統合の全体分析',
      color: 'blue'
    },
    {
      id: 'productivity',
      name: '生産性分析',
      icon: Zap,
      description: 'クロスプラットフォーム効率性',
      color: 'green'
    },
    {
      id: 'burnout',
      name: 'バーンアウト分析',
      icon: AlertTriangle,
      description: '多プラットフォーム負荷評価',
      color: 'red'
    },
    {
      id: 'team_dynamics',
      name: 'チーム分析',
      icon: Users,
      description: 'クロスサービス協働パターン',
      color: 'purple'
    }
  ];

  const getAnalysisTypeConfig = (type: string) => {
    return analysisTypes.find(t => t.id === type) || analysisTypes[0];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const currentAnalysis = analysisResults[activeAnalysis];
  const config = getAnalysisTypeConfig(activeAnalysis);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            AI統合分析エンジン
          </h2>
          <p className="text-gray-600 mt-1">
            6サービス統合データに基づくAI駆動の高度分析
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={runBatchAnalysis}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            {loading ? '分析中...' : '全分析実行'}
          </Button>
          <Button
            variant="outline"
            onClick={() => runAnalysis(activeAnalysis)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            個別分析
          </Button>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>AI分析エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 分析タイプ選択 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analysisTypes.map((type) => {
          const Icon = type.icon;
          const isActive = activeAnalysis === type.id;
          const hasResult = analysisResults[type.id];
          
          return (
            <Card 
              key={type.id} 
              className={`cursor-pointer transition-all duration-200 ${
                isActive ? 'ring-2 ring-blue-500 border-blue-200' : 'hover:border-gray-300'
              }`}
              onClick={() => setActiveAnalysis(type.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-5 w-5 text-${type.color}-600`} />
                  <div className="flex-1">
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </div>
                  {hasResult && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                {hasResult && (
                  <div className="text-xs text-gray-600">
                    信頼度: {hasResult.metrics.confidenceScore}%
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 分析結果表示 */}
      {currentAnalysis ? (
        <div className="space-y-6">
          {/* 分析概要 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <config.icon className={`h-5 w-5 text-${config.color}-600`} />
                {config.name}結果
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  信頼度 {currentAnalysis.metrics.confidenceScore}%
                </Badge>
              </CardTitle>
              <CardDescription>
                生成日時: {new Date(currentAnalysis.generatedAt).toLocaleString('ja-JP')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-900 mb-2">分析要約</h4>
                <p className="text-blue-800">{currentAnalysis.insights.summary}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-gray-600">データ品質</div>
                  <div className="text-lg font-bold">{currentAnalysis.metrics.dataQualityScore}%</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-gray-600">分析深度</div>
                  <div className="text-lg font-bold">{currentAnalysis.metrics.analysisDepth}%</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-gray-600">データ点数</div>
                  <div className="text-lg font-bold">
                    {currentAnalysis.dataSource.messageCount + currentAnalysis.dataSource.meetingCount}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 主要発見事項 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                主要発見事項
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentAnalysis.insights.keyFindings.map((finding, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-green-800">{finding}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 推奨事項 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                AI推奨事項
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentAnalysis.insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-800">{recommendation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* リスク要因 */}
          {currentAnalysis.insights.riskFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  検出されたリスク要因
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentAnalysis.insights.riskFactors.map((risk, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(risk.severity)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{risk.factor}</h4>
                        <Badge variant={
                          risk.severity === 'high' ? 'destructive' : 
                          risk.severity === 'medium' ? 'default' : 'secondary'
                        }>
                          {risk.severity === 'high' ? '高リスク' : 
                           risk.severity === 'medium' ? '中リスク' : '低リスク'}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2"><strong>影響:</strong> {risk.impact}</p>
                      <p className="text-sm"><strong>軽減策:</strong> {risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 改善機会 */}
          {currentAnalysis.insights.opportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  改善機会
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentAnalysis.insights.opportunities.map((opportunity, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">{opportunity.area}</h4>
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>可能性:</strong> {opportunity.potential}
                      </p>
                      <p className="text-sm text-blue-800">
                        <strong>実装方法:</strong> {opportunity.implementation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI分析を開始してください
            </h3>
            <p className="text-gray-600 mb-6">
              6サービス統合データに基づく高度なAI分析を実行します
            </p>
            <Button onClick={runBatchAnalysis} disabled={loading} className="flex items-center gap-2 mx-auto">
              <Brain className="h-4 w-4" />
              {loading ? '分析中...' : 'AI分析開始'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAnalysisResults;