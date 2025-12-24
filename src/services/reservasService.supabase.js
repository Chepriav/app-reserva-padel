import { supabase } from './supabaseConfig';
import { horasHasta, stringToDate, generarHorariosDisponibles } from '../utils/dateHelpers';

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
 * Límites de reserva
 */
const LIMITS = {
  MIN_HOURS_ADVANCE: 2,
  MAX_DAYS_ADVANCE: 7,
  MAX_ACTIVE_RESERVATIONS: 2,
  MIN_HOURS_TO_CANCEL: 4,
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
    jugadores: data.jugadores || [],
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
        return { success: false, error: 'Error al obtener reservas de la vivienda' };
      }

      return {
        success: true,
        data: data.map(mapReservaToCamelCase),
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener reservas de la vivienda' };
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

        return {
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          disponible: !reservaConflicto,
          reservaExistente: reservaConflicto || null,
        };
      });

      return { success: true, data: horariosDisponibles };
    } catch (error) {
      return { success: false, error: 'Error al verificar disponibilidad' };
    }
  },

  /**
   * Crea una nueva reserva con validaciones de negocio
   * El límite de reservas se aplica por vivienda, no por usuario
   */
  async crearReserva(reservaData) {
    try {
      const { pistaId, usuarioId, usuarioNombre, vivienda, fecha, horaInicio, horaFin, jugadores = [] } = reservaData;

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
      if (!horarioSeleccionado || !horarioSeleccionado.disponible) {
        return { success: false, error: 'El horario seleccionado ya no está disponible' };
      }

      // Verificar límite de reservas activas POR VIVIENDA
      const reservasVivienda = await this.obtenerReservasPorVivienda(vivienda);
      if (!reservasVivienda.success) {
        return reservasVivienda;
      }

      const reservasActivas = reservasVivienda.data.filter(
        (r) => r.estado === 'confirmada' && stringToDate(r.fecha, r.horaInicio) > new Date()
      );

      if (reservasActivas.length >= LIMITS.MAX_ACTIVE_RESERVATIONS) {
        return {
          success: false,
          error: `Tu vivienda ya tiene ${LIMITS.MAX_ACTIVE_RESERVATIONS} reservas activas. El límite es por vivienda.`,
        };
      }

      // Verificar conflicto de horario (de cualquier miembro de la vivienda)
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

      // Crear reserva (incluye vivienda)
      const { data, error } = await supabase
        .from('reservas')
        .insert({
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
        })
        .select()
        .single();

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
};
