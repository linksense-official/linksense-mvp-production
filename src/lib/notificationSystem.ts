import { pushNotificationService } from '@/lib/pushNotifications';

export interface NotificationRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  channels: string[];
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  source: string;
}

export class NotificationSystem {
  private static instance: NotificationSystem;
  private rules: NotificationRule[] = [];
  private alerts: Alert[] = [];
  
  public static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem();
    }
    return NotificationSystem.instance;
  }

  constructor() {
    this.initializeDefaultRules();
  }

  // デフォルトルールの初期化
  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'isolation-alert',
        name: '24時間孤立アラート',
        condition: 'no_activity_hours',
        threshold: 24,
        enabled: true,
        channels: ['push', 'email']
      },
      {
        id: 'overwork-alert',
        name: '過労検出',
        condition: 'messages_per_day',
        threshold: 50,
        enabled: true,
        channels: ['push', 'slack']
      },
      {
        id: 'sentiment-alert',
        name: 'ネガティブ感情検出',
        condition: 'negative_sentiment_percentage',
        threshold: 70,
        enabled: true,
        channels: ['push', 'email']
      },
      {
        id: 'team-health-alert',
        name: 'チーム健全性低下',
        condition: 'team_health_score',
        threshold: 60,
        enabled: true,
        channels: ['push', 'teams']
      }
    ];
  }

  // ルールの追加
  addRule(rule: Omit<NotificationRule, 'id'>): string {
    const id = `rule-${Date.now()}`;
    this.rules.push({ ...rule, id });
    return id;
  }

  // ルールの更新
  updateRule(id: string, updates: Partial<NotificationRule>): boolean {
    const index = this.rules.findIndex(rule => rule.id === id);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
      return true;
    }
    return false;
  }

  // ルールの削除
  deleteRule(id: string): boolean {
    const index = this.rules.findIndex(rule => rule.id === id);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  // 全ルールの取得
  getRules(): NotificationRule[] {
    return [...this.rules];
  }

  // アラートの作成
  createAlert(type: Alert['type'], title: string, message: string, source: string): string {
    const id = `alert-${Date.now()}`;
    const alert: Alert = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
      acknowledged: false,
      source
    };
    
    this.alerts.unshift(alert);
    
    // プッシュ通知の送信（条件付き）
    if (typeof window !== 'undefined') {
      this.sendPushNotification(alert);
    }
    
    // 最大100件まで保持
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }
    
    return id;
  }

  // プッシュ通知の送信
  private sendPushNotification(alert: Alert): void {
    try {
      switch (alert.type) {
        case 'error':
          pushNotificationService.showErrorNotification(alert.message);
          break;
        case 'warning':
          pushNotificationService.showWarningNotification(alert.message);
          break;
        case 'success':
          pushNotificationService.showSuccessNotification(alert.message);
          break;
        case 'info':
        default:
          pushNotificationService.showInfoNotification(alert.message);
          break;
      }
    } catch (error) {
      console.warn('プッシュ通知の送信に失敗しました:', error);
    }
  }

  // アラートの確認
  acknowledgeAlert(id: string): boolean {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  // 全アラートの取得
  getAlerts(acknowledged?: boolean): Alert[] {
    if (acknowledged !== undefined) {
      return this.alerts.filter(alert => alert.acknowledged === acknowledged);
    }
    return [...this.alerts];
  }

  // 未確認アラート数の取得
  getUnacknowledgedCount(): number {
    return this.alerts.filter(alert => !alert.acknowledged).length;
  }

  // アラートのクリア
  clearAlerts(acknowledgedOnly: boolean = true): void {
    if (acknowledgedOnly) {
      this.alerts = this.alerts.filter(alert => !alert.acknowledged);
    } else {
      this.alerts = [];
    }
  }

  // 条件チェック
  checkConditions(data: any): void {
    this.rules.forEach(rule => {
      if (!rule.enabled) return;
      
      let shouldTrigger = false;
      
      switch (rule.condition) {
        case 'no_activity_hours':
          shouldTrigger = data.inactiveHours >= rule.threshold;
          break;
        case 'messages_per_day':
          shouldTrigger = data.messagesPerDay >= rule.threshold;
          break;
        case 'negative_sentiment_percentage':
          shouldTrigger = data.negativeSentimentPercentage >= rule.threshold;
          break;
        case 'team_health_score':
          shouldTrigger = data.teamHealthScore <= rule.threshold;
          break;
      }
      
      if (shouldTrigger) {
        this.triggerRule(rule, data);
      }
    });
  }

  // ルールのトリガー
  private triggerRule(rule: NotificationRule, data: any): void {
    const now = new Date();
    if (rule.lastTriggered && now.getTime() - rule.lastTriggered.getTime() < 300000) {
      return;
    }
    
    rule.lastTriggered = now;
    
    let alertType: Alert['type'] = 'info';
    let message = '';
    
    switch (rule.condition) {
      case 'no_activity_hours':
        alertType = 'warning';
        message = `${data.memberName || 'メンバー'}が${data.inactiveHours}時間以上アクティブではありません`;
        break;
      case 'messages_per_day':
        alertType = 'error';
        message = `${data.memberName || 'メンバー'}の今日のメッセージ数が${data.messagesPerDay}件に達しました`;
        break;
      case 'negative_sentiment_percentage':
        alertType = 'warning';
        message = `ネガティブ感情の割合が${data.negativeSentimentPercentage}%に達しています`;
        break;
      case 'team_health_score':
        alertType = 'error';
        message = `チーム健全性スコアが${data.teamHealthScore}ポイントまで低下しました`;
        break;
    }
    
    this.createAlert(alertType, rule.name, message, 'system');
  }

  // テスト通知の送信
  sendTestNotification(): void {
    this.createAlert('info', 'テスト通知', 'これはテスト通知です。システムが正常に動作しています。', 'test');
  }

  // 統計情報の取得
  getStatistics(): any {
    const last24Hours = new Date(Date.now() - 86400000);
    const recentAlerts = this.alerts.filter(alert => alert.timestamp > last24Hours);
    
    return {
      totalAlerts: this.alerts.length,
      recentAlerts: recentAlerts.length,
      unacknowledged: this.getUnacknowledgedCount(),
      alertsByType: {
        error: this.alerts.filter(a => a.type === 'error').length,
        warning: this.alerts.filter(a => a.type === 'warning').length,
        info: this.alerts.filter(a => a.type === 'info').length,
        success: this.alerts.filter(a => a.type === 'success').length
      },
      activeRules: this.rules.filter(r => r.enabled).length,
      totalRules: this.rules.length
    };
  }
}

export const notificationSystem = NotificationSystem.getInstance();