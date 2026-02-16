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

export const reservasService = {
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
  async getReservationsByApartment(vivienda) {
    const result = await getReservationsByApartment.execute(vivienda);
    if (!result.success) {
      return { success: false, error: 'Error al obtener reservas de la vivienda' };
    }
    return { success: true, data: result.value.map(reservationToLegacy) };
  },

  /**
   * Gets confirmed reservations for a specific date
   */
  async getReservationsByDate(fecha) {
    const result = await getReservationsByDate.execute(fecha);
    if (!result.success) {
      return { success: false, error: 'Error al obtener disponibilidad' };
    }
    return { success: true, data: result.value.map(reservationToLegacy) };
  },

  /**
   * Gets schedule availability for a court on a specific date
   */
  async getAvailability(pistaId, fecha) {
    const result = await getAvailability.execute(pistaId, fecha);
    if (!result.success) {
      return { success: false, error: 'Error al verificar disponibilidad' };
    }
    return { success: true, data: result.value.map(availabilityToLegacy) };
  },

  /**
   * Gets active future reservations for an apartment
   */
  async getActiveApartmentReservations(vivienda) {
    const result = await getActiveApartmentReservations.execute(vivienda);
    if (!result.success) return [];
    return result.value.map(reservationToLegacy);
  },

  /**
   * Determines what priority a new reservation will have
   */
  async getPriorityForNewReservation(vivienda) {
    const result = await getActiveApartmentReservations.execute(vivienda);
    if (!result.success) return 'primera';

    const count = result.value.length;
    if (count === 0) return 'primera';
    if (count === 1) return 'segunda';
    return null;
  },

  /**
   * Displaces a secondary reservation (legacy facade — direct call)
   * @deprecated Use createReservation with forceDisplacement instead
   */
  async displaceReservation(reservaADesplazar, viviendaDesplazadora) {
    const { displaceReservation: displace } = await import('../di/container');
    const { toDomain } = await import('../infrastructure/supabase/mappers/reservationMapper');

    // Convert legacy format to domain entity
    const domainReservation = {
      id: reservaADesplazar.id,
      courtId: reservaADesplazar.pistaId,
      courtName: reservaADesplazar.pistaNombre,
      userId: reservaADesplazar.usuarioId,
      userName: reservaADesplazar.usuarioNombre,
      apartment: reservaADesplazar.vivienda,
      date: reservaADesplazar.fecha,
      startTime: reservaADesplazar.horaInicio,
      endTime: reservaADesplazar.horaFin,
      duration: reservaADesplazar.duracion || 30,
      status: 'confirmed',
      priority: 'provisional',
      players: reservaADesplazar.jugadores || [],
      conversionTimestamp: null,
      conversionRule: null,
      convertedAt: null,
      createdAt: reservaADesplazar.createdAt || '',
      updatedAt: reservaADesplazar.updatedAt || '',
    };

    const result = await displace.execute(domainReservation, viviendaDesplazadora);
    if (!result.success) {
      return { success: false, error: 'Error al desplazar la reserva' };
    }
    return { success: true };
  },

  /**
   * Creates a new reservation with business validations.
   * Returns { requiereConfirmacion, reservaADesplazar } when displacement is needed.
   */
  async createReservation(reservaData) {
    const domainData = fromLegacyCreateData(reservaData);
    const result = await createReservation.execute(domainData);

    if (!result.success) {
      // Displacement confirmation flow
      if (result.error?.code === 'DISPLACEMENT_REQUIRED') {
        return {
          success: false,
          requiereConfirmacion: true,
          reservaADesplazar: reservationToLegacy(result.error.reservationToDisplace),
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
  async cancelReservation(reservaId, usuarioId, viviendaUsuario = null) {
    const result = await cancelReservation.execute(reservaId, usuarioId, viviendaUsuario || undefined);
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
        totalReservas: s.totalReservations,
        reservasConfirmadas: s.confirmedReservations,
        reservasCanceladas: s.cancelledReservations,
        reservasHoy: s.todayReservations,
        reservasSemana: s.weekReservations,
      },
    };
  },

  /**
   * Gets unread displacement notifications for user
   */
  async getPendingNotifications(usuarioId) {
    const result = await getPendingDisplacementNotifications.execute(usuarioId);
    if (!result.success) {
      return { success: false, error: 'Error al obtener notificaciones' };
    }
    return { success: true, data: result.value.map(notificationToLegacy) };
  },

  /**
   * Marks all user's notifications as read
   */
  async markNotificationsAsRead(usuarioId) {
    const result = await markDisplacementNotificationsRead.execute(usuarioId);
    if (!result.success) {
      return { success: false, error: 'Error al marcar notificaciones' };
    }
    return { success: true };
  },

  /**
   * Creates a reservation using RPC (legacy method — now delegates to createReservation)
   * The CreateReservation use case already tries RPC first internally.
   */
  async createReservationWithRPC(reservaData) {
    return this.createReservation({ ...reservaData, forzarDesplazamiento: false });
  },

  /**
   * Displaces a provisional reservation and creates a new guaranteed one
   * (legacy method — now delegates to createReservation with forceDisplacement)
   */
  async displaceAndCreateReservation(reservaADesplazar, nuevaReservaData) {
    return this.createReservation({
      ...nuevaReservaData,
      forzarDesplazamiento: true,
    });
  },

  /**
   * Gets conversion information for a provisional reservation
   */
  async getConversionInfo(reservaId) {
    const result = await getConversionInfo.execute(reservaId);
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
        prioridad: c.priority === 'guaranteed' ? 'primera' : 'segunda',
        conversionTimestamp: c.conversionTimestamp,
        conversionRule: c.conversionRule,
        convertedAt: c.convertedAt,
        tiempoRestante: c.timeRemaining,
      },
    };
  },

  /**
   * Forces recalculation of conversions for an apartment
   */
  async recalculateApartmentConversions(vivienda) {
    const result = await recalculateApartmentConversions.execute(vivienda);
    if (!result.success) {
      return { success: false, error: 'Error al recalcular conversiones' };
    }
    return { success: true };
  },

  /**
   * Gets schedule blockouts for a court on a specific date
   */
  async getBlockouts(pistaId, fecha) {
    const result = await getBlockouts.execute(fecha, pistaId);
    if (!result.success) {
      return { success: false, error: 'Error al obtener bloqueos' };
    }
    return { success: true, data: result.value.map(blockoutToLegacy) };
  },

  /**
   * Creates a schedule blockout (admin only)
   */
  async createBlockout(pistaId, fecha, horaInicio, horaFin, motivo, creadoPor) {
    const result = await createBlockout.execute({
      courtId: pistaId,
      date: fecha,
      startTime: horaInicio,
      endTime: horaFin,
      reason: motivo || undefined,
      createdBy: creadoPor,
    });
    if (!result.success) {
      return { success: false, error: translateError(result.error) };
    }
    return { success: true, data: blockoutToLegacy(result.value) };
  },

  /**
   * Deletes a schedule blockout (admin only)
   */
  async deleteBlockout(bloqueoId) {
    const result = await deleteBlockout.execute(bloqueoId);
    if (!result.success) {
      return { success: false, error: 'Error al eliminar bloqueo' };
    }
    return { success: true };
  },

  // ============================================================================
  // LEGACY ALIASES
  // ============================================================================
  obtenerPistas(...args) { return this.getCourts(...args); },
  obtenerReservasUsuario(...args) { return this.getUserReservations(...args); },
  obtenerReservasPorVivienda(...args) { return this.getReservationsByApartment(...args); },
  obtenerReservasPorFecha(...args) { return this.getReservationsByDate(...args); },
  obtenerDisponibilidad(...args) { return this.getAvailability(...args); },
  obtenerReservasActivasVivienda(...args) { return this.getActiveApartmentReservations(...args); },
  obtenerPrioridadParaNuevaReserva(...args) { return this.getPriorityForNewReservation(...args); },
  desplazarReserva(...args) { return this.displaceReservation(...args); },
  crearReserva(...args) { return this.createReservation(...args); },
  cancelarReserva(...args) { return this.cancelReservation(...args); },
  obtenerTodasReservas(...args) { return this.getAllReservations(...args); },
  obtenerEstadisticas(...args) { return this.getStatistics(...args); },
  obtenerNotificacionesPendientes(...args) { return this.getPendingNotifications(...args); },
  marcarNotificacionesLeidas(...args) { return this.markNotificationsAsRead(...args); },
  crearReservaConRPC(...args) { return this.createReservationWithRPC(...args); },
  desplazarReservaYCrear(...args) { return this.displaceAndCreateReservation(...args); },
  obtenerInfoConversion(...args) { return this.getConversionInfo(...args); },
  recalcularConversionesVivienda(...args) { return this.recalculateApartmentConversions(...args); },
  obtenerBloqueos(...args) { return this.getBlockouts(...args); },
  crearBloqueo(...args) { return this.createBlockout(...args); },
  eliminarBloqueo(...args) { return this.deleteBlockout(...args); },
};

// Re-export with English name
export { reservasService as reservationsService };
