/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 では experimental.appDir は不要（デフォルトで有効）
  experimental: {
    // appDir を削除（Next.js 15では不要）
  },
  
  // 画像最適化設定
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
        ],
      },
    ];
  },
  
  // 本番環境でのソースマップ無効化
  productionBrowserSourceMaps: false,
  
  // 静的最適化
  trailingSlash: false,
  
  // TypeScript設定
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint設定
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig