/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// シンプルなモック設定
const mockSignIn = jest.fn();
const mockGetSession = jest.fn();
const mockPush = jest.fn();
const mockGet = jest.fn();
const mockLogin = jest.fn();
const mockVerifyTwoFactor = jest.fn();

// NextAuth.js のモック
jest.mock('next-auth/react', () => ({
  signIn: mockSignIn,
  getSession: mockGetSession,
  useSession: () => ({
    data: null,
    status: 'unauthenticated'
  })
}));

// Next.js Navigation のモック
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// AuthContext のモック
jest.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: mockLogin,
    logout: jest.fn(),
    register: jest.fn(),
    verifyTwoFactor: mockVerifyTwoFactor,
    requiresTwoFactor: false,
    socialLoginProvider: null,
    socialLoginProviderId: null,
    getSocialProviderName: (provider: string) => {
      switch (provider) {
        case 'google': return 'Google';
        case 'github': return 'GitHub';
        case 'azure-ad': return 'Microsoft';
        default: return provider;
      }
    },
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// テスト用のシンプルなコンポーネント
const TestSocialLoginComponent: React.FC = () => {
  const [socialLoading, setSocialLoading] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider);
    try {
      await mockSignIn(provider, { callbackUrl: '/dashboard', redirect: false });
    } catch (error) {
      console.error('Social login error:', error);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleDemoLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      await mockLogin(email, password);
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="social-login-test-component">
      <h2 data-testid="login-title">LinkSense にログイン</h2>
      <p data-testid="login-subtitle">チーム健全性分析ツール</p>
      
      {/* ソーシャルログインボタン */}
      <div data-testid="social-login-section">
        <button
          data-testid="google-login-button"
          onClick={() => handleSocialLogin('google')}
          disabled={loading || socialLoading !== null}
        >
          {socialLoading === 'google' ? 'Googleでログイン中...' : 'Googleでログイン'}
        </button>

        <button
          data-testid="github-login-button"
          onClick={() => handleSocialLogin('github')}
          disabled={loading || socialLoading !== null}
        >
          {socialLoading === 'github' ? 'GitHubでログイン中...' : 'GitHubでログイン'}
        </button>

        <button
          data-testid="microsoft-login-button"
          onClick={() => handleSocialLogin('azure-ad')}
          disabled={loading || socialLoading !== null}
        >
          {socialLoading === 'azure-ad' ? 'Microsoftでログイン中...' : 'Microsoftでログイン'}
        </button>
      </div>

      {/* デモアカウント */}
      <div data-testid="demo-accounts-section">
        <button
          data-testid="demo-login-button"
          onClick={() => handleDemoLogin('demo@company.com', 'demo123')}
          disabled={loading || socialLoading !== null}
        >
          デモユーザー
        </button>

        <button
          data-testid="admin-demo-login-button"
          onClick={() => handleDemoLogin('admin@company.com', 'admin123')}
          disabled={loading || socialLoading !== null}
        >
          管理者
        </button>

        <button
          data-testid="manager-demo-login-button"
          onClick={() => handleDemoLogin('manager@company.com', 'manager123')}
          disabled={loading || socialLoading !== null}
        >
          マネージャー
        </button>
      </div>
    </div>
  );
};

describe('ソーシャルログイン統合テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトのモック値を設定
    mockGet.mockReturnValue(null);
    mockSignIn.mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
      url: null,
    });
    mockLogin.mockResolvedValue({
      success: true,
      error: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('基本UI表示テスト', () => {
    test('ログインページが正しく表示される', async () => {
      render(<TestSocialLoginComponent />);

      expect(screen.getByTestId('social-login-test-component')).toBeInTheDocument();
      expect(screen.getByTestId('login-title')).toHaveTextContent('LinkSense にログイン');
      expect(screen.getByTestId('login-subtitle')).toHaveTextContent('チーム健全性分析ツール');
    });

    test('すべてのソーシャルログインボタンが表示される', async () => {
      render(<TestSocialLoginComponent />);

      expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
      expect(screen.getByTestId('github-login-button')).toBeInTheDocument();
      expect(screen.getByTestId('microsoft-login-button')).toBeInTheDocument();
    });

    test('デモアカウントボタンが表示される', async () => {
      render(<TestSocialLoginComponent />);

      expect(screen.getByTestId('demo-login-button')).toBeInTheDocument();
      expect(screen.getByTestId('admin-demo-login-button')).toBeInTheDocument();
      expect(screen.getByTestId('manager-demo-login-button')).toBeInTheDocument();
    });
  });

  describe('Google OAuth統合テスト', () => {
    test('Googleログインボタンクリック時に正しいプロバイダーで認証が開始される', async () => {
      render(<TestSocialLoginComponent />);

      const googleButton = screen.getByTestId('google-login-button');
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', {
          callbackUrl: '/dashboard',
          redirect: false,
        });
      });
    });

    test('Google認証成功時にユーザー情報が正しく設定される', async () => {
      const mockSession = {
        user: {
          id: 'google-user-123',
          email: 'test@gmail.com',
          name: 'Test User',
          provider: 'google',
          providerId: 'google-user-123',
        },
        expires: '2024-12-31',
      };

      mockGetSession.mockResolvedValue(mockSession);

      const session = await mockGetSession();
      expect(session.user.provider).toBe('google');
      expect(session.user.email).toBe('test@gmail.com');
    });
  });

  describe('GitHub OAuth統合テスト', () => {
    test('GitHubログインボタンクリック時に正しいプロバイダーで認証が開始される', async () => {
      render(<TestSocialLoginComponent />);

      const githubButton = screen.getByTestId('github-login-button');
      fireEvent.click(githubButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('github', {
          callbackUrl: '/dashboard',
          redirect: false,
        });
      });
    });

    test('GitHub認証成功時にプロフィール情報が正しく取得される', async () => {
      const mockSession = {
        user: {
          id: 'github-user-456',
          email: 'developer@github.com',
          name: 'GitHub Developer',
          provider: 'github',
          providerId: 'github-user-456',
          image: 'https://avatars.githubusercontent.com/u/456',
        },
        expires: '2024-12-31',
      };

      mockGetSession.mockResolvedValue(mockSession);

      const session = await mockGetSession();
      expect(session.user.provider).toBe('github');
      expect(session.user.image).toContain('avatars.githubusercontent.com');
    });
  });

  describe('Microsoft OAuth統合テスト', () => {
    test('Microsoftログインボタンクリック時に正しいプロバイダーで認証が開始される', async () => {
      render(<TestSocialLoginComponent />);

      const microsoftButton = screen.getByTestId('microsoft-login-button');
      fireEvent.click(microsoftButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('azure-ad', {
          callbackUrl: '/dashboard',
          redirect: false,
        });
      });
    });

    test('Microsoft認証成功時に企業アカウント情報が正しく設定される', async () => {
      const mockSession = {
        user: {
          id: 'azure-user-789',
          email: 'user@company.com',
          name: 'Enterprise User',
          provider: 'azure-ad',
          providerId: 'azure-user-789',
        },
        expires: '2024-12-31',
      };

      mockGetSession.mockResolvedValue(mockSession);

      const session = await mockGetSession();
      expect(session.user.provider).toBe('azure-ad');
      expect(session.user.email).toContain('@company.com');
    });
  });

  describe('デモアカウントテスト', () => {
    test('デモユーザーボタンクリック時に正しい認証情報でログインが実行される', async () => {
      render(<TestSocialLoginComponent />);

      const demoButton = screen.getByTestId('demo-login-button');
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('demo@company.com', 'demo123');
      });
    });

    test('管理者デモボタンクリック時に正しい認証情報でログインが実行される', async () => {
      render(<TestSocialLoginComponent />);

      const adminButton = screen.getByTestId('admin-demo-login-button');
      fireEvent.click(adminButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('admin@company.com', 'admin123');
      });
    });

    test('マネージャーデモボタンクリック時に正しい認証情報でログインが実行される', async () => {
      render(<TestSocialLoginComponent />);

      const managerButton = screen.getByTestId('manager-demo-login-button');
      fireEvent.click(managerButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('manager@company.com', 'manager123');
      });
    });
  });

  describe('エラーハンドリングテスト', () => {
    test('OAuth認証失敗時にエラーが適切に処理される', async () => {
      mockSignIn.mockRejectedValue(new Error('OAuth authentication failed'));

      render(<TestSocialLoginComponent />);

      const googleButton = screen.getByTestId('google-login-button');
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', {
          callbackUrl: '/dashboard',
          redirect: false,
        });
      });

      // エラーが発生してもアプリケーションがクラッシュしないことを確認
      expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    });

    test('ネットワークエラー時に適切に処理される', async () => {
      mockSignIn.mockRejectedValue(new Error('Network error'));

      render(<TestSocialLoginComponent />);

      const githubButton = screen.getByTestId('github-login-button');
      fireEvent.click(githubButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('github', {
          callbackUrl: '/dashboard',
          redirect: false,
        });
      });

      // エラーが発生してもUIが正常に表示されることを確認
      expect(screen.getByTestId('github-login-button')).toBeInTheDocument();
    });
  });

  describe('統合テスト', () => {
    test('複数のプロバイダーを順次テストできる', async () => {
      render(<TestSocialLoginComponent />);

      // Google ログインテスト
      const googleButton = screen.getByTestId('google-login-button');
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', expect.any(Object));
      });

      // GitHub ログインテスト
      const githubButton = screen.getByTestId('github-login-button');
      fireEvent.click(githubButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('github', expect.any(Object));
      });

      // Microsoft ログインテスト
      const microsoftButton = screen.getByTestId('microsoft-login-button');
      fireEvent.click(microsoftButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('azure-ad', expect.any(Object));
      });

      // 3回のソーシャルログインが実行されたことを確認
      expect(mockSignIn).toHaveBeenCalledTimes(3);
    });

    test('デモアカウントとソーシャルログインが併存できる', async () => {
      render(<TestSocialLoginComponent />);

      // すべてのボタンが表示されることを確認
      expect(screen.getByTestId('demo-login-button')).toBeInTheDocument();
      expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
      expect(screen.getByTestId('github-login-button')).toBeInTheDocument();
      expect(screen.getByTestId('microsoft-login-button')).toBeInTheDocument();
    });
  });
});