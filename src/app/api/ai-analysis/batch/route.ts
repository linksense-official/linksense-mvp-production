// src/app/api/ai-analysis/batch/route.ts の修正版
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AIAnalysisEngine, AIAnalysisResult } from '@/lib/ai/analysis-engine';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { analyses = ['comprehensive', 'productivity', 'burnout', 'team_dynamics'] } = body;

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
        error: 'No data available for batch analysis'
      });
    }

    // バッチ分析実行 - 型安全な実装
    const results: { [key: string]: AIAnalysisResult } = {};
    const errors: { [key: string]: string } = {};

    for (const analysisType of analyses) {
      try {
        let result: AIAnalysisResult;
        switch (analysisType) {
          case 'comprehensive':
            result = await AIAnalysisEngine.performComprehensiveAnalysis(messages, meetings, activities);
            break;
          case 'productivity':
            result = await AIAnalysisEngine.analyzeProductivity(messages, meetings);
            break;
          case 'burnout':
            result = await AIAnalysisEngine.analyzeBurnoutRisk(messages, meetings, activities);
            break;
          case 'team_dynamics':
            result = await AIAnalysisEngine.analyzeTeamDynamics(messages, meetings);
            break;
          default:
            throw new Error(`Unknown analysis type: ${analysisType}`);
        }
        results[analysisType] = result;
      } catch (error) {
        console.error(`${analysisType}分析エラー:`, error);
        errors[analysisType] = error instanceof Error ? error.message : 'Analysis failed';
      }
    }

    return NextResponse.json({
      success: Object.keys(results).length > 0,
      results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      metadata: {
        dataPoints: {
          messages: messages.length,
          meetings: meetings.length,
          activities: activities.length
        },
        analysesRequested: analyses.length,
        analysesCompleted: Object.keys(results).length,
        analysesFailed: Object.keys(errors).length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('バッチAI分析エラー:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch analysis failed'
    }, { status: 500 });
  }
}