import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // 認証確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザー取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // Discord統合を完全削除
    const deleteResult = await prisma.integration.deleteMany({
      where: {
        userId: user.id,
        service: 'discord'
      }
    });

    console.log('🗑️ Discord統合の完全削除:', deleteResult);

    return NextResponse.json({
      success: true,
      message: 'Discord統合が完全に削除されました',
      deleted: deleteResult.count > 0
    });
  } catch (error) {
    console.error('❌ Discord統合リセットエラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Discord統合のリセットに失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}