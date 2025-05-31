/** @type {import('next').NextConfig} */
const path = require('path');

// 環境判定
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig = {
  // Next.js 15 実験的機能設定
  experimental: {
    esmExternals: true,
    // 本番環境での最適化
    ...(isProduction && {
      optimizeCss: true,
      optimizeServerReact: true,
      serverComponentsExternalPackages: ['@prisma/client'],
    }),
    // 開発環境での最適化
    ...(isDevelopment && {
      turbo: {
        rules: {
          '*.svg': {
            loaders: ['@svgr/webpack'],
            as: '*.js',
          },
        },
      },
    }),
  },

  // Webpack設定 - パス解決とパフォーマンス最適化
  webpack: (config, { isServer, dev }) => {
    // パス解決の強制設定
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/contexts': path.resolve(__dirname, 'src/app/contexts'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
    };

    // ファイル拡張子解決設定
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];

    // 本番環境での最適化
    if (isProduction && !isServer) {
      // バンドルサイズ最適化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };

      // 本番環境でのコンソールログ除去
      config.optimization.minimizer = config.optimization.minimizer || [];
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer.push(
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          },
        })
      );
    }

    // 開発環境での最適化
    if (isDevelopment) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    return config;
  },

  // 画像最適化設定（本番環境強化）
  images: {
    domains: isProduction 
      ? [
          'linksense-mvp.vercel.app',
          'avatars.githubusercontent.com',
          'lh3.googleusercontent.com',
          'graph.microsoft.com',
        ]
      : ['localhost'],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: isProduction ? 86400 : 60, // 本番: 1日, 開発: 1分
    // 本番環境での画像最適化
    ...(isProduction && {
      loader: 'default',
      quality: 80,
    }),
  },

  // セキュリティヘッダー（本番環境強化版）
  async headers() {
    const securityHeaders = [
      {
        source: '/(.*)',
        headers: [
          // 基本セキュリティヘッダー
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // 本番環境での追加セキュリティ
          ...(isProduction ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https: blob:",
                "connect-src 'self' https://api.stripe.com https://api.github.com https://graph.microsoft.com https://accounts.google.com",
                "frame-src 'self' https://js.stripe.com https://accounts.google.com",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
                "upgrade-insecure-requests",
              ].join('; '),
            },
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
            },
          ] : []),
        ],
      },
      // API エンドポイント用ヘッダー
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          ...(isProduction ? [
            {
              key: 'X-Robots-Tag',
              value: 'noindex, nofollow',
            },
          ] : []),
        ],
      },
      // 認証エンドポイント用ヘッダー
      {
        source: '/api/auth/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          ...(isProduction ? [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
          ] : []),
        ],
      },
    ];

    return securityHeaders;
  },

  // リダイレクト設定
  async redirects() {
    return [
      // 認証関連リダイレクト
      {
        source: '/auth/:path*',
        destination: '/api/auth/:path*',
        permanent: false,
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
      // 本番環境での追加リダイレクト
      ...(isProduction ? [
        {
          source: '/admin',
          destination: '/dashboard',
          permanent: false,
        },
      ] : []),
    ];
  },

  // リライト設定
  async rewrites() {
    return [
      // ヘルスチェック
      {
        source: '/health',
        destination: '/api/health',
      },
      // メトリクス（本番環境のみ）
      ...(isProduction ? [
        {
          source: '/metrics',
          destination: '/api/metrics',
        },
      ] : []),
    ];
  },

  // 本番環境設定
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: isProduction,
  trailingSlash: false,
  
  // 静的ファイル最適化
  assetPrefix: isProduction ? '' : '',
  
  // TypeScript設定
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },

  // ESLint設定
  eslint: {
    ignoreDuringBuilds: isDevelopment, // 開発環境ではビルド時に無視
    dirs: ['src'],
  },

  // 出力設定
  output: 'standalone',
  
  // 環境変数設定
  env: {
    CUSTOM_KEY: isProduction ? 'production-value' : 'development-value',
  },

  // パフォーマンス最適化
  ...(isProduction && {
    swcMinify: true,
    modularizeImports: {
      '@mui/icons-material': {
        transform: '@mui/icons-material/{{member}}',
      },
      lodash: {
        transform: 'lodash/{{member}}',
      },
    },
  }),

  // 開発環境設定
  ...(isDevelopment && {
    reactStrictMode: true,
    fastRefresh: true,
  }),

  // ログ設定
  logging: {
    fetches: {
      fullUrl: isDevelopment,
    },
  },

  // キャッシュ設定
  onDemandEntries: {
    maxInactiveAge: isProduction ? 60 * 1000 : 25 * 1000,
    pagesBufferLength: isProduction ? 2 : 5,
  },

  // 本番環境でのバンドル分析（オプション）
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),
};

module.exports = nextConfig;