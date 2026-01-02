import React, { createContext, useState, useContext, useEffect } from 'react';
import { reservasService } from '../services/reservasService.supabase';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

const ReservasContext = createContext(null);

export const ReservasProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [pistas, setPistas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reservasVersion, setReservasVersion] = useState(0);

  // Load user reservations when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      cargarReservas();
    } else {
      setReservas([]);
    }
  }, [isAuthenticated, user]);

  // Load courts on init
  useEffect(() => {
    cargarPistas();
  }, []);

  const cargarReservas = async () => {
    if (!user?.vivienda) return;

    setLoading(true);
    try {
      // Load all reservations from the apartment (not just the user)
      const response = await reservasService.obtenerReservasPorVivienda(user.vivienda);
      if (response.success) {
        // Apply automatic P→G conversion if applicable
        const reservasConversion = aplicarConversionAutomatica(response.data);
        setReservas(reservasConversion);
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
  const aplicarConversionAutomatica = (reservasOriginales) => {
    const ahora = new Date();

    // Separate future confirmed reservations
    const reservasFuturas = reservasOriginales.filter(r => {
      const fechaReserva = new Date(r.fecha + 'T' + r.horaInicio);
      return r.estado === 'confirmada' && fechaReserva > ahora;
    });

    // Count future guaranteed reservations
    const garantizadasFuturas = reservasFuturas.filter(r => r.prioridad === 'primera');
    const provisionalesFuturas = reservasFuturas.filter(r => r.prioridad === 'segunda');

    // If there's no future guaranteed but there are provisionals,
    // the oldest provisional is converted to guaranteed
    if (garantizadasFuturas.length === 0 && provisionalesFuturas.length > 0) {
      // Sort provisionals by date/time (earliest first)
      const provisionalesOrdenadas = [...provisionalesFuturas].sort((a, b) => {
        const fechaA = new Date(a.fecha + 'T' + a.horaInicio);
        const fechaB = new Date(b.fecha + 'T' + b.horaInicio);
        return fechaA - fechaB;
      });

      // The first provisional is converted to guaranteed
      const aConvertir = provisionalesOrdenadas[0];

      // Return reservations with conversion applied
      return reservasOriginales.map(r => {
        if (r.id === aConvertir.id) {
          return { ...r, prioridad: 'primera' };
        }
        return r;
      });
    }

    return reservasOriginales;
  };

  const cargarPistas = async () => {
    try {
      const response = await reservasService.obtenerPistas();
      if (response.success) {
        setPistas(response.data);
      }
    } catch (error) {
      console.error('Error al cargar pistas:', error);
    }
  };

  const obtenerDisponibilidad = async (pistaId, fecha) => {
    try {
      const response = await reservasService.obtenerDisponibilidad(
        pistaId,
        fecha
      );
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Error al obtener disponibilidad' };
    }
  };

  const crearReserva = async (reservaData) => {
    try {
      const response = await reservasService.crearReserva({
        ...reservaData,
        usuarioId: user.id,
        usuarioNombre: user.nombre,
        vivienda: user.vivienda,
      });

      if (response.success) {
        // Update reservation list
        setReservas([...reservas, response.data]);
        // Increment version so HomeScreen reloads
        setReservasVersion((v) => v + 1);

        // Schedule local reminder 1 hour before
        notificationService.scheduleReservationReminder(response.data, 60);

        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Error al crear reserva' };
    }
  };

  const cancelarReserva = async (reservaId) => {
    try {
      // Pass apartment to validate user can cancel reservations from their apartment
      const response = await reservasService.cancelarReserva(reservaId, user.id, user.vivienda);
      if (response.success) {
        // Update reservation list
        setReservas(
          reservas.map((r) => (r.id === reservaId ? response.data : r))
        );
        // Increment version so HomeScreen reloads
        setReservasVersion((v) => v + 1);
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Error al cancelar reserva' };
    }
  };

  const obtenerReservasPorFecha = async (fecha) => {
    try {
      const response = await reservasService.obtenerReservasPorFecha(fecha);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Error al obtener reservas' };
    }
  };

  // Filter reservations with automatic P→G conversion in real time
  const getReservasProximas = () => {
    const ahora = new Date();

    // Filter only future confirmed ones
    const proximas = reservas.filter(
      (r) =>
        r.estado === 'confirmada' &&
        new Date(r.fecha + 'T' + r.horaInicio) > ahora
    );

    // If there's only 1 future reservation, it's always guaranteed
    if (proximas.length === 1) {
      return proximas.map(r => ({ ...r, prioridad: 'primera' }));
    }

    // If there's more than 1, apply P→G conversion if there are no guaranteed
    // Consider 'primera' as guaranteed, anything else (null, undefined, 'segunda') as provisional
    const garantizadas = proximas.filter(r => r.prioridad === 'primera');
    const provisionales = proximas.filter(r => r.prioridad !== 'primera');

    if (garantizadas.length === 0 && provisionales.length > 0) {
      // Sort by date/time (earliest first)
      const provisionalesOrdenadas = [...provisionales].sort((a, b) => {
        const fechaA = new Date(a.fecha + 'T' + a.horaInicio);
        const fechaB = new Date(b.fecha + 'T' + b.horaInicio);
        return fechaA - fechaB;
      });

      // The first provisional is converted to guaranteed
      const aConvertir = provisionalesOrdenadas[0];

      return proximas.map(r => {
        if (r.id === aConvertir.id) {
          return { ...r, prioridad: 'primera' };
        }
        return r;
      });
    }

    return proximas;
  };

  const getReservasPasadas = () => {
    const ahora = new Date();
    return reservas.filter(
      (r) =>
        r.estado === 'completada' ||
        r.estado === 'cancelada' ||
        (r.estado === 'confirmada' &&
          new Date(r.fecha + 'T' + r.horaInicio) <= ahora)
    );
  };

  const value = {
    reservas,
    pistas,
    loading,
    reservasVersion,
    crearReserva,
    cancelarReserva,
    obtenerDisponibilidad,
    obtenerReservasPorFecha,
    getReservasProximas,
    getReservasPasadas,
    recargarReservas: cargarReservas,
  };

  return (
    <ReservasContext.Provider value={value}>
      {children}
    </ReservasContext.Provider>
  );
};

export const useReservas = () => {
  const context = useContext(ReservasContext);
  if (!context) {
    throw new Error('useReservas debe usarse dentro de ReservasProvider');
  }
  return context;
};
