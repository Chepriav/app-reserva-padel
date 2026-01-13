import { useState, useEffect, useCallback } from 'react';
import { tablonService } from '../services/bulletinService';

/**
 * Hook to manage user notifications
 */
export function useNotifications(userId, onCountChange) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const result = await tablonService.obtenerNotificaciones(userId);
    if (result.success) {
      setNotifications(result.data);
    }
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
    const wasUnread = notifications.find(n => n.id === notificationId && !n.leida);
    const result = await tablonService.eliminarNotificacion(notificationId);
    if (result.success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (wasUnread) onCountChange?.();
    }
    return result;
  };

  const markAsRead = async (notificationId) => {
    const result = await tablonService.marcarNotificacionLeida(notificationId);
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, leida: true } : n)
      );
      onCountChange?.();
    }
    return result;
  };

  const markAllAsRead = async () => {
    const result = await tablonService.marcarTodasLeidas(userId);
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
      onCountChange?.();
    }
    return result;
  };

  const countUnread = () => {
    return notifications.filter(n => !n.leida).length;
  };

  return {
    notifications,
    loading,
    refreshing,
    loadNotifications,
    onRefresh,
    deleteNotification,
    markAsRead,
    markAllAsRead,
    countUnread,
  };
}

/**
 * Hook to manage announcements (user view)
 */
export function useAnnouncements(userId, onCountChange) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const loadAnnouncements = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const result = await tablonService.obtenerAnunciosParaUsuario(userId);
    if (result.success) {
      setAnnouncements(result.data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  };

  const viewAnnouncement = async (announcement) => {
    setSelectedAnnouncement(announcement);

    // Mark as read if not already
    if (!announcement.leido) {
      const result = await tablonService.marcarAnuncioLeido(announcement.id, userId);
      if (result.success) {
        setAnnouncements(prev =>
          prev.map(a => a.id === announcement.id ? { ...a, leido: true } : a)
        );
        // Also update the selected announcement
        setSelectedAnnouncement(prev => prev ? { ...prev, leido: true } : null);
        onCountChange?.();
      }
    }
  };

  const closeAnnouncement = () => {
    setSelectedAnnouncement(null);
  };

  const countUnread = () => {
    return announcements.filter(a => !a.leido).length;
  };

  return {
    announcements,
    loading,
    refreshing,
    selectedAnnouncement,
    loadAnnouncements,
    onRefresh,
    viewAnnouncement,
    closeAnnouncement,
    countUnread,
  };
}

/**
 * Hook for admin actions (announcement management)
 */
export function useAnnouncementsAdmin(userId, onCountChange) {
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    const result = await tablonService.obtenerTodosAnuncios();
    if (result.success) {
      setAnnouncements(result.data);
    }
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    const result = await tablonService.obtenerUsuariosAprobados();
    if (result.success) {
      setUsers(result.data);
    }
    return result;
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  };

  const viewAnnouncement = async (announcement) => {
    setSelectedAnnouncement(announcement);
    // Admin doesn't need to mark as read
  };

  const closeAnnouncement = () => {
    setSelectedAnnouncement(null);
  };

  const countUnread = () => {
    // Admin sees all announcements, not just unread
    return 0;
  };

  const createAnnouncement = async (announcementData) => {
    setCreating(true);

    const result = await tablonService.crearAnuncio(
      userId,
      announcementData.userName || 'Admin',
      announcementData.title,
      announcementData.message,
      announcementData.type,
      announcementData.recipients,
      announcementData.userIds
    );

    if (result.success) {
      // Send push notification
      const { notificationService } = require('../services/notificationService');

      if (announcementData.recipients === 'todos') {
        await notificationService.notifyNuevoAnuncio(
          announcementData.title,
          announcementData.message,
          result.data.id
        );
      } else {
        await notificationService.notifyNuevoAnuncio(
          announcementData.title,
          announcementData.message,
          result.data.id,
          announcementData.userIds
        );
      }

      await loadAnnouncements();
      onCountChange?.();
    }

    setCreating(false);
    return result;
  };

  const deleteAnnouncement = async (announcementId) => {
    const result = await tablonService.eliminarAnuncio(announcementId);
    if (result.success) {
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      onCountChange?.();
    }
    return result;
  };

  return {
    announcements,
    users,
    loading,
    refreshing,
    creating,
    selectedAnnouncement,
    loadAnnouncements,
    loadUsers,
    onRefresh,
    viewAnnouncement,
    closeAnnouncement,
    countUnread,
    createAnnouncement,
    deleteAnnouncement,
  };
}

// Singleton para compartir el updateCounts entre componentes
let globalUpdateCounts = null;

/**
 * Hook to count unread notifications/announcements (for tab badge)
 */
export function useBulletinCounter(userId) {
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const updateCounts = useCallback(async () => {
    if (!userId) return;

    const [announcementsResult, notifResult] = await Promise.all([
      tablonService.contarAnunciosNoLeidos(userId),
      tablonService.contarNotificacionesNoLeidas(userId),
    ]);

    if (announcementsResult.success) {
      setAnnouncementCount(announcementsResult.count);
    }
    if (notifResult.success) {
      setNotificationCount(notifResult.count);
    }
  }, [userId]);

  // Guardar referencia global para poder llamar desde otros componentes
  useEffect(() => {
    globalUpdateCounts = updateCounts;
    return () => { globalUpdateCounts = null; };
  }, [updateCounts]);

  useEffect(() => {
    updateCounts();

    // Update every 15 seconds (reduced from 30)
    const interval = setInterval(updateCounts, 15000);
    return () => clearInterval(interval);
  }, [updateCounts]);

  return {
    announcementCount,
    notificationCount,
    totalCount: announcementCount + notificationCount,
    updateCounts,
  };
}

/**
 * Function to trigger badge update from anywhere
 */
export function refreshBulletinBadge() {
  globalUpdateCounts?.();
}
