import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ログレベルの型安全な定義（文字列リテラル型を使用）
const developmentLogLevels = ['query', 'error', 'warn'] as const;
const productionLogLevels = ['error'] as const;

// 本番環境用のPrisma設定
const prismaConfig = {
  log: process.env.NODE_ENV === 'development' 
    ? [...developmentLogLevels]  // 配列をコピーして変更可能にする
    : [...productionLogLevels],
  
  // 本番環境用の最適化設定
  ...(process.env.NODE_ENV === 'production' && {
    // 本番環境用のログレベル
    errorFormat: 'minimal' as const,
    
    // リクエストタイムアウト設定
    transactionOptions: {
      timeout: 10000, // 10秒
      maxWait: 5000,  // 5秒
    },
  }),
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

// 本番環境ではグローバル変数にキャッシュしない
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 本番環境用のヘルスチェック関数
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// 本番環境用のクリーンアップ関数
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database disconnect failed:', error);
  }
}

// データベース初期化関数
export async function initializeDatabase(): Promise<boolean> {
  try {
    // データベース接続テスト
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // 本番環境では追加の初期化処理
    if (process.env.NODE_ENV === 'production') {
      console.info('DATABASE_INITIALIZED:', {
        environment: 'production',
        timestamp: new Date().toISOString(),
        status: 'connected',
      });
    }

    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

// データベース統計情報取得関数
export async function getDatabaseStats() {
  try {
    const userCount = await prisma.user.count();
    const sessionCount = await prisma.session.count();
    const accountCount = await prisma.account.count();
    const integrationCount = await prisma.integration.count();
    
    const stats = {
      users: userCount,
      sessions: sessionCount,
      accounts: accountCount,
      integrations: integrationCount,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'production') {
      console.info('DATABASE_STATS:', stats);
    }

    return stats;
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return null;
  }
}

// プロセス終了時のクリーンアップ
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await disconnectDatabase();
  });
  
  process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

// 本番環境用のデータベース監視
if (process.env.NODE_ENV === 'production') {
  // 定期的なヘルスチェック（5分間隔）
  setInterval(async () => {
    const isHealthy = await checkDatabaseConnection();
    if (!isHealthy) {
      console.error('DATABASE_HEALTH_CHECK_FAILED:', {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
      });
    }
  }, 5 * 60 * 1000);
}

// エクスポート
export default prisma;