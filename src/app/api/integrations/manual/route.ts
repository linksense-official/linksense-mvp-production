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

    const { service, accessToken } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 手動でトークンを保存
    const integration = await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: user.id,
          service: service
        }
      },
      update: {
        accessToken: accessToken,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        service: service,
        accessToken: accessToken,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      integration: {
        service: integration.service,
        hasToken: !!integration.accessToken,
        isActive: integration.isActive
      }
    });

  } catch (error) {
    console.error('手動統合エラー:', error);
    return NextResponse.json({ error: '統合に失敗しました' }, { status: 500 });
  }
}