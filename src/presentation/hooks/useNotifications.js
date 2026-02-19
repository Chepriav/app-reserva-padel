import { useState, useEffect, useCallback } from 'react';
import { tablonService } from '../../services/bulletinService';

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
    const result = await tablonService.obtenerNotificaciones(userId);
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
    const wasUnread = notifications.find((n) => n.id === notificationId && !n.leida);
    const result = await tablonService.eliminarNotificacion(notificationId);
    if (result.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (wasUnread) onCountChange?.();
    }
    return result;
  };

  const markAsRead = async (notificationId) => {
    const result = await tablonService.marcarNotificacionLeida(notificationId);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, leida: true } : n))
      );
      onCountChange?.();
    }
    return result;
  };

  const markAllAsRead = async () => {
    const result = await tablonService.marcarTodasLeidas(userId);
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
      onCountChange?.();
    }
    return result;
  };

  const countUnread = () => notifications.filter((n) => !n.leida).length;

  return {
    notifications, loading, refreshing,
    loadNotifications, onRefresh,
    deleteNotification, markAsRead, markAllAsRead, countUnread,
  };
}
