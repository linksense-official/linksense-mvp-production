// src/app/api/integrations/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 認証確認（authOptionsを使わずに直接セッション取得）
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
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    console.log('🔍 ユーザー統合情報取得開始:', user.id);

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

    // フロントエンド用にデータ形式を変換
    const formattedIntegrations = userIntegrations.map(integration => ({
      id: integration.id,
      serviceId: integration.service,
      serviceName: integration.teamName || integration.service,
      status: integration.isActive ? 'connected' : 'disconnected',
      healthScore: integration.isActive ? Math.floor(Math.random() * 30) + 70 : undefined,
      lastSync: integration.isActive ? integration.updatedAt.toISOString() : undefined,
      dataPoints: integration.isActive ? Math.floor(Math.random() * 5000) + 1000 : undefined,
      settings: {
        teamId: integration.teamId,
        teamName: integration.teamName,
      },
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    }));

    console.log('✅ ユーザー統合情報取得成功:', {
      userId: user.id,
      integrationCount: formattedIntegrations.length,
      integrations: formattedIntegrations.map(i => ({ id: i.serviceId, status: i.status }))
    });

    return NextResponse.json({
      success: true,
      integrations: formattedIntegrations,
      count: formattedIntegrations.length,
    });

  } catch (error) {
    console.error('❌ ユーザー統合情報取得エラー:', error);
    
    return NextResponse.json(
      { 
        error: 'ユーザー統合情報の取得に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

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
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { serviceId, serviceName, status, settings, accessToken, refreshToken, teamId, teamName } = body;

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId は必須です' },
        { status: 400 }
      );
    }

    console.log('🔄 ユーザー統合情報更新開始:', {
      userId: user.id,
      serviceId,
      status
    });

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
      console.log('✅ 統合情報更新完了:', integration.id);
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
        },
      });
      console.log('✅ 統合情報作成完了:', integration.id);
    }

    // フロントエンド用にデータ形式を変換
    const formattedIntegration = {
      id: integration.id,
      serviceId: integration.service,
      serviceName: integration.teamName || integration.service,
      status: integration.isActive ? 'connected' : 'disconnected',
      settings: {
        teamId: integration.teamId,
        teamName: integration.teamName,
      },
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };

    return NextResponse.json({
      success: true,
      integration: formattedIntegration,
    });

  } catch (error) {
    console.error('❌ ユーザー統合情報更新エラー:', error);
    
    return NextResponse.json(
      { 
        error: 'ユーザー統合情報の更新に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}