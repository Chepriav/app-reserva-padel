/**
 * bulletinService — thin facade delegating to domain use cases.
 * Maintains the original API shape for backward compatibility.
 *
 * NOTE: createNotification() still accepts Spanish tipo strings because
 * notificationService.js (Phase 6) calls it with DB-format values.
 * The facade translates them to domain types before calling the use case.
 */
import {
  getUserNotifications as getUserNotificationsUC,
  createUserNotification as createUserNotificationUC,
  markNotificationAsRead as markNotificationAsReadUC,
  markAllNotificationsAsRead as markAllNotificationsAsReadUC,
  deleteUserNotification as deleteUserNotificationUC,
  getAnnouncementsForUser as getAnnouncementsForUserUC,
  markAnnouncementAsRead as markAnnouncementAsReadUC,
  getAllAnnouncements as getAllAnnouncementsUC,
  createAnnouncement as createAnnouncementUC,
  deleteAnnouncement as deleteAnnouncementUC,
  getAllApprovedUsers,
} from '@di/container';
import {
  toLegacyFormat as notificationToLegacy,
  notificationTypeToDomain,
} from '@infrastructure/supabase/mappers/userNotificationMapper';
import {
  toLegacyFormat as announcementToLegacy,
  announcementTypeToDomain,
  recipientsToDomain,
} from '@infrastructure/supabase/mappers/announcementMapper';

// ---- Error translation ----

function toFail(appError) {
  return { success: false, error: appError?.message ?? 'Error inesperado' };
}

export const bulletinService = {
  // ============ USER NOTIFICATIONS ============

  async getNotifications(userId) {
    const result = await getUserNotificationsUC.execute(userId);
    if (!result.success) return { success: true, data: [] }; // non-critical
    return { success: true, data: result.value.map(notificationToLegacy) };
  },

  async countUnreadNotifications(userId) {
    const result = await getUserNotificationsUC.execute(userId);
    if (!result.success) return { success: true, count: 0 };
    const count = result.value.filter((n) => !n.isRead).length;
    return { success: true, count };
  },

  async markNotificationAsRead(notificationId) {
    const result = await markNotificationAsReadUC.execute(notificationId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async markAllAsRead(userId) {
    const result = await markAllNotificationsAsReadUC.execute(userId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async deleteNotification(notificationId) {
    const result = await deleteUserNotificationUC.execute(notificationId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  /**
   * Creates a notification entry in the bulletin.
   * Accepts Spanish tipo strings (from notificationService.js legacy calls)
   * or domain English strings.
   */
  async createNotification(userId, type, title, message, data = {}) {
    const domainType = notificationTypeToDomain(type); // translates Spanish → domain

    const result = await createUserNotificationUC.execute({
      userId: userId,
      type: domainType,
      title: title,
      message: message,
      data: data,
    });
    if (!result.success) return toFail(result.error);
    return { success: true, data: notificationToLegacy(result.value) };
  },

  // ============ ANNOUNCEMENTS (user read) ============

  async getAnnouncementsForUser(userId) {
    const result = await getAnnouncementsForUserUC.execute(userId);
    if (!result.success) return { success: true, data: [] }; // non-critical
    return { success: true, data: result.value.map(announcementToLegacy) };
  },

  async countUnreadAnnouncements(userId) {
    const result = await getAnnouncementsForUserUC.execute(userId);
    if (!result.success) return { success: true, count: 0 };
    const count = result.value.filter((a) => !a.isRead).length;
    return { success: true, count };
  },

  async markAnnouncementAsRead(announcementId, userId) {
    const result = await markAnnouncementAsReadUC.execute(announcementId, userId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  // ============ ANNOUNCEMENTS (admin management) ============

  async getAllAnnouncements() {
    const result = await getAllAnnouncementsUC.execute();
    if (!result.success) return { success: true, data: [] };
    return { success: true, data: result.value.map(announcementToLegacy) };
  },

  async createAnnouncement(
    creatorId,
    creatorName,
    title,
    message,
    type = 'info',
    recipients = 'todos',
    usersIds = [],
  ) {
    const result = await createAnnouncementUC.execute({
      creatorId: creatorId,
      creatorName: creatorName,
      title: title,
      message: message,
      type: announcementTypeToDomain(type),
      recipients: recipientsToDomain(recipients),
      userIds: usersIds,
    });

    if (!result.success) return toFail(result.error);
    return {
      success: true,
      data: announcementToLegacy(result.value.announcement),
      usersIds: result.value.recipientIds,
    };
  },

  async deleteAnnouncement(announcementId) {
    const result = await deleteAnnouncementUC.execute(announcementId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async getApprovedUsers() {
    // Reuse existing User domain use case — returns domain User[]
    const result = await getAllApprovedUsers.execute();
    if (!result.success) return toFail(result.error);
    return {
      success: true,
      data: result.value.map((u) => ({
        id: u.id,
        name: u.name,
        apartment: u.apartment,
        email: u.email,
      })),
    };
  },

  // ============================================================================
  // LEGACY ALIASES - For backwards compatibility
  // ============================================================================
  markNotificationRead(...args) { return this.markNotificationAsRead(...args); },
  markTodasRead(...args) { return this.markAllAsRead(...args); },
  markAnnouncementRead(...args) { return this.markAnnouncementAsRead(...args); },
  getTodosAnnouncements(...args) { return this.getAllAnnouncements(...args); },
  getUsersAprobados(...args) { return this.getApprovedUsers(...args); },
};
