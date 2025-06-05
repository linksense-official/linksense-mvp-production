// src/lib/data-integration/types.ts

export type ServiceType = 'google' | 'slack' | 'discord' | 'teams' | 'chatwork' | 'line-works';

export interface ServiceMetadata {
  [key: string]: any;
}

export interface UnifiedMessage {
  id: string;
  service: ServiceType;
  timestamp: Date;
  author: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  content: string;
  channel?: {
    id: string;
    name: string;
  };
  thread?: {
    id: string;
    parentId?: string;
  };
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  metadata?: ServiceMetadata; // オプショナルプロパティに変更
}

export interface UnifiedMeeting {
  id: string;
  service: ServiceType;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  participants: Array<{
    id: string;
    name: string;
    email?: string;
    joinTime?: Date;
    leaveTime?: Date;
    speaking_time?: number; // seconds
  }>;
  organizer: {
    id: string;
    name: string;
    email?: string;
  };
  recording?: {
    available: boolean;
    url?: string;
    duration?: number;
  };
  metadata: ServiceMetadata;
}

export interface UnifiedActivity {
  id: string;
  service: ServiceType;
  type: 'message' | 'meeting' | 'file_share' | 'reaction' | 'status_change';
  timestamp: Date;
  user: {
    id: string;
    name: string;
    email?: string;
  };
  details: {
    [key: string]: any;
  };
  metadata: ServiceMetadata;
}

export interface ServiceDataResponse<T> {
  success: boolean;
  data?: T[];
  error?: string;
  rateLimit?: {
    remaining: number;
    resetTime: Date;
  };
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
    totalCount?: number;
  };
}

export interface DataIntegrationOptions {
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  cursor?: string;
  includeMetadata?: boolean;
  channels?: string[];
  users?: string[];
}

export interface UnifiedAnalytics {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  services: ServiceType[];
  metrics: {
    totalMessages: number;
    totalMeetings: number;
    totalParticipants: number;
    averageResponseTime: number; // minutes
    mostActiveHours: number[];
    communicationPatterns: {
      [service: string]: {
        messageCount: number;
        meetingCount: number;
        activeUsers: number;
      };
    };
  };
  insights: {
    productivityScore: number;
    collaborationScore: number;
    burnoutRisk: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
  generatedAt: Date;
}