export interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number | number[];
  requireInteraction?: boolean;
  // actionsプロパティを完全に削除
}

export interface NotificationEventHandlers {
  onclick?: (event: Event) => void;
  onclose?: (event: Event) => void;
  onerror?: (event: Event) => void;
  onshow?: (event: Event) => void;
}

export interface ShowNotificationOptions extends ExtendedNotificationOptions {
  handlers?: NotificationEventHandlers;
}

export interface NotificationStatus {
  permission: NotificationPermission;
  serviceWorkerSupported: boolean;
  pushManagerSupported: boolean;
  notificationSupported: boolean;
  vibrationSupported: boolean;
}

export interface PushSubscriptionData {
  subscription: PushSubscriptionJSON;
  userAgent: string;
  timestamp: number;
  endpoint: string;
}

// LinkSense専用の通知タイプ
export type LinkSenseNotificationType = 'isolation' | 'overwork' | 'sentiment' | 'health';

export interface LinkSenseNotificationData {
  type: LinkSenseNotificationType;
  memberName?: string;
  teamName?: string;
  value: number;
  threshold: number;
  timestamp: number;
}

// 通知テスト用の型
export interface NotificationTestConfig {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'urgent' | 'silent';
  delay?: number;
}