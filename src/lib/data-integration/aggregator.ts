// src/lib/data-integration/aggregator.ts
import { UnifiedMessage, UnifiedMeeting, UnifiedActivity, ServiceType } from './types';

export class DataAggregator {
  
  // メッセージ統計計算
  static calculateMessageStats(messages: UnifiedMessage[]) {
    const stats = {
      totalMessages: messages.length,
      messagesByService: {} as { [service: string]: number },
      messagesByHour: {} as { [hour: string]: number },
      messagesByUser: {} as { [userId: string]: { name: string; count: number } },
      averageMessageLength: 0,
      mostActiveChannels: [] as Array<{ channelId: string; channelName: string; count: number }>,
      timeRange: {
        earliest: messages.length > 0 ? messages[messages.length - 1].timestamp : null,
        latest: messages.length > 0 ? messages[0].timestamp : null
      }
    };

    let totalLength = 0;
    const channelCounts: { [channelId: string]: { name: string; count: number } } = {};

    for (const message of messages) {
      // サービス別集計
      stats.messagesByService[message.service] = (stats.messagesByService[message.service] || 0) + 1;

      // 時間別集計
      const hour = message.timestamp.getHours().toString().padStart(2, '0');
      stats.messagesByHour[hour] = (stats.messagesByHour[hour] || 0) + 1;

      // ユーザー別集計
      const userId = message.author.id;
      if (!stats.messagesByUser[userId]) {
        stats.messagesByUser[userId] = { name: message.author.name, count: 0 };
      }
      stats.messagesByUser[userId].count++;

      // メッセージ長統計
      totalLength += message.content.length;

      // チャンネル別集計
      if (message.channel) {
        const channelId = message.channel.id;
        if (!channelCounts[channelId]) {
          channelCounts[channelId] = { name: message.channel.name, count: 0 };
        }
        channelCounts[channelId].count++;
      }
    }

    // 平均メッセージ長
    stats.averageMessageLength = messages.length > 0 ? Math.round(totalLength / messages.length) : 0;

    // 最もアクティブなチャンネル（上位10件）
    stats.mostActiveChannels = Object.entries(channelCounts)
      .map(([channelId, data]) => ({ channelId, channelName: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  // 会議統計計算
  static calculateMeetingStats(meetings: UnifiedMeeting[]) {
    const stats = {
      totalMeetings: meetings.length,
      meetingsByService: {} as { [service: string]: number },
      totalDuration: 0, // minutes
      averageDuration: 0,
      averageParticipants: 0,
      meetingsByDay: {} as { [day: string]: number },
      longestMeeting: null as UnifiedMeeting | null,
      mostParticipants: null as UnifiedMeeting | null,
      timeRange: {
        earliest: meetings.length > 0 ? meetings[meetings.length - 1].startTime : null,
        latest: meetings.length > 0 ? meetings[0].startTime : null
      }
    };

    let totalParticipants = 0;
    let longestDuration = 0;
    let mostParticipantsCount = 0;

    for (const meeting of meetings) {
      // サービス別集計
      stats.meetingsByService[meeting.service] = (stats.meetingsByService[meeting.service] || 0) + 1;

      // 時間統計
      stats.totalDuration += meeting.duration;
      if (meeting.duration > longestDuration) {
        longestDuration = meeting.duration;
        stats.longestMeeting = meeting;
      }

      // 参加者統計
      const participantCount = meeting.participants.length;
      totalParticipants += participantCount;
      if (participantCount > mostParticipantsCount) {
        mostParticipantsCount = participantCount;
        stats.mostParticipants = meeting;
      }

      // 日別集計
      const day = meeting.startTime.toISOString().split('T')[0];
      stats.meetingsByDay[day] = (stats.meetingsByDay[day] || 0) + 1;
    }

    // 平均値計算
    stats.averageDuration = meetings.length > 0 ? Math.round(stats.totalDuration / meetings.length) : 0;
    stats.averageParticipants = meetings.length > 0 ? Math.round(totalParticipants / meetings.length) : 0;

    return stats;
  }

  // クロスサービス分析
  static calculateCrossServiceAnalysis(messages: UnifiedMessage[], meetings: UnifiedMeeting[]) {
    const analysis = {
      serviceUsageDistribution: {} as { [service: string]: { messages: number; meetings: number; total: number } },
      userActivityAcrossServices: {} as { [userId: string]: { name: string; services: ServiceType[]; totalActivity: number } },
      timelineAnalysis: {
        peakHours: [] as Array<{ hour: number; activity: number }>,
        peakDays: [] as Array<{ day: string; activity: number }>
      },
      collaborationScore: 0
    };

    // サービス使用分布
    for (const message of messages) {
      if (!analysis.serviceUsageDistribution[message.service]) {
        analysis.serviceUsageDistribution[message.service] = { messages: 0, meetings: 0, total: 0 };
      }
      analysis.serviceUsageDistribution[message.service].messages++;
      analysis.serviceUsageDistribution[message.service].total++;
    }

    for (const meeting of meetings) {
      if (!analysis.serviceUsageDistribution[meeting.service]) {
        analysis.serviceUsageDistribution[meeting.service] = { messages: 0, meetings: 0, total: 0 };
      }
      analysis.serviceUsageDistribution[meeting.service].meetings++;
      analysis.serviceUsageDistribution[meeting.service].total++;
    }

    // ユーザーのクロスサービス活動
    const userServices: { [userId: string]: Set<ServiceType> } = {};
    const userActivity: { [userId: string]: { name: string; count: number } } = {};

    for (const message of messages) {
      const userId = message.author.id;
      if (!userServices[userId]) {
        userServices[userId] = new Set();
        userActivity[userId] = { name: message.author.name, count: 0 };
      }
      userServices[userId].add(message.service);
      userActivity[userId].count++;
    }

    for (const meeting of meetings) {
      const userId = meeting.organizer.id;
      if (!userServices[userId]) {
        userServices[userId] = new Set();
        userActivity[userId] = { name: meeting.organizer.name, count: 0 };
      }
      userServices[userId].add(meeting.service);
      userActivity[userId].count++;
    }

    // ユーザー活動分析結果
    for (const [userId, services] of Object.entries(userServices)) {
      analysis.userActivityAcrossServices[userId] = {
        name: userActivity[userId].name,
        services: Array.from(services),
        totalActivity: userActivity[userId].count
      };
    }

    // コラボレーションスコア計算（複数サービスを使用するユーザーの割合）
    const multiServiceUsers = Object.values(userServices).filter(services => services.size > 1).length;
    const totalUsers = Object.keys(userServices).length;
    analysis.collaborationScore = totalUsers > 0 ? Math.round((multiServiceUsers / totalUsers) * 100) : 0;

    return analysis;
  }

  // データ品質分析
  static analyzeDataQuality(messages: UnifiedMessage[], meetings: UnifiedMeeting[]) {
    const quality = {
      messages: {
        total: messages.length,
        withContent: messages.filter(m => m.content && m.content.trim().length > 0).length,
        withAuthor: messages.filter(m => m.author && m.author.name).length,
        withTimestamp: messages.filter(m => m.timestamp && !isNaN(m.timestamp.getTime())).length,
        withChannel: messages.filter(m => m.channel && m.channel.id).length
      },
      meetings: {
        total: meetings.length,
        withTitle: meetings.filter(m => m.title && m.title.trim().length > 0).length,
        withParticipants: meetings.filter(m => m.participants && m.participants.length > 0).length,
        withDuration: meetings.filter(m => m.duration && m.duration > 0).length,
        withOrganizer: meetings.filter(m => m.organizer && m.organizer.name).length
      },
      overallScore: 0
    };

    // 品質スコア計算（0-100）
    const messageQuality = quality.messages.total > 0 ? 
      ((quality.messages.withContent + quality.messages.withAuthor + quality.messages.withTimestamp + quality.messages.withChannel) / (quality.messages.total * 4)) * 100 : 100;
    
    const meetingQuality = quality.meetings.total > 0 ?
      ((quality.meetings.withTitle + quality.meetings.withParticipants + quality.meetings.withDuration + quality.meetings.withOrganizer) / (quality.meetings.total * 4)) * 100 : 100;

    quality.overallScore = Math.round((messageQuality + meetingQuality) / 2);

    return quality;
  }
}