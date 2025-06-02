import { prisma } from './prisma';

// データベースユーティリティ関数集

/**
 * ユーザー関連のデータベース操作
 */
export const userUtils = {
  // ユーザー検索（安全版）
  async findUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          company: true,
          role: true,
          emailVerified: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          loginAttempts: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true,
          password: true, // 認証時に必要
        },
      });
    } catch (error) {
      console.error('Failed to find user by email:', error);
      return null;
    }
  },

  // ユーザー作成（安全版）
  async createUser(userData: {
    email: string;
    name?: string;
    password?: string;
    company?: string;
    provider?: string;
  }) {
    try {
      return await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: userData.password,
          company: userData.company,
          emailVerified: userData.provider ? new Date() : null, // ソーシャルログインの場合は自動認証
        },
        select: {
          id: true,
          email: true,
          name: true,
          company: true,
          emailVerified: true,
          createdAt: true,
        },
      });
    } catch (error) {
      console.error('Failed to create user:', error);
      return null;
    }
  },

  // ユーザー更新（安全版）
  async updateUser(userId: string, updateData: {
    name?: string;
    company?: string;
    lastLoginAt?: Date;
    lastLoginIp?: string;
    lastLoginMetadata?: string;
    loginAttempts?: number;
    lockedUntil?: Date | null;
  }) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          company: true,
          lastLoginAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      console.error('Failed to update user:', error);
      return null;
    }
  },

  // アカウントロック状態の確認
  async checkAccountLock(email: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          lockedUntil: true,
          loginAttempts: true,
        },
      });

      if (!user) return false;

      // ロック期限が設定されており、まだ有効な場合
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return true;
      }

      // ロック期限が過ぎている場合はリセット
      if (user.lockedUntil && user.lockedUntil <= new Date()) {
        await prisma.user.update({
          where: { email },
          data: {
            lockedUntil: null,
            loginAttempts: 0,
          },
        });
        return false;
      }

      return false;
    } catch (error) {
      console.error('Failed to check account lock:', error);
      return false;
    }
  },
};

/**
 * セッション関連のデータベース操作
 */
export const sessionUtils = {
  // アクティブセッション数取得
  async getActiveSessionCount() {
    try {
      return await prisma.session.count({
        where: {
          expires: {
            gt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to get active session count:', error);
      return 0;
    }
  },

  // 期限切れセッションのクリーンアップ
  async cleanupExpiredSessions() {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expires: {
            lt: new Date(),
          },
        },
      });
      
      if (process.env.NODE_ENV === 'production') {
        console.info('EXPIRED_SESSIONS_CLEANED:', {
          deletedCount: result.count,
          timestamp: new Date().toISOString(),
        });
      }
      
      return result.count;
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  },

  // ユーザーの全セッション削除（ログアウト時）
  async deleteUserSessions(userId: string) {
    try {
      const result = await prisma.session.deleteMany({
        where: { userId },
      });
      
      return result.count;
    } catch (error) {
      console.error('Failed to delete user sessions:', error);
      return 0;
    }
  },
};

/**
 * ログイン履歴関連のデータベース操作
 */
export const loginHistoryUtils = {
  // ログイン履歴記録
  async recordLogin(data: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    reason?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      return await prisma.loginHistory.create({
        data: {
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          success: data.success,
          reason: data.reason,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });
    } catch (error) {
      console.error('Failed to record login history:', error);
      return null;
    }
  },

  // 失敗ログイン統計取得
  async getFailedLoginStats(timeRange: Date) {
    try {
      return await prisma.loginHistory.groupBy({
        by: ['reason'],
        where: {
          success: false,
          createdAt: {
            gte: timeRange,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });
    } catch (error) {
      console.error('Failed to get failed login stats:', error);
      return [];
    }
  },

  // ユーザーの最近のログイン履歴取得
  async getUserRecentLogins(userId: string, limit: number = 10) {
    try {
      return await prisma.loginHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          success: true,
          reason: true,
          createdAt: true,
        },
      });
    } catch (error) {
      console.error('Failed to get user recent logins:', error);
      return [];
    }
  },

  // 古いログイン履歴のクリーンアップ（90日以上前）
  async cleanupOldLoginHistory() {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await prisma.loginHistory.deleteMany({
        where: {
          createdAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      if (process.env.NODE_ENV === 'production') {
        console.info('OLD_LOGIN_HISTORY_CLEANED:', {
          deletedCount: result.count,
          timestamp: new Date().toISOString(),
        });
      }

      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old login history:', error);
      return 0;
    }
  },
};

/**
 * 統合関連のデータベース操作
 */
export const integrationUtils = {
  // ユーザーの統合設定取得
  async getUserIntegrations(userId: string) {
    try {
      return await prisma.integration.findMany({
        where: { userId },
        select: {
          id: true,
          service: true,
          teamId: true,
          teamName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      console.error('Failed to get user integrations:', error);
      return [];
    }
  },

  // 統合設定の作成または更新
  async upsertIntegration(data: {
    userId: string;
    service: string;
    accessToken: string;
    refreshToken?: string;
    teamId?: string;
    teamName?: string;
  }) {
    try {
      return await prisma.integration.upsert({
        where: {
          userId_service: {
            userId: data.userId,
            service: data.service,
          },
        },
        update: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          teamId: data.teamId,
          teamName: data.teamName,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          userId: data.userId,
          service: data.service,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          teamId: data.teamId,
          teamName: data.teamName,
          isActive: true,
        },
      });
    } catch (error) {
      console.error('Failed to upsert integration:', error);
      return null;
    }
  },

  // 統合設定の無効化
  async deactivateIntegration(userId: string, service: string) {
    try {
      return await prisma.integration.update({
        where: {
          userId_service: {
            userId,
            service,
          },
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to deactivate integration:', error);
      return null;
    }
  },
};

/**
 * トークン関連のデータベース操作
 */
export const tokenUtils = {
  // パスワードリセットトークンの作成
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
    try {
      return await prisma.passwordResetToken.create({
        data: {
          userId,
          token,
          expires: expiresAt,
        },
      });
    } catch (error) {
      console.error('Failed to create password reset token:', error);
      return null;
    }
  },

  // パスワードリセットトークンの検証
  async validatePasswordResetToken(token: string) {
    try {
      const tokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.used || tokenRecord.expires < new Date()) {
        return null;
      }

      return tokenRecord;
    } catch (error) {
      console.error('Failed to validate password reset token:', error);
      return null;
    }
  },

  // パスワードリセットトークンの使用済みマーク
  async markPasswordResetTokenAsUsed(token: string) {
    try {
      return await prisma.passwordResetToken.update({
        where: { token },
        data: { used: true },
      });
    } catch (error) {
      console.error('Failed to mark password reset token as used:', error);
      return null;
    }
  },

  // メール認証トークンの作成
  async createEmailVerificationToken(userId: string, token: string, expiresAt: Date) {
    try {
      return await prisma.emailVerificationToken.create({
        data: {
          userId,
          token,
          expires: expiresAt,
        },
      });
    } catch (error) {
      console.error('Failed to create email verification token:', error);
      return null;
    }
  },

  // メール認証トークンの検証
  async validateEmailVerificationToken(token: string) {
    try {
      const tokenRecord = await prisma.emailVerificationToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.expires < new Date()) {
        return null;
      }

      return tokenRecord;
    } catch (error) {
      console.error('Failed to validate email verification token:', error);
      return null;
    }
  },

  // メール認証トークンの削除
  async deleteEmailVerificationToken(token: string) {
    try {
      return await prisma.emailVerificationToken.delete({
        where: { token },
      });
    } catch (error) {
      console.error('Failed to delete email verification token:', error);
      return null;
    }
  },
};

/**
 * データベースメンテナンス関数
 */
export const maintenanceUtils = {
  // 定期メンテナンスの実行
  async runPeriodicMaintenance() {
    try {
      console.info('Starting periodic database maintenance...');

      // 期限切れセッションのクリーンアップ
      const cleanedSessions = await sessionUtils.cleanupExpiredSessions();

      // 古いログイン履歴のクリーンアップ
      const cleanedHistory = await loginHistoryUtils.cleanupOldLoginHistory();

      // 古いトークンのクリーンアップ
      const cleanedTokens = await cleanupExpiredTokens();

      const maintenanceResult = {
        cleanedSessions,
        cleanedHistory,
        cleanedTokens,
        timestamp: new Date().toISOString(),
      };

      if (process.env.NODE_ENV === 'production') {
        console.info('PERIODIC_MAINTENANCE_COMPLETED:', maintenanceResult);
      }

      return maintenanceResult;
    } catch (error) {
      console.error('Failed to run periodic maintenance:', error);
      return null;
    }
  },

  // データベース統計の取得
  async getDatabaseStatistics() {
    try {
      const [
        userCount,
        activeUserCount,
        sessionCount,
        activeSessionCount,
        integrationCount,
        loginHistoryCount,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30日以内
            },
          },
        }),
        prisma.session.count(),
        sessionUtils.getActiveSessionCount(),
        prisma.integration.count({ where: { isActive: true } }),
        prisma.loginHistory.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7日以内
            },
          },
        }),
      ]);

      return {
        users: {
          total: userCount,
          active: activeUserCount,
        },
        sessions: {
          total: sessionCount,
          active: activeSessionCount,
        },
        integrations: {
          active: integrationCount,
        },
        loginHistory: {
          recentWeek: loginHistoryCount,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get database statistics:', error);
      return null;
    }
  },
};

// 期限切れトークンのクリーンアップ
async function cleanupExpiredTokens() {
  try {
    const now = new Date();

    // 期限切れのパスワードリセットトークン削除
    const expiredPasswordTokens = await prisma.passwordResetToken.deleteMany({
      where: {
        expires: {
          lt: now,
        },
      },
    });

    // 期限切れのメール認証トークン削除
    const expiredEmailTokens = await prisma.emailVerificationToken.deleteMany({
      where: {
        expires: {
          lt: now,
        },
      },
    });

    return expiredPasswordTokens.count + expiredEmailTokens.count;
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
    return 0;
  }
}

// 本番環境では定期メンテナンスをスケジュール（24時間間隔）
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    await maintenanceUtils.runPeriodicMaintenance();
  }, 24 * 60 * 60 * 1000); // 24時間
}