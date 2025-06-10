import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 ChatWork統合API開始');

    // 認証確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザー取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // リクエストボディからAPIトークンを取得
    const { apiToken } = await request.json();

    if (!apiToken) {
      return NextResponse.json({ error: 'ChatWork APIトークンが必要です' }, { status: 400 });
    }

    // ChatWork APIでトークンの有効性確認
    const meResponse = await fetch('https://api.chatwork.com/v2/me', {
      headers: {
        'X-ChatWorkToken': apiToken,
        'Content-Type': 'application/json'
      }
    });

    if (!meResponse.ok) {
      return NextResponse.json({ 
        error: 'ChatWork APIトークンが無効です',
        details: `API Status: ${meResponse.status}`
      }, { status: 400 });
    }

    const chatworkUser = await meResponse.json();

    // 統合情報を保存
    const integration = await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: user.id,
          service: 'chatwork',
        },
      },
      update: {
        accessToken: apiToken,
        refreshToken: '',
        scope: 'api_access',
        tokenType: 'APIToken',
        isActive: true,
        teamId: chatworkUser.organization_id?.toString() || null,
        teamName: chatworkUser.organization_name || null,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        service: 'chatwork',
        accessToken: apiToken,
        refreshToken: '',
        scope: 'api_access',
        tokenType: 'APIToken',
        isActive: true,
        teamId: chatworkUser.organization_id?.toString() || null,
        teamName: chatworkUser.organization_name || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ ChatWork統合完了:', {
      userId: user.id,
      integrationId: integration.id,
      chatworkUser: chatworkUser.name
    });

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        service: 'chatwork',
        isActive: true,
        teamName: integration.teamName,
        user: {
          name: chatworkUser.name,
          account_id: chatworkUser.account_id
        }
      }
    });

  } catch (error) {
    console.error('❌ ChatWork統合エラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'ChatWork統合に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // ChatWork統合を削除
    await prisma.integration.deleteMany({
      where: {
        userId: user.id,
        service: 'chatwork'
      }
    });

    return NextResponse.json({ success: true, message: 'ChatWork統合を削除しました' });

  } catch (error) {
    console.error('❌ ChatWork統合削除エラー:', error);
    return NextResponse.json(
      { error: 'ChatWork統合の削除に失敗しました' },
      { status: 500 }
    );
  }
}