'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { APIResponse } from '@/types/api';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

interface UseGlobalNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export const useGlobalNotifications = (): UseGlobalNotificationsReturn => {
  const { user, isAuthenticated, isLoading } = useAuth(); // authState削除
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 通知の取得
  const fetchNotifications = async () => {
    if (!isAuthenticated || isLoading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: APIResponse<Notification[]> = await apiClient.get('/notifications');

      if (response.success && response.data) {
        setNotifications(Array.isArray(response.data) ? response.data : []);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : '通知の取得に失敗しました';
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '通知の取得中にエラーが発生しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 初期化時とユーザー認証状態変更時に通知を取得
  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated, isLoading]);

  // 定期的な通知更新（5分ごと）
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000); // 5分

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // 既読マーク
  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      const response: APIResponse = await apiClient.patch(`/notifications/${notificationId}/read`);

      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : '既読マークに失敗しました';
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '既読マーク中にエラーが発生しました';
      setError(errorMessage);
    }
  };

  // 全て既読にする
  const markAllAsRead = async (): Promise<void> => {
    try {
      const response: APIResponse = await apiClient.patch('/notifications/read-all');

      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : '一括既読マークに失敗しました';
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '一括既読マーク中にエラーが発生しました';
      setError(errorMessage);
    }
  };

  // 通知削除
  const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
      const response: APIResponse = await apiClient.delete(`/notifications/${notificationId}`);

      if (response.success) {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : '通知の削除に失敗しました';
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '通知削除中にエラーが発生しました';
      setError(errorMessage);
    }
  };

  // 通知更新
  const refreshNotifications = async (): Promise<void> => {
    await fetchNotifications();
  };

  // 未読数の計算
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };
};

export default useGlobalNotifications;