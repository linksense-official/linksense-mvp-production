// src/app/api/integrations/disconnect/route.ts
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
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { userId, integrationId } = body;

    // セキュリティチェック：リクエストのuserIdとセッションのuserIdが一致するか確認
    if (userId && userId !== user.id) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    if (!integrationId) {
      return NextResponse.json(
        { error: 'integrationId は必須です' },
        { status: 400 }
      );
    }

    console.log('🔄 統合サービス切断開始:', {
      userId: user.id,
      integrationId
    });

    // 統合情報を検索
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        userId: user.id,
        service: integrationId,
      },
    });

    if (!existingIntegration) {
      console.log('⚠️ 統合情報が見つかりません:', { userId: user.id, integrationId });
      return NextResponse.json(
        { 
          success: true,
          message: '統合情報が見つかりませんが、切断処理は成功しました',
          integrationId 
        }
      );
    }

    // 統合を無効化（完全削除ではなく、isActiveをfalseに設定）
    const updatedIntegration = await prisma.integration.update({
      where: {
        id: existingIntegration.id,
      },
      data: {
        isActive: false,
        accessToken: '', // セキュリティのためトークンをクリア
        refreshToken: null,
        updatedAt: new Date(),
      },
    });

    console.log('✅ 統合サービス切断完了:', {
      userId: user.id,
      integrationId,
      integrationDbId: updatedIntegration.id
    });

    // フロントエンド用にデータ形式を変換
    const formattedIntegration = {
      id: updatedIntegration.id,
      serviceId: updatedIntegration.service,
      serviceName: updatedIntegration.teamName || updatedIntegration.service,
      status: 'disconnected',
      settings: {
        teamId: updatedIntegration.teamId,
        teamName: updatedIntegration.teamName,
      },
      createdAt: updatedIntegration.createdAt,
      updatedAt: updatedIntegration.updatedAt,
    };

    return NextResponse.json({
      success: true,
      message: '統合サービスの切断が完了しました',
      integration: formattedIntegration,
      integrationId,
    });

  } catch (error) {
    console.error('❌ 統合サービス切断エラー:', error);
    
    return NextResponse.json(
      { 
        error: '統合サービスの切断に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

// GET メソッドでも切断状態の確認ができるようにする
export async function GET(request: NextRequest) {
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

    // URLパラメータから integrationId を取得
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');

    if (!integrationId) {
      return NextResponse.json(
        { error: 'integrationId パラメータが必要です' },
        { status: 400 }
      );
    }

    console.log('🔍 統合サービス状態確認:', {
      userId: user.id,
      integrationId
    });

    // 統合情報を検索
    const integration = await prisma.integration.findFirst({
      where: {
        userId: user.id,
        service: integrationId,
      },
      select: {
        id: true,
        service: true,
        teamId: true,
        teamName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!integration) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: '統合情報が見つかりません',
        integrationId,
      });
    }

    // フロントエンド用にデータ形式を変換
    const formattedIntegration = {
      id: integration.id,
      serviceId: integration.service,
      serviceName: integration.teamName || integration.service,
      status: integration.isActive ? 'connected' : 'disconnected',
      connected: integration.isActive,
      settings: {
        teamId: integration.teamId,
        teamName: integration.teamName,
      },
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };

    console.log('✅ 統合サービス状態確認完了:', {
      userId: user.id,
      integrationId,
      status: formattedIntegration.status
    });

    return NextResponse.json({
      success: true,
      integration: formattedIntegration,
      connected: integration.isActive,
    });

  } catch (error) {
    console.error('❌ 統合サービス状態確認エラー:', error);
    
    return NextResponse.json(
      { 
        error: '統合サービスの状態確認に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}