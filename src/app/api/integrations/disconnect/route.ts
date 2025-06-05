import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // 認証確認（authOptionsを正しく渡す）
    const session = await getServerSession(authOptions);
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
    const { service, userId, integrationId } = body;

    // セキュリティチェック：リクエストのuserIdとセッションのuserIdが一致するか確認
    if (userId && userId !== user.id) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    // service または integrationId のいずれかが必要
    if (!service && !integrationId) {
      return NextResponse.json(
        { error: 'service または integrationId は必須です' },
        { status: 400 }
      );
    }

    const serviceToDisconnect = service || integrationId;

    console.log('🔄 統合サービス切断開始:', {
      userId: user.id,
      service: serviceToDisconnect
    });

    // 統合情報を検索
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        userId: user.id,
        service: serviceToDisconnect,
      },
    });

    if (!existingIntegration) {
      console.log('⚠️ 統合情報が見つかりません:', { userId: user.id, service: serviceToDisconnect });
      return NextResponse.json(
        { 
          success: true,
          message: '統合情報が見つかりませんが、切断処理は成功しました',
          service: serviceToDisconnect 
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
      service: serviceToDisconnect,
      integrationDbId: updatedIntegration.id
    });

    // フロントエンド用にデータ形式を変換（統合ページの期待形式に合わせる）
    const formattedIntegration = {
      id: updatedIntegration.id,
      service: updatedIntegration.service,
      isActive: false,
      createdAt: updatedIntegration.createdAt.toISOString(),
      updatedAt: updatedIntegration.updatedAt.toISOString(),
      teamId: updatedIntegration.teamId,
      teamName: updatedIntegration.teamName,
    };

    return NextResponse.json({
      success: true,
      message: '統合サービスの切断が完了しました',
      integration: formattedIntegration,
      service: serviceToDisconnect,
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
    // 認証確認（authOptionsを正しく渡す）
    const session = await getServerSession(authOptions);
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

    // URLパラメータから service を取得
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service') || searchParams.get('integrationId');

    if (!service) {
      return NextResponse.json(
        { error: 'service パラメータが必要です' },
        { status: 400 }
      );
    }

    console.log('🔍 統合サービス状態確認:', {
      userId: user.id,
      service
    });

    // 統合情報を検索
    const integration = await prisma.integration.findFirst({
      where: {
        userId: user.id,
        service: service,
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
        service,
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
    };

    console.log('✅ 統合サービス状態確認完了:', {
      userId: user.id,
      service,
      isActive: formattedIntegration.isActive
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