import { useState, useEffect, useCallback } from 'react';
import { bulletinService } from '../../services/bulletinService';

/**
 * Hook to manage user notifications (inbox tab)
 */
export function useNotifications(userId, onCountChange) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const result = await bulletinService.getNotifications(userId);
    if (result.success) setNotifications(result.data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const deleteNotification = async (notificationId) => {
    const wasUnread = notifications.find((n) => n.id === notificationId && !n.read);
    const result = await bulletinService.deleteNotification(notificationId);
    if (result.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (wasUnread) onCountChange?.();
    }
    return result;
  };

  const markAsRead = async (notificationId) => {
    const result = await bulletinService.markNotificationRead(notificationId);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      onCountChange?.();
    }
    return result;
  };

  const markAllAsRead = async () => {
    const result = await bulletinService.markTodasRead(userId);
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      onCountChange?.();
    }
    return result;
  };

  const countUnread = () => notifications.filter((n) => !n.read).length;

  return {
    notifications, loading, refreshing,
    loadNotifications, onRefresh,
    deleteNotification, markAsRead, markAllAsRead, countUnread,
  };
}
