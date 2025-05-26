'use client';

import { useState, useEffect } from 'react';

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  installPrompt: any;
}

export const usePWAState = () => {
  const [pwaState, setPWAState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    canInstall: false,
    installPrompt: null,
  });

  useEffect(() => {
    // PWAインストール可能状態の監視
    const handleInstallable = (event: CustomEvent) => {
      setPWAState(prev => ({
        ...prev,
        isInstallable: true,
        canInstall: true,
        installPrompt: event.detail,
      }));
    };

    // PWAインストール完了の監視
    const handleInstalled = () => {
      setPWAState(prev => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
        installPrompt: null,
      }));
    };

    // 既にインストール済みかチェック
    const checkInstallStatus = () => {
      if (typeof window !== 'undefined') {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isInWebAppiOS = (window.navigator as any).standalone === true;
        const isInstalled = isStandalone || isInWebAppiOS;
        
        setPWAState(prev => ({
          ...prev,
          isInstalled,
        }));
      }
    };

    window.addEventListener('pwa-installable', handleInstallable as EventListener);
    window.addEventListener('pwa-installed', handleInstalled);
    
    checkInstallStatus();

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable as EventListener);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const installPWA = async (): Promise<boolean> => {
    if (!pwaState.installPrompt) {
      return false;
    }

    try {
      const result = await pwaState.installPrompt.prompt();
      const outcome = await result.userChoice;
      
      if (outcome === 'accepted') {
        setPWAState(prev => ({
          ...prev,
          isInstalled: true,
          canInstall: false,
          installPrompt: null,
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    }
  };

  return {
    pwaState,
    installPWA,
  };
};
