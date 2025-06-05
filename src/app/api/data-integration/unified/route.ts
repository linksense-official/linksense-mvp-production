// src/app/api/data-integration/unified/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { ServiceDataResponse, UnifiedMessage, UnifiedMeeting, UnifiedActivity, DataIntegrationOptions, ServiceType } from '@/lib/data-integration/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // URLパラメータ取得
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type') || 'messages'; // 'messages', 'meetings', 'activities', 'all'
    const services = searchParams.get('services')?.split(',') as ServiceType[] || ['google', 'slack', 'discord', 'teams', 'chatwork', 'line-works'];
    const options: DataIntegrationOptions = {
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : new Date(),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      includeMetadata: searchParams.get('includeMetadata') === 'true'
    };

    // ユーザーの統合状況確認
    const userIntegrations = await getUserIntegrations(session.user.id);
    const availableServices = services.filter(service => userIntegrations.includes(service));

    if (availableServices.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No integrated services found',
        availableServices: []
      });
    }

    // データタイプ別処理
    switch (dataType) {
      case 'messages':
        return await getUnifiedMessages(availableServices, options, request.url);
      case 'meetings':
        return await getUnifiedMeetings(availableServices, options, request.url);
      case 'activities':
        return await getUnifiedActivities(availableServices, options, request.url);
      case 'all':
        return await getAllUnifiedData(availableServices, options, request.url);
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid data type. Use: messages, meetings, activities, or all'
        });
    }

  } catch (error) {
    console.error('Unified data integration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// ユーザーの統合サービス一覧取得
async function getUserIntegrations(userId: string): Promise<ServiceType[]> {
  const integrations: ServiceType[] = [];

  // NextAuth管理のアカウント確認
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { provider: true, access_token: true }
  });

  for (const account of accounts) {
    if (account.access_token) {
      switch (account.provider) {
        case 'google':
          integrations.push('google');
          break;
        case 'slack':
          integrations.push('slack');
          break;
        case 'discord':
          integrations.push('discord');
          break;
        case 'azure-ad':
          integrations.push('teams');
          break;
      }
    }
  }

  // カスタム統合確認
  const customIntegrations = await prisma.integration.findMany({
    where: { userId, isActive: true },
    select: { service: true }
  });

  for (const integration of customIntegrations) {
    if (integration.service === 'chatwork') {
      integrations.push('chatwork');
    } else if (integration.service === 'line-works') {
      integrations.push('line-works');
    }
  }

  return integrations;
}

// 統合メッセージデータ取得
async function getUnifiedMessages(services: ServiceType[], options: DataIntegrationOptions, baseUrl: string): Promise<NextResponse> {
  const allMessages: UnifiedMessage[] = [];
  const errors: { [service: string]: string } = {};
  const rateLimit: { [service: string]: any } = {};

  // 各サービスからメッセージを並行取得
  const fetchPromises = services.map(async (service) => {
    try {
      const serviceUrl = new URL(baseUrl.replace('/unified', `/${service}`));
      serviceUrl.searchParams.set('dateFrom', options.dateFrom!.toISOString());
      serviceUrl.searchParams.set('dateTo', options.dateTo!.toISOString());
      serviceUrl.searchParams.set('limit', Math.ceil((options.limit || 100) / services.length).toString());
      serviceUrl.searchParams.set('includeMetadata', options.includeMetadata?.toString() || 'false');

      const response = await fetch(serviceUrl.toString(), {
        headers: {
          'Cookie': 'next-auth.session-token=' // セッション引き継ぎが必要な場合
        }
      });

      if (response.ok) {
        const data: ServiceDataResponse<UnifiedMessage> = await response.json();
        if (data.success && data.data) {
          allMessages.push(...data.data);
          if (data.rateLimit) {
            rateLimit[service] = data.rateLimit;
          }
        } else {
          errors[service] = data.error || 'Unknown error';
        }
      } else {
        errors[service] = `HTTP ${response.status}`;
      }
    } catch (error) {
      errors[service] = error instanceof Error ? error.message : 'Fetch error';
    }
  });

  await Promise.allSettled(fetchPromises);

  // 統合データをタイムスタンプでソート
  allMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // 制限数まで切り取り
  const limitedMessages = allMessages.slice(0, options.limit);

  return NextResponse.json({
    success: true,
    data: limitedMessages,
    metadata: {
      totalServices: services.length,
      successfulServices: services.length - Object.keys(errors).length,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      rateLimit: Object.keys(rateLimit).length > 0 ? rateLimit : undefined
    },
    pagination: {
      hasMore: allMessages.length > (options.limit || 100),
      totalCount: allMessages.length
    }
  } as ServiceDataResponse<UnifiedMessage> & { metadata: any });
}

// 統合会議データ取得
async function getUnifiedMeetings(services: ServiceType[], options: DataIntegrationOptions, baseUrl: string): Promise<NextResponse> {
  const allMeetings: UnifiedMeeting[] = [];
  const errors: { [service: string]: string } = {};
  
  // 会議データをサポートするサービスのみ
  const meetingServices = services.filter(service => ['google', 'teams'].includes(service));

  if (meetingServices.length === 0) {
    return NextResponse.json({
      success: false,
      error: 'No services support meeting data',
      supportedServices: ['google', 'teams']
    });
  }

  // 各サービスから会議データを取得
  const fetchPromises = meetingServices.map(async (service) => {
    try {
      const serviceUrl = new URL(baseUrl.replace('/unified', `/${service}`));
      serviceUrl.searchParams.set('type', 'meetings');
      serviceUrl.searchParams.set('dateFrom', options.dateFrom!.toISOString());
      serviceUrl.searchParams.set('dateTo', options.dateTo!.toISOString());
      serviceUrl.searchParams.set('limit', Math.ceil((options.limit || 100) / meetingServices.length).toString());
      serviceUrl.searchParams.set('includeMetadata', options.includeMetadata?.toString() || 'false');

      const response = await fetch(serviceUrl.toString());

      if (response.ok) {
        const data: ServiceDataResponse<UnifiedMeeting> = await response.json();
        if (data.success && data.data) {
          allMeetings.push(...data.data);
        } else {
          errors[service] = data.error || 'Unknown error';
        }
      } else {
        errors[service] = `HTTP ${response.status}`;
      }
    } catch (error) {
      errors[service] = error instanceof Error ? error.message : 'Fetch error';
    }
  });

  await Promise.allSettled(fetchPromises);

  // 会議データを開始時間でソート
  allMeetings.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  // 制限数まで切り取り
  const limitedMeetings = allMeetings.slice(0, options.limit);

  return NextResponse.json({
    success: true,
    data: limitedMeetings,
    metadata: {
      totalServices: meetingServices.length,
      successfulServices: meetingServices.length - Object.keys(errors).length,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    },
    pagination: {
      hasMore: allMeetings.length > (options.limit || 100),
      totalCount: allMeetings.length
    }
  } as ServiceDataResponse<UnifiedMeeting> & { metadata: any });
}

// 統合アクティビティデータ取得
async function getUnifiedActivities(services: ServiceType[], options: DataIntegrationOptions, baseUrl: string): Promise<NextResponse> {
  // メッセージと会議データを組み合わせてアクティビティとして統合
  const messagesResponse = await getUnifiedMessages(services, options, baseUrl);
  const meetingsResponse = await getUnifiedMeetings(services, options, baseUrl);

  const messagesData = await messagesResponse.json();
  const meetingsData = await meetingsResponse.json();

  const allActivities: UnifiedActivity[] = [];

  // メッセージをアクティビティに変換
  if (messagesData.success && messagesData.data) {
    for (const message of messagesData.data) {
      allActivities.push({
        id: message.id,
        service: message.service,
        type: 'message',
        timestamp: message.timestamp,
        user: message.author,
        details: {
          content: message.content,
          channel: message.channel,
          reactions: message.reactions?.length || 0,
          attachments: message.attachments?.length || 0
        },
        metadata: message.metadata
      });
    }
  }

  // 会議をアクティビティに変換
  if (meetingsData.success && meetingsData.data) {
    for (const meeting of meetingsData.data) {
      allActivities.push({
        id: meeting.id,
        service: meeting.service,
        type: 'meeting',
        timestamp: meeting.startTime,
        user: meeting.organizer,
        details: {
          title: meeting.title,
          duration: meeting.duration,
          participants: meeting.participants.length,
          recording: meeting.recording?.available || false
        },
        metadata: meeting.metadata
      });
    }
  }

  // タイムスタンプでソート
  allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // 制限数まで切り取り
  const limitedActivities = allActivities.slice(0, options.limit);

  return NextResponse.json({
    success: true,
    data: limitedActivities,
    metadata: {
      totalServices: services.length,
      messageCount: messagesData.data?.length || 0,
      meetingCount: meetingsData.data?.length || 0
    },
    pagination: {
      hasMore: allActivities.length > (options.limit || 100),
      totalCount: allActivities.length
    }
  } as ServiceDataResponse<UnifiedActivity> & { metadata: any });
}

// 全データ統合取得
async function getAllUnifiedData(services: ServiceType[], options: DataIntegrationOptions, baseUrl: string): Promise<NextResponse> {
  // 並行してメッセージ、会議、アクティビティを取得
  const [messagesResponse, meetingsResponse, activitiesResponse] = await Promise.all([
    getUnifiedMessages(services, { ...options, limit: Math.ceil((options.limit || 100) / 3) }, baseUrl),
    getUnifiedMeetings(services, { ...options, limit: Math.ceil((options.limit || 100) / 3) }, baseUrl),
    getUnifiedActivities(services, { ...options, limit: Math.ceil((options.limit || 100) / 3) }, baseUrl)
  ]);

  const messagesData = await messagesResponse.json();
  const meetingsData = await meetingsResponse.json();
  const activitiesData = await activitiesResponse.json();

  return NextResponse.json({
    success: true,
    data: {
      messages: messagesData.data || [],
      meetings: meetingsData.data || [],
      activities: activitiesData.data || []
    },
    metadata: {
      totalServices: services.length,
      messageCount: messagesData.data?.length || 0,
      meetingCount: meetingsData.data?.length || 0,
      activityCount: activitiesData.data?.length || 0,
      errors: {
        messages: messagesData.metadata?.errors,
        meetings: meetingsData.metadata?.errors,
        activities: activitiesData.metadata?.errors
      }
    },
    summary: {
      totalItems: (messagesData.data?.length || 0) + (meetingsData.data?.length || 0) + (activitiesData.data?.length || 0),
      dateRange: {
        from: options.dateFrom,
        to: options.dateTo
      },
      services: services
    }
  });
}