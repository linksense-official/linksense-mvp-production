// src/app/api/integrations/oauth-callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // 認証確認
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーIDをemailから取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { code, state, integrationId, userId } = body;

    // セキュリティチェック：リクエストのuserIdとセッションのuserIdが一致するか確認
    if (userId && userId !== user.id) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    if (!code || !integrationId) {
      return NextResponse.json(
        { error: 'code と integrationId は必須です' },
        { status: 400 }
      );
    }

    console.log('🔄 OAuth認証コールバック処理開始:', {
      userId: user.id,
      integrationId,
      hasCode: !!code,
      hasState: !!state
    });

    // サービス別のOAuth処理
    let tokenData;
    let teamInfo;

    try {
      switch (integrationId) {
        case 'slack':
          tokenData = await handleSlackOAuth(code, state);
          break;
        case 'microsoft-teams':
          tokenData = await handleTeamsOAuth(code, state);
          break;
        case 'chatwork':
          tokenData = await handleChatWorkOAuth(code, state);
          break;
        case 'line-works':
          tokenData = await handleLineWorksOAuth(code, state);
          break;
        case 'discord':
          tokenData = await handleDiscordOAuth(code, state);
          break;
        case 'google-meet':
          tokenData = await handleGoogleMeetOAuth(code, state);
          break;
        case 'zoom':
          tokenData = await handleZoomOAuth(code, state);
          break;
        default:
          // デモ用の処理（開発中のサービス）
          console.log(`🧪 デモOAuth処理: ${integrationId}`);
          tokenData = {
            access_token: `demo_token_${integrationId}_${Date.now()}`,
            refresh_token: `demo_refresh_${integrationId}_${Date.now()}`,
            team_id: `demo_team_${integrationId}`,
            team_name: `Demo Team for ${integrationId}`,
          };
          break;
      }

      if (!tokenData || !tokenData.access_token) {
        throw new Error('OAuth認証に失敗しました：トークンが取得できませんでした');
      }

      console.log('✅ OAuth認証成功:', {
        integrationId,
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        teamId: tokenData.team_id,
        teamName: tokenData.team_name
      });

    } catch (oauthError) {
      console.error(`❌ ${integrationId} OAuth認証エラー:`, oauthError);
      return NextResponse.json(
        { 
          error: `${integrationId} OAuth認証に失敗しました`,
          details: oauthError instanceof Error ? oauthError.message : '不明なエラー'
        },
        { status: 400 }
      );
    }

    // データベースに統合情報を保存
    try {
      // 既存の統合情報を確認
      const existingIntegration = await prisma.integration.findFirst({
        where: {
          userId: user.id,
          service: integrationId,
        },
      });

      let integration;

      if (existingIntegration) {
        // 更新
        integration = await prisma.integration.update({
          where: {
            id: existingIntegration.id,
          },
          data: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || null,
            teamId: tokenData.team_id || null,
            teamName: tokenData.team_name || null,
            isActive: true,
            updatedAt: new Date(),
          },
        });
        console.log('✅ 統合情報更新完了:', integration.id);
      } else {
        // 新規作成
        integration = await prisma.integration.create({
          data: {
            userId: user.id,
            service: integrationId,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || null,
            teamId: tokenData.team_id || null,
            teamName: tokenData.team_name || getServiceDisplayName(integrationId),
            isActive: true,
          },
        });
        console.log('✅ 統合情報作成完了:', integration.id);
      }

      // フロントエンド用にデータ形式を変換
      const formattedIntegration = {
        id: integration.id,
        serviceId: integration.service,
        serviceName: integration.teamName || integration.service,
        status: 'connected',
        healthScore: 95, // 新規接続時は高スコア
        lastSync: new Date().toISOString(),
        dataPoints: Math.floor(Math.random() * 1000) + 500,
        settings: {
          teamId: integration.teamId,
          teamName: integration.teamName,
        },
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      };

      console.log('✅ OAuth認証コールバック処理完了:', {
        userId: user.id,
        integrationId,
        integrationDbId: integration.id,
        status: 'connected'
      });

      return NextResponse.json({
        success: true,
        message: `${getServiceDisplayName(integrationId)}との連携が完了しました`,
        integration: formattedIntegration,
        integrationId,
      });

    } catch (dbError) {
      console.error('❌ データベース保存エラー:', dbError);
      return NextResponse.json(
        { 
          error: '統合情報の保存に失敗しました',
          details: dbError instanceof Error ? dbError.message : '不明なエラー'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ OAuth認証コールバック処理エラー:', error);
    
    return NextResponse.json(
      { 
        error: 'OAuth認証処理に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

// サービス別OAuth処理関数（デモ実装）
async function handleSlackOAuth(code: string, state?: string) {
  // 実際の実装では Slack API を呼び出す
  console.log('🔄 Slack OAuth処理中...');
  
  // デモ用のレスポンス
  return {
    access_token: `slack_demo_token_${Date.now()}`,
    refresh_token: `slack_demo_refresh_${Date.now()}`,
    team_id: 'T1234567890',
    team_name: 'Demo Slack Team',
  };
}

async function handleTeamsOAuth(code: string, state?: string) {
  console.log('🔄 Microsoft Teams OAuth処理中...');
  
  return {
    access_token: `teams_demo_token_${Date.now()}`,
    refresh_token: `teams_demo_refresh_${Date.now()}`,
    team_id: 'teams_demo_id',
    team_name: 'Demo Teams Organization',
  };
}

async function handleChatWorkOAuth(code: string, state?: string) {
  console.log('🔄 ChatWork OAuth処理中...');
  
  return {
    access_token: `chatwork_demo_token_${Date.now()}`,
    refresh_token: `chatwork_demo_refresh_${Date.now()}`,
    team_id: 'cw_demo_id',
    team_name: 'Demo ChatWork Company',
  };
}

async function handleLineWorksOAuth(code: string, state?: string) {
  console.log('🔄 LINE WORKS OAuth処理中...');
  
  return {
    access_token: `lineworks_demo_token_${Date.now()}`,
    refresh_token: `lineworks_demo_refresh_${Date.now()}`,
    team_id: 'lw_demo_id',
    team_name: 'Demo LINE WORKS Organization',
  };
}

async function handleDiscordOAuth(code: string, state?: string) {
  console.log('🔄 Discord OAuth処理中...');
  
  return {
    access_token: `discord_demo_token_${Date.now()}`,
    refresh_token: `discord_demo_refresh_${Date.now()}`,
    team_id: 'discord_guild_id',
    team_name: 'Demo Discord Server',
  };
}

async function handleGoogleMeetOAuth(code: string, state?: string) {
  console.log('🔄 Google Meet OAuth処理中...');
  
  return {
    access_token: `googlemeet_demo_token_${Date.now()}`,
    refresh_token: `googlemeet_demo_refresh_${Date.now()}`,
    team_id: 'google_org_id',
    team_name: 'Demo Google Workspace',
  };
}

async function handleZoomOAuth(code: string, state?: string) {
  console.log('🔄 Zoom OAuth処理中...');
  
  return {
    access_token: `zoom_demo_token_${Date.now()}`,
    refresh_token: `zoom_demo_refresh_${Date.now()}`,
    team_id: 'zoom_account_id',
    team_name: 'Demo Zoom Account',
  };
}

function getServiceDisplayName(integrationId: string): string {
  const displayNames: { [key: string]: string } = {
    'slack': 'Slack',
    'microsoft-teams': 'Microsoft Teams',
    'chatwork': 'ChatWork',
    'line-works': 'LINE WORKS',
    'discord': 'Discord',
    'google-meet': 'Google Meet',
    'cybozu-office': 'サイボウズ Office',
    'zoom': 'Zoom'
  };
  return displayNames[integrationId] || integrationId;
}