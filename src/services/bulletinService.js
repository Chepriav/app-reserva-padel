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

export const tablonService = {
  // ============ USER NOTIFICATIONS ============

  async getNotifications(usuarioId) {
    const result = await getUserNotificationsUC.execute(usuarioId);
    if (!result.success) return { success: true, data: [] }; // non-critical
    return { success: true, data: result.value.map(notificationToLegacy) };
  },

  async countUnreadNotifications(usuarioId) {
    const result = await getUserNotificationsUC.execute(usuarioId);
    if (!result.success) return { success: true, count: 0 };
    const count = result.value.filter((n) => !n.isRead).length;
    return { success: true, count };
  },

  async markNotificationAsRead(notificacionId) {
    const result = await markNotificationAsReadUC.execute(notificacionId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async markAllAsRead(usuarioId) {
    const result = await markAllNotificationsAsReadUC.execute(usuarioId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async deleteNotification(notificacionId) {
    const result = await deleteUserNotificationUC.execute(notificacionId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  /**
   * Creates a notification entry in the bulletin.
   * Accepts Spanish tipo strings (from notificationService.js legacy calls)
   * or domain English strings.
   */
  async createNotification(usuarioId, tipo, titulo, mensaje, datos = {}) {
    const domainType = notificationTypeToDomain(tipo); // translates Spanish → domain

    const result = await createUserNotificationUC.execute({
      userId: usuarioId,
      type: domainType,
      title: titulo,
      message: mensaje,
      data: datos,
    });
    if (!result.success) return toFail(result.error);
    return { success: true, data: notificationToLegacy(result.value) };
  },

  // ============ ANNOUNCEMENTS (user read) ============

  async getAnnouncementsForUser(usuarioId) {
    const result = await getAnnouncementsForUserUC.execute(usuarioId);
    if (!result.success) return { success: true, data: [] }; // non-critical
    return { success: true, data: result.value.map(announcementToLegacy) };
  },

  async countUnreadAnnouncements(usuarioId) {
    const result = await getAnnouncementsForUserUC.execute(usuarioId);
    if (!result.success) return { success: true, count: 0 };
    const count = result.value.filter((a) => !a.isRead).length;
    return { success: true, count };
  },

  async markAnnouncementAsRead(anuncioId, usuarioId) {
    const result = await markAnnouncementAsReadUC.execute(anuncioId, usuarioId);
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
    creadorId,
    creadorNombre,
    titulo,
    mensaje,
    tipo = 'info',
    destinatarios = 'todos',
    usuariosIds = [],
  ) {
    const result = await createAnnouncementUC.execute({
      creatorId: creadorId,
      creatorName: creadorNombre,
      title: titulo,
      message: mensaje,
      type: announcementTypeToDomain(tipo),
      recipients: recipientsToDomain(destinatarios),
      userIds: usuariosIds,
    });

    if (!result.success) return toFail(result.error);
    return {
      success: true,
      data: announcementToLegacy(result.value.announcement),
      usuariosIds: result.value.recipientIds,
    };
  },

  async deleteAnnouncement(anuncioId) {
    const result = await deleteAnnouncementUC.execute(anuncioId);
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
        nombre: u.name,
        vivienda: u.apartment,
        email: u.email,
      })),
    };
  },

  // ============================================================================
  // LEGACY ALIASES - For backwards compatibility
  // ============================================================================
  obtenerNotificaciones(...args) { return this.getNotifications(...args); },
  contarNotificacionesNoLeidas(...args) { return this.countUnreadNotifications(...args); },
  marcarNotificacionLeida(...args) { return this.markNotificationAsRead(...args); },
  marcarTodasLeidas(...args) { return this.markAllAsRead(...args); },
  eliminarNotificacion(...args) { return this.deleteNotification(...args); },
  crearNotificacion(...args) { return this.createNotification(...args); },
  obtenerAnunciosParaUsuario(...args) { return this.getAnnouncementsForUser(...args); },
  contarAnunciosNoLeidos(...args) { return this.countUnreadAnnouncements(...args); },
  marcarAnuncioLeido(...args) { return this.markAnnouncementAsRead(...args); },
  obtenerTodosAnuncios(...args) { return this.getAllAnnouncements(...args); },
  crearAnuncio(...args) { return this.createAnnouncement(...args); },
  eliminarAnuncio(...args) { return this.deleteAnnouncement(...args); },
  obtenerUsuariosAprobados(...args) { return this.getApprovedUsers(...args); },
};

// Re-export with English name
export { tablonService as bulletinService };
