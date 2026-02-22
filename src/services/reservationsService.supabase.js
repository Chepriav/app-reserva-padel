/**
 * Reservations Service — FACADE
 *
 * Delegates to domain use cases while maintaining the legacy API.
 * Consumers (hooks, screens, context) need zero changes.
 */
import {
  getCourts,
  getReservationsByApartment,
  getReservationsByDate,
  getUserReservations,
  getAllReservations,
  getReservationStatistics,
  getActiveApartmentReservations,
  getAvailability,
  getBlockouts,
  getPendingDisplacementNotifications,
  markDisplacementNotificationsRead,
  getConversionInfo,
  recalculateApartmentConversions,
  deleteBlockout,
  createReservation,
  cancelReservation,
  createBlockout,
} from '../di/container';
import {
  toLegacyFormat as reservationToLegacy,
  fromLegacyCreateData,
} from '../infrastructure/supabase/mappers/reservationMapper';
import { toLegacyFormat as courtToLegacy } from '../infrastructure/supabase/mappers/courtMapper';
import { toLegacyFormat as blockoutToLegacy } from '../infrastructure/supabase/mappers/blockoutMapper';
import { toLegacyFormat as availabilityToLegacy } from '../infrastructure/supabase/mappers/availabilityMapper';
import { toLegacyFormat as notificationToLegacy } from '../infrastructure/supabase/mappers/displacementNotificationMapper';

/**
 * Translates domain AppError to Spanish user-facing message.
 */
const ERROR_MESSAGES = {
  DISPLACEMENT_REQUIRED: null, // handled separately
  RESERVATION_LIMIT_EXCEEDED: 'Tu vivienda ya tiene el máximo de reservas activas',
  RESERVATION_SLOT_UNAVAILABLE: 'El horario seleccionado no está disponible',
  RESERVATION_TOO_EARLY: 'No se puede reservar con tan poca anticipación',
  RESERVATION_TOO_FAR_AHEAD: 'No se puede reservar con tanta anticipación',
  RESERVATION_NOT_FOUND: 'Reserva no encontrada',
  RESERVATION_ALREADY_CANCELLED: 'Esta reserva ya fue cancelada',
  RESERVATION_PERMISSION_ERROR: 'No tienes permisos para esta operación',
  COURT_NOT_FOUND: 'Pista no encontrada',
  BLOCKOUT_CONFLICT: 'Este horario ya está bloqueado',
  BLOCKOUT_NOT_FOUND: 'Bloqueo no encontrado',
  INFRASTRUCTURE_ERROR: 'Error del servidor. Intenta de nuevo',
};

const translateError = (error) => {
  return ERROR_MESSAGES[error?.code] || error?.message || 'Ha ocurrido un error. Intenta de nuevo';
};

export const reservationsService = {
  /**
   * Gets the list of available courts
   */
  async getCourts() {
    const result = await getCourts.execute();
    if (!result.success) {
      return { success: false, error: translateError(result.error) };
    }
    return { success: true, data: result.value.map(courtToLegacy) };
  },

  /**
   * Gets reservations for a specific user
   */
  async getUserReservations(userId) {
    const result = await getUserReservations.execute(userId);
    if (!result.success) {
      return { success: false, error: 'Error al obtener tus reservas' };
    }
    return { success: true, data: result.value.map(reservationToLegacy) };
  },

  /**
   * Gets reservations for a specific apartment
   */
  async getReservationsByApartment(apartment) {
    const result = await getReservationsByApartment.execute(apartment);
    if (!result.success) {
      return { success: false, error: 'Error al obtener reservas de la vivienda' };
    }
    return { success: true, data: result.value.map(reservationToLegacy) };
  },

  /**
   * Gets confirmed reservations for a specific date
   */
  async getReservationsByDate(date) {
    const result = await getReservationsByDate.execute(date);
    if (!result.success) {
      return { success: false, error: 'Error al obtener disponibilidad' };
    }
    return { success: true, data: result.value.map(reservationToLegacy) };
  },

  /**
   * Gets schedule availability for a court on a specific date
   */
  async getAvailability(courtId, date) {
    const result = await getAvailability.execute(courtId, date);
    if (!result.success) {
      return { success: false, error: 'Error al verificar disponibilidad' };
    }
    return { success: true, data: result.value.map(availabilityToLegacy) };
  },

  /**
   * Gets active future reservations for an apartment
   */
  async getActiveApartmentReservations(apartment) {
    const result = await getActiveApartmentReservations.execute(apartment);
    if (!result.success) return [];
    return result.value.map(reservationToLegacy);
  },

  /**
   * Determines what priority a new reservation will have
   */
  async getPriorityForNewReservation(apartment) {
    const result = await getActiveApartmentReservations.execute(apartment);
    if (!result.success) return 'guaranteed';

    const count = result.value.length;
    if (count === 0) return 'guaranteed';
    if (count === 1) return 'provisional';
    return null;
  },

  /**
   * Displaces a secondary reservation (legacy facade — direct call)
   * @deprecated Use createReservation with forceDisplacement instead
   */
  async displaceReservation(reservationToDisplace, displacingApartment) {
    const { displaceReservation: displace } = await import('../di/container');
    const { toDomain } = await import('../infrastructure/supabase/mappers/reservationMapper');

    // Convert legacy format to domain entity
    const domainReservation = {
      id: reservationToDisplace.id,
      courtId: reservationToDisplace.courtId,
      courtName: reservationToDisplace.courtName,
      userId: reservationToDisplace.userId,
      userName: reservationToDisplace.userName,
      apartment: reservationToDisplace.apartment,
      date: reservationToDisplace.date,
      startTime: reservationToDisplace.startTime,
      endTime: reservationToDisplace.endTime,
      duration: reservationToDisplace.duration || 30,
      status: 'confirmed',
      priority: 'provisional',
      players: reservationToDisplace.players || [],
      conversionTimestamp: null,
      conversionRule: null,
      convertedAt: null,
      createdAt: reservationToDisplace.createdAt || '',
      updatedAt: reservationToDisplace.updatedAt || '',
    };

    const result = await displace.execute(domainReservation, displacingApartment);
    if (!result.success) {
      return { success: false, error: 'Error al desplazar la reserva' };
    }
    return { success: true };
  },

  /**
   * Creates a new reservation with business validations.
   * Returns { requiereConfirmacion, reservaADesplazar } when displacement is needed.
   */
  async createReservation(reservationData) {
    const domainData = fromLegacyCreateData(reservationData);
    const result = await createReservation.execute(domainData);

    if (!result.success) {
      // Displacement confirmation flow
      if (result.error?.code === 'DISPLACEMENT_REQUIRED') {
        return {
          success: false,
          requiereConfirmacion: true,
          reservationADisplace: reservationToLegacy(result.error.reservationToDisplace),
          error: 'Este horario tiene una reserva provisional que será desplazada',
        };
      }
      return { success: false, error: translateError(result.error) };
    }

    return { success: true, data: reservationToLegacy(result.value) };
  },

  /**
   * Cancels an existing reservation
   */
  async cancelReservation(reservationId, userId, apartmentUser = null) {
    const result = await cancelReservation.execute(reservationId, userId, apartmentUser || undefined);
    if (!result.success) {
      return { success: false, error: translateError(result.error) };
    }
    return { success: true };
  },

  /**
   * Gets all reservations (admin only)
   */
  async getAllReservations() {
    const result = await getAllReservations.execute();
    if (!result.success) {
      return { success: false, error: 'Error al obtener reservas' };
    }
    return { success: true, data: result.value.map(reservationToLegacy) };
  },

  /**
   * Gets reservation statistics (admin only)
   */
  async getStatistics() {
    const result = await getReservationStatistics.execute();
    if (!result.success) {
      return { success: false, error: 'Error al obtener estadísticas' };
    }
    const s = result.value;
    return {
      success: true,
      data: {
        totalReservations: s.totalReservations,
        reservationsConfirmadas: s.confirmedReservations,
        reservationsCanceladas: s.cancelledReservations,
        reservationsToday: s.todayReservations,
        reservationsWeek: s.weekReservations,
      },
    };
  },

  /**
   * Gets unread displacement notifications for user
   */
  async getPendingNotifications(userId) {
    const result = await getPendingDisplacementNotifications.execute(userId);
    if (!result.success) {
      return { success: false, error: 'Error al obtener notificaciones' };
    }
    return { success: true, data: result.value.map(notificationToLegacy) };
  },

  /**
   * Marks all user's notifications as read
   */
  async markNotificationsAsRead(userId) {
    const result = await markDisplacementNotificationsRead.execute(userId);
    if (!result.success) {
      return { success: false, error: 'Error al marcar notificaciones' };
    }
    return { success: true };
  },

  /**
   * Creates a reservation using RPC (legacy method — now delegates to createReservation)
   * The CreateReservation use case already tries RPC first internally.
   */
  async createReservationWithRPC(reservationData) {
    return this.createReservation({ ...reservationData, forceDisplacement: false });
  },

  /**
   * Displaces a provisional reservation and creates a new guaranteed one
   * (legacy method — now delegates to createReservation with forceDisplacement)
   */
  async displaceAndCreateReservation(reservationToDisplace, newReservationData) {
    return this.createReservation({
      ...newReservationData,
      forceDisplacement: true,
    });
  },

  /**
   * Gets conversion information for a provisional reservation
   */
  async getConversionInfo(reservationId) {
    const result = await getConversionInfo.execute(reservationId);
    if (!result.success) {
      return { success: false, error: 'Error al obtener información de conversión' };
    }
    if (!result.value) {
      return { success: false, error: 'Reserva no encontrada' };
    }
    const c = result.value;
    return {
      success: true,
      data: {
        id: c.id,
        priority: c.priority,
        conversionTimestamp: c.conversionTimestamp,
        conversionRule: c.conversionRule,
        convertedAt: c.convertedAt,
        timeRemaining: c.timeRemaining,
      },
    };
  },

  /**
   * Forces recalculation of conversions for an apartment
   */
  async recalculateApartmentConversions(apartment) {
    const result = await recalculateApartmentConversions.execute(apartment);
    if (!result.success) {
      return { success: false, error: 'Error al recalcular conversiones' };
    }
    return { success: true };
  },

  /**
   * Gets schedule blockouts for a court on a specific date
   */
  async getBlockouts(courtId, date) {
    const result = await getBlockouts.execute(date, courtId);
    if (!result.success) {
      return { success: false, error: 'Error al obtener bloqueos' };
    }
    return { success: true, data: result.value.map(blockoutToLegacy) };
  },

  /**
   * Creates a schedule blockout (admin only)
   */
  async createBlockout(courtId, date, startTime, endTime, reason, createdBy) {
    const result = await createBlockout.execute({
      courtId: courtId,
      date: date,
      startTime: startTime,
      endTime: endTime,
      reason: reason || undefined,
      createdBy: createdBy,
    });
    if (!result.success) {
      return { success: false, error: translateError(result.error) };
    }
    return { success: true, data: blockoutToLegacy(result.value) };
  },

  /**
   * Deletes a schedule blockout (admin only)
   */
  async deleteBlockout(blockoutId) {
    const result = await deleteBlockout.execute(blockoutId);
    if (!result.success) {
      return { success: false, error: 'Error al eliminar bloqueo' };
    }
    return { success: true };
  },

  // ============================================================================
  // LEGACY ALIASES
  // ============================================================================
  getReservationsUser(...args) { return this.getUserReservations(...args); },
  getReservationsActivasApartment(...args) { return this.getActiveApartmentReservations(...args); },
  getPriorityForNuevaReservation(...args) { return this.getPriorityForNewReservation(...args); },
  getTodasReservations(...args) { return this.getAllReservations(...args); },
  getEstadisticas(...args) { return this.getStatistics(...args); },
  getNotificationsPending(...args) { return this.getPendingNotifications(...args); },
  markNotificationsRead(...args) { return this.markNotificationsAsRead(...args); },
  displaceReservationYCreate(...args) { return this.displaceAndCreateReservation(...args); },
  getInfoConversion(...args) { return this.getConversionInfo(...args); },
  recalcularConversionesApartment(...args) { return this.recalculateApartmentConversions(...args); },
};
