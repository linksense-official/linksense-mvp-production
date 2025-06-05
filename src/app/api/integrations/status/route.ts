import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // NextAuth管理のアカウント（Google Meet, Slack, Discord, Microsoft Teams）
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: {
        provider: true,
        access_token: true,
        expires_at: true
      }
    });

    // カスタム実装の統合（ChatWork, LINE WORKS）
    const integrations = await prisma.integration.findMany({
      where: { 
        userId: session.user.id,
        isActive: true 
      },
      select: {
        service: true,
        accessToken: true,
        createdAt: true
      }
    });

    const connectionStatus = {
      // NextAuth管理サービス
      google: accounts.find(acc => acc.provider === 'google'),
      slack: accounts.find(acc => acc.provider === 'slack'),
      discord: accounts.find(acc => acc.provider === 'discord'),
      'azure-ad': accounts.find(acc => acc.provider === 'azure-ad'),
      
      // カスタム実装サービス
      chatwork: integrations.find(int => int.service === 'chatwork'),
      'line-works': integrations.find(int => int.service === 'line-works')
    };

    return NextResponse.json({
      accounts: connectionStatus,
      connectedCount: Object.values(connectionStatus).filter(Boolean).length,
      totalServices: 6,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('接続状態確認エラー:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}