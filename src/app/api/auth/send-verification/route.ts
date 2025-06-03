import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';
import crypto from 'crypto';

// レート制限設定
const RATE_LIMIT = {
  maxAttempts: 3, // 最大送信回数
  windowMs: 15 * 60 * 1000, // 15分間
  cooldownMs: 5 * 60 * 1000 // 5分間のクールダウン
};

// メール認証トークン生成
async function generateEmailVerificationToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

  try {
    // 既存トークンを削除
    await prisma.emailVerificationToken.deleteMany({
      where: { userId }
    });

    // 新しいトークン作成
    await prisma.emailVerificationToken.create({
      data: {
        userId,
        token,
        expires
      }
    });

    return token;
  } catch (error) {
    console.error('メール認証トークン生成エラー:', error);
    throw new Error('トークン生成に失敗しました');
  }
}

// レート制限チェック
async function checkRateLimit(email: string): Promise<{ allowed: boolean; remainingTime?: number }> {
  const cacheKey = `email_verification_rate_${email}`;
  
  // 簡易的なレート制限（実際の実装では Redis などを使用することを推奨）
  // ここでは Prisma を使用してログイン履歴テーブルで代用
  const recentAttempts = await prisma.loginHistory.findMany({
    where: {
      userId: 'rate_limit_check',
      reason: `email_verification_${email}`,
      createdAt: {
        gte: new Date(Date.now() - RATE_LIMIT.windowMs)
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (recentAttempts.length >= RATE_LIMIT.maxAttempts) {
    const lastAttempt = recentAttempts[0];
    const timeSinceLastAttempt = Date.now() - lastAttempt.createdAt.getTime();
    
    if (timeSinceLastAttempt < RATE_LIMIT.cooldownMs) {
      const remainingTime = Math.ceil((RATE_LIMIT.cooldownMs - timeSinceLastAttempt) / 1000 / 60);
      return { allowed: false, remainingTime };
    }
  }

  return { allowed: true };
}

// レート制限記録
async function recordRateLimitAttempt(email: string): Promise<void> {
  try {
    await prisma.loginHistory.create({
      data: {
        userId: 'rate_limit_check',
        ipAddress: 'unknown',
        userAgent: 'email_verification_api',
        success: true,
        reason: `email_verification_${email}`,
        metadata: JSON.stringify({
          type: 'email_verification_request',
          timestamp: new Date().toISOString()
        })
      }
    });
  } catch (error) {
    console.error('レート制限記録エラー:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    // メールアドレス形式の検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    console.log('認証メール再送信リクエスト:', email);

    // レート制限チェック
    const rateLimitResult = await checkRateLimit(email);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: `送信回数制限に達しました。${rateLimitResult.remainingTime}分後に再度お試しください。`,
          remainingTime: rateLimitResult.remainingTime
        },
        { status: 429 }
      );
    }

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // セキュリティ上、ユーザーが存在しない場合も成功レスポンスを返す
      console.log('存在しないメールアドレス:', email);
      return NextResponse.json(
        { message: '認証メールを送信しました。メールボックスをご確認ください。' },
        { status: 200 }
      );
    }

    // 既に認証済みかチェック
    if (user.emailVerified) {
      console.log('既に認証済みユーザー:', email);
      return NextResponse.json(
        { message: 'このメールアドレスは既に認証済みです。' },
        { status: 200 }
      );
    }

    // レート制限記録
    await recordRateLimitAttempt(email);

    // 認証トークン生成
    const token = await generateEmailVerificationToken(user.id);

    // 認証メール送信
    const emailSent = await emailService.sendVerificationEmail(
      email, 
      token, 
      user.name || undefined
    );

    if (!emailSent) {
      console.error('認証メール送信失敗:', email);
      return NextResponse.json(
        { error: 'メール送信に失敗しました。しばらく時間をおいて再度お試しください。' },
        { status: 500 }
      );
    }

    console.log('✅ 認証メール再送信成功:', email);

    return NextResponse.json(
      { 
        message: '認証メールを送信しました。メールボックスをご確認ください。',
        email: email
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('認証メール送信API エラー:', error);
    
    return NextResponse.json(
      { error: 'メール送信処理中にサーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// GET リクエスト（送信状況確認用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    // レート制限状況確認
    const rateLimitResult = await checkRateLimit(email);

    return NextResponse.json(
      {
        canSend: rateLimitResult.allowed,
        remainingTime: rateLimitResult.remainingTime || 0
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('送信状況確認API エラー:', error);
    
    return NextResponse.json(
      { error: '送信状況確認処理中にサーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}