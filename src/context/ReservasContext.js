import React, { createContext, useState, useContext, useEffect } from 'react';
import { reservasService } from '../services/reservasService.firebase';
import { useAuth } from './AuthContext';

const ReservasContext = createContext(null);

export const ReservasProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [pistas, setPistas] = useState([]);
  const [loading, setLoading] = useState(false);

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
    if (!user) return;

    setLoading(true);
    try {
      const response = await reservasService.obtenerReservasUsuario(user.id);
      if (response.success) {
        setReservas(response.data);
      }
    } catch (error) {
      console.error('Error al cargar reservas:', error);
    } finally {
      setLoading(false);
    }
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
      });

      if (response.success) {
        // Actualizar lista de reservas
        setReservas([...reservas, response.data]);
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Error al crear reserva' };
    }
  };

  const cancelarReserva = async (reservaId) => {
    try {
      const response = await reservasService.cancelarReserva(reservaId, user.id);
      if (response.success) {
        // Actualizar lista de reservas
        setReservas(
          reservas.map((r) => (r.id === reservaId ? response.data : r))
        );
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

  // Filtrar reservas
  const getReservasProximas = () => {
    const ahora = new Date();
    return reservas.filter(
      (r) =>
        r.estado === 'confirmada' &&
        new Date(r.fecha + 'T' + r.horaInicio) > ahora
    );
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
