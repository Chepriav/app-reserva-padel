import { supabase } from './supabaseConfig';
import { horasHasta, stringToDate, generarHorariosDisponibles } from '../utils/dateHelpers';
import { LIMITES_RESERVA } from '../constants/config';

/**
 * Convierte tiempo en formato HH:MM a minutos totales
 */
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Verifica si dos rangos de tiempo se solapan
 */
const rangesOverlap = (start1, end1, start2, end2) => {
  return (start1 >= start2 && start1 < end2) ||
         (end1 > start2 && end1 <= end2) ||
         (start1 <= start2 && end1 >= end2);
};

/**
 * Límites de reserva (desde config.js)
 */
const LIMITS = {
  MIN_HOURS_ADVANCE: LIMITES_RESERVA.horasAnticipacionMinima,
  MAX_DAYS_ADVANCE: LIMITES_RESERVA.diasAnticipacionMaxima,
  MAX_ACTIVE_RESERVATIONS: LIMITES_RESERVA.maxReservasActivas,
  MIN_HOURS_TO_CANCEL: LIMITES_RESERVA.horasCancelacionMinima,
};

/**
 * Convierte snake_case a camelCase para reservas
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
    prioridad: data.prioridad || 'primera', // 'primera' (garantizada) o 'segunda' (provisional)
    jugadores: data.jugadores || [],
    // Campos de conversión automática P->G
    conversionTimestamp: data.conversion_timestamp,
    conversionRule: data.conversion_rule,
    convertedAt: data.converted_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Convierte snake_case a camelCase para pistas
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
 * Servicio de reservas con Supabase
 */
export const reservasService = {
  /**
   * Obtiene la lista de pistas disponibles
   */
  async obtenerPistas() {
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
   * Obtiene las reservas de un usuario específico
   */
  async obtenerReservasUsuario(userId) {
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
   * Obtiene las reservas de una vivienda específica
   */
  async obtenerReservasPorVivienda(vivienda) {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('vivienda', vivienda)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false });

      if (error) {
        // Si la columna vivienda no existe, devolver array vacío
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
   * Obtiene las reservas confirmadas para una fecha específica
   */
  async obtenerReservasPorFecha(fecha) {
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
   * Obtiene la disponibilidad de horarios para una pista en una fecha
   * Incluye información de prioridad para el sistema de reservas primera/segunda
   */
  async obtenerDisponibilidad(pistaId, fecha) {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('pista_id', pistaId)
        .eq('fecha', fecha)
        .eq('estado', 'confirmada');

      if (error) {
        return { success: false, error: 'Error al verificar disponibilidad' };
      }

      const reservasExistentes = data.map(mapReservaToCamelCase);
      const horariosGenerados = generarHorariosDisponibles();

      const horariosDisponibles = horariosGenerados.map((horario) => {
        const bloqueInicioMin = timeToMinutes(horario.horaInicio);
        const bloqueFinMin = timeToMinutes(horario.horaFin);

        const reservaConflicto = reservasExistentes.find((reserva) => {
          const reservaInicioMin = timeToMinutes(reserva.horaInicio);
          const reservaFinMin = timeToMinutes(reserva.horaFin);
          return rangesOverlap(bloqueInicioMin, bloqueFinMin, reservaInicioMin, reservaFinMin);
        });

        // Calcular si la reserva está protegida (< 24h antes)
        let estaProtegida = false;
        let esDesplazable = false;
        if (reservaConflicto) {
          const horasRestantes = horasHasta(fecha, horario.horaInicio);
          estaProtegida = horasRestantes < 24;
          // Es desplazable si es segunda prioridad Y faltan 24h o más
          esDesplazable = reservaConflicto.prioridad === 'segunda' && !estaProtegida;
        }

        return {
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          disponible: !reservaConflicto,
          reservaExistente: reservaConflicto || null,
          // Nuevos campos para sistema de prioridades
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
   * Obtiene las reservas activas futuras de una vivienda
   */
  async obtenerReservasActivasVivienda(vivienda) {
    try {
      const reservasVivienda = await this.obtenerReservasPorVivienda(vivienda);

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
   * Determina qué prioridad tendrá una nueva reserva
   * basándose en las reservas activas de la vivienda
   */
  async obtenerPrioridadParaNuevaReserva(vivienda) {
    try {
      const reservasActivas = await this.obtenerReservasActivasVivienda(vivienda);

      if (reservasActivas.length === 0) {
        return 'primera'; // Sin reservas = primera garantizada
      }
      if (reservasActivas.length === 1) {
        return 'segunda'; // Ya tiene una = segunda provisional
      }
      return null; // Ya tiene 2 = no puede reservar más
    } catch (error) {
      // En caso de error, asumir que puede reservar como primera
      return 'primera';
    }
  },

  /**
   * Desplaza (cancela) una reserva secundaria y crea notificación
   */
  async desplazarReserva(reservaADesplazar, viviendaDesplazadora) {
    try {
      // 1. Cancelar la reserva existente
      const { error: cancelError } = await supabase
        .from('reservas')
        .update({
          estado: 'cancelada',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservaADesplazar.id);

      if (cancelError) {
        return { success: false, error: 'Error al desplazar la reserva' };
      }

      // 2. Crear notificación para el usuario desplazado
      await supabase
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

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al desplazar la reserva' };
    }
  },

  /**
   * Crea una nueva reserva con validaciones de negocio
   * El límite de reservas se aplica por vivienda, no por usuario
   * Soporta desplazamiento de reservas secundarias
   *
   * Intenta usar el RPC (crear_reserva_con_prioridad) para manejar
   * automáticamente la prioridad y conversiones P->G.
   * Si el RPC no existe, usa el método de fallback.
   */
  async crearReserva(reservaData) {
    try {
      const { pistaId, usuarioId, usuarioNombre, vivienda, fecha, horaInicio, horaFin, jugadores = [], forzarDesplazamiento = false } = reservaData;

      // Primero intentar crear con RPC (si no hay desplazamiento pendiente)
      if (!forzarDesplazamiento) {
        const rpcResult = await this.crearReservaConRPC(reservaData);

        // Si el RPC funcionó, devolver resultado
        if (rpcResult.success) {
          return rpcResult;
        }

        // Si el RPC no existe, continuar con método fallback
        // Si hay otro error del RPC, devolverlo
        if (!rpcResult.rpcNotFound) {
          return rpcResult;
        }
      }

      // Validar que la vivienda esté presente
      if (!vivienda) {
        return {
          success: false,
          error: 'Debes tener una vivienda configurada para hacer reservas',
        };
      }

      // Validar anticipación mínima
      const horasAntes = horasHasta(fecha, horaInicio);
      if (horasAntes < LIMITS.MIN_HOURS_ADVANCE) {
        return {
          success: false,
          error: `Las reservas deben hacerse con mínimo ${LIMITS.MIN_HOURS_ADVANCE} horas de anticipación`,
        };
      }

      // Validar anticipación máxima
      const diasAntes = horasAntes / 24;
      if (diasAntes > LIMITS.MAX_DAYS_ADVANCE) {
        return {
          success: false,
          error: `No se pueden hacer reservas con más de ${LIMITS.MAX_DAYS_ADVANCE} días de anticipación`,
        };
      }

      // Verificar disponibilidad del horario
      const disponibilidad = await this.obtenerDisponibilidad(pistaId, fecha);
      if (!disponibilidad.success) {
        return disponibilidad;
      }

      const horarioSeleccionado = disponibilidad.data.find((h) => h.horaInicio === horaInicio);

      // Manejar caso de horario ocupado
      if (horarioSeleccionado && !horarioSeleccionado.disponible) {
        // Verificar si es desplazable
        if (!horarioSeleccionado.esDesplazable) {
          return {
            success: false,
            error: 'El horario seleccionado ya no está disponible (reserva garantizada)'
          };
        }

        // Es desplazable - verificar que la nueva sería "primera"
        const prioridadNueva = await this.obtenerPrioridadParaNuevaReserva(vivienda);
        if (prioridadNueva !== 'primera') {
          return {
            success: false,
            error: 'Solo puedes desplazar reservas provisionales con tu primera reserva',
          };
        }

        // Verificar que no sea de la misma vivienda
        if (horarioSeleccionado.reservaExistente.vivienda === vivienda) {
          return { success: false, error: 'Tu vivienda ya tiene una reserva a esta hora' };
        }

        // Desplazar la reserva existente
        if (forzarDesplazamiento) {
          const resultadoDesplazamiento = await this.desplazarReserva(
            horarioSeleccionado.reservaExistente,
            vivienda
          );

          if (!resultadoDesplazamiento.success) {
            return resultadoDesplazamiento;
          }
        } else {
          // Indicar que se necesita confirmación
          return {
            success: false,
            requiereConfirmacion: true,
            reservaADesplazar: horarioSeleccionado.reservaExistente,
            error: 'Este horario tiene una reserva provisional que será desplazada',
          };
        }
      }

      // Determinar prioridad de la nueva reserva
      const prioridad = await this.obtenerPrioridadParaNuevaReserva(vivienda);

      if (!prioridad) {
        return {
          success: false,
          error: `Tu vivienda ya tiene ${LIMITS.MAX_ACTIVE_RESERVATIONS} reservas activas.`,
        };
      }

      // Verificar conflicto de horario (de cualquier miembro de la vivienda)
      const reservasActivas = await this.obtenerReservasActivasVivienda(vivienda);
      const conflicto = reservasActivas.find((r) => r.fecha === fecha && r.horaInicio === horaInicio);
      if (conflicto) {
        return { success: false, error: 'Tu vivienda ya tiene una reserva a esta hora' };
      }

      // Obtener nombre de pista
      const { data: pistaData } = await supabase
        .from('pistas')
        .select('nombre')
        .eq('id', pistaId)
        .single();

      const pistaNombre = pistaData?.nombre || 'Pista';

      // Calcular duración en minutos
      const duracion = timeToMinutes(horaFin) - timeToMinutes(horaInicio);

      // Crear reserva con prioridad
      // Preparar datos base de la reserva
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

      // Intentar con prioridad primero
      let { data, error } = await supabase
        .from('reservas')
        .insert({ ...reservaInsert, prioridad })
        .select()
        .single();

      // Si falla por la columna prioridad, intentar sin ella
      if (error) {
        if (error.message?.includes('prioridad') || error.code === '42703') {
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
        if (error.code === '42501') {
          return { success: false, error: 'No tienes permisos para crear reservas' };
        }
        return { success: false, error: 'Error al crear la reserva. Intenta de nuevo' };
      }

      return {
        success: true,
        data: mapReservaToCamelCase(data),
      };
    } catch (error) {
      return { success: false, error: 'Error al crear la reserva. Intenta de nuevo' };
    }
  },

  /**
   * Cancela una reserva existente
   */
  async cancelarReserva(reservaId, usuarioId) {
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

      // Verificar propiedad
      if (reserva.usuario_id !== usuarioId) {
        return { success: false, error: 'No puedes cancelar una reserva que no es tuya' };
      }

      // Verificar estado
      if (reserva.estado !== 'confirmada') {
        return { success: false, error: 'Esta reserva ya fue cancelada' };
      }

      // Verificar tiempo de anticipación
      const horasAntes = horasHasta(reserva.fecha, reserva.hora_inicio);
      if (horasAntes < LIMITS.MIN_HOURS_TO_CANCEL) {
        return {
          success: false,
          error: `Solo puedes cancelar con mínimo ${LIMITS.MIN_HOURS_TO_CANCEL} horas de anticipación`,
        };
      }

      // Actualizar estado
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

      return {
        success: true,
        data: mapReservaToCamelCase({ ...reserva, estado: 'cancelada' }),
      };
    } catch (error) {
      return { success: false, error: 'Error al cancelar la reserva' };
    }
  },

  /**
   * Obtiene todas las reservas (solo admin)
   */
  async obtenerTodasReservas() {
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
   * Obtiene estadísticas de reservas (solo admin)
   */
  async obtenerEstadisticas() {
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
   * Obtiene notificaciones de desplazamiento no leídas del usuario
   */
  async obtenerNotificacionesPendientes(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('notificaciones_desplazamiento')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('leida', false)
        .order('created_at', { ascending: false });

      if (error) {
        // Si la tabla no existe, devolver array vacío sin error
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
      return { success: true, data: [] }; // Devolver vacío en caso de error
    }
  },

  /**
   * Marca todas las notificaciones del usuario como leídas
   */
  async marcarNotificacionesLeidas(usuarioId) {
    try {
      const { error } = await supabase
        .from('notificaciones_desplazamiento')
        .update({ leida: true })
        .eq('usuario_id', usuarioId)
        .eq('leida', false);

      if (error) {
        // Si la tabla no existe, ignorar
        if (error.code === 'PGRST205' || error.message?.includes('notificaciones_desplazamiento')) {
          return { success: true };
        }
        return { success: false, error: 'Error al marcar notificaciones' };
      }

      return { success: true };
    } catch (error) {
      return { success: true }; // No fallar por esto
    }
  },

  // ============================================================================
  // MÉTODOS RPC - Sistema de Conversión Automática P->G
  // ============================================================================

  /**
   * Crea una reserva usando el RPC que maneja automáticamente:
   * - Prioridad (primera/segunda)
   * - Detección de continuidad para conversión inmediata
   * - Cálculo de tiempo de conversión P->G
   */
  async crearReservaConRPC(reservaData) {
    try {
      const { pistaId, usuarioId, usuarioNombre, vivienda, fecha, horaInicio, horaFin, jugadores = [] } = reservaData;

      // Calcular duración
      const duracion = timeToMinutes(horaFin) - timeToMinutes(horaInicio);

      // Llamar al RPC
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
        // Si el RPC no existe, devolver indicador para usar fallback
        if (error.code === 'PGRST202' || error.message?.includes('function')) {
          return { success: false, rpcNotFound: true };
        }
        return { success: false, error: error.message || 'Error al crear la reserva' };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      // Obtener la reserva completa
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
   * Desplaza una reserva provisional y crea una nueva garantizada de forma atómica
   * Usa el RPC para garantizar atomicidad y evitar race conditions
   */
  async desplazarReservaYCrear(reservaADesplazar, nuevaReservaData) {
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
        // Si el RPC no existe, usar método de fallback
        if (error.code === 'PGRST202' || error.message?.includes('function')) {
          return { success: false, rpcNotFound: true };
        }
        return { success: false, error: error.message || 'Error al desplazar la reserva' };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      // Obtener la nueva reserva
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
   * Obtiene información de conversión para una reserva provisional
   * Útil para mostrar countdown en la UI
   */
  async obtenerInfoConversion(reservaId) {
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
   * Fuerza el recálculo de conversiones para una vivienda
   * Útil después de cancelar una reserva G
   */
  async recalcularConversionesVivienda(vivienda) {
    try {
      const { data, error } = await supabase.rpc('recalculate_vivienda_conversions', {
        p_vivienda: vivienda,
      });

      if (error) {
        // Si el RPC no existe, ignorar silenciosamente
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
};
