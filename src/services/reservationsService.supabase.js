import { supabase } from './supabaseConfig';
import { horasHasta, stringToDate, generarHorariosDisponibles, formatearFechaLegible } from '../utils/dateHelpers';
import { LIMITES_RESERVA } from '../constants/config';
import { notificationService } from './notificationService';
import { partidasService } from './matchesService';
import { scheduleConfigService } from './scheduleConfigService';

/**
 * Converts time in HH:MM format to total minutes
 */
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Checks if two time ranges overlap
 */
const rangesOverlap = (start1, end1, start2, end2) => {
  return (start1 >= start2 && start1 < end2) ||
         (end1 > start2 && end1 <= end2) ||
         (start1 <= start2 && end1 >= end2);
};

/**
 * Reservation limits (from config.js)
 */
const LIMITS = {
  MIN_HOURS_ADVANCE: LIMITES_RESERVA.horasAnticipacionMinima,
  MAX_DAYS_ADVANCE: LIMITES_RESERVA.diasAnticipacionMaxima,
  MAX_ACTIVE_RESERVATIONS: LIMITES_RESERVA.maxReservasActivas,
  MIN_HOURS_TO_CANCEL: LIMITES_RESERVA.horasCancelacionMinima,
};

/**
 * Converts snake_case to camelCase for reservations
 */
const mapReservaToCamelCase = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    pistaId: data.pista_id,
    pistaNombre: data.pista_nombre,
    usuarioId: data.usuario_id,
    usuarioNombre: data.usuario_nombre,
    vivienda: data.vivienda,
    fecha: data.fecha,
    horaInicio: data.hora_inicio,
    horaFin: data.hora_fin,
    duracion: data.duracion,
    estado: data.estado,
    prioridad: data.prioridad || 'primera', // 'primera' (guaranteed) or 'segunda' (provisional)
    jugadores: data.jugadores || [],
    // Automatic P->G conversion fields
    conversionTimestamp: data.conversion_timestamp,
    conversionRule: data.conversion_rule,
    convertedAt: data.converted_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Converts snake_case to camelCase for courts
 */
const mapPistaToCamelCase = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion,
    techada: data.techada,
    conLuz: data.con_luz,
    capacidadJugadores: data.capacidad_jugadores,
  };
};

/**
 * Reservations service with Supabase
 */
export const reservasService = {
  /**
   * Gets the list of available courts
   */
  async getCourts() {
    try {
      const { data, error } = await supabase
        .from('pistas')
        .select('*');

      if (error) {
        return { success: false, error: 'Error al obtener pistas' };
      }

      return {
        success: true,
        data: data.map(mapPistaToCamelCase),
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener pistas' };
    }
  },

  /**
   * Gets reservations for a specific user
   */
  async getUserReservations(userId) {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('usuario_id', userId)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false });

      if (error) {
        return { success: false, error: 'Error al obtener tus reservas' };
      }

      return {
        success: true,
        data: data.map(mapReservaToCamelCase),
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener tus reservas' };
    }
  },

  /**
   * Gets reservations for a specific apartment
   */
  async getReservationsByApartment(vivienda) {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('vivienda', vivienda)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false });

      if (error) {
        // If the apartment column doesn't exist, return empty array
        if (error.code === '42703' || error.message?.includes('vivienda')) {
          return { success: true, data: [] };
        }
        return { success: false, error: 'Error al obtener reservas de la vivienda' };
      }

      return {
        success: true,
        data: data.map(mapReservaToCamelCase),
      };
    } catch (error) {
      return { success: true, data: [] };
    }
  },

  /**
   * Gets confirmed reservations for a specific date
   */
  async getReservationsByDate(fecha) {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('fecha', fecha)
        .eq('estado', 'confirmada');

      if (error) {
        return { success: false, error: 'Error al obtener disponibilidad' };
      }

      return {
        success: true,
        data: data.map(mapReservaToCamelCase),
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener disponibilidad' };
    }
  },

  /**
   * Gets schedule availability for a court on a specific date
   * Includes priority information for the first/second reservation system
   * Applies automatic P→G conversion if apartment only has 1 future reservation
   * Includes administrative blockout information
   */
  async getAvailability(pistaId, fecha) {
    try {
      console.log('[obtenerDisponibilidad] Consultando pista:', pistaId, 'fecha:', fecha);

      // Get reservations, blockouts, and schedule config in parallel
      const [reservasResult, bloqueosResult, configResult] = await Promise.all([
        supabase
          .from('reservas')
          .select('*')
          .eq('pista_id', pistaId)
          .eq('fecha', fecha)
          .eq('estado', 'confirmada'),
        this.getBlockouts(pistaId, fecha),
        scheduleConfigService.getConfig(),
      ]);

      const { data, error } = reservasResult;

      if (error) {
        console.error('[obtenerDisponibilidad] Error:', error);
        return { success: false, error: 'Error al verificar disponibilidad' };
      }

      const bloqueos = bloqueosResult.success ? bloqueosResult.data : [];
      const scheduleConfig = configResult.success ? configResult.data : null;

      console.log('[obtenerDisponibilidad] Reservas confirmadas encontradas:', data?.length, data?.map(r => ({ id: r.id, vivienda: r.vivienda, estado: r.estado, prioridad: r.prioridad })));
      console.log('[obtenerDisponibilidad] Bloqueos encontrados:', bloqueos.length);
      console.log('[obtenerDisponibilidad] Configuración horarios:', scheduleConfig);

      let reservasExistentes = data.map(mapReservaToCamelCase);

      // Apply automatic P→G conversion for each apartment with reservations
      // If an apartment only has 1 confirmed future reservation, that one is guaranteed
      const viviendasConReservas = [...new Set(reservasExistentes.map(r => r.vivienda))];

      for (const vivienda of viviendasConReservas) {
        // Get ALL future reservations for this apartment
        const reservasFuturasVivienda = await this.getActiveApartmentReservations(vivienda);

        // If only has 1 future reservation, convert to guaranteed
        if (reservasFuturasVivienda.length === 1) {
          reservasExistentes = reservasExistentes.map(r => {
            if (r.vivienda === vivienda) {
              return { ...r, prioridad: 'primera' };
            }
            return r;
          });
        } else if (reservasFuturasVivienda.length > 1) {
          // If has more than 1, check if there are guaranteed ones
          const garantizadas = reservasFuturasVivienda.filter(r => r.prioridad === 'primera');
          if (garantizadas.length === 0) {
            // No guaranteed ones, the nearest one gets converted
            const ordenadas = [...reservasFuturasVivienda].sort((a, b) => {
              const fechaA = new Date(a.fecha + 'T' + a.horaInicio);
              const fechaB = new Date(b.fecha + 'T' + b.horaInicio);
              return fechaA - fechaB;
            });
            const primeraId = ordenadas[0].id;

            reservasExistentes = reservasExistentes.map(r => {
              if (r.id === primeraId) {
                return { ...r, prioridad: 'primera' };
              }
              return r;
            });
          }
        }
      }

      // Generate time slots with schedule config (filters out break times)
      const horariosGenerados = generarHorariosDisponibles(scheduleConfig, fecha);

      const horariosDisponibles = horariosGenerados.map((horario) => {
        const bloqueInicioMin = timeToMinutes(horario.horaInicio);
        const bloqueFinMin = timeToMinutes(horario.horaFin);

        // Check if slot is blocked by admin
        const bloqueoConflicto = bloqueos.find((bloqueo) => {
          const bloqueoInicioMin = timeToMinutes(bloqueo.horaInicio);
          const bloqueoFinMin = timeToMinutes(bloqueo.horaFin);
          return rangesOverlap(bloqueInicioMin, bloqueFinMin, bloqueoInicioMin, bloqueoFinMin);
        });

        // If blocked, return blockout status
        if (bloqueoConflicto) {
          return {
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            disponible: false,
            bloqueado: true,
            bloqueoId: bloqueoConflicto.id,
            motivoBloqueo: bloqueoConflicto.motivo || 'Bloqueado por administración',
            reservaExistente: null,
            prioridad: null,
            esDesplazable: false,
            estaProtegida: true,
          };
        }

        const reservaConflicto = reservasExistentes.find((reserva) => {
          const reservaInicioMin = timeToMinutes(reserva.horaInicio);
          const reservaFinMin = timeToMinutes(reserva.horaFin);
          return rangesOverlap(bloqueInicioMin, bloqueFinMin, reservaInicioMin, reservaFinMin);
        });

        // Calculate if reservation is protected (< 24h before)
        let estaProtegida = false;
        let esDesplazable = false;
        if (reservaConflicto) {
          const horasRestantes = horasHasta(fecha, horario.horaInicio);
          estaProtegida = horasRestantes < 24;
          // Is displaceable if second priority AND 24h or more remaining
          esDesplazable = reservaConflicto.prioridad === 'segunda' && !estaProtegida;
        }

        return {
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          disponible: !reservaConflicto,
          bloqueado: false,
          bloqueoId: null,
          motivoBloqueo: null,
          reservaExistente: reservaConflicto || null,
          // New fields for priority system
          prioridad: reservaConflicto?.prioridad || null,
          esDesplazable,
          estaProtegida,
        };
      });

      return { success: true, data: horariosDisponibles };
    } catch (error) {
      return { success: false, error: 'Error al verificar disponibilidad' };
    }
  },

  /**
   * Gets active future reservations for an apartment
   */
  async getActiveApartmentReservations(vivienda) {
    try {
      const reservasVivienda = await this.getReservationsByApartment(vivienda);

      if (!reservasVivienda.success) {
        return [];
      }

      const ahora = new Date();

      const activas = reservasVivienda.data.filter((r) => {
        const fechaReserva = stringToDate(r.fecha, r.horaInicio);
        const esConfirmada = r.estado === 'confirmada';
        const esFutura = fechaReserva > ahora;
        return esConfirmada && esFutura;
      });

      return activas;
    } catch (error) {
      return [];
    }
  },

  /**
   * Determines what priority a new reservation will have
   * based on the apartment's active reservations
   */
  async getPriorityForNewReservation(vivienda) {
    try {
      const reservasActivas = await this.getActiveApartmentReservations(vivienda);

      if (reservasActivas.length === 0) {
        return 'primera'; // No reservations = first guaranteed
      }
      if (reservasActivas.length === 1) {
        return 'segunda'; // Already has one = second provisional
      }
      return null; // Already has 2 = can't reserve more
    } catch (error) {
      // In case of error, assume can reserve as first
      return 'primera';
    }
  },

  /**
   * Displaces (cancels) a secondary reservation and creates notification
   */
  async displaceReservation(reservaADesplazar, viviendaDesplazadora) {
    console.log('[desplazarReserva] Iniciando...', {
      id: reservaADesplazar.id,
      viviendaOriginal: reservaADesplazar.vivienda,
      viviendaDesplazadora,
      fecha: reservaADesplazar.fecha,
      horaInicio: reservaADesplazar.horaInicio,
    });

    try {
      // 1. Cancel the existing reservation
      const { data: updateData, error: cancelError } = await supabase
        .from('reservas')
        .update({
          estado: 'cancelada',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservaADesplazar.id)
        .select();

      if (cancelError) {
        console.error('[desplazarReserva] Error cancelando reserva:', cancelError);
        return { success: false, error: 'Error al desplazar la reserva' };
      }

      // Verify it was actually updated
      console.log('[desplazarReserva] Resultado UPDATE:', updateData);
      if (!updateData || updateData.length === 0) {
        console.error('[desplazarReserva] UPDATE no afectó ninguna fila - posible problema de RLS');
        // Try to verify current reservation status
        const { data: checkData } = await supabase
          .from('reservas')
          .select('id, estado, vivienda')
          .eq('id', reservaADesplazar.id)
          .single();
        console.log('[desplazarReserva] Estado actual de la reserva:', checkData);
        return { success: false, error: 'No se pudo cancelar la reserva (permisos insuficientes)' };
      }
      console.log('[desplazarReserva] Reserva cancelada en BD OK, nuevo estado:', updateData[0]?.estado);

      // 2. Create notification for displaced user
      const { error: notifError } = await supabase
        .from('notificaciones_desplazamiento')
        .insert({
          usuario_id: reservaADesplazar.usuarioId,
          vivienda: reservaADesplazar.vivienda,
          fecha_reserva: reservaADesplazar.fecha,
          hora_inicio: reservaADesplazar.horaInicio,
          hora_fin: reservaADesplazar.horaFin,
          pista_nombre: reservaADesplazar.pistaNombre,
          desplazado_por_vivienda: viviendaDesplazadora,
        });

      if (notifError) {
        console.error('[desplazarReserva] Error creando notificación:', notifError);
        // Don't fail here, notification is not critical
      } else {
        console.log('[desplazarReserva] Notificación creada OK');
      }

      // 3. Send push notification to ALL users of the displaced apartment
      notificationService.notifyViviendaDisplacement(reservaADesplazar.vivienda, {
        fecha: formatearFechaLegible(reservaADesplazar.fecha),
        horaInicio: reservaADesplazar.horaInicio,
        pistaNombre: reservaADesplazar.pistaNombre,
      });
      console.log('[desplazarReserva] Push notification enviada a vivienda:', reservaADesplazar.vivienda);

      // 4. Cancel linked match if exists
      const partidaResult = await partidasService.cancelarPartidaPorReserva(
        reservaADesplazar.id,
        'reserva_desplazada'
      );
      if (partidaResult.hadPartida) {
        console.log('[desplazarReserva] Partida cancelada:', partidaResult.partidaId);
      }

      return { success: true };
    } catch (error) {
      console.error('[desplazarReserva] Error general:', error);
      return { success: false, error: 'Error al desplazar la reserva' };
    }
  },

  /**
   * Creates a new reservation with business validations
   * Reservation limit applies per apartment, not per user
   * Supports displacement of secondary reservations
   *
   * Attempts to use RPC (crear_reserva_con_prioridad) to automatically
   * handle priority and P->G conversions.
   * If RPC doesn't exist, uses fallback method.
   */
  async createReservation(reservaData) {
    try {
      const { pistaId, usuarioId, usuarioNombre, vivienda, fecha, horaInicio, horaFin, jugadores = [], forzarDesplazamiento = false } = reservaData;

      // First try to create with RPC (if no pending displacement)
      if (!forzarDesplazamiento) {
        const rpcResult = await this.createReservationWithRPC(reservaData);

        // If RPC worked, return result
        if (rpcResult.success) {
          return rpcResult;
        }

        // If RPC doesn't exist, continue with fallback method
        // If there's another RPC error, return it
        if (!rpcResult.rpcNotFound) {
          return rpcResult;
        }
      }

      // Validate that apartment is present
      if (!vivienda) {
        return {
          success: false,
          error: 'Debes tener una vivienda configurada para hacer reservas',
        };
      }

      // Validate minimum advance
      const horasAntes = horasHasta(fecha, horaInicio);
      if (horasAntes < LIMITS.MIN_HOURS_ADVANCE) {
        return {
          success: false,
          error: `Las reservas deben hacerse con mínimo ${LIMITS.MIN_HOURS_ADVANCE} horas de anticipación`,
        };
      }

      // Validate maximum advance
      const diasAntes = horasAntes / 24;
      if (diasAntes > LIMITS.MAX_DAYS_ADVANCE) {
        return {
          success: false,
          error: `No se pueden hacer reservas con más de ${LIMITS.MAX_DAYS_ADVANCE} días de anticipación`,
        };
      }

      // Check schedule availability
      const disponibilidad = await this.getAvailability(pistaId, fecha);
      if (!disponibilidad.success) {
        return disponibilidad;
      }

      const horarioSeleccionado = disponibilidad.data.find((h) => h.horaInicio === horaInicio);

      // Find all slots to be reserved (from start time to end time)
      const bloquesAReservar = disponibilidad.data.filter((h) => {
        const bloqueMin = timeToMinutes(h.horaInicio);
        const reservaInicioMin = timeToMinutes(horaInicio);
        const reservaFinMin = timeToMinutes(horaFin);
        return bloqueMin >= reservaInicioMin && bloqueMin < reservaFinMin;
      });

      // Phase 1: Validate slots and collect UNIQUE reservations to displace
      // (A reservation can occupy multiple slots, we avoid displacing it multiple times)
      const reservasADesplazar = new Map();

      for (const bloque of bloquesAReservar) {
        if (!bloque.disponible) {
          // Check if it's displaceable
          if (!bloque.esDesplazable) {
            return {
              success: false,
              error: `El horario ${bloque.horaInicio} ya no está disponible (reserva garantizada)`
            };
          }

          // Verify it's not from the same apartment
          if (bloque.reservaExistente?.vivienda === vivienda) {
            return { success: false, error: 'Tu vivienda ya tiene una reserva a esta hora' };
          }

          // Add to Map only if doesn't exist (deduplicate by id)
          if (bloque.reservaExistente && !reservasADesplazar.has(bloque.reservaExistente.id)) {
            reservasADesplazar.set(bloque.reservaExistente.id, bloque.reservaExistente);
          }

          // If no displacement confirmation, request confirmation
          if (!forzarDesplazamiento) {
            return {
              success: false,
              requiereConfirmacion: true,
              reservaADesplazar: bloque.reservaExistente,
              error: 'Este horario tiene una reserva provisional que será desplazada',
            };
          }
        }
      }

      // Phase 2: Displace each reservation ONLY ONCE
      if (forzarDesplazamiento && reservasADesplazar.size > 0) {
        console.log('[crearReserva] Reservas a desplazar:', reservasADesplazar.size);
        for (const [id, reserva] of reservasADesplazar) {
          console.log('[crearReserva] Desplazando reserva:', id, 'vivienda:', reserva.vivienda);
          const resultadoDesplazamiento = await this.displaceReservation(reserva, vivienda);

          if (!resultadoDesplazamiento.success) {
            console.error('[crearReserva] Error al desplazar:', resultadoDesplazamiento.error);
            return resultadoDesplazamiento;
          }
          console.log('[crearReserva] Reserva desplazada OK:', id);
        }
      }

      // Determine priority for the new reservation
      // If it's a displacement, the reservation is ALWAYS guaranteed (first)
      // because you're taking the slot from another apartment's provisional reservation
      let prioridad;
      if (forzarDesplazamiento) {
        prioridad = 'primera';
        console.log('[crearReserva] Desplazamiento: prioridad forzada a "primera"');
      } else {
        prioridad = await this.getPriorityForNewReservation(vivienda);
        console.log('[crearReserva] Prioridad calculada:', prioridad);
      }

      if (!prioridad) {
        console.log('[crearReserva] Sin prioridad disponible, vivienda ya tiene 2 reservas');
        return {
          success: false,
          error: `Tu vivienda ya tiene ${LIMITS.MAX_ACTIVE_RESERVATIONS} reservas activas.`,
        };
      }

      // Check schedule conflict (from any apartment member)
      const reservasActivas = await this.getActiveApartmentReservations(vivienda);
      const conflicto = reservasActivas.find((r) => r.fecha === fecha && r.horaInicio === horaInicio);
      if (conflicto) {
        return { success: false, error: 'Tu vivienda ya tiene una reserva a esta hora' };
      }

      // Get court name
      const { data: pistaData } = await supabase
        .from('pistas')
        .select('nombre')
        .eq('id', pistaId)
        .single();

      const pistaNombre = pistaData?.nombre || 'Pista';

      // Calculate duration in minutes
      const duracion = timeToMinutes(horaFin) - timeToMinutes(horaInicio);

      // Create reservation with priority
      // Prepare base reservation data
      const reservaInsert = {
        pista_id: pistaId,
        pista_nombre: pistaNombre,
        usuario_id: usuarioId,
        usuario_nombre: usuarioNombre,
        vivienda,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        duracion,
        estado: 'confirmada',
        jugadores: jugadores || [],
      };

      // Try with priority first
      console.log('[crearReserva] Insertando reserva con prioridad:', prioridad);
      let { data, error } = await supabase
        .from('reservas')
        .insert({ ...reservaInsert, prioridad })
        .select()
        .single();

      // If fails due to priority column, try without it
      if (error) {
        console.error('[crearReserva] Error al insertar:', error);
        if (error.message?.includes('prioridad') || error.code === '42703') {
          console.log('[crearReserva] Reintentando sin columna prioridad...');
          const result = await supabase
            .from('reservas')
            .insert(reservaInsert)
            .select()
            .single();
          data = result.data;
          error = result.error;
        }
      }

      if (error) {
        console.error('[crearReserva] Error final:', error);
        if (error.code === '42501') {
          return { success: false, error: 'No tienes permisos para crear reservas' };
        }
        return { success: false, error: 'Error al crear la reserva. Intenta de nuevo' };
      }

      console.log('[crearReserva] Reserva creada OK:', data?.id, 'prioridad:', data?.prioridad);
      return {
        success: true,
        data: mapReservaToCamelCase(data),
      };
    } catch (error) {
      return { success: false, error: 'Error al crear la reserva. Intenta de nuevo' };
    }
  },

  /**
   * Cancels an existing reservation
   */
  async cancelReservation(reservaId, usuarioId, viviendaUsuario = null) {
    try {
      // Obtener la reserva
      const { data: reserva, error: getError } = await supabase
        .from('reservas')
        .select('*')
        .eq('id', reservaId)
        .single();

      if (getError || !reserva) {
        return { success: false, error: 'Reserva no encontrada' };
      }

      // Verify apartment membership (any user from the apartment can cancel)
      // If viviendaUsuario is passed, validate by apartment; otherwise, maintain compatibility with user validation
      if (viviendaUsuario) {
        if (reserva.vivienda !== viviendaUsuario) {
          return { success: false, error: 'Solo puedes cancelar reservas de tu vivienda' };
        }
      } else if (reserva.usuario_id !== usuarioId) {
        return { success: false, error: 'No puedes cancelar una reserva que no es tuya' };
      }

      // Verify status
      if (reserva.estado !== 'confirmada') {
        return { success: false, error: 'Esta reserva ya fue cancelada' };
      }

      // No time restriction - users can cancel anytime

      // Update status
      const { error: updateError } = await supabase
        .from('reservas')
        .update({ estado: 'cancelada' })
        .eq('id', reservaId);

      if (updateError) {
        if (updateError.code === '42501') {
          return { success: false, error: 'No tienes permisos para cancelar esta reserva' };
        }
        return { success: false, error: 'Error al cancelar la reserva' };
      }

      // Cancel linked match if exists
      try {
        console.log('[cancelarReserva] Buscando partida vinculada a reserva:', reservaId);
        const partidaResult = await partidasService.cancelarPartidaPorReserva(reservaId, 'reserva_cancelada');
        console.log('[cancelarReserva] Resultado cancelar partida:', partidaResult);
      } catch (partidaError) {
        console.error('[cancelarReserva] Error al cancelar partida vinculada:', partidaError);
      }

      return {
        success: true,
        data: mapReservaToCamelCase({ ...reserva, estado: 'cancelada' }),
      };
    } catch (error) {
      console.error('[cancelarReserva] Error general:', error);
      return { success: false, error: 'Error al cancelar la reserva' };
    }
  },

  /**
   * Gets all reservations (admin only)
   */
  async getAllReservations() {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false });

      if (error) {
        return { success: false, error: 'Error al obtener reservas' };
      }

      return {
        success: true,
        data: data.map(mapReservaToCamelCase),
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener reservas' };
    }
  },

  /**
   * Gets reservation statistics (admin only)
   */
  async getStatistics() {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*');

      if (error) {
        return { success: false, error: 'Error al obtener estadísticas' };
      }

      const reservas = data.map(mapReservaToCamelCase);
      const hoy = new Date().toISOString().split('T')[0];

      const reservasHoy = reservas.filter((r) => r.fecha === hoy);
      const reservasSemana = reservas.filter((r) => {
        const fechaReserva = new Date(r.fecha);
        const fechaHoy = new Date(hoy);
        const diffDays = Math.floor((fechaReserva - fechaHoy) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      });

      return {
        success: true,
        data: {
          totalReservas: reservas.length,
          reservasConfirmadas: reservas.filter((r) => r.estado === 'confirmada').length,
          reservasCanceladas: reservas.filter((r) => r.estado === 'cancelada').length,
          reservasHoy: reservasHoy.length,
          reservasSemana: reservasSemana.length,
        },
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener estadísticas' };
    }
  },

  /**
   * Gets unread displacement notifications for user
   */
  async getPendingNotifications(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('notificaciones_desplazamiento')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('leida', false)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, return empty array without error
        if (error.code === 'PGRST205' || error.message?.includes('notificaciones_desplazamiento')) {
          return { success: true, data: [] };
        }
        return { success: false, error: 'Error al obtener notificaciones' };
      }

      return {
        success: true,
        data: data.map(n => ({
          id: n.id,
          fechaReserva: n.fecha_reserva,
          horaInicio: n.hora_inicio,
          horaFin: n.hora_fin,
          pistaNombre: n.pista_nombre,
          desplazadoPorVivienda: n.desplazado_por_vivienda,
          createdAt: n.created_at,
        })),
      };
    } catch (error) {
      return { success: true, data: [] }; // Return empty on error
    }
  },

  /**
   * Marks all user's notifications as read
   */
  async markNotificationsAsRead(usuarioId) {
    try {
      const { error } = await supabase
        .from('notificaciones_desplazamiento')
        .update({ leida: true })
        .eq('usuario_id', usuarioId)
        .eq('leida', false);

      if (error) {
        // If table doesn't exist, ignore
        if (error.code === 'PGRST205' || error.message?.includes('notificaciones_desplazamiento')) {
          return { success: true };
        }
        return { success: false, error: 'Error al marcar notificaciones' };
      }

      return { success: true };
    } catch (error) {
      return { success: true }; // Don't fail because of this
    }
  },

  // ============================================================================
  // RPC METHODS - Automatic P->G Conversion System
  // ============================================================================

  /**
   * Creates a reservation using RPC that automatically handles:
   * - Priority (first/second)
   * - Continuity detection for immediate conversion
   * - P->G conversion time calculation
   */
  async createReservationWithRPC(reservaData) {
    try {
      const { pistaId, usuarioId, usuarioNombre, vivienda, fecha, horaInicio, horaFin, jugadores = [] } = reservaData;

      // Calculate duration
      const duracion = timeToMinutes(horaFin) - timeToMinutes(horaInicio);

      // Call the RPC
      const { data, error } = await supabase.rpc('crear_reserva_con_prioridad', {
        p_pista_id: pistaId,
        p_usuario_id: usuarioId,
        p_usuario_nombre: usuarioNombre,
        p_vivienda: vivienda,
        p_fecha: fecha,
        p_hora_inicio: horaInicio,
        p_hora_fin: horaFin,
        p_duracion: duracion,
        p_jugadores: jugadores,
      });

      if (error) {
        // If RPC doesn't exist, return indicator to use fallback
        if (error.code === 'PGRST202' || error.message?.includes('function')) {
          return { success: false, rpcNotFound: true };
        }
        return { success: false, error: error.message || 'Error al crear la reserva' };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      // Get the complete reservation
      const { data: reserva } = await supabase
        .from('reservas')
        .select('*')
        .eq('id', data.reserva_id)
        .single();

      return {
        success: true,
        data: {
          ...mapReservaToCamelCase(reserva),
          esContinuidad: data.es_continuidad,
        },
      };
    } catch (error) {
      return { success: false, error: 'Error al crear la reserva' };
    }
  },

  /**
   * Displaces a provisional reservation and creates a new guaranteed one atomically
   * Uses RPC to guarantee atomicity and avoid race conditions
   */
  async displaceAndCreateReservation(reservaADesplazar, nuevaReservaData) {
    try {
      const { pistaId, usuarioId, usuarioNombre, vivienda, fecha, horaInicio, horaFin, jugadores = [] } = nuevaReservaData;
      const duracion = timeToMinutes(horaFin) - timeToMinutes(horaInicio);

      const { data, error } = await supabase.rpc('desplazar_reserva_y_crear_nueva', {
        p_reserva_a_desplazar_id: reservaADesplazar.id,
        p_nueva_pista_id: pistaId,
        p_nuevo_usuario_id: usuarioId,
        p_nuevo_usuario_nombre: usuarioNombre,
        p_nueva_vivienda: vivienda,
        p_nueva_fecha: fecha,
        p_nueva_hora_inicio: horaInicio,
        p_nueva_hora_fin: horaFin,
        p_nueva_duracion: duracion,
        p_nuevos_jugadores: jugadores,
      });

      if (error) {
        // If RPC doesn't exist, use fallback method
        if (error.code === 'PGRST202' || error.message?.includes('function')) {
          return { success: false, rpcNotFound: true };
        }
        return { success: false, error: error.message || 'Error al desplazar la reserva' };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      // Get the new reservation
      const { data: reserva } = await supabase
        .from('reservas')
        .select('*')
        .eq('id', data.nueva_reserva_id)
        .single();

      return {
        success: true,
        data: mapReservaToCamelCase(reserva),
        reservaDesplazadaId: data.reserva_desplazada_id,
      };
    } catch (error) {
      return { success: false, error: 'Error al desplazar la reserva' };
    }
  },

  /**
   * Gets conversion information for a provisional reservation
   * Useful for showing countdown in the UI
   */
  async getConversionInfo(reservaId) {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('id, prioridad, conversion_timestamp, conversion_rule, converted_at')
        .eq('id', reservaId)
        .single();

      if (error) {
        return { success: false, error: 'Error al obtener información de conversión' };
      }

      return {
        success: true,
        data: {
          id: data.id,
          prioridad: data.prioridad,
          conversionTimestamp: data.conversion_timestamp,
          conversionRule: data.conversion_rule,
          convertedAt: data.converted_at,
          tiempoRestante: data.conversion_timestamp
            ? Math.max(0, new Date(data.conversion_timestamp) - new Date())
            : null,
        },
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener información de conversión' };
    }
  },

  /**
   * Forces recalculation of conversions for an apartment
   * Useful after canceling a G reservation
   */
  async recalculateApartmentConversions(vivienda) {
    try {
      const { data, error } = await supabase.rpc('recalculate_vivienda_conversions', {
        p_vivienda: vivienda,
      });

      if (error) {
        // If RPC doesn't exist, ignore silently
        if (error.code === 'PGRST202' || error.message?.includes('function')) {
          return { success: true, data: { updated: 0 } };
        }
        return { success: false, error: 'Error al recalcular conversiones' };
      }

      return { success: true, data };
    } catch (error) {
      return { success: true, data: { updated: 0 } };
    }
  },

  // ============================================================================
  // SCHEDULE BLOCKOUT METHODS (Admin Only)
  // ============================================================================

  /**
   * Gets schedule blockouts for a court on a specific date
   */
  async getBlockouts(pistaId, fecha) {
    try {
      const { data, error } = await supabase
        .from('bloqueos_horarios')
        .select('*')
        .eq('pista_id', pistaId)
        .eq('fecha', fecha);

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01' || error.message?.includes('bloqueos_horarios')) {
          return { success: true, data: [] };
        }
        console.error('[obtenerBloqueos] Error:', error);
        return { success: false, error: 'Error al obtener bloqueos' };
      }

      return {
        success: true,
        data: (data || []).map(b => ({
          id: b.id,
          pistaId: b.pista_id,
          fecha: b.fecha,
          horaInicio: b.hora_inicio,
          horaFin: b.hora_fin,
          motivo: b.motivo,
          creadoPor: b.creado_por,
          createdAt: b.created_at,
        })),
      };
    } catch (error) {
      console.error('[obtenerBloqueos] Error:', error);
      return { success: true, data: [] };
    }
  },

  /**
   * Creates a schedule blockout (admin only)
   */
  async createBlockout(pistaId, fecha, horaInicio, horaFin, motivo, creadoPor) {
    try {
      // Verify there's no confirmed reservation at that time
      const disponibilidad = await this.getAvailability(pistaId, fecha);
      if (disponibilidad.success) {
        const bloqueInicio = timeToMinutes(horaInicio);
        const bloqueFin = timeToMinutes(horaFin);

        const hayReserva = disponibilidad.data.some(h => {
          if (h.disponible || h.bloqueado) return false;
          const hInicio = timeToMinutes(h.horaInicio);
          return hInicio >= bloqueInicio && hInicio < bloqueFin;
        });

        if (hayReserva) {
          return {
            success: false,
            error: 'No se puede bloquear: hay una reserva confirmada en ese horario',
          };
        }
      }

      const { data, error } = await supabase
        .from('bloqueos_horarios')
        .insert({
          pista_id: pistaId,
          fecha,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          motivo: motivo || null,
          creado_por: creadoPor,
        })
        .select()
        .single();

      if (error) {
        console.error('[crearBloqueo] Error:', error);
        if (error.code === '23505') {
          return { success: false, error: 'Este horario ya está bloqueado' };
        }
        return { success: false, error: 'Error al crear bloqueo' };
      }

      return {
        success: true,
        data: {
          id: data.id,
          pistaId: data.pista_id,
          fecha: data.fecha,
          horaInicio: data.hora_inicio,
          horaFin: data.hora_fin,
          motivo: data.motivo,
          creadoPor: data.creado_por,
          createdAt: data.created_at,
        },
      };
    } catch (error) {
      console.error('[crearBloqueo] Error:', error);
      return { success: false, error: 'Error al crear bloqueo' };
    }
  },

  /**
   * Deletes a schedule blockout (admin only)
   */
  async deleteBlockout(bloqueoId) {
    try {
      const { error } = await supabase
        .from('bloqueos_horarios')
        .delete()
        .eq('id', bloqueoId);

      if (error) {
        console.error('[eliminarBloqueo] Error:', error);
        return { success: false, error: 'Error al eliminar bloqueo' };
      }

      return { success: true };
    } catch (error) {
      console.error('[eliminarBloqueo] Error:', error);
      return { success: false, error: 'Error al eliminar bloqueo' };
    }
  },

  // ============================================================================
  // LEGACY ALIASES - For backwards compatibility
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
