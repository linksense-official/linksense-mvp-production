export interface AIInsight {
  id: string;
  type: 'prediction' | 'anomaly' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timestamp: Date;
  data: any;
  actionable: boolean;
}

export interface PredictionModel {
  name: string;
  accuracy: number;
  lastTrained: Date;
  features: string[];
  predictions: any[];
}

export interface AnomalyDetection {
  detected: boolean;
  score: number;
  threshold: number;
  description: string;
  affectedMetrics: string[];
}

export class AIInsightsEngine {
  private static instance: AIInsightsEngine;
  private insights: AIInsight[] = [];
  private models: PredictionModel[] = [];
  
  public static getInstance(): AIInsightsEngine {
    if (!AIInsightsEngine.instance) {
      AIInsightsEngine.instance = new AIInsightsEngine();
    }
    return AIInsightsEngine.instance;
  }

  constructor() {
    this.initializeModels();
    this.generateInitialInsights();
  }

  // 予測モデルの初期化
  private initializeModels(): void {
    this.models = [
      {
        name: 'Team Burnout Predictor',
        accuracy: 87.5,
        lastTrained: new Date(Date.now() - 86400000), // 1日前
        features: ['message_frequency', 'response_time', 'sentiment_score', 'working_hours'],
        predictions: []
      },
      {
        name: 'Communication Pattern Analyzer',
        accuracy: 92.3,
        lastTrained: new Date(Date.now() - 172800000), // 2日前
        features: ['channel_activity', 'user_interactions', 'topic_distribution'],
        predictions: []
      },
      {
        name: 'Team Health Forecaster',
        accuracy: 89.1,
        lastTrained: new Date(Date.now() - 259200000), // 3日前
        features: ['collaboration_index', 'sentiment_trends', 'response_patterns'],
        predictions: []
      }
    ];
  }

  // 初期インサイトの生成
  private generateInitialInsights(): void {
    this.insights = [
      {
        id: 'insight-1',
        type: 'prediction',
        title: 'チーム過労リスクの予測',
        description: '現在のコミュニケーションパターンから、開発チームで72時間以内に過労のリスクが高まる可能性があります。',
        confidence: 85,
        impact: 'high',
        timestamp: new Date(),
        data: { affectedMembers: ['田中太郎', '佐藤花子'], riskScore: 0.85 },
        actionable: true
      },
      {
        id: 'insight-2',
        type: 'anomaly',
        title: '異常なレスポンス時間を検出',
        description: 'マーケティングチームの平均レスポンス時間が通常の3倍に増加しています。',
        confidence: 92,
        impact: 'medium',
        timestamp: new Date(Date.now() - 1800000), // 30分前
        data: { normalTime: 120, currentTime: 360, increase: 200 },
        actionable: true
      },
      {
        id: 'insight-3',
        type: 'recommendation',
        title: 'コミュニケーション改善の提案',
        description: 'チーム間の連携を向上させるため、週次のクロスファンクショナルミーティングの実施を推奨します。',
        confidence: 78,
        impact: 'medium',
        timestamp: new Date(Date.now() - 3600000), // 1時間前
        data: { expectedImprovement: 25, implementationTime: '2週間' },
        actionable: true
      },
      {
        id: 'insight-4',
        type: 'trend',
        title: 'ポジティブ感情の増加傾向',
        description: '過去1週間でチーム全体のポジティブ感情が15%増加しています。この傾向が続く見込みです。',
        confidence: 88,
        impact: 'low',
        timestamp: new Date(Date.now() - 7200000), // 2時間前
        data: { increase: 15, trend: 'upward', duration: '1週間' },
        actionable: false
      }
    ];
  }

  // 新しいインサイトの生成
  generateInsights(data: any): AIInsight[] {
    const newInsights: AIInsight[] = [];
    
    // 予測分析
    const predictions = this.runPredictiveAnalysis(data);
    newInsights.push(...predictions);
    
    // 異常検知
    const anomalies = this.detectAnomalies(data);
    newInsights.push(...anomalies);
    
    // 推奨事項の生成
    const recommendations = this.generateRecommendations(data);
    newInsights.push(...recommendations);
    
    // トレンド分析
    const trends = this.analyzeTrends(data);
    newInsights.push(...trends);
    
    // 新しいインサイトを追加
    this.insights.unshift(...newInsights);
    
    // 最大50件まで保持
    if (this.insights.length > 50) {
      this.insights = this.insights.slice(0, 50);
    }
    
    return newInsights;
  }

  // 予測分析の実行
  private runPredictiveAnalysis(data: any): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // チーム過労の予測
    if (data.averageMessageCount > 40) {
      insights.push({
        id: `prediction-${Date.now()}`,
        type: 'prediction',
        title: '過労リスクの予測',
        description: `現在のメッセージ頻度から、${data.teamName || 'チーム'}で48時間以内に過労のリスクが予測されます。`,
        confidence: Math.floor(Math.random() * 20) + 70,
        impact: 'high',
        timestamp: new Date(),
        data: { messageCount: data.averageMessageCount, riskLevel: 'high' },
        actionable: true
      });
    }
    
    // コミュニケーション品質の予測
    if (data.sentimentScore < 70) {
      insights.push({
        id: `prediction-${Date.now() + 1}`,
        type: 'prediction',
        title: 'チーム満足度の低下予測',
        description: '現在の感情傾向から、チーム満足度が今後1週間で低下する可能性があります。',
        confidence: Math.floor(Math.random() * 15) + 75,
        impact: 'medium',
        timestamp: new Date(),
        data: { currentSentiment: data.sentimentScore, predictedChange: -10 },
        actionable: true
      });
    }
    
    return insights;
  }

  // 異常検知
  private detectAnomalies(data: any): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // レスポンス時間の異常
    if (data.responseTime > 300) {
      insights.push({
        id: `anomaly-${Date.now()}`,
        type: 'anomaly',
        title: 'レスポンス時間の異常',
        description: `平均レスポンス時間が通常の${Math.floor(data.responseTime / 120)}倍に増加しています。`,
        confidence: 90,
        impact: 'medium',
        timestamp: new Date(),
        data: { responseTime: data.responseTime, baseline: 120 },
        actionable: true
      });
    }
    
    return insights;
  }

  // 推奨事項の生成
  private generateRecommendations(data: any): AIInsight[] {
    const insights: AIInsight[] = [];
    
    const recommendations = [
      {
        title: '1on1ミーティングの実施',
          description: 'チームメンバーとの個別面談を通じて、課題の早期発見と解決を図ることを推奨します。',
        condition: () => data.sentimentScore < 75,
        impact: 'medium' as const
      },
      {
        title: 'ワークロードの再配分',
        description: 'メッセージ数の多いメンバーの負荷を軽減するため、タスクの再配分を検討してください。',
        condition: () => data.maxMessageCount > 60,
        impact: 'high' as const
      },
      {
        title: 'チームビルディング活動',
        description: 'チーム内のコミュニケーション活性化のため、非公式な交流の機会を設けることを推奨します。',
        condition: () => data.interactionScore < 60,
        impact: 'low' as const
      }
    ];

    recommendations.forEach((rec, index) => {
      if (rec.condition()) {
        insights.push({
          id: `recommendation-${Date.now() + index}`,
          type: 'recommendation',
          title: rec.title,
          description: rec.description,
          confidence: Math.floor(Math.random() * 20) + 70,
          impact: rec.impact,
          timestamp: new Date(),
          data: { category: 'team_management' },
          actionable: true
        });
      }
    });
    
    return insights;
  }

  // トレンド分析
  private analyzeTrends(data: any): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // ポジティブトレンド
    if (data.sentimentTrend > 5) {
      insights.push({
        id: `trend-${Date.now()}`,
        type: 'trend',
        title: 'チーム満足度の向上傾向',
        description: `過去1週間でチーム満足度が${data.sentimentTrend}%向上しています。`,
        confidence: 85,
        impact: 'low',
        timestamp: new Date(),
        data: { trendValue: data.sentimentTrend, period: '1週間' },
        actionable: false
      });
    }
    
    return insights;
  }

  // 全インサイトの取得
  getInsights(type?: AIInsight['type']): AIInsight[] {
    if (type) {
      return this.insights.filter(insight => insight.type === type);
    }
    return [...this.insights];
  }

  // 高インパクトインサイトの取得
  getHighImpactInsights(): AIInsight[] {
    return this.insights.filter(insight => insight.impact === 'high');
  }

  // アクション可能なインサイトの取得
  getActionableInsights(): AIInsight[] {
    return this.insights.filter(insight => insight.actionable);
  }

  // 予測モデルの情報取得
  getModels(): PredictionModel[] {
    return [...this.models];
  }

  // モデルの再トレーニング
  retrainModel(modelName: string): boolean {
    const model = this.models.find(m => m.name === modelName);
    if (model) {
      model.lastTrained = new Date();
      model.accuracy = Math.min(model.accuracy + Math.random() * 2, 95); // 精度を少し向上
      return true;
    }
    return false;
  }

  // 異常検知の実行
  detectAnomaliesInMetrics(metrics: any): AnomalyDetection {
    const anomalyScore = Math.random();
    const threshold = 0.7;
    
    return {
      detected: anomalyScore > threshold,
      score: anomalyScore,
      threshold,
      description: anomalyScore > threshold 
        ? '通常パターンからの逸脱が検出されました' 
        : '正常範囲内です',
      affectedMetrics: anomalyScore > threshold 
        ? ['response_time', 'message_frequency'] 
        : []
    };
  }

  // インサイトの重要度スコア計算
  calculateImportanceScore(insight: AIInsight): number {
    let score = insight.confidence;
    
    // インパクトによる重み付け
    switch (insight.impact) {
      case 'high':
        score *= 1.5;
        break;
      case 'medium':
        score *= 1.2;
        break;
      case 'low':
        score *= 1.0;
        break;
    }
    
    // タイプによる重み付け
    switch (insight.type) {
      case 'prediction':
        score *= 1.3;
        break;
      case 'anomaly':
        score *= 1.4;
        break;
      case 'recommendation':
        score *= 1.1;
        break;
      case 'trend':
        score *= 0.9;
        break;
    }
    
    // アクション可能性による重み付け
    if (insight.actionable) {
      score *= 1.2;
    }
    
    return Math.min(score, 100);
  }

  // インサイトの統計情報
  getInsightStatistics(): any {
    const total = this.insights.length;
    const byType = {
      prediction: this.insights.filter(i => i.type === 'prediction').length,
      anomaly: this.insights.filter(i => i.type === 'anomaly').length,
      recommendation: this.insights.filter(i => i.type === 'recommendation').length,
      trend: this.insights.filter(i => i.type === 'trend').length
    };
    
    const byImpact = {
      high: this.insights.filter(i => i.impact === 'high').length,
      medium: this.insights.filter(i => i.impact === 'medium').length,
      low: this.insights.filter(i => i.impact === 'low').length
    };
    
    const averageConfidence = this.insights.reduce((sum, i) => sum + i.confidence, 0) / total || 0;
    const actionableCount = this.insights.filter(i => i.actionable).length;
    
    return {
      total,
      byType,
      byImpact,
      averageConfidence: Math.round(averageConfidence),
      actionablePercentage: Math.round((actionableCount / total) * 100) || 0,
      lastGenerated: this.insights[0]?.timestamp || new Date()
    };
  }

  // リアルタイム分析の実行
  runRealTimeAnalysis(streamData: any): AIInsight[] {
    // リアルタイムデータに基づいて即座にインサイトを生成
    const realTimeInsights: AIInsight[] = [];
    
    // 急激な変化の検出
    if (streamData.suddenChange) {
      realTimeInsights.push({
        id: `realtime-${Date.now()}`,
        type: 'anomaly',
        title: '急激な変化を検出',
        description: `${streamData.metric}に急激な変化が観測されました。`,
        confidence: 95,
        impact: 'high',
        timestamp: new Date(),
        data: streamData,
        actionable: true
      });
    }
    
    return realTimeInsights;
  }

  // インサイトのクリア
  clearInsights(olderThan?: Date): void {
    if (olderThan) {
      this.insights = this.insights.filter(insight => insight.timestamp > olderThan);
    } else {
      this.insights = [];
    }
  }
}

export const aiInsightsEngine = AIInsightsEngine.getInstance();