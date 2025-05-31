import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

interface LoginHistoryEntry {
  id: string;
  ipAddress: string;
  userAgent: string | null;
  success: boolean;
  reason: string | null;
  createdAt: Date;
}

interface EnrichedHistoryEntry extends LoginHistoryEntry {
  location: string;
  device: string;
  browser: string;
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // ログイン履歴を取得
    const [loginHistory, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          success: true,
          reason: true,
          createdAt: true
        }
      }),
      prisma.loginHistory.count({
        where: {
          userId: session.user.id
        }
      })
    ]);

    // IPアドレスから地域情報を推定（簡易版）
    const enrichedHistory: EnrichedHistoryEntry[] = loginHistory.map((entry: LoginHistoryEntry) => ({
      ...entry,
      location: getLocationFromIP(entry.ipAddress),
      device: getDeviceFromUserAgent(entry.userAgent || ''),
      browser: getBrowserFromUserAgent(entry.userAgent || '')
    }));

    return NextResponse.json({
      history: enrichedHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('ログイン履歴取得エラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}

// IPアドレスから地域を推定（簡易版）
function getLocationFromIP(ip: string): string {
  // 開発環境やローカルIPの場合
  if (ip === 'unknown' || ip.startsWith('192.168.') || ip.startsWith('127.') || ip === '::1') {
    return '開発環境';
  }
  
  // 実際の実装では、GeoIPライブラリを使用
  // 今回は簡易版として固定値を返す
  return '日本';
}

// User-Agentからデバイス情報を抽出
function getDeviceFromUserAgent(userAgent: string): string {
  if (userAgent.includes('Mobile')) {
    return 'モバイル';
  } else if (userAgent.includes('Tablet')) {
    return 'タブレット';
  } else {
    return 'デスクトップ';
  }
}

// User-Agentからブラウザ情報を抽出
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { action } = await request.json();
    
    if (action === 'clear-history') {
      // ログイン履歴をクリア（最新10件を除く）
      const recentHistory = await prisma.loginHistory.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true }
      });

      const recentIds = recentHistory.map((h: { id: string }) => h.id);

      await prisma.loginHistory.deleteMany({
        where: {
          userId: session.user.id,
          id: {
            notIn: recentIds
          }
        }
      });

      return NextResponse.json({ message: 'ログイン履歴をクリアしました' });
    }

    return NextResponse.json(
      { error: '無効なアクション' },
      { status: 400 }
    );

  } catch (error) {
    console.error('ログイン履歴操作エラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}