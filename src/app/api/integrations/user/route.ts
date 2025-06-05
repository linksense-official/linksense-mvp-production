import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

// Prismaクライアント初期化
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 統合データ取得API開始');

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

    // ユーザーの統合情報を取得
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
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    console.log('📊 データベースから取得した統合情報:', {
      count: userIntegrations.length,
      services: userIntegrations.map(i => ({
        service: i.service,
        isActive: i.isActive,
        hasToken: !!i.accessToken,
        teamName: i.teamName
      }))
    });

    // フロントエンド用にデータ形式を変換（ダッシュボードの期待形式に合わせる）
    const formattedIntegrations = userIntegrations.map(integration => ({
      id: integration.id,
      service: integration.service, // 統合ページで期待されるフィールド名
      isActive: integration.isActive,
      createdAt: integration.createdAt.toISOString(),
      updatedAt: integration.updatedAt.toISOString(),
      // 追加情報
      teamId: integration.teamId,
      teamName: integration.teamName,
      hasToken: !!integration.accessToken,
      hasRefreshToken: !!integration.refreshToken,
    }));

    // 統計情報計算
    const activeIntegrations = formattedIntegrations.filter(i => i.isActive);
    const stats = {
      total: formattedIntegrations.length,
      active: activeIntegrations.length,
      inactive: formattedIntegrations.length - activeIntegrations.length,
      services: formattedIntegrations.map(i => i.service),
      lastUpdated: formattedIntegrations.length > 0 
        ? Math.max(...formattedIntegrations.map(i => new Date(i.updatedAt).getTime()))
        : Date.now()
    };

    console.log('✅ ユーザー統合情報取得成功:', {
      userId: user.id,
      stats,
      integrations: formattedIntegrations.map(i => ({ 
        service: i.service, 
        isActive: i.isActive,
        hasToken: i.hasToken,
        teamName: i.teamName
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
    const { serviceId, serviceName, status, settings, accessToken, refreshToken, teamId, teamName } = body;

    console.log('📝 統合情報更新リクエスト:', {
      userId: user.id,
      serviceId,
      status,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      teamName
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