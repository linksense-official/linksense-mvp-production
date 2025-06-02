import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // セキュリティアラートメール送信（環境変数チェック付き）
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      
      if (resendApiKey) {
        // 動的インポートでResendを使用
        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);
        
        const changeTime = new Date().toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        await resend.emails.send({
          from: 'LinkSense Security <security@linksense-mvp.vercel.app>',
          to: updatedUser.email,
          subject: '【重要】パスワード変更完了のお知らせ',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #28a745;">
                <h2 style="color: #28a745; margin: 0;">✅ パスワード変更完了</h2>
              </div>
              <div style="padding: 20px;">
                <p>こんにちは${updatedUser.name ? ` ${updatedUser.name}さん` : ''}、</p>
                <p>LinkSenseアカウントのパスワードが正常に変更されました。</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                  <strong>変更詳細:</strong><br>
                  📅 変更日時: ${changeTime}<br>
                  📧 アカウント: ${updatedUser.email}<br>
                  🔒 変更内容: パスワード
                </div>
                
                <p>もしこの変更に心当たりがない場合は、直ちに以下の対応を行ってください：</p>
                <ul>
                  <li>再度パスワードを変更する</li>
                  <li>2要素認証を有効にする</li>
                  <li>サポートチームに連絡する</li>
                </ul>
                
                <p style="margin-top: 30px;">
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" 
                     style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    ログインページへ
                  </a>
                </p>
              </div>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                LinkSense セキュリティチーム<br>
                このメールは自動送信されています。
              </p>
            </div>
          `
        });
        
        console.log('✅ セキュリティアラートメール送信成功:', { email: updatedUser.email });
      } else {
        console.warn('⚠️ RESEND_API_KEY が設定されていません。セキュリティアラートメール送信をスキップします。');
      }
    } catch (emailError) {
      console.error('❌ セキュリティアラートメール送信エラー:', emailError);
      // メール送信エラーでもパスワード変更は成功しているので続行
    }

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