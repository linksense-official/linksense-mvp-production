export interface ProcessedData {
  totalMessages: number;
  activeUsers: number;
  averageResponseTime: number;
  sentimentScore: number;
  timestamp: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastActive: Date;
  messageCount: number;
  responseTime: number;
  sentimentScore: number;
}

export interface ChannelData {
  id: string;
  name: string;
  messageCount: number;
  activeMembers: number;
  avgSentiment: number;
  lastActivity: Date;
}

export class DataProcessor {
  private static instance: DataProcessor;
  
  public static getInstance(): DataProcessor {
    if (!DataProcessor.instance) {
      DataProcessor.instance = new DataProcessor();
    }
    return DataProcessor.instance;
  }

  // メッセージデータの処理
  processMessageData(rawData: any[]): ProcessedData {
    const totalMessages = rawData.length;
    const activeUsers = new Set(rawData.map(msg => msg.userId)).size;
    
    // 平均応答時間の計算（ダミーデータ）
    const averageResponseTime = Math.floor(Math.random() * 300) + 60; // 60-360秒
    
    // 感情スコアの計算（ダミーデータ）
    const sentimentScore = Math.floor(Math.random() * 40) + 60; // 60-100%
    
    return {
      totalMessages,
      activeUsers,
      averageResponseTime,
      sentimentScore,
      timestamp: new Date()
    };
  }

  // チームメンバーデータの生成
  generateTeamMembers(): TeamMember[] {
    const names = ['田中太郎', '佐藤花子', '鈴木一郎', '高橋美咲', '伊藤健太', '山田由美'];
    const statuses: ('online' | 'offline' | 'away')[] = ['online', 'offline', 'away'];
    
    return names.map((name, index) => ({
      id: `member-${index + 1}`,
      name,
      avatar: `/avatars/avatar-${index + 1}.png`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lastActive: new Date(Date.now() - Math.random() * 86400000), // 過去24時間以内
      messageCount: Math.floor(Math.random() * 50) + 10,
      responseTime: Math.floor(Math.random() * 300) + 30,
      sentimentScore: Math.floor(Math.random() * 40) + 60
    }));
  }

  // チャンネルデータの生成
  generateChannelData(): ChannelData[] {
    const channels = [
      { name: '一般', id: 'general' },
      { name: '開発', id: 'development' },
      { name: 'マーケティング', id: 'marketing' },
      { name: 'デザイン', id: 'design' },
      { name: 'セールス', id: 'sales' }
    ];

    return channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      messageCount: Math.floor(Math.random() * 100) + 20,
      activeMembers: Math.floor(Math.random() * 8) + 3,
      avgSentiment: Math.floor(Math.random() * 40) + 60,
      lastActivity: new Date(Date.now() - Math.random() * 3600000) // 過去1時間以内
    }));
  }

  // リアルタイムデータの更新
  updateRealTimeData(): ProcessedData {
    return this.processMessageData(this.generateMockMessages());
  }

  // モックメッセージデータの生成
  private generateMockMessages(): any[] {
    const messageCount = Math.floor(Math.random() * 50) + 20;
    const messages = [];
    
    for (let i = 0; i < messageCount; i++) {
      messages.push({
        id: `msg-${i}`,
        userId: `user-${Math.floor(Math.random() * 6) + 1}`,
        content: `メッセージ ${i + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        sentiment: Math.random() > 0.3 ? 'positive' : 'negative'
      });
    }
    
    return messages;
  }

  // データのフィルタリング
  filterDataByTimeRange(data: any[], hours: number): any[] {
    const cutoffTime = new Date(Date.now() - hours * 3600000);
    return data.filter(item => new Date(item.timestamp) > cutoffTime);
  }

  // 統計データの計算
  calculateStatistics(data: any[]) {
    if (data.length === 0) {
      return {
        average: 0,
        median: 0,
        max: 0,
        min: 0,
        total: 0
      };
    }

    const values = data.map(item => item.value || 0);
    const sorted = values.sort((a, b) => a - b);
    
    return {
      average: values.reduce((a, b) => a + b, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      max: Math.max(...values),
      min: Math.min(...values),
      total: values.reduce((a, b) => a + b, 0)
    };
  }
}

export const dataProcessor = DataProcessor.getInstance();