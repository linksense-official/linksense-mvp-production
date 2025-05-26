// src/hooks/useSlackData.ts
import { useState, useEffect, useCallback } from 'react';

// Slack関連の型定義
export interface SlackChannel {
  id: string;
  name: string;
  purpose: string;
  memberCount: number;
  isPrivate: boolean;
  lastActivity: Date;
  messageCount: number;
  unreadCount: number;
}

export interface SlackUser {
  id: string;
  name: string;
  realName: string;
  email: string;
  avatar: string;
  status: 'active' | 'away' | 'dnd' | 'offline';
  timezone: string;
  isBot: boolean;
  lastSeen: Date;
  messageCount: number;
}

export interface SlackMessage {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  timestamp: Date;
  threadTs?: string;
  reactions: SlackReaction[];
  attachments: SlackAttachment[];
  edited?: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface SlackReaction {
  name: string;
  count: number;
  users: string[];
}

export interface SlackAttachment {
  type: 'image' | 'file' | 'link';
  url: string;
  title?: string;
  mimetype?: string;
}

export interface SlackWorkspace {
  id: string;
  name: string;
  domain: string;
  icon: string;
  memberCount: number;
  channelCount: number;
  plan: 'free' | 'pro' | 'business';
}

export interface SlackAnalytics {
  totalMessages: number;
  activeUsers: number;
  averageResponseTime: number;
  peakHours: number[];
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  channelActivity: {
    channelId: string;
    messageCount: number;
    activeUsers: number;
  }[];
  userActivity: {
    userId: string;
    messageCount: number;
    avgResponseTime: number;
    sentiment: number;
  }[];
}

export interface SlackConfig {
  botToken: string;
  userToken: string;
  signingSecret: string;
  webhookUrl: string;
  enabled: boolean;
  syncInterval: number; // minutes
  channels: string[]; // 監視対象チャンネル
  excludeBots: boolean;
  sentimentAnalysis: boolean;
}

export interface UseSlackDataReturn {
  // データ状態
  workspace: SlackWorkspace | null;
  channels: SlackChannel[];
  users: SlackUser[];
  messages: SlackMessage[];
  analytics: SlackAnalytics | null;
  
  // 設定
  config: SlackConfig;
  
  // 状態管理
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  lastSync: Date | null;
  
  // アクション
  connect: (config: Partial<SlackConfig>) => Promise<boolean>;
  disconnect: () => void;
  syncData: () => Promise<void>;
  sendMessage: (channelId: string, text: string) => Promise<boolean>;
  updateConfig: (updates: Partial<SlackConfig>) => void;
  
  // データフィルタリング
  getChannelMessages: (channelId: string, limit?: number) => SlackMessage[];
  getUserMessages: (userId: string, limit?: number) => SlackMessage[];
  getRecentMessages: (hours: number) => SlackMessage[];
  
  // 分析機能
  analyzeChannelActivity: (channelId: string) => any;
  analyzeUserActivity: (userId: string) => any;
  detectAnomalies: () => any[];
}

export const useSlackData = (): UseSlackDataReturn => {
  // 状態管理
  const [workspace, setWorkspace] = useState<SlackWorkspace | null>(null);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [users, setUsers] = useState<SlackUser[]>([]);
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [analytics, setAnalytics] = useState<SlackAnalytics | null>(null);
  
  const [config, setConfig] = useState<SlackConfig>({
    botToken: '',
    userToken: '',
    signingSecret: '',
    webhookUrl: '',
    enabled: false,
    syncInterval: 15,
    channels: [],
    excludeBots: true,
    sentimentAnalysis: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Slack API接続
  const connect = useCallback(async (newConfig: Partial<SlackConfig>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);
      
      // 実際のSlack API接続をシミュレート
      // 本番環境では実際のSlack Web APIを呼び出し
      await simulateSlackConnection(updatedConfig);
      
      // 初期データの取得
      await loadInitialData(updatedConfig);
      
      setIsConnected(true);
      setLastSync(new Date());
      
      // 定期同期の開始
      startPeriodicSync(updatedConfig.syncInterval);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Slack接続に失敗しました');
      setIsConnected(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // 接続解除
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setWorkspace(null);
    setChannels([]);
    setUsers([]);
    setMessages([]);
    setAnalytics(null);
    setError(null);
    stopPeriodicSync();
  }, []);

  // データ同期
  const syncData = useCallback(async (): Promise<void> => {
    if (!isConnected || !config.enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // チャンネル情報の更新
      const channelData = await fetchChannels(config);
      setChannels(channelData);
      
      // ユーザー情報の更新
      const userData = await fetchUsers(config);
      setUsers(userData);
      
      // メッセージの取得
      const messageData = await fetchMessages(config);
      setMessages(prev => mergeMessages(prev, messageData));
      
      // 分析データの更新
      const analyticsData = calculateAnalytics(messageData, userData, channelData);
      setAnalytics(analyticsData);
      
      setLastSync(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データ同期に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, config]);

  // メッセージ送信
  const sendMessage = useCallback(async (channelId: string, text: string): Promise<boolean> => {
    if (!isConnected) {
      setError('Slackに接続されていません');
      return false;
    }
    
    try {
      // 実際のSlack API呼び出しをシミュレート
      await simulateMessageSend(channelId, text, config);
      
      // ローカルメッセージリストに追加
      const newMessage: SlackMessage = {
        id: `msg-${Date.now()}`,
        channelId,
        userId: 'current-user',
        text,
        timestamp: new Date(),
        reactions: [],
        attachments: []
      };
      
      setMessages(prev => [newMessage, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'メッセージ送信に失敗しました');
      return false;
    }
  }, [isConnected, config]);

  // 設定更新
  const updateConfig = useCallback((updates: Partial<SlackConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // チャンネルメッセージの取得
  const getChannelMessages = useCallback((channelId: string, limit: number = 100): SlackMessage[] => {
    return messages
      .filter(msg => msg.channelId === channelId)
      .slice(0, limit);
  }, [messages]);

  // ユーザーメッセージの取得
  const getUserMessages = useCallback((userId: string, limit: number = 100): SlackMessage[] => {
    return messages
      .filter(msg => msg.userId === userId)
      .slice(0, limit);
  }, [messages]);

  // 最近のメッセージ取得
  const getRecentMessages = useCallback((hours: number): SlackMessage[] => {
    const cutoff = new Date(Date.now() - hours * 3600000);
    return messages.filter(msg => msg.timestamp > cutoff);
  }, [messages]);

  // チャンネル活動分析
  const analyzeChannelActivity = useCallback((channelId: string) => {
    const channelMessages = getChannelMessages(channelId);
    const channel = channels.find(c => c.id === channelId);
    
    if (!channel || channelMessages.length === 0) {
      return null;
    }
    
    const now = new Date();
    const last24h = channelMessages.filter(msg => 
      now.getTime() - msg.timestamp.getTime() < 86400000
    );
    
    const activeUsers = new Set(last24h.map(msg => msg.userId)).size;
    const avgResponseTime = calculateAverageResponseTime(last24h);
    const sentimentScore = calculateSentimentScore(last24h);
    
    return {
      channelId,
      channelName: channel.name,
      totalMessages: channelMessages.length,
      last24hMessages: last24h.length,
      activeUsers,
      avgResponseTime,
      sentimentScore,
      peakHours: calculatePeakHours(last24h),
      topUsers: getTopActiveUsers(last24h)
    };
  }, [channels, getChannelMessages]);

  // ユーザー活動分析
  const analyzeUserActivity = useCallback((userId: string) => {
    const userMessages = getUserMessages(userId);
    const user = users.find(u => u.id === userId);
    
    if (!user || userMessages.length === 0) {
      return null;
    }
    
    const now = new Date();
    const last24h = userMessages.filter(msg => 
      now.getTime() - msg.timestamp.getTime() < 86400000
    );
    
    const channelDistribution = calculateChannelDistribution(userMessages);
    const activityPattern = calculateActivityPattern(userMessages);
    const sentimentTrend = calculateSentimentTrend(userMessages);
    
    return {
      userId,
      userName: user.name,
      totalMessages: userMessages.length,
      last24hMessages: last24h.length,
      avgResponseTime: calculateAverageResponseTime(last24h),
      sentimentScore: calculateSentimentScore(userMessages),
      channelDistribution,
      activityPattern,
      sentimentTrend,
      isOverworked: detectOverwork(userMessages)
    };
  }, [users, getUserMessages]);

  // 異常検知
  const detectAnomalies = useCallback(() => {
    const anomalies = [];
    
    // 過度なメッセージ活動の検知
    users.forEach(user => {
      const userMessages = getUserMessages(user.id);
      const last24h = userMessages.filter(msg => 
        Date.now() - msg.timestamp.getTime() < 86400000
      );
      
      if (last24h.length > 100) { // 24時間で100件以上
        anomalies.push({
          type: 'overwork',
          userId: user.id,
          userName: user.name,
          messageCount: last24h.length,
          severity: 'high'
        });
      }
    });
    
    // チャンネル活動の異常検知
    channels.forEach(channel => {
      const channelMessages = getChannelMessages(channel.id);
      const last24h = channelMessages.filter(msg => 
        Date.now() - msg.timestamp.getTime() < 86400000
      );
      
      if (last24h.length === 0 && channel.memberCount > 5) {
        anomalies.push({
          type: 'inactive_channel',
          channelId: channel.id,
          channelName: channel.name,
          memberCount: channel.memberCount,
          severity: 'medium'
        });
      }
    });
    
    // ネガティブ感情の検知
    const recentMessages = getRecentMessages(24);
    const negativeMessages = recentMessages.filter(msg => msg.sentiment === 'negative');
    const negativeRatio = negativeMessages.length / recentMessages.length;
    
    if (negativeRatio > 0.3) { // 30%以上がネガティブ
      anomalies.push({
        type: 'negative_sentiment',
        ratio: negativeRatio,
        messageCount: negativeMessages.length,
        severity: 'high'
      });
    }
    
    return anomalies;
  }, [users, channels, getUserMessages, getChannelMessages, getRecentMessages]);

  // 定期同期の管理
  const [syncInterval, setSyncInterval] = useState<NodeJS.Timeout | null>(null);
  
  const startPeriodicSync = useCallback((minutes: number) => {
    stopPeriodicSync();
    const interval = setInterval(() => {
      syncData();
    }, minutes * 60 * 1000);
    setSyncInterval(interval);
  }, [syncData]);
  
  const stopPeriodicSync = useCallback(() => {
    if (syncInterval) {
      clearInterval(syncInterval);
      setSyncInterval(null);
    }
  }, [syncInterval]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopPeriodicSync();
    };
  }, [stopPeriodicSync]);

  return {
    // データ状態
    workspace,
    channels,
    users,
    messages,
    analytics,
    
    // 設定
    config,
    
    // 状態管理
    isLoading,
    isConnected,
    error,
    lastSync,
    
    // アクション
    connect,
    disconnect,
    syncData,
    sendMessage,
    updateConfig,
    
    // データフィルタリング
    getChannelMessages,
    getUserMessages,
    getRecentMessages,
    
    // 分析機能
    analyzeChannelActivity,
    analyzeUserActivity,
    detectAnomalies
  };
};

// ヘルパー関数群
async function simulateSlackConnection(config: SlackConfig): Promise<void> {
  // 実際の実装ではSlack Web APIを使用
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (config.botToken && config.botToken.startsWith('xoxb-')) {
        resolve();
      } else {
        reject(new Error('無効なBot Tokenです'));
      }
    }, 1000);
  });
}

async function loadInitialData(config: SlackConfig): Promise<void> {
  // 実際の実装ではSlack APIからデータを取得
  return new Promise(resolve => {
    setTimeout(resolve, 2000);
  });
}

async function fetchChannels(config: SlackConfig): Promise<SlackChannel[]> {
  // モックデータの生成
  return [
    {
      id: 'C1234567890',
      name: 'general',
      purpose: '全体的なディスカッション',
      memberCount: 25,
      isPrivate: false,
      lastActivity: new Date(),
      messageCount: 1250,
      unreadCount: 5
    },
    {
      id: 'C2345678901',
      name: 'development',
      purpose: '開発関連の議論',
      memberCount: 12,
      isPrivate: false,
      lastActivity: new Date(Date.now() - 3600000),
      messageCount: 890,
      unreadCount: 2
    }
  ];
}

async function fetchUsers(config: SlackConfig): Promise<SlackUser[]> {
  // モックデータの生成
  return [
    {
      id: 'U1234567890',
      name: 'tanaka.taro',
      realName: '田中太郎',
      email: 'tanaka@example.com',
      avatar: '/avatars/tanaka.png',
      status: 'active',
      timezone: 'Asia/Tokyo',
      isBot: false,
      lastSeen: new Date(),
      messageCount: 45
    }
  ];
}

async function fetchMessages(config: SlackConfig): Promise<SlackMessage[]> {
  // モックデータの生成
  return [];
}

function mergeMessages(existing: SlackMessage[], newMessages: SlackMessage[]): SlackMessage[] {
  const merged = [...newMessages];
  existing.forEach(msg => {
    if (!newMessages.find(newMsg => newMsg.id === msg.id)) {
      merged.push(msg);
    }
  });
  return merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function calculateAnalytics(
  messages: SlackMessage[], 
  users: SlackUser[], 
  channels: SlackChannel[]
): SlackAnalytics {
  return {
    totalMessages: messages.length,
    activeUsers: users.filter(u => !u.isBot).length,
    averageResponseTime: 120, // seconds
    peakHours: [9, 10, 14, 15],
    sentimentDistribution: {
      positive: 60,
      neutral: 30,
      negative: 10
    },
    channelActivity: channels.map(ch => ({
      channelId: ch.id,
      messageCount: ch.messageCount,
      activeUsers: Math.floor(ch.memberCount * 0.7)
    })),
    userActivity: users.map(user => ({
      userId: user.id,
      messageCount: user.messageCount,
      avgResponseTime: Math.floor(Math.random() * 300) + 60,
      sentiment: Math.floor(Math.random() * 40) + 60
    }))
  };
}

async function simulateMessageSend(
  channelId: string, 
  text: string, 
  config: SlackConfig
): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 500);
  });
}

function calculateAverageResponseTime(messages: SlackMessage[]): number {
  // 実際の実装では応答時間を計算
  return Math.floor(Math.random() * 300) + 60;
}

function calculateSentimentScore(messages: SlackMessage[]): number {
  // 実際の実装では感情分析を実行
  return Math.floor(Math.random() * 40) + 60;
}

function calculatePeakHours(messages: SlackMessage[]): number[] {
  // 実際の実装では時間別のメッセージ分布を計算
  return [9, 10, 14, 15];
}

function getTopActiveUsers(messages: SlackMessage[]): any[] {
  // 実際の実装ではユーザー別のアクティビティを計算
  return [];
}

function calculateChannelDistribution(messages: SlackMessage[]): any {
  // 実際の実装ではチャンネル別の分布を計算
  return {};
}

function calculateActivityPattern(messages: SlackMessage[]): any {
  // 実際の実装では活動パターンを分析
  return {};
}

function calculateSentimentTrend(messages: SlackMessage[]): any {
  // 実際の実装では感情の傾向を分析
  return {};
}

function detectOverwork(messages: SlackMessage[]): boolean {
  // 実際の実装では過労を検知
  const last24h = messages.filter(msg => 
    Date.now() - msg.timestamp.getTime() < 86400000
  );
  return last24h.length > 50;
}

export default useSlackData;