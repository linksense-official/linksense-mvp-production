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

    // セキュリティ上、ユーザーが存在しない場合でも成功レスポンスを返す
    if (!user) {
      console.log('⚠️ 存在しないメールアドレスでのパスワードリセット要求:', email);
      return NextResponse.json({
        message: 'パスワードリセットメールを送信しました。メールボックスをご確認ください。',
        success: true
      });
    }

    // 既存のリセットトークンを削除
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // 新しいリセットトークンを生成
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

    // トークンをデータベースに保存
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires
      }
    });

    // パスワードリセットメール送信
    const emailSent = await emailService.sendPasswordResetEmail(
      email,
      token,
      user.name || undefined
    );

    if (!emailSent) {
      console.error('❌ パスワードリセットメール送信に失敗しました');
      return NextResponse.json(
        { error: 'メール送信に失敗しました。しばらく後にお試しください。' },
        { status: 500 }
      );
    }

    console.log('✅ パスワードリセットメール送信成功:', { email, userId: user.id });

    return NextResponse.json({
      message: 'パスワードリセットメールを送信しました。メールボックスをご確認ください。',
      success: true
    });

  } catch (error) {
    console.error('💥 パスワードリセット要求エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}