import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// 開発環境用のメール送信シミュレーション機能付き
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;
  
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
    try {
      // 開発環境では実際のメール送信をスキップし、コンソールに出力
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' || !process.env.RESEND_API_KEY) {
        console.log('📧 [開発環境] メール送信シミュレーション:');
        console.log(`宛先: ${to}`);
        console.log(`件名: ${subject}`);
        console.log(`内容: ${text || html.substring(0, 200)}...`);
        console.log('✅ メール送信シミュレーション完了');
        return true;
      }

      // 本番環境でResendを使用
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const { data, error } = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@linksense.app',
        to: [to],
        subject,
        html,
        text: text || undefined,
      });

      if (error) {
        console.error('❌ メール送信エラー:', error);
        return false;
      }

      console.log('✅ メール送信成功:', data);
      return true;
    } catch (error) {
      console.error('💥 メール送信例外:', error);
      // 開発環境ではエラーでも成功として扱う
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.log('🔧 開発環境のため、メール送信エラーを無視します');
        return true;
      }
      return false;
    }
  }

  async sendVerificationEmail(email: string, token: string, name?: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>LinkSense - メールアドレス認証</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔗 LinkSense</h1>
              <p>メールアドレスの認証をお願いします</p>
            </div>
            <div class="content">
              <p>こんにちは${name ? ` ${name}さん` : ''}！</p>
              <p>LinkSenseにご登録いただき、ありがとうございます。</p>
              <p>以下のボタンをクリックして、メールアドレスの認証を完了してください：</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">メールアドレスを認証する</a>
              </div>
              <p>ボタンが動作しない場合は、以下のURLを直接ブラウザにコピー＆ペーストしてください：</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
              <p><strong>注意：</strong>このリンクは24時間で有効期限が切れます。</p>
              <p>このメールに心当たりがない場合は、無視していただいて構いません。</p>
            </div>
            <div class="footer">
              <p>© 2025 LinkSense. All rights reserved.</p>
              <p>このメールは自動送信されています。返信はできません。</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
LinkSense - メールアドレス認証

こんにちは${name ? ` ${name}さん` : ''}！

LinkSenseにご登録いただき、ありがとうございます。
以下のURLにアクセスして、メールアドレスの認証を完了してください：

${verificationUrl}

注意：このリンクは24時間で有効期限が切れます。

このメールに心当たりがない場合は、無視していただいて構いません。

© 2025 LinkSense. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject: 'LinkSense - メールアドレス認証のお願い',
      html,
      text
    });
  }

  async sendPasswordResetEmail(email: string, token: string, name?: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>LinkSense - パスワードリセット</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔗 LinkSense</h1>
              <p>パスワードリセットのご案内</p>
            </div>
            <div class="content">
              <p>こんにちは${name ? ` ${name}さん` : ''}！</p>
              <p>LinkSenseアカウントのパスワードリセットが要求されました。</p>
              <div class="warning">
                <strong>⚠️ セキュリティ確認</strong><br>
                このリクエストがご本人様によるものでない場合は、このメールを無視してください。
              </div>
              <p>パスワードをリセットするには、以下のボタンをクリックしてください：</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">パスワードをリセットする</a>
              </div>
              <p>ボタンが動作しない場合は、以下のURLを直接ブラウザにコピー＆ペーストしてください：</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">${resetUrl}</p>
              <p><strong>注意：</strong>このリンクは1時間で有効期限が切れます。</p>
            </div>
            <div class="footer">
              <p>© 2025 LinkSense. All rights reserved.</p>
              <p>このメールは自動送信されています。返信はできません。</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
LinkSense - パスワードリセット

こんにちは${name ? ` ${name}さん` : ''}！

LinkSenseアカウントのパスワードリセットが要求されました。

⚠️ セキュリティ確認
このリクエストがご本人様によるものでない場合は、このメールを無視してください。

パスワードをリセットするには、以下のURLにアクセスしてください：

${resetUrl}

注意：このリンクは1時間で有効期限が切れます。

© 2025 LinkSense. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject: 'LinkSense - パスワードリセットのご案内',
      html,
      text
    });
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
    const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>LinkSense - ようこそ！</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .button { display: inline-block; background: #00b894; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .feature { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #00b894; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 LinkSenseへようこそ！</h1>
              <p>リモートチーム健全性分析の新しい体験が始まります</p>
            </div>
            <div class="content">
              <p>こんにちは${name ? ` ${name}さん` : ''}！</p>
              <p>LinkSenseにご登録いただき、ありがとうございます。メールアドレスの認証が完了しました。</p>
              
              <h3>🚀 今すぐ始められること：</h3>
              
              <div class="feature">
                <strong>📊 リアルタイム分析</strong><br>
                チームのコミュニケーション状況をリアルタイムで可視化
              </div>
              
              <div class="feature">
                <strong>🔗 サービス統合</strong><br>
                Slack、Teams、Discord等の主要サービスと連携
              </div>
              
              <div class="feature">
                <strong>⚠️ スマートアラート</strong><br>
                チームの健全性に関する重要な変化を自動検知
              </div>
              
              <div class="feature">
                <strong>📈 詳細レポート</strong><br>
                週次・月次レポートでチームの成長を追跡
              </div>
              
              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">ダッシュボードを開く</a>
              </div>
              
              <p>ご質問やサポートが必要な場合は、いつでもお気軽にお問い合わせください。</p>
              <p>LinkSenseでチームの可能性を最大限に引き出しましょう！</p>
            </div>
            <div class="footer">
              <p>© 2025 LinkSense. All rights reserved.</p>
              <p>サポート: support@linksense.app</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🎉 LinkSenseへようこそ！チーム分析を始めましょう',
      html
    });
  }

  async sendSecurityAlert(email: string, alertType: string, details: string, name?: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>LinkSense - セキュリティアラート</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #e17055 0%, #d63031 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .alert { background: #ffe0e0; border: 1px solid #ff7675; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 セキュリティアラート</h1>
              <p>アカウントの重要な変更が検出されました</p>
            </div>
            <div class="content">
              <p>こんにちは${name ? ` ${name}さん` : ''}！</p>
              <div class="alert">
                <strong>🔒 ${alertType}</strong><br>
                ${details}
              </div>
              <p>この変更がご本人様によるものでない場合は、直ちに以下の対応を行ってください：</p>
              <ul>
                <li>パスワードを変更する</li>
                <li>2要素認証を有効にする</li>
                <li>不審なアクティビティがないか確認する</li>
              </ul>
              <p>ご不明な点がございましたら、サポートチームまでお問い合わせください。</p>
            </div>
            <div class="footer">
              <p>© 2025 LinkSense. All rights reserved.</p>
              <p>緊急サポート: security@linksense.app</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `🚨 LinkSense - セキュリティアラート: ${alertType}`,
      html
    });
  }
}

export const emailService = EmailService.getInstance();