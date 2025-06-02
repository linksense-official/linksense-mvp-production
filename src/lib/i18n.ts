// 言語設定
export const locales = ['ja', 'en'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'ja';

// 翻訳辞書の型定義
export interface Dictionary {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    previous: string;
  };
  navigation: {
    dashboard: string;
    analytics: string;
    reports: string;
    alerts: string;
    members: string;
    settings: string;
    integrations: string;
    profile: string;
    logout: string;
  };
  auth: {
    login: string;
    register: string;
    logout: string;
    email: string;
    password: string;
    forgotPassword: string;
    resetPassword: string;
    twoFactor: string;
  };
  dashboard: {
    title: string;
    overview: string;
    recentActivity: string;
    quickActions: string;
  };
}

// 翻訳辞書（直接定義）
const dictionaries: Record<Locale, Dictionary> = {
  ja: {
    common: {
      loading: "読み込み中...",
      error: "エラーが発生しました",
      success: "成功しました",
      cancel: "キャンセル",
      save: "保存",
      delete: "削除",
      edit: "編集",
      back: "戻る",
      next: "次へ",
      previous: "前へ"
    },
    navigation: {
      dashboard: "ダッシュボード",
      analytics: "分析",
      reports: "レポート",
      alerts: "アラート",
      members: "メンバー",
      settings: "設定",
      integrations: "統合設定",
      profile: "プロフィール",
      logout: "ログアウト"
    },
    auth: {
      login: "ログイン",
      register: "新規登録",
      logout: "ログアウト",
      email: "メールアドレス",
      password: "パスワード",
      forgotPassword: "パスワードを忘れた方",
      resetPassword: "パスワードリセット",
      twoFactor: "二要素認証"
    },
    dashboard: {
      title: "ダッシュボード",
      overview: "概要",
      recentActivity: "最近のアクティビティ",
      quickActions: "クイックアクション"
    }
  },
  en: {
    common: {
      loading: "Loading...",
      error: "An error occurred",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      next: "Next",
      previous: "Previous"
    },
    navigation: {
      dashboard: "Dashboard",
      analytics: "Analytics",
      reports: "Reports",
      alerts: "Alerts",
      members: "Members",
      settings: "Settings",
      integrations: "Integrations",
      profile: "Profile",
      logout: "Logout"
    },
    auth: {
      login: "Login",
      register: "Register",
      logout: "Logout",
      email: "Email",
      password: "Password",
      forgotPassword: "Forgot Password",
      resetPassword: "Reset Password",
      twoFactor: "Two-Factor Authentication"
    },
    dashboard: {
      title: "Dashboard",
      overview: "Overview",
      recentActivity: "Recent Activity",
      quickActions: "Quick Actions"
    }
  }
};

// 辞書取得関数（同期版）
export const getDictionary = (locale: Locale): Dictionary => {
  return dictionaries[locale] || dictionaries[defaultLocale];
};

// 辞書取得関数（非同期版 - 将来の拡張用）
export const getDictionaryAsync = async (locale: Locale): Promise<Dictionary> => {
  return Promise.resolve(getDictionary(locale));
};

// 言語検出
export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/');
  const maybeLocale = segments[1] as Locale;
  
  if (locales.includes(maybeLocale)) {
    return maybeLocale;
  }
  
  return defaultLocale;
}

// パスの言語プレフィックス除去
export function removeLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/');
  const maybeLocale = segments[1] as Locale;
  
  if (locales.includes(maybeLocale)) {
    return '/' + segments.slice(2).join('/');
  }
  
  return pathname;
}

// 言語付きパスの生成
export function getLocalizedPath(pathname: string, locale: Locale): string {
  const cleanPath = removeLocaleFromPathname(pathname);
  
  if (locale === defaultLocale) {
    return cleanPath === '/' ? '/' : cleanPath;
  }
  
  return `/${locale}${cleanPath === '/' ? '' : cleanPath}`;
}

// 翻訳ヘルパー関数
export function t(dictionary: Dictionary, key: string): string {
  const keys = key.split('.');
  let value: any = dictionary;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // キーが見つからない場合はキー自体を返す
    }
  }
  
  return typeof value === 'string' ? value : key;
}

// 現在のロケールを取得するヘルパー（クライアントサイド用）
export function getCurrentLocale(): Locale {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    return getLocaleFromPathname(pathname);
  }
  return defaultLocale;
}

// ブラウザの言語設定から推奨ロケールを取得
export function getPreferredLocale(): Locale {
  if (typeof window !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.toLowerCase();
    
    for (const locale of locales) {
      if (browserLang.startsWith(locale)) {
        return locale;
      }
    }
  }
  
  return defaultLocale;
}

// ロケール情報の取得
export function getLocaleInfo(locale: Locale) {
  const info = {
    ja: {
      name: '日本語',
      nativeName: '日本語',
      flag: '🇯🇵',
      direction: 'ltr' as const,
      dateFormat: 'YYYY年MM月DD日',
      timeFormat: 'HH:mm',
    },
    en: {
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      direction: 'ltr' as const,
      dateFormat: 'MMMM DD, YYYY',
      timeFormat: 'h:mm A',
    },
  };
  
  return info[locale];
}

// 数値のフォーマット
export function formatNumber(value: number, locale: Locale): string {
  const localeMap = {
    ja: 'ja-JP',
    en: 'en-US',
  };
  
  return new Intl.NumberFormat(localeMap[locale]).format(value);
}

// 通貨のフォーマット
export function formatCurrency(value: number, locale: Locale, currency: string = 'JPY'): string {
  const localeMap = {
    ja: 'ja-JP',
    en: 'en-US',
  };
  
  const currencyMap = {
    ja: 'JPY',
    en: 'USD',
  };
  
  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency: currency || currencyMap[locale],
  }).format(value);
}

// 日付のフォーマット
export function formatDate(date: Date, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  const localeMap = {
    ja: 'ja-JP',
    en: 'en-US',
  };
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat(localeMap[locale], options || defaultOptions).format(date);
}

// 相対時間のフォーマット
export function formatRelativeTime(date: Date, locale: Locale): string {
  const localeMap = {
    ja: 'ja-JP',
    en: 'en-US',
  };
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(localeMap[locale], { numeric: 'auto' });
  
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

// 翻訳キーの型安全性を提供するヘルパー
export type TranslationKey = 
  | `common.${keyof Dictionary['common']}`
  | `navigation.${keyof Dictionary['navigation']}`
  | `auth.${keyof Dictionary['auth']}`
  | `dashboard.${keyof Dictionary['dashboard']}`;

// 型安全な翻訳関数
export function translate(dictionary: Dictionary, key: TranslationKey): string {
  return t(dictionary, key);
}