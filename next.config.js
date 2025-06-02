/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基本設定
  reactStrictMode: true,
  
  // 実験的機能（Next.js 15対応）
  experimental: {
    optimizeCss: true,
    // Next.js 15の新機能
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // サーバー外部パッケージ（新しい設定名）
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'otplib'],

  // TypeScript設定
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint設定
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 画像最適化
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'graph.microsoft.com',
      },
      {
        protocol: 'https',
        hostname: 'linksense-mvp.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
      },
      {
        protocol: 'https',
        hostname: 'unpkg.com',
      },
    ],
    // domains は非推奨なので remotePatterns を使用
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 出力設定
  output: 'standalone',
  
  // ビルド設定（Windows対応 + 最適化）
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Windows環境でのファイルパス問題を解決
    if (process.platform === 'win32') {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        url: false,
      };
    }

    // Prisma関連の設定
    config.externals = [...(config.externals || []), '@prisma/client'];

    // SVGをReactコンポーネントとして扱う
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // 本番環境での最適化
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
              priority: 5,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 20,
            },
            nextjs: {
              test: /[\\/]node_modules[\\/]next[\\/]/,
              name: 'nextjs',
              chunks: 'all',
              priority: 15,
            },
          },
        },
      };
    }

    // パフォーマンス警告の調整
    config.performance = {
      maxAssetSize: 250000,
      maxEntrypointSize: 250000,
    };

    return config;
  },

  // 環境変数
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },

  // セキュリティヘッダー（強化版）
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https://api.github.com https://graph.microsoft.com https://accounts.google.com https://vitals.vercel-insights.com",
          "frame-src 'self' https://js.stripe.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "upgrade-insecure-requests"
        ].join('; ')
      }
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/(.*)',
        headers: [
          ...securityHeaders,
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://linksense-mvp.vercel.app' 
              : '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          }
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      }
    ];
  },

  // リダイレクト設定（拡張版）
  async redirects() {
    return [
      // 基本リダイレクト
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/register',
        permanent: true,
      },
      // 言語別リダイレクト（App Routerでの国際化対応）
      {
        source: '/en',
        destination: '/en/dashboard',
        permanent: false,
      },
      {
        source: '/ja',
        destination: '/dashboard',
        permanent: false,
      },
      // 旧パス対応
      {
        source: '/dashboard/analytics',
        destination: '/analytics',
        permanent: true,
      },
      {
        source: '/dashboard/reports',
        destination: '/reports',
        permanent: true,
      },
      {
        source: '/dashboard/alerts',
        destination: '/alerts',
        permanent: true,
      },
      {
        source: '/dashboard/members',
        destination: '/members',
        permanent: true,
      },
      {
        source: '/dashboard/settings',
        destination: '/settings',
        permanent: true,
      },
      // セキュリティ関連リダイレクト
      {
        source: '/admin',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/wp-admin',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/wp-login',
        destination: '/login',
        permanent: false,
      },
    ];
  },

  // リライト設定（拡張版）
  async rewrites() {
    return {
      beforeFiles: [
        // 国際化対応のリライト
        {
          source: '/en/:path*',
          destination: '/:path*',
          has: [
            {
              type: 'header',
              key: 'accept-language',
              value: '.*en.*',
            },
          ],
        },
      ],
      afterFiles: [
        // API関連のリライト
        {
          source: '/api/health',
          destination: '/api/health-check',
        },
        {
          source: '/api/status',
          destination: '/api/health-check',
        },
        // 静的ファイルのリライト
        {
          source: '/robots.txt',
          destination: '/api/robots',
        },
        {
          source: '/sitemap.xml',
          destination: '/api/sitemap',
        },
      ],
      fallback: [
        // フォールバック処理
        {
          source: '/:path*',
          destination: '/404',
        },
      ],
    };
  },

  // パフォーマンス設定
  poweredByHeader: false,
  compress: true,
  
  // 静的ファイル設定
  trailingSlash: false,
  
  // ページ拡張子設定
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  
  // ビルド時設定
  generateBuildId: async () => {
    // カスタムビルドIDの生成
    return `linksense-${new Date().getTime()}`;
  },

  // 開発時設定
  ...(process.env.NODE_ENV === 'development' && {
    // 開発時のみの設定
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),

  // 本番時設定
  ...(process.env.NODE_ENV === 'production' && {
    // 本番時のみの設定
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),
};

module.exports = nextConfig;