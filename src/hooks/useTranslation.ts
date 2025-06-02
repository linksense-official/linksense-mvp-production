'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { getDictionary, getLocaleFromPathname, translate, type Dictionary, type Locale, type TranslationKey } from '@/lib/i18n';

export function useTranslation() {
  const pathname = usePathname();
  
  const locale = useMemo(() => {
    return getLocaleFromPathname(pathname);
  }, [pathname]);
  
  const dictionary = useMemo(() => {
    return getDictionary(locale);
  }, [locale]);
  
  const t = useMemo(() => {
    return (key: TranslationKey) => translate(dictionary, key);
  }, [dictionary]);
  
  return {
    locale,
    dictionary,
    t,
  };
}

// サーバーサイド用の翻訳フック
export function useServerTranslation(locale: Locale) {
  const dictionary = getDictionary(locale);
  
  const t = (key: TranslationKey) => translate(dictionary, key);
  
  return {
    locale,
    dictionary,
    t,
  };
}