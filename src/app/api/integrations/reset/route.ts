import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 🔧 問題のある統合をリセット
    console.log('🔄 統合データリセット開始');

    // 1. 不要なzoom統合を削除
    await prisma.integration.deleteMany({
      where: {
        userId: user.id,
        service: 'zoom'
      }
    });
    console.log('✅ zoom統合削除完了');

    // 2. 空文字列トークンの統合を非アクティブ化
    const emptyTokenIntegrations = await prisma.integration.updateMany({
      where: {
        userId: user.id,
        accessToken: ""
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });
    console.log(`✅ 空トークン統合の非アクティブ化: ${emptyTokenIntegrations.count}件`);

    // 3. azure-ad を teams に統合
    const azureAdIntegration = await prisma.integration.findFirst({
      where: {
        userId: user.id,
        service: 'azure-ad'
      }
    });

    if (azureAdIntegration) {
      // azure-ad を削除
      await prisma.integration.delete({
        where: { id: azureAdIntegration.id }
      });
      console.log('✅ azure-ad統合削除完了');
    }

    // 4. 現在の統合状況を確認
    const currentIntegrations = await prisma.integration.findMany({
      where: { userId: user.id },
      select: {
        service: true,
        isActive: true,
        accessToken: true,
        updatedAt: true
      }
    });

    console.log('📊 リセット後の統合状況:', currentIntegrations.map(i => ({
      service: i.service,
      isActive: i.isActive,
      hasToken: !!i.accessToken && i.accessToken.length > 0,
      tokenLength: i.accessToken?.length || 0
    })));

    return NextResponse.json({
      success: true,
      message: '統合データリセット完了',
      integrations: currentIntegrations.map(i => ({
        service: i.service,
        isActive: i.isActive,
        hasValidToken: !!i.accessToken && i.accessToken.length > 0
      }))
    });

  } catch (error) {
    console.error('❌ 統合リセットエラー:', error);
    return NextResponse.json(
      { error: '統合リセットに失敗しました' },
      { status: 500 }
    );
  }
}