import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { PISTAS } from '../constants/config';
import { horasHasta, stringToDate, generarHorariosDisponibles } from '../utils/dateHelpers';

/**
 * Convierte un Timestamp de Firestore a Date
 */
const toDate = (timestamp) => timestamp?.toDate?.() || timestamp;

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
 * Servicio de reservas con Firebase
 */
export const reservasService = {
  /**
   * Obtiene la lista de pistas disponibles
   */
  async obtenerPistas() {
    return { success: true, data: PISTAS };
  },

  /**
   * Obtiene las reservas de un usuario específico
   */
  async obtenerReservasUsuario(userId) {
    try {
      const q = query(
        collection(db, 'reservas'),
        where('usuarioId', '==', userId),
        orderBy('fecha', 'desc'),
        orderBy('horaInicio', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const reservas = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        reservas.push({
          id: docSnapshot.id,
          ...data,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        });
      });

      return { success: true, data: reservas };
    } catch (error) {
      return { success: false, error: 'Error al obtener tus reservas' };
    }
  },

  /**
   * Obtiene las reservas confirmadas para una fecha específica
   */
  async obtenerReservasPorFecha(fecha) {
    try {
      const q = query(
        collection(db, 'reservas'),
        where('fecha', '==', fecha),
        where('estado', '==', 'confirmada')
      );

      const querySnapshot = await getDocs(q);
      const reservas = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        reservas.push({
          id: docSnapshot.id,
          ...data,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        });
      });

      return { success: true, data: reservas };
    } catch (error) {
      return { success: false, error: 'Error al obtener disponibilidad' };
    }
  },

  /**
   * Obtiene la disponibilidad de horarios para una pista en una fecha
   */
  async obtenerDisponibilidad(pistaId, fecha) {
    try {
      const q = query(
        collection(db, 'reservas'),
        where('pistaId', '==', pistaId),
        where('fecha', '==', fecha),
        where('estado', '==', 'confirmada')
      );

      const querySnapshot = await getDocs(q);
      const reservasExistentes = [];

      querySnapshot.forEach((docSnapshot) => {
        reservasExistentes.push({ id: docSnapshot.id, ...docSnapshot.data() });
      });

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
      if (error.message?.includes('index')) {
        return {
          success: false,
          error: 'Falta crear índices en Firestore. Revisa la consola de Firebase.',
        };
      }

      return { success: false, error: 'Error al verificar disponibilidad' };
    }
  },

  /**
   * Crea una nueva reserva con validaciones de negocio
   */
  async crearReserva(reservaData) {
    try {
      const { pistaId, usuarioId, usuarioNombre, fecha, horaInicio, horaFin, jugadores = [] } = reservaData;

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

      // Verificar límite de reservas activas
      const reservasUsuario = await this.obtenerReservasUsuario(usuarioId);
      if (!reservasUsuario.success) {
        return reservasUsuario;
      }

      const reservasActivas = reservasUsuario.data.filter(
        (r) => r.estado === 'confirmada' && stringToDate(r.fecha, r.horaInicio) > new Date()
      );

      if (reservasActivas.length >= LIMITS.MAX_ACTIVE_RESERVATIONS) {
        return {
          success: false,
          error: `Solo puedes tener ${LIMITS.MAX_ACTIVE_RESERVATIONS} reservas activas simultáneamente`,
        };
      }

      // Verificar conflicto de horario
      const conflicto = reservasActivas.find((r) => r.fecha === fecha && r.horaInicio === horaInicio);
      if (conflicto) {
        return { success: false, error: 'Ya tienes una reserva a esta hora' };
      }

      // Obtener nombre de pista
      const pista = PISTAS.find((p) => p.id === pistaId);
      const pistaNombre = pista?.nombre || 'Pista';

      // Crear reserva
      const nuevaReserva = {
        pistaId,
        pistaNombre,
        usuarioId,
        usuarioNombre,
        fecha,
        horaInicio,
        horaFin,
        estado: 'confirmada',
        jugadores: jugadores || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'reservas'), nuevaReserva);

      return {
        success: true,
        data: {
          id: docRef.id,
          ...nuevaReserva,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    } catch (error) {
      if (error.code === 'permission-denied') {
        return { success: false, error: 'No tienes permisos para crear reservas' };
      }
      return { success: false, error: 'Error al crear la reserva. Intenta de nuevo' };
    }
  },

  /**
   * Cancela una reserva existente
   */
  async cancelarReserva(reservaId, usuarioId) {
    try {
      const docRef = doc(db, 'reservas', reservaId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: false, error: 'Reserva no encontrada' };
      }

      const reserva = docSnap.data();

      // Verificar propiedad
      if (reserva.usuarioId !== usuarioId) {
        return { success: false, error: 'No puedes cancelar una reserva que no es tuya' };
      }

      // Verificar estado
      if (reserva.estado !== 'confirmada') {
        return { success: false, error: 'Esta reserva ya fue cancelada' };
      }

      // Verificar tiempo de anticipación
      const horasAntes = horasHasta(reserva.fecha, reserva.horaInicio);
      if (horasAntes < LIMITS.MIN_HOURS_TO_CANCEL) {
        return {
          success: false,
          error: `Solo puedes cancelar con mínimo ${LIMITS.MIN_HOURS_TO_CANCEL} horas de anticipación`,
        };
      }

      await updateDoc(docRef, {
        estado: 'cancelada',
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        data: { id: reservaId, ...reserva, estado: 'cancelada' },
      };
    } catch (error) {
      if (error.code === 'permission-denied') {
        return { success: false, error: 'No tienes permisos para cancelar esta reserva' };
      }
      return { success: false, error: 'Error al cancelar la reserva' };
    }
  },

  /**
   * Obtiene todas las reservas (solo admin)
   */
  async obtenerTodasReservas() {
    try {
      const q = query(
        collection(db, 'reservas'),
        orderBy('fecha', 'desc'),
        orderBy('horaInicio', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const reservas = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        reservas.push({
          id: docSnapshot.id,
          ...data,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        });
      });

      return { success: true, data: reservas };
    } catch (error) {
      return { success: false, error: 'Error al obtener reservas' };
    }
  },

  /**
   * Obtiene estadísticas de reservas (solo admin)
   */
  async obtenerEstadisticas() {
    try {
      const q = query(collection(db, 'reservas'));
      const querySnapshot = await getDocs(q);
      const reservas = [];

      querySnapshot.forEach((docSnapshot) => {
        reservas.push({ id: docSnapshot.id, ...docSnapshot.data() });
      });

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
