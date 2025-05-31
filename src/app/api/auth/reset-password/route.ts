import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    // バリデーション
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: '全ての項目を入力してください' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'パスワードが一致しません' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上で入力してください' },
        { status: 400 }
      );
    }

    // トークンの確認
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: '無効なリセットトークンです' },
        { status: 400 }
      );
    }

    // トークンの有効期限確認
    if (resetToken.expires < new Date()) {
      // 期限切れトークンを削除
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      });

      return NextResponse.json(
        { error: 'リセットトークンの有効期限が切れています。新しいリセット要求を行ってください。' },
        { status: 400 }
      );
    }

    // トークンが既に使用済みかチェック
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'このリセットトークンは既に使用されています' },
        { status: 400 }
      );
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // ユーザーのパスワードを更新
    const updatedUser = await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
        // ログイン試行回数をリセット
        loginAttempts: 0,
        lockedUntil: null
      }
    });

    // トークンを使用済みにマーク
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    });

    // セキュリティアラートメール送信
    await emailService.sendSecurityAlert(
      updatedUser.email,
      'パスワード変更',
      `パスワードが正常に変更されました。変更日時: ${new Date().toLocaleString('ja-JP')}`,
      updatedUser.name || undefined
    );

    console.log('✅ パスワードリセット完了:', { 
      userId: updatedUser.id, 
      email: updatedUser.email 
    });

    return NextResponse.json({
      message: 'パスワードが正常にリセットされました。新しいパスワードでログインしてください。',
      success: true
    });

  } catch (error) {
    console.error('💥 パスワードリセットエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // トークンの確認（GET用）
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // トークンの有効期限確認
    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      });
      return NextResponse.redirect(new URL('/login?error=expired_token', request.url));
    }

    // トークンが既に使用済みかチェック
    if (resetToken.used) {
      return NextResponse.redirect(new URL('/login?error=token_used', request.url));
    }

    // パスワードリセットページにリダイレクト
    return NextResponse.redirect(new URL(`/reset-password?token=${token}`, request.url));

  } catch (error) {
    console.error('💥 パスワードリセットGET エラー:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}