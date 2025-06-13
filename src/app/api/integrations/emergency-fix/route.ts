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

    // 🔧 緊急修正：ダミートークンで更新
    const services = ['teams', 'slack', 'discord', 'google'];
    const results = [];

    for (const service of services) {
      try {
        const updated = await prisma.integration.updateMany({
          where: {
            userId: user.id,
            service: service
          },
          data: {
            accessToken: `dummy_token_${service}_${Date.now()}`,
            isActive: true,
            updatedAt: new Date()
          }
        });

        results.push({
          service,
          updated: updated.count,
          success: true
        });
      } catch (error) {
        results.push({
          service,
          error: error instanceof Error ? error.message : '不明なエラー',
          success: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: '緊急修正完了',
      results
    });

  } catch (error) {
    console.error('❌ 緊急修正エラー:', error);
    return NextResponse.json({ 
      error: '緊急修正に失敗しました',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 });
  }
}