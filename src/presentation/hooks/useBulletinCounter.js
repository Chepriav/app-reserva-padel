import { useState, useEffect, useCallback } from 'react';
import { tablonService } from '../../services/bulletinService';

// Singleton to share updateCounts across components
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
    if (announcementsResult.success) setAnnouncementCount(announcementsResult.count);
    if (notifResult.success) setNotificationCount(notifResult.count);
  }, [userId]);

  // Store global reference so refreshBulletinBadge() can call it
  useEffect(() => {
    globalUpdateCounts = updateCounts;
    return () => { globalUpdateCounts = null; };
  }, [updateCounts]);

  useEffect(() => {
    updateCounts();
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
 * Trigger badge update from anywhere (e.g., after creating an announcement)
 */
export function refreshBulletinBadge() {
  globalUpdateCounts?.();
}
