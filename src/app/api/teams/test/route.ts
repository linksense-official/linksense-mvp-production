// src/app/api/teams/test/route.ts
// Microsoft Teams統合テストAPI
// LinkSense MVP Teams統合完全版

import { NextRequest, NextResponse } from 'next/server';
import { teamsTestUtils } from '@/lib/teams-test-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('🔷 Teams統合テストAPI呼び出し');

    // デバッグ情報出力
    teamsTestUtils.logDebugInfo();

    // 健全性チェック実行
    const healthCheck = await teamsTestUtils.performHealthCheck();

    // OAuth設定検証
    const oauthValidation = teamsTestUtils.validateTeamsOAuthConfig();

    // テスト用OAuth URL生成
    const testOAuthURL = teamsTestUtils.generateTestOAuthURL();

    // モックデータ生成
    const mockData = teamsTestUtils.generateMockTeamsData();

    const response = {
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        teamsDebug: process.env.NEXT_PUBLIC_TEAMS_DEBUG,
        teamsMockMode: process.env.NEXT_PUBLIC_TEAMS_MOCK_MODE,
        teamsTestMode: process.env.TEAMS_TEST_MODE
      },
      healthCheck,
      oauthValidation,
      testOAuthURL,
      mockData: {
        usersCount: mockData.users.length,
        teamsCount: mockData.teams.length,
        meetingsCount: mockData.meetings.length
      },
      recommendations: generateRecommendations(healthCheck, oauthValidation)
    };

    console.log('✅ Teams統合テスト完了:', response.healthCheck.overall);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Teams統合テストエラー:', error);

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Teams統合テストでエラーが発生しました'
    }, { status: 500 });
  }
}

/**
 * 健全性チェック結果に基づく推奨事項生成
 */
function generateRecommendations(
  healthCheck: any,
  oauthValidation: any
): string[] {
  const recommendations: string[] = [];

  if (!oauthValidation.isValid) {
    recommendations.push('Azure App Registrationでアプリを作成し、TEAMS_CLIENT_IDとTEAMS_CLIENT_SECRETを設定してください');
  }

  if (oauthValidation.warnings.length > 0) {
    recommendations.push('環境変数のデフォルト値を実際の値に更新してください');
  }

  if (healthCheck.overall === 'error') {
    recommendations.push('エラー状態のチェック項目を修正してください');
  }

  if (healthCheck.overall === 'warning') {
    recommendations.push('警告状態のチェック項目を確認してください');
  }

  if (!process.env.NGROK_URL?.startsWith('https://')) {
    recommendations.push('ngrokを起動し、HTTPS URLを環境変数に設定してください');
  }

  if (recommendations.length === 0) {
    recommendations.push('Teams統合の設定は正常です。OAuth認証をテストしてください');
  }

  return recommendations;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, accessToken } = body;

    console.log(`🔷 Teams統合テストアクション: ${action}`);

    switch (action) {
      case 'test-api-connection':
        if (!accessToken) {
          return NextResponse.json({
            status: 'error',
            message: 'アクセストークンが必要です'
          }, { status: 400 });
        }

        const apiTest = await teamsTestUtils.testTeamsAPIConnection(accessToken);
        return NextResponse.json({
          status: 'success',
          action,
          result: apiTest
        });

      case 'generate-mock-data':
        const mockData = teamsTestUtils.generateMockTeamsData();
        return NextResponse.json({
          status: 'success',
          action,
          result: mockData
        });

      default:
        return NextResponse.json({
          status: 'error',
          message: `未知のアクション: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Teams統合テストPOSTエラー:', error);

    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Teams統合テストでエラーが発生しました'
    }, { status: 500 });
  }
}