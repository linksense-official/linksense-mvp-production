// src/lib/data-integration/normalizer.ts

import { 
  UnifiedMessage, 
  UnifiedMeeting, 
  UnifiedActivity, 
  ServiceType,
  ServiceMetadata 
} from './types';

export class DataNormalizer {
  
  // Slack メッセージの正規化
  static normalizeSlackMessage(slackMessage: any): UnifiedMessage {
    return {
      id: slackMessage.ts,
      service: 'slack',
      timestamp: new Date(parseFloat(slackMessage.ts) * 1000),
      author: {
        id: slackMessage.user,
        name: slackMessage.user_profile?.display_name || slackMessage.user_profile?.real_name || 'Unknown',
        email: slackMessage.user_profile?.email,
        avatar: slackMessage.user_profile?.image_72
      },
      content: slackMessage.text || '',
      channel: slackMessage.channel ? {
        id: slackMessage.channel,
        name: slackMessage.channel_name || 'Unknown Channel'
      } : undefined,
      thread: slackMessage.thread_ts ? {
        id: slackMessage.thread_ts,
        parentId: slackMessage.thread_ts !== slackMessage.ts ? slackMessage.thread_ts : undefined
      } : undefined,
      reactions: slackMessage.reactions?.map((reaction: any) => ({
        emoji: reaction.name,
        count: reaction.count,
        users: reaction.users || []
      })) || [],
      attachments: slackMessage.files?.map((file: any) => ({
        type: file.mimetype || 'unknown',
        url: file.url_private || file.permalink,
        name: file.name || 'Untitled'
      })) || [],
      metadata: {
        originalData: slackMessage,
        messageType: slackMessage.type,
        subtype: slackMessage.subtype
      }
    };
  }

  // Discord メッセージの正規化
  static normalizeDiscordMessage(discordMessage: any): UnifiedMessage {
    return {
      id: discordMessage.id,
      service: 'discord',
      timestamp: new Date(discordMessage.timestamp),
      author: {
        id: discordMessage.author.id,
        name: discordMessage.author.username,
        avatar: discordMessage.author.avatar ? 
          `https://cdn.discordapp.com/avatars/${discordMessage.author.id}/${discordMessage.author.avatar}.png` : 
          undefined
      },
      content: discordMessage.content || '',
      channel: {
        id: discordMessage.channel_id,
        name: discordMessage.channel_name || 'Unknown Channel'
      },
      reactions: discordMessage.reactions?.map((reaction: any) => ({
        emoji: reaction.emoji.name,
        count: reaction.count,
        users: [] // Discord APIでは詳細なユーザーリストが別途必要
      })) || [],
      attachments: discordMessage.attachments?.map((attachment: any) => ({
        type: attachment.content_type || 'unknown',
        url: attachment.url,
        name: attachment.filename || 'Untitled'
      })) || [],
      metadata: {
        originalData: discordMessage,
        messageType: discordMessage.type,
        guildId: discordMessage.guild_id
      }
    };
  }

  // Google Meet 会議の正規化
  static normalizeGoogleMeeting(googleMeeting: any): UnifiedMeeting {
    return {
      id: googleMeeting.id,
      service: 'google',
      title: googleMeeting.summary || 'Untitled Meeting',
      startTime: new Date(googleMeeting.start.dateTime || googleMeeting.start.date),
      endTime: new Date(googleMeeting.end.dateTime || googleMeeting.end.date),
      duration: this.calculateDuration(
        new Date(googleMeeting.start.dateTime || googleMeeting.start.date),
        new Date(googleMeeting.end.dateTime || googleMeeting.end.date)
      ),
      participants: googleMeeting.attendees?.map((attendee: any) => ({
        id: attendee.email,
        name: attendee.displayName || attendee.email,
        email: attendee.email
      })) || [],
      organizer: {
        id: googleMeeting.organizer.email,
        name: googleMeeting.organizer.displayName || googleMeeting.organizer.email,
        email: googleMeeting.organizer.email
      },
      recording: {
        available: false // Google Calendar APIでは録画情報は別途必要
      },
      metadata: {
        originalData: googleMeeting,
        location: googleMeeting.location,
        conferenceData: googleMeeting.conferenceData
      }
    };
  }

  // Teams 会議の正規化
  static normalizeTeamsMeeting(teamsMeeting: any): UnifiedMeeting {
    return {
      id: teamsMeeting.id,
      service: 'teams',
      title: teamsMeeting.subject || 'Untitled Meeting',
      startTime: new Date(teamsMeeting.start.dateTime),
      endTime: new Date(teamsMeeting.end.dateTime),
      duration: this.calculateDuration(
        new Date(teamsMeeting.start.dateTime),
        new Date(teamsMeeting.end.dateTime)
      ),
      participants: teamsMeeting.attendees?.map((attendee: any) => ({
        id: attendee.emailAddress.address,
        name: attendee.emailAddress.name,
        email: attendee.emailAddress.address
      })) || [],
      organizer: {
        id: teamsMeeting.organizer.emailAddress.address,
        name: teamsMeeting.organizer.emailAddress.name,
        email: teamsMeeting.organizer.emailAddress.address
      },
      recording: {
        available: false // Teams Graph APIでは録画情報は別途必要
      },
      metadata: {
        originalData: teamsMeeting,
        onlineMeeting: teamsMeeting.onlineMeeting
      }
    };
  }
  // Teamsメッセージの正規化（既存のnormalizeTeamsMeetingの後に追加）
static normalizeTeamsMessage(teamsMessage: any): UnifiedMessage {
  return {
    id: teamsMessage.id,
    service: 'teams',
    timestamp: new Date(teamsMessage.createdDateTime),
    author: {
      id: teamsMessage.from?.user?.id || 'unknown',
      name: teamsMessage.from?.user?.displayName || 'Unknown User',
      email: teamsMessage.from?.user?.userPrincipalName
    },
    content: teamsMessage.body?.content || '',
    channel: {
      id: teamsMessage.channelId || 'unknown',
      name: teamsMessage.channelName || 'Unknown Channel'
    },
    attachments: teamsMessage.attachments?.map((attachment: any) => ({
      type: attachment.contentType || 'unknown',
      url: attachment.contentUrl || attachment.content,
      name: attachment.name || 'Untitled'
    })) || [],
    reactions: teamsMessage.reactions?.map((reaction: any) => ({
      emoji: reaction.reactionType,
      count: reaction.users?.length || 0,
      users: reaction.users?.map((user: any) => user.user?.id) || []
    })) || [],
    metadata: {
      originalData: teamsMessage,
      messageType: teamsMessage.messageType,
      teamId: teamsMessage.teamId,
      teamName: teamsMessage.teamName,
      importance: teamsMessage.importance
    }
  };
}

  // ChatWork メッセージの正規化
  static normalizeChatWorkMessage(chatworkMessage: any): UnifiedMessage {
    return {
    id: chatworkMessage.message_id,
    service: 'chatwork',
    timestamp: new Date(chatworkMessage.send_time * 1000),
    author: {
      id: chatworkMessage.account.account_id.toString(),
      name: chatworkMessage.account.name,
      avatar: chatworkMessage.account.avatar_image_url
    },
    content: chatworkMessage.body || '',
    channel: {
      id: chatworkMessage.room_id?.toString() || 'unknown',
      name: chatworkMessage.room_name || 'ChatWork Room' // room_nameを使用
    },
    attachments: [], // ChatWorkでは添付ファイル情報は別途API呼び出しが必要
    reactions: [], // ChatWorkにはリアクション機能なし
    metadata: {
      originalData: chatworkMessage,
      updateTime: chatworkMessage.update_time
    }
  };
}

  // LINE WORKS メッセージの正規化
  static normalizeLineWorksMessage(lineWorksMessage: any): UnifiedMessage {
    return {
      id: lineWorksMessage.id,
      service: 'line-works',
      timestamp: new Date(lineWorksMessage.createdTime),
      author: {
        id: lineWorksMessage.createdBy.userId,
        name: lineWorksMessage.createdBy.displayName,
        avatar: lineWorksMessage.createdBy.profileImageUrl
      },
      content: lineWorksMessage.content?.text || '',
      channel: lineWorksMessage.channelId ? {
        id: lineWorksMessage.channelId,
        name: 'LINE WORKS Channel'
      } : undefined,
      metadata: {
        originalData: lineWorksMessage,
        messageType: lineWorksMessage.type
      }
    };
  }

  // 時間計算ヘルパー
  private static calculateDuration(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
  }

  // サービス別正規化ディスパッチャー
  static normalizeMessage(service: ServiceType, rawMessage: any): UnifiedMessage {
    switch (service) {
      case 'slack':
        return this.normalizeSlackMessage(rawMessage);
      case 'discord':
        return this.normalizeDiscordMessage(rawMessage);
      case 'chatwork':
        return this.normalizeChatWorkMessage(rawMessage);
      case 'line-works':
        return this.normalizeLineWorksMessage(rawMessage);
      default:
        throw new Error(`Unsupported service for message normalization: ${service}`);
    }
  }

  static normalizeMeeting(service: ServiceType, rawMeeting: any): UnifiedMeeting {
    switch (service) {
      case 'google':
        return this.normalizeGoogleMeeting(rawMeeting);
      case 'teams':
        return this.normalizeTeamsMeeting(rawMeeting);
      default:
        throw new Error(`Unsupported service for meeting normalization: ${service}`);
    }
  }
}