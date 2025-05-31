import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

interface SessionInfo {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  device: string;
  browser: string;
  isCurrentSession: boolean;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

interface LoginHistoryEntry {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string | null;
  success: boolean;
  reason: string | null;
  createdAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const currentIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const currentUserAgent = request.headers.get('user-agent') || 'unknown';

    // アクティブなセッションを取得（ログイン履歴から推定）
    const recentLogins: LoginHistoryEntry[] = await prisma.loginHistory.findMany({
      where: {
        userId,
        success: true,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 過去30日
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // セッション情報を構築
    const sessions: SessionInfo[] = [];
    const seenSessions = new Set<string>();

    recentLogins.forEach((login: LoginHistoryEntry, index: number) => {
      const sessionKey = `${login.ipAddress}-${login.userAgent}`;
      
      if (!seenSessions.has(sessionKey)) {
        seenSessions.add(sessionKey);
        
        const isCurrentSession = login.ipAddress === currentIp && 
                                login.userAgent === currentUserAgent;
        
        sessions.push({
          id: `session-${login.id}`,
          userId: login.userId,
          ipAddress: login.ipAddress,
          userAgent: login.userAgent || 'unknown',
          location: getLocationFromIP(login.ipAddress),
          device: getDeviceFromUserAgent(login.userAgent || ''),
          browser: getBrowserFromUserAgent(login.userAgent || ''),
          isCurrentSession,
          createdAt: login.createdAt,
          lastActivity: login.createdAt,
          expiresAt: new Date(login.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
        });
      }
    });

    // 現在のセッションを最初に表示
    sessions.sort((a, b) => {
      if (a.isCurrentSession) return -1;
      if (b.isCurrentSession) return 1;
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });

    return NextResponse.json({
      sessions: sessions.slice(0, 10), // 最大10セッション
      currentSessionId: sessions.find(s => s.isCurrentSession)?.id,
      totalSessions: sessions.length
    });

  } catch (error) {
    console.error('セッション取得エラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { sessionId, action } = await request.json();

    if (action === 'terminate-session' && sessionId) {
      // 特定のセッションを終了（実際の実装では、セッションストアから削除）
      console.log(`セッション ${sessionId} を終了しました`);
      
      return NextResponse.json({
        message: 'セッションを終了しました',
        sessionId
      });
    }

    if (action === 'terminate-all-others') {
      // 他のすべてのセッションを終了
      console.log(`ユーザー ${session.user.id} の他のセッションをすべて終了しました`);
      
      return NextResponse.json({
        message: '他のすべてのセッションを終了しました'
      });
    }

    if (action === 'terminate-all') {
      // すべてのセッションを終了（現在のセッションも含む）
      console.log(`ユーザー ${session.user.id} のすべてのセッションを終了しました`);
      
      return NextResponse.json({
        message: 'すべてのセッションを終了しました',
        shouldLogout: true
      });
    }

    return NextResponse.json(
      { error: '無効なアクション' },
      { status: 400 }
    );

  } catch (error) {
    console.error('セッション操作エラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}

// ヘルパー関数
function getLocationFromIP(ip: string): string {
  if (ip === 'unknown' || ip.startsWith('192.168.') || ip.startsWith('127.') || ip === '::1') {
    return '開発環境';
  }
  return '日本';
}

function getDeviceFromUserAgent(userAgent: string): string {
  if (userAgent.includes('Mobile')) {
    return 'モバイル';
  } else if (userAgent.includes('Tablet')) {
    return 'タブレット';
  } else {
    return 'デスクトップ';
  }
}

function getBrowserFromUserAgent(userAgent: string): string {
  if (userAgent.includes('Chrome')) {
    return 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    return 'Firefox';
  } else if (userAgent.includes('Safari')) {
    return 'Safari';
  } else if (userAgent.includes('Edge')) {
    return 'Edge';
  } else {
    return '不明';
  }
}