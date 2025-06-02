'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getLocaleFromPathname, getLocalizedPath, getLocaleInfo, locales, type Locale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  className?: string;
  showFlag?: boolean;
  showDropdown?: boolean;
}

export default function LanguageSwitcher({ 
  className = '', 
  showFlag = true, 
  showDropdown = true 
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentLocale, setCurrentLocale] = useState<Locale>('ja');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCurrentLocale(getLocaleFromPathname(pathname));
  }, [pathname]);

  const handleLocaleChange = (newLocale: Locale) => {
    const newPath = getLocalizedPath(pathname, newLocale);
    router.push(newPath);
    setIsOpen(false);
  };

  const currentLocaleInfo = getLocaleInfo(currentLocale);

  if (!showDropdown) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showFlag && <span className="text-lg">{currentLocaleInfo.flag}</span>}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentLocaleInfo.nativeName}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="言語を選択"
        aria-expanded={isOpen}
      >
        {showFlag && <span className="text-lg">{currentLocaleInfo.flag}</span>}
        <span>{currentLocaleInfo.nativeName}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* オーバーレイ */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* ドロップダウンメニュー */}
          <div className="absolute right-0 mt-2 py-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            {locales.map((locale) => {
              const localeInfo = getLocaleInfo(locale);
              const isSelected = currentLocale === locale;
              
              return (
                <button
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                  className={`flex items-center space-x-3 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    isSelected
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                  aria-label={`${localeInfo.nativeName}に切り替え`}
                >
                  <span className="text-lg">{localeInfo.flag}</span>
                  <span className="flex-1">{localeInfo.nativeName}</span>
                  {isSelected && (
                    <svg 
                      className="w-4 h-4 text-blue-600 dark:text-blue-400" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}