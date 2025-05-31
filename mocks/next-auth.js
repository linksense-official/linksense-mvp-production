// NextAuth.js Mock for Jest
// NextAuth.js の機能をテスト用にモックします

const nextAuth = {
  // NextAuth default export mock
  default: jest.fn().mockImplementation((options) => {
    return {
      ...options,
      handlers: {
        GET: jest.fn(),
        POST: jest.fn(),
      },
    }
  }),
  
  // NextAuth named exports mock
  getServerSession: jest.fn().mockResolvedValue(null),
  
  // Auth options mock
  authOptions: {
    providers: [],
    callbacks: {},
    pages: {},
    session: {
      strategy: 'jwt',
    },
  },
}

// react モジュールのモック
const nextAuthReact = {
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
    update: jest.fn(),
  })),
  
  signIn: jest.fn().mockResolvedValue({
    error: null,
    status: 200,
    ok: true,
    url: null,
  }),
  
  signOut: jest.fn().mockResolvedValue({
    url: 'http://localhost:3000',
  }),
  
  getSession: jest.fn().mockResolvedValue(null),
  
  getCsrfToken: jest.fn().mockResolvedValue('mock-csrf-token'),
  
  getProviders: jest.fn().mockResolvedValue({}),
  
  SessionProvider: ({ children }) => children,
}

// プロバイダーのモック
const providers = {
  GoogleProvider: jest.fn().mockImplementation((config) => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
    ...config,
  })),
  
  GitHubProvider: jest.fn().mockImplementation((config) => ({
    id: 'github',
    name: 'GitHub',
    type: 'oauth',
    ...config,
  })),
  
  AzureADProvider: jest.fn().mockImplementation((config) => ({
    id: 'azure-ad',
    name: 'Azure Active Directory',
    type: 'oauth',
    ...config,
  })),
  
  CredentialsProvider: jest.fn().mockImplementation((config) => ({
    id: 'credentials',
    name: 'Credentials',
    type: 'credentials',
    ...config,
  })),
}

// アダプターのモック
const adapters = {
  PrismaAdapter: jest.fn().mockImplementation((prisma) => ({
    createUser: jest.fn(),
    getUser: jest.fn(),
    getUserByEmail: jest.fn(),
    getUserByAccount: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    linkAccount: jest.fn(),
    unlinkAccount: jest.fn(),
    createSession: jest.fn(),
    getSessionAndUser: jest.fn(),
    updateSession: jest.fn(),
    deleteSession: jest.fn(),
    createVerificationToken: jest.fn(),
    useVerificationToken: jest.fn(),
  })),
}

// JWT のモック
const jwt = {
  encode: jest.fn().mockResolvedValue('mock-jwt-token'),
  decode: jest.fn().mockResolvedValue({
    sub: 'mock-user-id',
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  }),
  getToken: jest.fn().mockResolvedValue({
    sub: 'mock-user-id',
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  }),
}

module.exports = nextAuth
module.exports.useSession = nextAuthReact.useSession
module.exports.signIn = nextAuthReact.signIn
module.exports.signOut = nextAuthReact.signOut
module.exports.getSession = nextAuthReact.getSession
module.exports.getCsrfToken = nextAuthReact.getCsrfToken
module.exports.getProviders = nextAuthReact.getProviders
module.exports.SessionProvider = nextAuthReact.SessionProvider
module.exports.providers = providers
module.exports.adapters = adapters
module.exports.jwt = jwt

// 個別エクスポート用
module.exports.GoogleProvider = providers.GoogleProvider
module.exports.GitHubProvider = providers.GitHubProvider
module.exports.AzureADProvider = providers.AzureADProvider
module.exports.CredentialsProvider = providers.CredentialsProvider
module.exports.PrismaAdapter = adapters.PrismaAdapter