// src/app/api/ai-analysis/comprehensive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AIAnalysisEngine } from '@/lib/ai/analysis-engine';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { analysisType = 'comprehensive', timeRange = '7d' } = body;

    // 統合データ取得
    const [messagesResponse, meetingsResponse, activitiesResponse] = await Promise.all([
      fetch(`${process.env.NEXTAUTH_URL}/api/data-integration/unified?type=messages&limit=1000&includeMetadata=true`, {
        headers: { 'Cookie': request.headers.get('Cookie') || '' }
      }),
      fetch(`${process.env.NEXTAUTH_URL}/api/data-integration/unified?type=meetings&limit=200&includeMetadata=true`, {
        headers: { 'Cookie': request.headers.get('Cookie') || '' }
      }),
      fetch(`${process.env.NEXTAUTH_URL}/api/data-integration/unified?type=activities&limit=500&includeMetadata=true`, {
        headers: { 'Cookie': request.headers.get('Cookie') || '' }
      })
    ]);

    const messagesData = messagesResponse.ok ? await messagesResponse.json() : null;
    const meetingsData = meetingsResponse.ok ? await meetingsResponse.json() : null;
    const activitiesData = activitiesResponse.ok ? await activitiesResponse.json() : null;

    const messages = messagesData?.data || [];
    const meetings = meetingsData?.data || [];
    const activities = activitiesData?.data || [];

    if (messages.length === 0 && meetings.length === 0 && activities.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No data available for analysis'
      });
    }

    let analysisResult;

    switch (analysisType) {
      case 'productivity':
        analysisResult = await AIAnalysisEngine.analyzeProductivity(messages, meetings);
        break;
      case 'burnout':
        analysisResult = await AIAnalysisEngine.analyzeBurnoutRisk(messages, meetings, activities);
        break;
      case 'team_dynamics':
        analysisResult = await AIAnalysisEngine.analyzeTeamDynamics(messages, meetings);
        break;
      case 'comprehensive':
      default:
        analysisResult = await AIAnalysisEngine.performComprehensiveAnalysis(messages, meetings, activities);
        break;
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      metadata: {
        dataPoints: {
          messages: messages.length,
          meetings: meetings.length,
          activities: activities.length
        },
        analysisType,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI分析エラー:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'AI analysis failed'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 利用可能な分析タイプを返す
    return NextResponse.json({
      success: true,
      availableAnalyses: [
        {
          type: 'comprehensive',
          name: '包括的分析',
          description: '6サービス統合の全体的な分析',
          estimatedTime: '30-60秒'
        },
        {
          type: 'productivity',
          name: '生産性分析',
          description: 'クロスプラットフォーム生産性の詳細分析',
          estimatedTime: '20-40秒'
        },
        {
          type: 'burnout',
          name: 'バーンアウト分析',
          description: '多プラットフォーム利用による負荷分析',
          estimatedTime: '25-45秒'
        },
        {
          type: 'team_dynamics',
          name: 'チームダイナミクス分析',
          description: 'クロスサービス協働パターン分析',
          estimatedTime: '20-40秒'
            }
      ],
      requirements: {
        minimumData: {
          messages: 10,
          meetings: 2,
          timeRange: '3 days'
        },
        optimalData: {
          messages: 100,
          meetings: 10,
          timeRange: '7 days'
        }
      }
    });

  } catch (error) {
    console.error('AI分析情報取得エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get analysis information'
    }, { status: 500 });
  }
}