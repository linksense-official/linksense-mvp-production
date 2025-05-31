import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // バリデーション
    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'このメールアドレスは登録されていません' },
        { status: 404 }
      );
    }

    // 既に認証済みの場合
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に認証済みです' },
        { status: 400 }
      );
    }

    // 既存の認証トークンを削除
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id }
    });

    // 新しい認証トークンを生成
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

    // トークンをデータベースに保存
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expires
      }
    });

    // 認証メール送信
    const emailSent = await emailService.sendVerificationEmail(
      email,
      token,
      user.name || undefined
    );

    if (!emailSent) {
      console.error('❌ メール送信に失敗しました');
      return NextResponse.json(
        { error: 'メール送信に失敗しました。しばらく後にお試しください。' },
        { status: 500 }
      );
    }

    console.log('✅ 認証メール送信成功:', { email, userId: user.id });

    return NextResponse.json({
      message: '認証メールを送信しました。メールボックスをご確認ください。',
      success: true
    });

  } catch (error) {
    console.error('💥 認証メール送信エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}