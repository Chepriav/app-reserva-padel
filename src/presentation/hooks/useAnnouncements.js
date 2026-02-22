import { useState, useEffect, useCallback } from 'react';
import { bulletinService } from '../../services/bulletinService';

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
    const result = await bulletinService.getAnnouncementsForUser(userId);
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
    if (!announcement.read) {
      const result = await bulletinService.markAnnouncementRead(announcement.id, userId);
      if (result.success) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === announcement.id ? { ...a, read: true } : a))
        );
        setSelectedAnnouncement((prev) => (prev ? { ...prev, read: true } : null));
        onCountChange?.();
      }
    }
  };

  const closeAnnouncement = async () => {
    const current = selectedAnnouncement;
    setSelectedAnnouncement(null);

    if (current && !current.read && userId) {
      const result = await bulletinService.markAnnouncementRead(current.id, userId);
      if (result.success) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === current.id ? { ...a, read: true } : a))
        );
        onCountChange?.();
      }
    }
  };
  const countUnread = () => announcements.filter((a) => !a.read).length;

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
    const result = await bulletinService.getAllAnnouncements();
    if (result.success) setAnnouncements(result.data);
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    const result = await bulletinService.getApprovedUsers();
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
      await bulletinService.markAnnouncementRead(current.id, userId);
      onCountChange?.();
    }
  };
  const countUnread = () => 0;

  const createAnnouncement = async (announcementData) => {
    setCreating(true);
    const result = await bulletinService.createAnnouncement(
      userId,
      announcementData.userName || 'Admin',
      announcementData.title,
      announcementData.message,
      announcementData.type,
      announcementData.recipients,
      announcementData.usersIds
    );

    if (result.success) {
      try {
        const { notificationService } = require('../../services/notificationService');
        await notificationService.notifyNuevoAnnouncement(
          announcementData.title,
          announcementData.message,
          result.data.id,
          announcementData.recipients === 'todos' ? undefined : announcementData.usersIds
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
    const result = await bulletinService.deleteAnnouncement(announcementId);
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
