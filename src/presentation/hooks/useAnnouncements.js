import { useState, useEffect, useCallback } from 'react';
import { tablonService } from '../../services/bulletinService';

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
    if (result.success) setAnnouncements(result.data);
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
    if (!announcement.leido) {
      const result = await tablonService.marcarAnuncioLeido(announcement.id, userId);
      if (result.success) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === announcement.id ? { ...a, leido: true } : a))
        );
        setSelectedAnnouncement((prev) => (prev ? { ...prev, leido: true } : null));
        onCountChange?.();
      }
    }
  };

  const closeAnnouncement = async () => {
    const current = selectedAnnouncement;
    setSelectedAnnouncement(null);

    if (current && !current.leido && userId) {
      const result = await tablonService.marcarAnuncioLeido(current.id, userId);
      if (result.success) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === current.id ? { ...a, leido: true } : a))
        );
        onCountChange?.();
      }
    }
  };
  const countUnread = () => announcements.filter((a) => !a.leido).length;

  return {
    announcements, loading, refreshing, selectedAnnouncement,
    loadAnnouncements, onRefresh, viewAnnouncement, closeAnnouncement, countUnread,
  };
}

/**
 * Hook for admin announcement management
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
    if (result.success) setAnnouncements(result.data);
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    const result = await tablonService.obtenerUsuariosAprobados();
    if (result.success) setUsers(result.data);
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

  const viewAnnouncement = (announcement) => setSelectedAnnouncement(announcement);
  const closeAnnouncement = async () => {
    const current = selectedAnnouncement;
    setSelectedAnnouncement(null);

    if (current && userId) {
      await tablonService.marcarAnuncioLeido(current.id, userId);
      onCountChange?.();
    }
  };
  const countUnread = () => 0;

  const createAnnouncement = async (announcementData) => {
    setCreating(true);
    const result = await tablonService.crearAnuncio(
      userId,
      announcementData.userName || 'Admin',
      announcementData.titulo,
      announcementData.mensaje,
      announcementData.tipo,
      announcementData.destinatarios,
      announcementData.usuariosIds
    );

    if (result.success) {
      try {
        const { notificationService } = require('../../services/notificationService');
        await notificationService.notifyNuevoAnuncio(
          announcementData.titulo,
          announcementData.mensaje,
          result.data.id,
          announcementData.destinatarios === 'todos' ? undefined : announcementData.usuariosIds
        );
      } catch (notifError) {
        console.error('[useAnnouncements] Notification error:', notifError);
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
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
      onCountChange?.();
    }
    return result;
  };

  return {
    announcements, users, loading, refreshing, creating, selectedAnnouncement,
    loadAnnouncements, loadUsers, onRefresh,
    viewAnnouncement, closeAnnouncement, countUnread,
    createAnnouncement, deleteAnnouncement,
  };
}
