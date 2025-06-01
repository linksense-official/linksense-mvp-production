import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from './contexts/AuthContext'
import Layout from '@/components/layout/Layout'
import NextAuthProvider from '@/components/providers/nextauth-provider'

export const metadata: Metadata = {
  title: {
    default: 'LinkSense - チーム健全性分析プラットフォーム',
    template: '%s | LinkSense'
  },
  description: 'Slack、Teams、Zoom等8つのプラットフォームを統合したチーム健全性分析SaaS。バーンアウト早期検出、コミュニケーション最適化、エンタープライズ対応。',
  keywords: [
    'チーム健全性分析',
    'バーンアウト検出',
    'コミュニケーション分析',
    'Slack統合',
    'Microsoft Teams',
    'Zoom分析',
    'チームマネジメント',
    'リモートワーク',
    'エンタープライズSaaS',
    'AI分析'
  ],
  authors: [{ name: 'LinkSense Team' }],
  creator: 'LinkSense',
  publisher: 'LinkSense',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://linksense-mvp.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://linksense-mvp.vercel.app',
    siteName: 'LinkSense',
    title: 'LinkSense - チーム健全性分析プラットフォーム',
    description: 'Slack、Teams、Zoom等8つのプラットフォームを統合したチーム健全性分析SaaS。バーンアウト早期検出、コミュニケーション最適化、エンタープライズ対応。',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LinkSense - チーム健全性分析プラットフォーム',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkSense - チーム健全性分析プラットフォーム',
    description: 'Slack、Teams、Zoom等8つのプラットフォームを統合したチーム健全性分析SaaS。',
    images: ['/og-image.png'],
    creator: '@linksense_jp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LinkSense',
    startupImage: [
      {
        url: '/icons/apple-splash-2048-2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-1668-2224.png',
        media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-1536-2048.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' }
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/* PWA最適化メタタグ */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LinkSense" />
        <meta name="application-name" content="LinkSense" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* セキュリティヘッダー */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* パフォーマンス最適化 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//vercel.com" />
        <link rel="dns-prefetch" href="//api.stripe.com" />
        
        {/* 構造化データ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "LinkSense",
              "description": "チーム健全性分析プラットフォーム",
              "url": "https://linksense-mvp.vercel.app",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "JPY",
                "description": "無料トライアル利用可能"
              },
              "provider": {
                "@type": "Organization",
                "name": "LinkSense"
              }
            })
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 antialiased">
        <NextAuthProvider>
          <AuthProvider>
            <Layout>
              {children}
            </Layout>
          </AuthProvider>
        </NextAuthProvider>
        
        {/* 本番環境でのアナリティクス */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics */}
            {process.env.NEXT_PUBLIC_GA_ID && (
              <>
                <script
                  async
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                />
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                        page_title: document.title,
                        page_location: window.location.href,
                      });
                    `,
                  }}
                />
              </>
            )}
          </>
        )}
      </body>
    </html>
  )
}