import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

// Prismaクライアント初期化
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 統合データ取得API開始 - 詳細デバッグ版');

    // 認証確認（authOptionsを正しく渡す）
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('❌ 未認証アクセス');
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーIDをemailから取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      console.log('❌ ユーザーが見つかりません:', session.user.email);
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    console.log('✅ ユーザー確認:', { id: user.id, email: user.email });

    // 🆕 詳細なクエリログ追加
    console.log('📊 データベースクエリ実行:', {
      userId: user.id,
      query: 'integration.findMany',
      timestamp: new Date().toISOString()
    });

    // ユーザーの統合情報を取得（metadataフィールドを削除）
    const userIntegrations = await prisma.integration.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        service: true,
        accessToken: true,
        refreshToken: true,
        teamId: true,
        teamName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        scope: true,        
        tokenType: true,    
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // 🆕 Teams統合の詳細分析
    const teamsIntegrations = userIntegrations.filter(i => i.service === 'azure-ad' || i.service === 'teams');
    
    console.log('🔍 Teams統合詳細分析:', {
      count: teamsIntegrations.length,
      details: teamsIntegrations.map(integration => ({
        id: integration.id,
        service: integration.service,
        isActive: integration.isActive,
        hasAccessToken: !!integration.accessToken,
        accessTokenLength: integration.accessToken?.length || 0,
        accessTokenPreview: integration.accessToken ? 
          `${integration.accessToken.substring(0, 20)}...${integration.accessToken.substring(integration.accessToken.length - 10)}` : 
          'なし',
        hasRefreshToken: !!integration.refreshToken,
        refreshTokenLength: integration.refreshToken?.length || 0,
        scope: integration.scope,
        scopeLength: integration.scope?.length || 0,
        tokenType: integration.tokenType,
        teamId: integration.teamId,
        teamName: integration.teamName,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
        timeSinceUpdate: Date.now() - integration.updatedAt.getTime()
      }))
    });

    // 🆕 アクセストークンの健全性チェック
    const tokenHealthCheck = userIntegrations.map(integration => {
      const health = {
        service: integration.service,
        isHealthy: true,
        issues: [] as string[],
        recommendations: [] as string[]
      };

      // トークンの存在チェック
      if (!integration.accessToken) {
        health.isHealthy = false;
        health.issues.push('アクセストークンが存在しません');
        health.recommendations.push('再認証が必要です');
      } else if (integration.accessToken.length < 50) {
        health.isHealthy = false;
        health.issues.push(`アクセストークンが短すぎます（${integration.accessToken.length}文字）`);
        health.recommendations.push('トークンが破損している可能性があります');
      }

      // Teamsの特別チェック
      if ((integration.service === 'azure-ad' || integration.service === 'teams')) {
        if (!integration.scope) {
          health.isHealthy = false;
          health.issues.push('スコープ情報が存在しません');
          health.recommendations.push('権限設定を確認してください');
        } else {
          const requiredScopes = ['User.Read', 'User.Read.All'];
          const hasRequiredScopes = requiredScopes.some(scope => 
            integration.scope!.includes(scope)
          );
          
          if (!hasRequiredScopes) {
            health.isHealthy = false;
            health.issues.push('必要な権限が不足しています');
            health.recommendations.push('管理者権限の再取得が必要です');
          }
        }

        // トークンの有効期限推定
        const tokenAge = Date.now() - integration.updatedAt.getTime();
        const oneHour = 60 * 60 * 1000;
        if (tokenAge > oneHour) {
          health.issues.push(`トークンが古い可能性があります（${Math.round(tokenAge / oneHour)}時間前）`);
          health.recommendations.push('トークンの更新を確認してください');
        }
      }

      return health;
    });

    console.log('🔍 トークン健全性チェック結果:', tokenHealthCheck);

    console.log('📊 データベースから取得した統合情報（詳細）:', {
      count: userIntegrations.length,
      services: userIntegrations.map(i => ({
        id: i.id,
        service: i.service,
        isActive: i.isActive,
        hasToken: !!i.accessToken,
        tokenLength: i.accessToken?.length || 0,
        teamName: i.teamName,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
        scope: i.scope,
        tokenType: i.tokenType
      }))
    });

    // 🆕 サービス重複チェック
    const serviceCounts = userIntegrations.reduce((acc, integration) => {
      acc[integration.service] = (acc[integration.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const duplicateServices = Object.entries(serviceCounts).filter(([_, count]) => count > 1);
    if (duplicateServices.length > 0) {
      console.warn('⚠️ 重複サービス検出:', duplicateServices);
    }

    // フロントエンド用にデータ形式を変換（ダッシュボードの期待形式に合わせる）
    const formattedIntegrations = userIntegrations.map(integration => ({
      id: integration.id,
      service: integration.service, 
      isActive: integration.isActive,
      createdAt: integration.createdAt.toISOString(),
      updatedAt: integration.updatedAt.toISOString(),
      // 追加情報
      teamId: integration.teamId,
      teamName: integration.teamName,
      hasToken: !!integration.accessToken,
      tokenLength: integration.accessToken?.length || 0, // 🆕 トークン長を追加
      hasRefreshToken: !!integration.refreshToken,
      scope: integration.scope,
      tokenType: integration.tokenType,
      // 🆕 権限情報の推定
      hasAdminPermission: integration.scope?.includes('User.Read.All') || 
                         integration.scope?.includes('admin.directory.user.readonly') || 
                         false,
      // 🆕 健全性情報
      isHealthy: tokenHealthCheck.find(h => h.service === integration.service)?.isHealthy || false,
      healthIssues: tokenHealthCheck.find(h => h.service === integration.service)?.issues || [],
      recommendations: tokenHealthCheck.find(h => h.service === integration.service)?.recommendations || []
    }));

    // 統計情報計算
    const activeIntegrations = formattedIntegrations.filter(i => i.isActive);
    const healthyIntegrations = formattedIntegrations.filter(i => i.isHealthy);
    
    const stats = {
      total: formattedIntegrations.length,
      active: activeIntegrations.length,
      inactive: formattedIntegrations.length - activeIntegrations.length,
      healthy: healthyIntegrations.length,
      unhealthy: formattedIntegrations.length - healthyIntegrations.length,
      services: formattedIntegrations.map(i => i.service),
      lastUpdated: formattedIntegrations.length > 0 
        ? Math.max(...formattedIntegrations.map(i => new Date(i.updatedAt).getTime()))
        : Date.now(),
      // 🆕 Teams統合の特別統計
      teamsIntegrationCount: teamsIntegrations.length,
      teamsWithValidTokens: teamsIntegrations.filter(t => t.accessToken && t.accessToken.length > 50).length
    };

    console.log('✅ 最終レスポンス準備完了:', {
      userId: user.id,
      stats,
      duplicateServices: duplicateServices.length > 0 ? duplicateServices : 'なし',
      integrations: formattedIntegrations.map(i => ({ 
        service: i.service, 
        isActive: i.isActive,
        hasToken: i.hasToken,
        tokenLength: i.tokenLength,
        teamName: i.teamName,
        hasAdminPermission: i.hasAdminPermission,
        isHealthy: i.isHealthy,
        healthIssues: i.healthIssues
      }))
    });

    // レスポンス形式をダッシュボードに最適化
    const response = {
      success: true,
      integrations: formattedIntegrations,
      stats,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      debug: {
        duplicateServices,
        rawCount: userIntegrations.length,
        formattedCount: formattedIntegrations.length,
        servicesWithTokens: formattedIntegrations.filter(i => i.hasToken).map(i => i.service),
        servicesWithAdminPermission: formattedIntegrations.filter(i => i.hasAdminPermission).map(i => i.service),
        // 🆕 Teams統合の詳細デバッグ情報
        teamsDebug: {
          count: teamsIntegrations.length,
          services: teamsIntegrations.map(t => t.service),
          tokenLengths: teamsIntegrations.map(t => t.accessToken?.length || 0),
          scopes: teamsIntegrations.map(t => t.scope),
          lastUpdated: teamsIntegrations.map(t => t.updatedAt)
        },
        tokenHealthSummary: {
          total: tokenHealthCheck.length,
          healthy: tokenHealthCheck.filter(h => h.isHealthy).length,
          issues: tokenHealthCheck.filter(h => !h.isHealthy).map(h => ({
            service: h.service,
            issues: h.issues,
            recommendations: h.recommendations
          }))
        }
      },
      timestamp: new Date().toISOString()
    };

    // CORS ヘッダー追加（必要に応じて）
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('❌ ユーザー統合情報取得エラー:', error);
    
    // エラーの詳細ログ
    if (error instanceof Error) {
      console.error('エラー詳細:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'ユーザー統合情報の取得に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 統合情報更新API開始');

    // 認証確認（authOptionsを正しく渡す）
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('❌ 未認証アクセス');
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーIDをemailから取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      console.log('❌ ユーザーが見つかりません:', session.user.email);
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { serviceId, serviceName, status, settings, accessToken, refreshToken, teamId, teamName, scope } = body;

    console.log('📝 統合情報更新リクエスト:', {
      userId: user.id,
      serviceId,
      status,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      teamName,
      scope
    });

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId は必須です' },
        { status: 400 }
      );
    }

    // 既存の統合情報を確認
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        userId: user.id,
        service: serviceId,
      },
    });

    let integration;
    const isActive = status === 'connected';

    if (existingIntegration) {
      // 更新
      integration = await prisma.integration.update({
        where: {
          id: existingIntegration.id,
        },
        data: {
          isActive: isActive,
          accessToken: accessToken || existingIntegration.accessToken,
          refreshToken: refreshToken || existingIntegration.refreshToken,
          teamId: teamId || existingIntegration.teamId,
          teamName: teamName || serviceName || existingIntegration.teamName,
          scope: scope || existingIntegration.scope,
          updatedAt: new Date(),
        },
      });
      console.log('✅ 統合情報更新完了:', {
        id: integration.id,
        service: integration.service,
        isActive: integration.isActive
      });
    } else {
      // 新規作成
      integration = await prisma.integration.create({
        data: {
          userId: user.id,
          service: serviceId,
          accessToken: accessToken || '',
          refreshToken: refreshToken || null,
          teamId: teamId || null,
          teamName: teamName || serviceName || serviceId,
          scope: scope || null,
          isActive: isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log('✅ 統合情報作成完了:', {
        id: integration.id,
        service: integration.service,
        isActive: integration.isActive
      });
    }

    // フロントエンド用にデータ形式を変換
    const formattedIntegration = {
      id: integration.id,
      service: integration.service,
      isActive: integration.isActive,
      createdAt: integration.createdAt.toISOString(),
      updatedAt: integration.updatedAt.toISOString(),
      teamId: integration.teamId,
      teamName: integration.teamName,
      hasToken: !!integration.accessToken,
      scope: integration.scope,
    };

    return NextResponse.json({
      success: true,
      integration: formattedIntegration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ユーザー統合情報更新エラー:', error);
    
    // エラーの詳細ログ
    if (error instanceof Error) {
      console.error('エラー詳細:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'ユーザー統合情報の更新に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// データベース接続確認用のヘルスチェック
export async function HEAD(request: NextRequest) {
  try {
    // データベース接続確認
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('❌ データベース接続エラー:', error);
    return new NextResponse(null, { status: 500 });
  }
}