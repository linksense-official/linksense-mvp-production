// src/lib/pushNotifications.ts
import type { 
  ExtendedNotificationOptions,
  NotificationEventHandlers,
  ShowNotificationOptions
} from '@/types/notifications';

export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.log('このブラウザはService Workerをサポートしていません');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker が正常に登録されました');
      
      this.registration.addEventListener('updatefound', () => {
        console.log('新しいService Workerが見つかりました');
      });

      return true;
    } catch (error) {
      console.error('Service Worker の登録に失敗しました:', error);
      return false;
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('このブラウザは通知をサポートしていません');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('通知が拒否されています。ブラウザの設定から許可してください。');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('通知許可の要求に失敗しました:', error);
      return false;
    }
  }

  async subscribeToNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service Worker が登録されていません');
      return null;
    }

    try {
      const existingSubscription = await this.registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('既存のサブスクリプションを使用します');
        return existingSubscription;
      }

      const dummyKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI8YlOu_Ym_NkNpQ1WNW1iS6Yp1zKy-Q8Y8YmXeWyNK5M5Oj6vKlGW3Q1o';
      const applicationServerKey = this.urlBase64ToUint8Array(dummyKey);
      
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      await this.sendSubscriptionToServer(subscription);
      console.log('プッシュ通知の購読が完了しました');
      return subscription;
    } catch (error) {
      console.error('プッシュ通知の購読に失敗しました:', error);
      return null;
    }
  }

  showLocalNotification(title: string, options: ShowNotificationOptions = {}): Notification | null {
    if (Notification.permission !== 'granted') {
      console.warn('通知の許可がありません');
      return null;
    }

    try {
      const supportsVibrate = 'vibrate' in navigator;
      const { handlers, vibrate, requireInteraction, ...standardOptions } = options;
      
      const finalOptions: NotificationOptions = {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...standardOptions
      };

      if (requireInteraction !== undefined) {
        (finalOptions as any).requireInteraction = requireInteraction;
      }

      const notification = new Notification(title, finalOptions);

      if (handlers) {
        if (handlers.onclick) {
          notification.onclick = handlers.onclick;
        } else {
          notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            notification.close();
          };
        }

        if (handlers.onclose) {
          notification.onclose = handlers.onclose;
        }

        if (handlers.onerror) {
          notification.onerror = handlers.onerror;
        }

        if (handlers.onshow) {
          notification.onshow = handlers.onshow;
        }
      } else {
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          notification.close();
        };

        notification.onclose = () => {
          console.log('通知が閉じられました');
        };

        notification.onerror = (event) => {
          console.error('通知エラー:', event);
        };
      }

      if (supportsVibrate && vibrate) {
        navigator.vibrate(vibrate);
      }

      return notification;
    } catch (error) {
      console.error('通知の表示に失敗しました:', error);
      return null;
    }
  }

  showSuccessNotification(message: string, customHandlers?: NotificationEventHandlers) {
    return this.showLocalNotification('✅ 成功', {
      body: message,
      icon: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      tag: 'success',
      handlers: {
        onclick: (event) => {
          event.preventDefault();
          window.focus();
          console.log('成功通知がクリックされました');
          (event.target as Notification).close();
        },
        ...customHandlers
      }
    });
  }

  showErrorNotification(message: string, customHandlers?: NotificationEventHandlers) {
    return this.showLocalNotification('❌ エラー', {
      body: message,
      icon: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'error',
      requireInteraction: true,
      handlers: {
        onclick: (event) => {
          event.preventDefault();
          window.focus();
          console.log('エラー通知がクリックされました');
          (event.target as Notification).close();
        },
        ...customHandlers
      }
    });
  }

  showWarningNotification(message: string, customHandlers?: NotificationEventHandlers) {
    return this.showLocalNotification('⚠️ 警告', {
      body: message,
      icon: '/icons/icon-192x192.png',
      vibrate: [150, 75, 150],
      tag: 'warning',
      handlers: {
        onclick: (event) => {
          event.preventDefault();
          window.focus();
          console.log('警告通知がクリックされました');
          (event.target as Notification).close();
        },
        ...customHandlers
      }
    });
  }

  showInfoNotification(message: string, customHandlers?: NotificationEventHandlers) {
    return this.showLocalNotification('ℹ️ 情報', {
      body: message,
      icon: '/icons/icon-192x192.png',
      vibrate: [100],
      tag: 'info',
      handlers: {
        onclick: (event) => {
          event.preventDefault();
          window.focus();
          console.log('情報通知がクリックされました');
          (event.target as Notification).close();
        },
        ...customHandlers
      }
    });
  }

  showIsolationAlert(memberName: string, hours: number) {
    return this.showWarningNotification(
      `${memberName}さんが${hours}時間以上連絡を取っていません。`,
      {
        onclick: (event) => {
          event.preventDefault();
          window.focus();
          if (typeof window !== 'undefined') {
            window.location.href = `/dashboard?member=${encodeURIComponent(memberName)}`;
          }
          (event.target as Notification).close();
        }
      }
    );
  }

  showOverworkAlert(memberName: string, messageCount: number) {
    return this.showErrorNotification(
      `${memberName}さんの今日のメッセージ数が${messageCount}件に達しました。`,
      {
        onclick: (event) => {
          event.preventDefault();
          window.focus();
          if (typeof window !== 'undefined') {
            window.location.href = `/dashboard?analysis=overwork&member=${encodeURIComponent(memberName)}`;
          }
          (event.target as Notification).close();
        }
      }
    );
  }

  showSentimentAlert(teamName: string, negativePercentage: number) {
    return this.showWarningNotification(
      `${teamName}チームのネガティブ感情が${negativePercentage}%に達しています。`,
      {
        onclick: (event) => {
          event.preventDefault();
          window.focus();
          if (typeof window !== 'undefined') {
            window.location.href = `/dashboard?analysis=sentiment&team=${encodeURIComponent(teamName)}`;
          }
          (event.target as Notification).close();
        }
      }
    );
  }

  showTeamHealthAlert(teamName: string, healthScore: number) {
    return this.showErrorNotification(
      `${teamName}チームの健全性スコアが${healthScore}ポイントまで低下しました。`,
      {
        onclick: (event) => {
          event.preventDefault();
          window.focus();
          if (typeof window !== 'undefined') {
            window.location.href = `/dashboard?analysis=health&team=${encodeURIComponent(teamName)}`;
          }
          (event.target as Notification).close();
        }
      }
    );
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('開発環境: サブスクリプション情報', subscription.toJSON());
        return;
      }

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          endpoint: subscription.endpoint
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('サブスクリプション情報をサーバーに送信しました:', result);
    } catch (error) {
      console.error('サブスクリプション送信エラー:', error);
    }
  }

  async unsubscribeFromNotifications(): Promise<boolean> {
    if (!this.registration) {
      console.error('Service Worker が登録されていません');
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        const successful = await subscription.unsubscribe();
        if (successful) {
          console.log('プッシュ通知の購読を解除しました');
          await this.notifyServerUnsubscription(subscription);
        }
        return successful;
      }
      return true;
    } catch (error) {
      console.error('プッシュ通知の購読解除に失敗しました:', error);
      return false;
    }
  }

  private async notifyServerUnsubscription(subscription: PushSubscription) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('開発環境: 購読解除', subscription.endpoint);
        return;
      }

      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        }),
      });
    } catch (error) {
      console.error('購読解除の通知に失敗しました:', error);
    }
  }

  getNotificationStatus() {
    return {
      permission: Notification.permission,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      pushManagerSupported: 'PushManager' in window,
      notificationSupported: 'Notification' in window,
      vibrationSupported: 'vibrate' in navigator
    };
  }

  clearAllNotifications() {
    if ('serviceWorker' in navigator && this.registration) {
      this.registration.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close());
        console.log(`${notifications.length}件の通知をクリアしました`);
      });
    }
  }

  clearNotificationsByTag(tag: string) {
    if ('serviceWorker' in navigator && this.registration) {
      this.registration.getNotifications({ tag }).then(notifications => {
        notifications.forEach(notification => notification.close());
        console.log(`タグ"${tag}"の${notifications.length}件の通知をクリアしました`);
      });
    }
  }

  testAllNotificationTypes() {
    console.log('全種類の通知テストを開始します...');
    
    setTimeout(() => this.showSuccessNotification('成功通知のテストです'), 1000);
    setTimeout(() => this.showWarningNotification('警告通知のテストです'), 2000);
    setTimeout(() => this.showErrorNotification('エラー通知のテストです'), 3000);
    setTimeout(() => this.showInfoNotification('情報通知のテストです'), 4000);
    setTimeout(() => this.showIsolationAlert('田中太郎', 25), 5000);
    setTimeout(() => this.showOverworkAlert('佐藤花子', 75), 6000);
    setTimeout(() => this.showSentimentAlert('開発チーム', 78), 7000);
    setTimeout(() => this.showTeamHealthAlert('マーケティングチーム', 45), 8000);
  }
}

export const pushNotificationService = new PushNotificationService();
export type { ShowNotificationOptions, NotificationEventHandlers };