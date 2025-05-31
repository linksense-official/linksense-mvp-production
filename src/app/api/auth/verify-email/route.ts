import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // バリデーション
    if (!token) {
      return NextResponse.json(
        { error: '認証トークンが必要です' },
        { status: 400 }
      );
    }

    // トークンの確認
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: '無効な認証トークンです' },
        { status: 400 }
      );
    }

    // トークンの有効期限確認
    if (verificationToken.expires < new Date()) {
      // 期限切れトークンを削除
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id }
      });

      return NextResponse.json(
        { error: '認証トークンの有効期限が切れています。新しい認証メールを送信してください。' },
        { status: 400 }
      );
    }

    // ユーザーのメール認証状態を更新
    const updatedUser = await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: new Date()
      }
    });

    // 使用済みトークンを削除
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id }
    });

    // ウェルカムメール送信
    await emailService.sendWelcomeEmail(
      updatedUser.email,
      updatedUser.name || undefined
    );

    console.log('✅ メール認証完了:', { 
      userId: updatedUser.id, 
      email: updatedUser.email 
    });

    return NextResponse.json({
      message: 'メールアドレスの認証が完了しました！',
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        emailVerified: updatedUser.emailVerified
      }
    });

  } catch (error) {
    console.error('💥 メール認証エラー:', error);
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
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // トークンの有効期限確認
    if (verificationToken.expires < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id }
      });
      return NextResponse.redirect(new URL('/login?error=expired_token', request.url));
    }

    // 認証ページにリダイレクト
    return NextResponse.redirect(new URL(`/verify-email?token=${token}`, request.url));

  } catch (error) {
    console.error('💥 メール認証GET エラー:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}