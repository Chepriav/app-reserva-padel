import React, { createContext, useState, useContext, useEffect } from 'react';
import { reservasService } from '../../services/reservationsService.supabase';
import { notificationService } from '../../services/notificationService';
import { useAuth } from './AuthContext';

const ReservationsContext = createContext(null);

export const ReservationsProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reservationsVersion, setReservationsVersion] = useState(0);

  // Load user reservations when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadReservations();
    } else {
      setReservations([]);
    }
  }, [isAuthenticated, user]);

  // Load courts on init
  useEffect(() => {
    loadCourts();
  }, []);

  const loadReservations = async () => {
    if (!user?.vivienda) return;

    setLoading(true);
    try {
      // Load all reservations from the apartment (not just the user)
      const response = await reservasService.obtenerReservasPorVivienda(user.vivienda);
      if (response.success) {
        // Apply automatic P→G conversion if applicable
        const reservasConversion = applyAutomaticConversion(response.data);
        setReservations(reservasConversion);
      }
    } catch (error) {
      console.error('Error al cargar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Applies automatic conversion from Provisional to Guaranteed
   * When a Guaranteed reservation passes (already occurred), the oldest Provisional
   * is automatically converted to Guaranteed
   */
  const applyAutomaticConversion = (originalReservations) => {
    const now = new Date();

    // Separate future confirmed reservations
    const futureReservations = originalReservations.filter(r => {
      const reservationDate = new Date(r.fecha + 'T' + r.horaInicio);
      return r.estado === 'confirmada' && reservationDate > now;
    });

    // Count future guaranteed reservations
    const futureGuaranteed = futureReservations.filter(r => r.prioridad === 'primera');
    const futureProvisional = futureReservations.filter(r => r.prioridad === 'segunda');

    // If there's no future guaranteed but there are provisionals,
    // the oldest provisional is converted to guaranteed
    if (futureGuaranteed.length === 0 && futureProvisional.length > 0) {
      // Sort provisionals by date/time (earliest first)
      const sortedProvisionals = [...futureProvisional].sort((a, b) => {
        const dateA = new Date(a.fecha + 'T' + a.horaInicio);
        const dateB = new Date(b.fecha + 'T' + b.horaInicio);
        return dateA - dateB;
      });

      // The first provisional is converted to guaranteed
      const toConvert = sortedProvisionals[0];

      // Return reservations with conversion applied
      return originalReservations.map(r => {
        if (r.id === toConvert.id) {
          return { ...r, prioridad: 'primera' };
        }
        return r;
      });
    }

    return originalReservations;
  };

  const loadCourts = async () => {
    try {
      const response = await reservasService.obtenerPistas();
      if (response.success) {
        setCourts(response.data);
      }
    } catch (error) {
      console.error('Error al cargar pistas:', error);
    }
  };

  const getAvailability = async (courtId, date) => {
    try {
      const response = await reservasService.obtenerDisponibilidad(
        courtId,
        date
      );
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Error al obtener disponibilidad' };
    }
  };

  const createReservation = async (reservationData) => {
    try {
      const response = await reservasService.crearReserva({
        ...reservationData,
        usuarioId: user.id,
        usuarioNombre: user.nombre,
        vivienda: user.vivienda,
      });

      if (response.success) {
        // Update reservation list
        setReservations([...reservations, response.data]);
        // Increment version so HomeScreen reloads
        setReservationsVersion((v) => v + 1);

        // Schedule local reminder 1 hour before
        notificationService.scheduleReservationReminder(response.data, 60);

        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Error al crear reserva' };
    }
  };

  const cancelReservation = async (reservationId) => {
    try {
      // Pass apartment to validate user can cancel reservations from their apartment
      const response = await reservasService.cancelarReserva(reservationId, user.id, user.vivienda);
      if (response.success) {
        // Mark reservation as cancelled locally (CancelReservation use case returns void)
        setReservations(
          reservations.map((r) => (r.id === reservationId ? { ...r, estado: 'cancelada' } : r))
        );
        // Increment version so HomeScreen reloads
        setReservationsVersion((v) => v + 1);
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Error al cancelar reserva' };
    }
  };

  const getReservationsByDate = async (date) => {
    try {
      const response = await reservasService.obtenerReservasPorFecha(date);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Error al obtener reservas' };
    }
  };

  // Filter reservations with automatic P→G conversion in real time
  const getUpcomingReservations = () => {
    const now = new Date();

    // Filter only future confirmed ones
    const upcoming = reservations.filter(
      (r) =>
        r.estado === 'confirmada' &&
        new Date(r.fecha + 'T' + r.horaInicio) > now
    );

    // If there's only 1 future reservation, it's always guaranteed
    if (upcoming.length === 1) {
      return upcoming.map(r => ({ ...r, prioridad: 'primera' }));
    }

    // If there's more than 1, apply P→G conversion if there are no guaranteed
    // Consider 'primera' as guaranteed, anything else (null, undefined, 'segunda') as provisional
    const guaranteed = upcoming.filter(r => r.prioridad === 'primera');
    const provisional = upcoming.filter(r => r.prioridad !== 'primera');

    if (guaranteed.length === 0 && provisional.length > 0) {
      // Sort by date/time (earliest first)
      const sortedProvisional = [...provisional].sort((a, b) => {
        const dateA = new Date(a.fecha + 'T' + a.horaInicio);
        const dateB = new Date(b.fecha + 'T' + b.horaInicio);
        return dateA - dateB;
      });

      // The first provisional is converted to guaranteed
      const toConvert = sortedProvisional[0];

      return upcoming.map(r => {
        if (r.id === toConvert.id) {
          return { ...r, prioridad: 'primera' };
        }
        return r;
      });
    }

    return upcoming;
  };

  const getPastReservations = () => {
    const now = new Date();
    return reservations.filter(
      (r) =>
        r.estado === 'completada' ||
        r.estado === 'cancelada' ||
        (r.estado === 'confirmada' &&
          new Date(r.fecha + 'T' + r.horaInicio) <= now)
    );
  };

  const value = {
    reservations,
    courts,
    loading,
    reservationsVersion,
    createReservation,
    cancelReservation,
    getAvailability,
    getReservationsByDate,
    getUpcomingReservations,
    getPastReservations,
    reloadReservations: loadReservations,
  };

  return (
    <ReservationsContext.Provider value={value}>
      {children}
    </ReservationsContext.Provider>
  );
};

export const useReservations = () => {
  const context = useContext(ReservationsContext);
  if (!context) {
    throw new Error('useReservations debe usarse dentro de ReservationsProvider');
  }
  return context;
};
