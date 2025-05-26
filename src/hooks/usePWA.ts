'use client';

import { useState, useEffect } from 'react';
import type { 
  PWAState, 
  PWAActions, 
  PWANotification, 
  BeforeInstallPromptEvent, 
  UsePWAReturn 
} from '@/types/pwa';

export const usePWA = (): UsePWAReturn => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkPWASupport = () => {
      if (typeof window !== 'undefined') {
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        setIsSupported(isSupported);

        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                                 (window.navigator as any).standalone ||
                                 document.referrer.includes('android-app://');
        setIsStandalone(isStandaloneMode);
        setIsInstalled(isStandaloneMode);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    checkPWASupport();

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    // 明示的に undefined を返す（window が undefined の場合）
    return undefined;
  }, []);

  const install = async (): Promise<void> => {
    if (!deferredPrompt) {
      throw new Error('インストールプロンプトが利用できません');
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWAインストールエラー:', error);
      throw error;
    }
  };

  const checkInstallability = (): void => {
    if (typeof window !== 'undefined') {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                               (window.navigator as any).standalone ||
                               document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
      
      if (isStandaloneMode) {
        setIsInstallable(false);
      }
    }
  };

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    isSupported,
    install,
    checkInstallability,
  };
};

// 型定義の再エクスポート
export type { PWAState, PWAActions, PWANotification, BeforeInstallPromptEvent, UsePWAReturn } from '@/types/pwa';

export default usePWA;