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
  other: {
    'zoom-domain-verification': 'ZOOM_verify_af34206311a84c71a59fb3f82f504d98'
  }
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
        <meta name="zoom-domain-verification" content="ZOOM_verify_af34206311a84c71a59fb3f82f504d98" />
      </head>
      <body className="min-h-screen bg-gray-50 antialiased">
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