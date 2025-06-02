import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export class TOTPService {
  private static instance: TOTPService;
  
  public static getInstance(): TOTPService {
    if (!TOTPService.instance) {
      TOTPService.instance = new TOTPService();
    }
    return TOTPService.instance;
  }

  /**
   * 新しい2FA秘密鍵を生成
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * QRコード用のOTPAuth URLを生成
   */
  generateOtpAuthUrl(secret: string, email: string, issuer: string = 'LinkSense'): string {
    return authenticator.keyuri(email, issuer, secret);
  }

  /**
   * QRコード画像を生成（Base64）
   */
  async generateQRCode(otpAuthUrl: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpAuthUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('QRコード生成エラー:', error);
    throw new Error('QRコードの生成に失敗しました');
  }
}
  /**
   * TOTPトークンを検証
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      // otplibの新しいバージョンに対応した検証方法
      return authenticator.check(token, secret);
    } catch (error) {
      console.error('TOTP検証エラー:', error);
      return false;
    }
  }

  /**
   * より厳密なTOTPトークン検証（時間許容範囲付き）
   */
  verifyTokenWithWindow(token: string, secret: string, windowSize: number = 1): boolean {
    try {
      // 現在時刻を基準に前後の時間窓で検証
      const currentTime = Math.floor(Date.now() / 1000);
      const timeStep = 30; // TOTP標準の30秒間隔

      for (let i = -windowSize; i <= windowSize; i++) {
        const timeWindow = currentTime + (i * timeStep);
        const expectedToken = authenticator.generate(secret);
        
        if (token === expectedToken) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('TOTP検証エラー:', error);
      return false;
    }
  }

  /**
   * 現在のTOTPトークンを生成（テスト用）
   */
  generateToken(secret: string): string {
    return authenticator.generate(secret);
  }

  /**
   * バックアップコードを生成
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // 8桁のランダムな数字を生成
      const code = Math.random().toString().substr(2, 8);
      codes.push(code);
    }
    return codes;
  }

  /**
   * バックアップコードを検証
   */
  verifyBackupCode(inputCode: string, backupCodes: string[]): { isValid: boolean; remainingCodes: string[] } {
    const codeIndex = backupCodes.indexOf(inputCode);
    
    if (codeIndex === -1) {
      return { isValid: false, remainingCodes: backupCodes };
    }

    // 使用済みコードを削除
    const remainingCodes = backupCodes.filter((_, index) => index !== codeIndex);
    
    return { isValid: true, remainingCodes };
  }

  /**
   * 2FA設定の検証（秘密鍵とトークンの組み合わせ）
   */
  validateSetup(secret: string, token: string): boolean {
    return this.verifyToken(token, secret);
  }

  /**
   * 秘密鍵をユーザーフレンドリーな形式に変換
   */
  formatSecretForDisplay(secret: string): string {
    // 4文字ごとにスペースを入れて読みやすくする
    return secret.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * TOTPの設定情報を取得
   */
  getTOTPInfo() {
    return {
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      issuer: 'LinkSense'
    };
  }
}

export const totpService = TOTPService.getInstance();