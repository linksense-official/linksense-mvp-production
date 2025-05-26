'use client';

import mockApi from './mockApi';

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp?: string;
}

class APIClient {
  private baseURL: string;
  private token: string | null = null;
  private useMockApi: boolean = true; // 強制的にtrueに設定

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    
    // 強制的にモックAPIを使用
    this.useMockApi = true;
    
    // 初期化時にストレージからトークンを復元
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('linksense_auth_token');
    }
  }

  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('linksense_auth_token', token);
    }
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('linksense_auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // モックAPI使用の切り替え
  setMockMode(useMock: boolean): void {
    this.useMockApi = useMock;
  }

  private async request<T>(endpoint: string, config: RequestConfig): Promise<APIResponse<T>> {
    console.log('APIClient.request called:', { endpoint, method: config.method, useMockApi: this.useMockApi });
    
    // モックAPIを使用する場合
    if (this.useMockApi) {
      return this.handleMockRequest<T>(endpoint, config);
    }

    // 実際のAPIリクエスト
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // 認証トークンがある場合は追加
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: config.method,
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      // レスポンスのパース
      let responseData: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // HTTPステータスコードによる判定
      if (response.ok) {
        return {
          success: true,
          data: responseData,
        };
      } else {
        return {
          success: false,
          error: responseData?.message || responseData?.error || `HTTP ${response.status}: ${response.statusText}`,
          code: responseData?.code || response.status.toString(),
        };
      }
    } catch (error) {
      console.error('Real API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ネットワークエラーが発生しました',
        code: 'NETWORK_ERROR',
      };
    }
  }

  // モックAPIリクエストの処理
  private async handleMockRequest<T>(endpoint: string, config: RequestConfig): Promise<APIResponse<T>> {
    console.log('Mock API Request:', { endpoint, method: config.method, body: config.body });
    
    try {
      // エンドポイントに基づいてモック関数を呼び出し
      switch (endpoint) {
        case '/auth/login':
          if (config.method === 'POST' && config.body) {
            console.log('Calling mockApi.login with:', config.body);
            const result = await mockApi.login(config.body) as APIResponse<T>;
            console.log('mockApi.login result:', result);
            return result;
          }
          break;

        case '/auth/register':
          if (config.method === 'POST' && config.body) {
            console.log('Calling mockApi.login with:', config.body);
            const result = await mockApi.login(config.body) as APIResponse<T>;
            console.log('mockApi.login result:', result);
            return result;
          }
          break;

        case '/auth/me':
          if (config.method === 'GET' && this.token) {
            console.log('Calling mockApi.getUser with token:', this.token);
            const result = await mockApi.getUser(this.token) as APIResponse<T>;
            console.log('mockApi.getUser result:', result);
            return result;
          }
          console.log('Auth/me: No token provided');
          return {
            success: false,
            error: '認証が必要です',
            code: 'UNAUTHORIZED',
          };

        case '/auth/refresh':
          if (config.method === 'POST' && config.body) {
            console.log('Mock refresh token request');
            // リフレッシュトークンのモック実装
            return {
              success: true,
              data: {
                user: {
                  id: '1',
                  email: 'demo@example.com',
                  name: 'デモユーザー',
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-01T00:00:00Z',
                },
                accessToken: `mock_token_1_${Date.now()}`,
                refreshToken: `mock_refresh_1_${Date.now()}`,
                expiresIn: 3600,
              } as T,
            };
          }
          break;

        case '/dashboard/stats':
          if (config.method === 'GET') {
            console.log('Calling mockApi.getDashboardStats');
            const result = await mockApi.getDashboardStats() as APIResponse<T>;
            console.log('mockApi.getDashboardStats result:', result);
            return result;
          }
          break;

        case '/user/settings':
          if (config.method === 'GET') {
            console.log('Mock get user settings');
            // 現在のユーザーの設定を返す（仮のユーザーID使用）
            const result = await mockApi.getUser('demo-user') as APIResponse<any>;
            if (result.success && result.data) {
              return {
                success: true,
                data: result.data.settings as T,
              };
            }
            return result as APIResponse<T>;
          } else if (config.method === 'PUT') {
            console.log('Mock update user settings with:', config.body);
            const result = await mockApi.updateUserSettings('demo-user', config.body) as APIResponse<T>;
            console.log('mockApi.updateUserSettings result:', result);
            return result;
          }
          break;

        case '/subscription/plans':
          if (config.method === 'GET') {
            console.log('Mock get subscription plans');
            return {
              success: true,
              data: [
                {
                  id: '1',
                  name: 'Free',
                  price: 0,
                  currency: 'JPY',
                  interval: 'month',
                  features: ['基本的なリンク作成', '月間100クリックまで', '基本分析'],
                  isPopular: false,
                  isActive: true,
                  limits: {
                    links: 10,
                    clicks: 100,
                    analytics: false,
                    customDomain: false,
                  },
                },
                {
                  id: '2',
                  name: 'Pro',
                  price: 1980,
                  currency: 'JPY',
                  interval: 'month',
                  features: ['無制限リンク作成', '無制限クリック', '高度な分析', 'カスタムドメイン'],
                  isPopular: true,
                  isActive: true,
                  limits: {
                    links: -1,
                    clicks: -1,
                    analytics: true,
                    customDomain: true,
                  },
                },
                {
                  id: '3',
                  name: 'Enterprise',
                  price: 4980,
                  currency: 'JPY',
                  interval: 'month',
                  features: ['Proの全機能', 'チーム管理', 'API アクセス', '優先サポート'],
                  isPopular: false,
                  isActive: true,
                  limits: {
                    links: -1,
                    clicks: -1,
                    analytics: true,
                    customDomain: true,
                  },
                },
              ] as T,
            };
          }
          break;

        case '/subscription/payment-methods':
          if (config.method === 'GET') {
            console.log('Mock get payment methods');
            return {
              success: true,
              data: [
                {
                  id: '1',
                  type: 'card',
                  last4: '4242',
                  brand: 'Visa',
                  expiryMonth: 12,
                  expiryYear: 2025,
                  isDefault: true,
                },
              ] as T,
            };
          }
          break;

        case '/subscription/usage':
          if (config.method === 'GET') {
            console.log('Mock get usage data');
            return {
              success: true,
              data: [
                {
                  period: '2024-01-01',
                  links: 15,
                  clicks: 450,
                  conversions: 12,
                  revenue: 5400,
                },
                {
                  period: '2024-02-01',
                  links: 22,
                  clicks: 680,
                  conversions: 18,
                  revenue: 7200,
                },
                {
                  period: '2024-03-01',
                  links: 18,
                  clicks: 520,
                  conversions: 15,
                  revenue: 6100,
                },
              ] as T,
            };
          }
          break;

        case '/subscription/usage-stats':
          if (config.method === 'GET') {
            console.log('Mock get usage stats');
            return {
              success: true,
              data: {
                currentPeriod: {
                  links: 45,
                  clicks: 1250,
                  conversions: 38,
                  revenue: 15750,
                },
                limits: {
                  links: -1,
                  clicks: -1,
                },
                usage: {
                  linksPercentage: 0,
                  clicksPercentage: 0,
                },
              } as T,
            };
          }
          break;

        case '/notifications':
          if (config.method === 'GET') {
            console.log('Mock get notifications');
            return {
              success: true,
              data: [
                {
                  id: '1',
                  type: 'info',
                  title: 'システム更新',
                  message: 'システムが正常に更新されました',
                  timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                  isRead: false,
                },
                {
                  id: '2',
                  type: 'success',
                  title: 'コンバージョン発生',
                  message: '新しいコンバージョンが発生しました',
                  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                  isRead: true,
                },
              ] as T,
            };
          }
          break;

        default:
          console.log('Default mock response for:', endpoint);
          // その他のエンドポイントは成功レスポンスを返す（開発用）
          return {
            success: true,
            data: {} as T,
            message: `モックレスポンス: ${endpoint}`,
          };
      }

      return {
        success: false,
        error: `未対応のエンドポイント: ${endpoint}`,
        code: 'ENDPOINT_NOT_FOUND',
      };
    } catch (error) {
      console.error('Mock API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'モックAPIエラー',
        code: 'MOCK_API_ERROR',
      };
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  async post<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body: data, headers });
  }

  async put<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body: data, headers });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  async patch<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body: data, headers });
  }
}

// シングルトンインスタンス
const apiClient = new APIClient(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api');

export default apiClient;
export { APIClient, type APIResponse };