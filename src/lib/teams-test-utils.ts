// src/lib/teams-test-utils.ts
// Microsoft Teams統合テスト・デバッグユーティリティ
// LinkSense MVP Teams統合完全版 - TypeScriptエラー修正済み

/**
 * Teams統合テスト用ユーティリティクラス
 */
export class TeamsTestUtils {
  private static instance: TeamsTestUtils;

  private constructor() {}

  static getInstance(): TeamsTestUtils {
    if (!TeamsTestUtils.instance) {
      TeamsTestUtils.instance = new TeamsTestUtils();
    }
    return TeamsTestUtils.instance;
  }

  /**
   * Teams OAuth設定の検証
   */
  validateTeamsOAuthConfig(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必須環境変数のチェック
    if (!process.env.TEAMS_CLIENT_ID) {
      errors.push('TEAMS_CLIENT_ID が設定されていません');
    } else if (process.env.TEAMS_CLIENT_ID === 'your-teams-client-id-here') {
      warnings.push('TEAMS_CLIENT_ID がデフォルト値のままです');
    }

    if (!process.env.TEAMS_CLIENT_SECRET) {
      errors.push('TEAMS_CLIENT_SECRET が設定されていません');
    } else if (process.env.TEAMS_CLIENT_SECRET === 'your-teams-client-secret-here') {
      warnings.push('TEAMS_CLIENT_SECRET がデフォルト値のままです');
    }

    if (!process.env.NGROK_URL) {
      errors.push('NGROK_URL が設定されていません（Teams OAuth Redirect URIに必要）');
    }

    // ngrok URLの形式チェック
    if (process.env.NGROK_URL && !process.env.NGROK_URL.startsWith('https://')) {
      errors.push('NGROK_URL はHTTPS形式である必要があります');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Teams OAuth URLの生成テスト
   */
  generateTestOAuthURL(): string {
    const clientId = process.env.TEAMS_CLIENT_ID || 'test-client-id';
    const redirectUri = `${process.env.NGROK_URL}/api/auth/teams/callback`;
    const scopes = [
      'User.Read',
      'Team.ReadBasic.All',
      'Chat.Read',
      'OnlineMeetings.Read',
      'Presence.Read',
      'ChannelMessage.Read.All',
      'TeamMember.Read.All'
    ].join(' ');

    const state = Math.random().toString(36).substring(2, 15);

    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'consent');

    return authUrl.toString();
  }

  /**
   * Teams API接続テスト
   */
  async testTeamsAPIConnection(accessToken: string): Promise<{
    success: boolean;
    userInfo?: any;
    error?: string;
  }> {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Microsoft Graph API Error: ${response.status} - ${response.statusText}`
        };
      }

      const userInfo = await response.json();
      return {
        success: true,
        userInfo
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * ✅ タイムアウト付きfetch関数
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 5000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Teams統合の健全性チェック
   */
  async performHealthCheck(): Promise<{
    overall: 'healthy' | 'warning' | 'error';
    checks: Array<{
      name: string;
      status: 'pass' | 'warn' | 'fail';
      message: string;
    }>;
  }> {
    const checks: Array<{
      name: string;
      status: 'pass' | 'warn' | 'fail';
      message: string;
    }> = [];

    // 環境変数チェック
    const configValidation = this.validateTeamsOAuthConfig();
    checks.push({
      name: 'OAuth設定',
      status: configValidation.isValid ? 'pass' : 'fail',
      message: configValidation.isValid 
        ? 'Teams OAuth設定が正常です' 
        : `設定エラー: ${configValidation.errors.join(', ')}`
    });

    // ngrok接続チェック
    try {
      if (process.env.NGROK_URL) {
        const response = await this.fetchWithTimeout(`${process.env.NGROK_URL}/api/health`, {
          method: 'GET'
        }, 5000);
        checks.push({
          name: 'ngrok接続',
          status: response.ok ? 'pass' : 'warn',
          message: response.ok ? 'ngrok接続が正常です' : 'ngrok接続に問題があります'
        });
      }
    } catch (error) {
      checks.push({
        name: 'ngrok接続',
        status: 'fail',
        message: 'ngrok接続テストに失敗しました'
      });
    }

    // Microsoft Graph API接続テスト
    try {
      const response = await this.fetchWithTimeout('https://graph.microsoft.com/v1.0/$metadata', {
        method: 'GET'
      }, 5000);
      checks.push({
        name: 'Microsoft Graph API',
        status: response.ok ? 'pass' : 'warn',
        message: response.ok ? 'Microsoft Graph APIに接続可能です' : 'Microsoft Graph API接続に問題があります'
      });
    } catch (error) {
      checks.push({
        name: 'Microsoft Graph API',
        status: 'fail',
        message: 'Microsoft Graph API接続テストに失敗しました'
      });
    }

    // 全体的な健全性評価
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warnCount = checks.filter(c => c.status === 'warn').length;

    let overall: 'healthy' | 'warning' | 'error';
    if (failCount > 0) {
      overall = 'error';
    } else if (warnCount > 0) {
      overall = 'warning';
    } else {
      overall = 'healthy';
    }

    return { overall, checks };
  }

  /**
   * Teams統合デバッグ情報の出力
   */
  logDebugInfo(): void {
    if (process.env.NEXT_PUBLIC_TEAMS_DEBUG === 'true') {
      console.group('🔷 Teams統合デバッグ情報');
      console.log('Teams Client ID:', process.env.TEAMS_CLIENT_ID ? '設定済み' : '未設定');
      console.log('Teams Client Secret:', process.env.TEAMS_CLIENT_SECRET ? '設定済み' : '未設定');
      console.log('ngrok URL:', process.env.NGROK_URL || '未設定');
      console.log('Mock Mode:', process.env.NEXT_PUBLIC_TEAMS_MOCK_MODE || 'false');
      console.log('Test Mode:', process.env.TEAMS_TEST_MODE || 'false');
      console.log('OAuth Timeout:', process.env.TEAMS_OAUTH_TIMEOUT || '30000');
      
      const testOAuthURL = this.generateTestOAuthURL();
      console.log('Test OAuth URL:', testOAuthURL);
      
      console.groupEnd();
    }
  }

  /**
   * Teams統合のモックデータ生成
   */
  generateMockTeamsData() {
    return {
      users: [
        {
          id: 'mock-user-1',
          displayName: '田中太郎（テスト）',
          email: 'tanaka@testcompany.com',
          department: '開発部',
          jobTitle: 'シニアエンジニア',
          presence: 'Available',
          lastActivity: new Date()
        },
        {
          id: 'mock-user-2',
          displayName: '佐藤花子（テスト）',
          email: 'sato@testcompany.com',
          department: 'マーケティング部',
          jobTitle: 'マーケティングマネージャー',
          presence: 'Busy',
          lastActivity: new Date(Date.now() - 30 * 60 * 1000)
        },
        {
          id: 'mock-user-3',
          displayName: '鈴木一郎（テスト）',
          email: 'suzuki@testcompany.com',
          department: '営業部',
          jobTitle: '営業担当',
          presence: 'Away',
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: 'mock-user-4',
          displayName: '高橋美咲（テスト）',
          email: 'takahashi@testcompany.com',
          department: 'デザイン部',
          jobTitle: 'UIデザイナー',
          presence: 'Available',
          lastActivity: new Date(Date.now() - 10 * 60 * 1000)
        },
        {
          id: 'mock-user-5',
          displayName: '山田健太（テスト）',
          email: 'yamada@testcompany.com',
          department: '人事部',
          jobTitle: 'HRマネージャー',
          presence: 'DoNotDisturb',
          lastActivity: new Date(Date.now() - 45 * 60 * 1000)
        }
      ],
      teams: [
        {
          id: 'mock-team-1',
          displayName: '開発チーム（テスト）',
          description: 'テスト用の開発チーム',
          memberCount: 8,
          visibility: 'Private',
          channels: [
            {
              id: 'mock-channel-1',
              displayName: '一般（テスト）',
              description: 'テスト用一般チャンネル',
              memberCount: 8,
              messageCount: 150,
              lastActivity: new Date(Date.now() - 30 * 60 * 1000)
            },
            {
              id: 'mock-channel-2',
              displayName: '技術討論（テスト）',
              description: 'テスト用技術討論チャンネル',
              memberCount: 6,
              messageCount: 89,
              lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
            },
            {
              id: 'mock-channel-3',
              displayName: 'デザインレビュー（テスト）',
              description: 'テスト用デザインレビューチャンネル',
              memberCount: 5,
              messageCount: 45,
              lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000)
            }
          ],
          createdAt: new Date('2024-01-15')
        },
        {
          id: 'mock-team-2',
          displayName: 'マーケティングチーム（テスト）',
          description: 'テスト用マーケティングチーム',
          memberCount: 5,
          visibility: 'Public',
          channels: [
            {
              id: 'mock-channel-4',
              displayName: '一般（テスト）',
              description: 'テスト用一般チャンネル',
              memberCount: 5,
              messageCount: 92,
              lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000)
            },
            {
              id: 'mock-channel-5',
              displayName: 'キャンペーン企画（テスト）',
              description: 'テスト用キャンペーン企画チャンネル',
              memberCount: 4,
              messageCount: 67,
              lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000)
            }
          ],
          createdAt: new Date('2024-02-01')
        },
        {
          id: 'mock-team-3',
          displayName: '営業チーム（テスト）',
          description: 'テスト用営業チーム',
          memberCount: 6,
          visibility: 'Private',
          channels: [
            {
              id: 'mock-channel-6',
              displayName: '一般（テスト）',
              description: 'テスト用一般チャンネル',
              memberCount: 6,
              messageCount: 134,
              lastActivity: new Date(Date.now() - 20 * 60 * 1000)
            }
          ],
          createdAt: new Date('2024-01-20')
        }
      ],
      meetings: [
        {
          id: 'mock-meeting-1',
          subject: 'テスト週次スタンドアップ',
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
          attendeesCount: 6,
          duration: 30
        },
        {
          id: 'mock-meeting-2',
          subject: 'テストプロジェクト計画会議',
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 23 * 60 * 60 * 1000),
          attendeesCount: 8,
          duration: 60
        },
        {
          id: 'mock-meeting-3',
          subject: 'テストデザインレビュー',
          startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
          attendeesCount: 5,
          duration: 30
        },
        {
          id: 'mock-meeting-4',
          subject: 'テスト月次全体会議',
          startTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 47 * 60 * 60 * 1000),
          attendeesCount: 12,
          duration: 60
        },
        {
          id: 'mock-meeting-5',
          subject: 'テスト1on1ミーティング',
          startTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
          attendeesCount: 2,
          duration: 30
        }
      ]
    };
  }

  /**
   * ✅ Teams統合パフォーマンステスト
   */
  async performanceTest(): Promise<{
    apiResponseTime: number;
    oauthUrlGeneration: number;
    mockDataGeneration: number;
    healthCheckTime: number;
  }> {
    const results = {
      apiResponseTime: 0,
      oauthUrlGeneration: 0,
      mockDataGeneration: 0,
      healthCheckTime: 0
    };

    // OAuth URL生成時間測定
    const oauthStart = performance.now();
    this.generateTestOAuthURL();
    results.oauthUrlGeneration = performance.now() - oauthStart;

    // モックデータ生成時間測定
    const mockStart = performance.now();
    this.generateMockTeamsData();
    results.mockDataGeneration = performance.now() - mockStart;

    // 健全性チェック時間測定
    const healthStart = performance.now();
    await this.performHealthCheck();
    results.healthCheckTime = performance.now() - healthStart;

    // API応答時間測定（Microsoft Graph API）
    try {
      const apiStart = performance.now();
      await this.fetchWithTimeout('https://graph.microsoft.com/v1.0/$metadata', {
        method: 'GET'
      }, 5000);
      results.apiResponseTime = performance.now() - apiStart;
    } catch (error) {
      results.apiResponseTime = -1; // エラーを示す
    }

    return results;
  }
}

// シングルトンインスタンスをエクスポート
export const teamsTestUtils = TeamsTestUtils.getInstance();