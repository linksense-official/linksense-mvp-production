import { NextRequest, NextResponse } from 'next/server';

// サポートする言語
const locales = ['ja', 'en'];
const defaultLocale = 'ja';

// 言語検出関数
function getLocale(request: NextRequest): string {
  // URLパスから言語を検出
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameLocale) return pathnameLocale;

  // Accept-Languageヘッダーから検出
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    for (const locale of locales) {
      if (acceptLanguage.includes(locale)) {
        return locale;
      }
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 静的ファイルとAPIルートはスキップ
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 既に言語プレフィックスがある場合
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // 言語プレフィックスがない場合、デフォルト言語として処理
  const locale = getLocale(request);
  
  // 日本語の場合はプレフィックスなし、英語の場合は /en を付与
  if (locale === 'en') {
    const newUrl = new URL(`/en${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // APIルートと静的ファイルを除外
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};