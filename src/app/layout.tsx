import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from './contexts/AuthContext'
import Layout from '@/components/layout/Layout'
import NextAuthProvider from '@/components/providers/nextauth-provider'

export const metadata: Metadata = {
  title: 'LinkSense - チーム健全性分析',
  description: 'AIを活用したチームコミュニケーション分析ツール',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LinkSense',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'LinkSense',
    title: 'LinkSense - チーム健全性分析',
    description: 'AIを活用したチームコミュニケーション分析ツール',
  },
  twitter: {
    card: 'summary',
    title: 'LinkSense - チーム健全性分析',
    description: 'AIを活用したチームコミュニケーション分析ツール',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        {/* PWA用のメタタグ */}
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LinkSense" />
        
        {/* 認証システム用のセキュリティヘッダー */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Service Worker登録スクリプト */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 antialiased">
        {/* NextAuthProviderで全体をラップし、既存のAuthProviderとLayoutを内包 */}
        <NextAuthProvider>
          <AuthProvider>
            <Layout>
              {children}
            </Layout>
          </AuthProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}