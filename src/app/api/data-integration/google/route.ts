// src/app/api/data-integration/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DataNormalizer } from '@/lib/data-integration/normalizer';
import { ServiceDataResponse, UnifiedMeeting, DataIntegrationOptions } from '@/lib/data-integration/types';

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // URLパラメータ取得
    const { searchParams } = new URL(request.url);
    const options: DataIntegrationOptions = {
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // デフォルト: 7日前
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : new Date(), // デフォルト: 現在
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      includeMetadata: searchParams.get('includeMetadata') === 'true'
    };

    // Google統合情報取得
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google'
      }
    });

    if (!account?.access_token) {
      return NextResponse.json({
        success: false,
        error: 'Google integration not found'
      } as ServiceDataResponse<UnifiedMeeting>);
    }

    // Google Calendar APIでイベント取得
    const timeMin = options.dateFrom!.toISOString();
    const timeMax = options.dateTo!.toISOString();
    
    const eventsUrl = `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=${options.limit}&singleEvents=true&orderBy=startTime`;

    const eventsResponse = await fetch(eventsUrl, {
      headers: {
        'Authorization': `Bearer ${account.access_token}`
      }
    });

    if (!eventsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Google Calendar API error: ${eventsResponse.status}`
      } as ServiceDataResponse<UnifiedMeeting>);
    }

    const eventsData = await eventsResponse.json();
    const allMeetings: UnifiedMeeting[] = [];

    // イベントを正規化
    if (eventsData.items) {
      for (const event of eventsData.items) {
        try {
          // Meet会議のみフィルタリング（conferenceDataがあるもの）
          if (event.conferenceData || event.location?.includes('meet.google.com') || event.hangoutLink) {
            const normalizedMeeting = DataNormalizer.normalizeGoogleMeeting(event);

            // メタデータ除去オプション対応
            const finalMeeting: UnifiedMeeting = {
              ...normalizedMeeting,
              ...(options.includeMetadata ? { metadata: normalizedMeeting.metadata } : {})
            };

            allMeetings.push(finalMeeting);
          }
        } catch (error) {
          console.error('Google meeting normalization error:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: allMeetings,
      pagination: {
        hasMore: false,
        totalCount: allMeetings.length
      }
    } as ServiceDataResponse<UnifiedMeeting>);

  } catch (error) {
    console.error('Google data integration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ServiceDataResponse<UnifiedMeeting>, { status: 500 });
  }
}