/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 では experimental.appDir は不要（デフォルトで有効）
  experimental: {
    // appDir を削除（Next.js 15では不要）
    esmExternals: true,
  },
  
  // webpack設定追加 - パス解決問題修正
  webpack: (config, { isServer }) => {
    // パス解決の強制設定
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
      '@/components': require('path').resolve(__dirname, 'src/components'),
      '@/lib': require('path').resolve(__dirname, 'src/lib'),
      '@/types': require('path').resolve(__dirname, 'src/types'),
      '@/app': require('path').resolve(__dirname, 'src/app'),
      '@/contexts': require('path').resolve(__dirname, 'src/app/contexts'),
    };
    
    // ファイル拡張子解決設定
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];
    
    return config;
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
  
  // ESLint設定（ビルド時は一時的に無効化）
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig