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

  // Cargar reservas del usuario cuando se autentique
  useEffect(() => {
    if (isAuthenticated && user) {
      cargarReservas();
    } else {
      setReservas([]);
    }
  }, [isAuthenticated, user]);

  // Cargar pistas al iniciar
  useEffect(() => {
    cargarPistas();
  }, []);

  const cargarReservas = async () => {
    if (!user?.vivienda) return;

    setLoading(true);
    try {
      // Cargar todas las reservas de la vivienda (no solo del usuario)
      const response = await reservasService.obtenerReservasPorVivienda(user.vivienda);
      if (response.success) {
        // Aplicar conversión automática P→G si corresponde
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
   * Aplica conversión automática de Provisional a Garantizada
   * Cuando una reserva Garantizada pasa (ya ocurrió), la Provisional más antigua
   * se convierte automáticamente en Garantizada
   */
  const aplicarConversionAutomatica = (reservasOriginales) => {
    const ahora = new Date();

    // Separar reservas futuras confirmadas
    const reservasFuturas = reservasOriginales.filter(r => {
      const fechaReserva = new Date(r.fecha + 'T' + r.horaInicio);
      return r.estado === 'confirmada' && fechaReserva > ahora;
    });

    // Contar reservas garantizadas futuras
    const garantizadasFuturas = reservasFuturas.filter(r => r.prioridad === 'primera');
    const provisionalesFuturas = reservasFuturas.filter(r => r.prioridad === 'segunda');

    // Si no hay ninguna garantizada futura pero hay provisionales,
    // la provisional más antigua se convierte a garantizada
    if (garantizadasFuturas.length === 0 && provisionalesFuturas.length > 0) {
      // Ordenar provisionales por fecha/hora (la más próxima primero)
      const provisionalesOrdenadas = [...provisionalesFuturas].sort((a, b) => {
        const fechaA = new Date(a.fecha + 'T' + a.horaInicio);
        const fechaB = new Date(b.fecha + 'T' + b.horaInicio);
        return fechaA - fechaB;
      });

      // La primera provisional se convierte a garantizada
      const aConvertir = provisionalesOrdenadas[0];

      // Devolver reservas con la conversión aplicada
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
        // Actualizar lista de reservas
        setReservas([...reservas, response.data]);
        // Incrementar versión para que HomeScreen recargue
        setReservasVersion((v) => v + 1);

        // Programar recordatorio local 1 hora antes
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
      // Pasar vivienda para validar que el usuario puede cancelar reservas de su vivienda
      const response = await reservasService.cancelarReserva(reservaId, user.id, user.vivienda);
      if (response.success) {
        // Actualizar lista de reservas
        setReservas(
          reservas.map((r) => (r.id === reservaId ? response.data : r))
        );
        // Incrementar versión para que HomeScreen recargue
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

  // Filtrar reservas con conversión automática P→G en tiempo real
  const getReservasProximas = () => {
    const ahora = new Date();

    // Filtrar solo las futuras confirmadas
    const proximas = reservas.filter(
      (r) =>
        r.estado === 'confirmada' &&
        new Date(r.fecha + 'T' + r.horaInicio) > ahora
    );

    // Si solo hay 1 reserva futura, siempre es garantizada
    if (proximas.length === 1) {
      return proximas.map(r => ({ ...r, prioridad: 'primera' }));
    }

    // Si hay más de 1, aplicar conversión P→G si no hay garantizadas
    // Considerar 'primera' como garantizada, cualquier otra cosa (null, undefined, 'segunda') como provisional
    const garantizadas = proximas.filter(r => r.prioridad === 'primera');
    const provisionales = proximas.filter(r => r.prioridad !== 'primera');

    if (garantizadas.length === 0 && provisionales.length > 0) {
      // Ordenar por fecha/hora (la más próxima primero)
      const provisionalesOrdenadas = [...provisionales].sort((a, b) => {
        const fechaA = new Date(a.fecha + 'T' + a.horaInicio);
        const fechaB = new Date(b.fecha + 'T' + b.horaInicio);
        return fechaA - fechaB;
      });

      // La primera provisional se convierte a garantizada
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
