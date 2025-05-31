import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

interface SecurityAlert {
  type: 'suspicious_login' | 'new_device' | 'unusual_location' | 'multiple_failures';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  details?: any;
}

interface LoginHistoryEntry {
  id: string;
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
    const alerts: SecurityAlert[] = [];

    // 過去24時間のログイン履歴を取得
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentHistory: LoginHistoryEntry[] = await prisma.loginHistory.findMany({
      where: {
        userId,
        createdAt: {
          gte: yesterday
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 1. 複数回のログイン失敗を検知
    const failedLogins = recentHistory.filter((h: LoginHistoryEntry) => !h.success);
    if (failedLogins.length >= 3) {
      alerts.push({
        type: 'multiple_failures',
        severity: 'high',
        message: `過去24時間で${failedLogins.length}回のログイン失敗が検出されました`,
        timestamp: new Date(),
        details: { count: failedLogins.length }
      });
    }

    // 2. 新しいIPアドレスからのログインを検知
    const allHistory = await prisma.loginHistory.findMany({
      where: { userId },
      select: { ipAddress: true, createdAt: true }
    });

    const knownIPs = new Set(
      allHistory
        .filter((h: { ipAddress: string; createdAt: Date }) => h.createdAt < yesterday)
        .map((h: { ipAddress: string; createdAt: Date }) => h.ipAddress)
    );

    const newIPs = recentHistory
      .filter((h: LoginHistoryEntry) => h.success && !knownIPs.has(h.ipAddress))
      .map((h: LoginHistoryEntry) => h.ipAddress);

    if (newIPs.length > 0) {
      alerts.push({
        type: 'new_device',
        severity: 'medium',
        message: `新しいIPアドレスからのログインが検出されました: ${newIPs.join(', ')}`,
        timestamp: new Date(),
        details: { newIPs }
      });
    }

    // 3. 異常な時間帯のログインを検知
    const unusualTimeLogins = recentHistory.filter((h: LoginHistoryEntry) => {
      const hour = h.createdAt.getHours();
      return h.success && (hour < 6 || hour > 22); // 深夜早朝のログイン
    });

    if (unusualTimeLogins.length > 0) {
      alerts.push({
        type: 'suspicious_login',
        severity: 'low',
        message: `通常とは異なる時間帯でのログインが検出されました`,
        timestamp: new Date(),
        details: { count: unusualTimeLogins.length }
      });
    }

    // 4. 短時間での複数ログインを検知
    const successfulLogins = recentHistory.filter((h: LoginHistoryEntry) => h.success);
    if (successfulLogins.length >= 5) {
      const timeSpan = successfulLogins[0].createdAt.getTime() - successfulLogins[successfulLogins.length - 1].createdAt.getTime();
      const hoursSpan = timeSpan / (1000 * 60 * 60);
      
      if (hoursSpan < 1) { // 1時間以内に5回以上
        alerts.push({
          type: 'suspicious_login',
          severity: 'medium',
          message: `短時間で複数回のログインが検出されました`,
          timestamp: new Date(),
          details: { count: successfulLogins.length, hoursSpan }
        });
      }
    }

    // セキュリティスコアを計算
    const securityScore = calculateSecurityScore(alerts, recentHistory);

    return NextResponse.json({
      alerts,
      securityScore,
      summary: {
        totalLogins: recentHistory.length,
        successfulLogins: recentHistory.filter((h: LoginHistoryEntry) => h.success).length,
        failedLogins: recentHistory.filter((h: LoginHistoryEntry) => !h.success).length,
        uniqueIPs: new Set(recentHistory.map((h: LoginHistoryEntry) => h.ipAddress)).size
      }
    });

  } catch (error) {
    console.error('セキュリティチェックエラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}

function calculateSecurityScore(alerts: SecurityAlert[], history: LoginHistoryEntry[]): number {
  let score = 100; // 基本スコア

  alerts.forEach(alert => {
    switch (alert.severity) {
      case 'high':
        score -= 30;
        break;
      case 'medium':
        score -= 15;
        break;
      case 'low':
        score -= 5;
        break;
    }
  });

  // 最近のログイン失敗率を考慮
  const failureRate = history.filter((h: LoginHistoryEntry) => !h.success).length / Math.max(history.length, 1);
  score -= failureRate * 20;

  return Math.max(score, 0);
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
    
    if (action === 'acknowledge-alerts') {
      // アラートを確認済みとしてマーク（実装は省略）
      return NextResponse.json({ message: 'アラートを確認しました' });
    }

    return NextResponse.json(
      { error: '無効なアクション' },
      { status: 400 }
    );

  } catch (error) {
    console.error('セキュリティアクションエラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}