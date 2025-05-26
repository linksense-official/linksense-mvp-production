// src/types/pwa.ts
export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isSupported: boolean;
}

export interface PWAActions {
  install: () => Promise<void>;
  checkInstallability: () => void;
}

// AppNotificationに名前変更（ブラウザのNotificationと区別）
export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface UsePWAReturn extends PWAState, PWAActions {}

// 旧名称のエクスポートも残す（互換性のため）
export type PWANotification = AppNotification;