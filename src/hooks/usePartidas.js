import { useState, useEffect, useCallback } from 'react';
import { partidasService } from '../services/partidasService';

/**
 * Hook para gestionar la lógica de partidas
 */
export function usePartidas(userId, tabActivo) {
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarPartidas = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      if (tabActivo === 'disponibles') {
        const result = await partidasService.obtenerPartidasActivas();
        if (result.success) {
          // Filtrar: solo partidas de OTROS usuarios (no las mías)
          const partidasDeOtros = result.data.filter((p) => p.creadorId !== userId);
          setPartidas(partidasDeOtros.map((p) => ({ ...p, esCreador: false })));
        }
      } else {
        const [creadas, apuntado] = await Promise.all([
          partidasService.obtenerMisPartidas(userId),
          partidasService.obtenerPartidasApuntado(userId),
        ]);

        const todas = [];
        if (creadas.success) {
          creadas.data.forEach((p) => {
            p.esCreador = true;
            todas.push(p);
          });
        }
        if (apuntado.success) {
          apuntado.data.forEach((p) => {
            if (!todas.find((t) => t.id === p.id)) {
              p.esCreador = false;
              todas.push(p);
            }
          });
        }
        setPartidas(todas);
      }
    } catch (error) {
      // Error silencioso, el usuario verá lista vacía
    }
    setLoading(false);
  }, [userId, tabActivo]);

  useEffect(() => {
    cargarPartidas();
  }, [cargarPartidas]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarPartidas();
    setRefreshing(false);
  };

  return {
    partidas,
    loading,
    refreshing,
    cargarPartidas,
    onRefresh,
  };
}

/**
 * Hook para las acciones sobre partidas
 */
export function usePartidasActions(userId, onSuccess) {
  const [actionLoading, setActionLoading] = useState(false);

  const crearPartida = async (partidaData) => {
    setActionLoading(true);
    const result = await partidasService.crearPartida(partidaData);
    setActionLoading(false);

    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const cancelarPartida = async (partidaId) => {
    const result = await partidasService.cancelarPartida(partidaId, userId);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const solicitarUnirse = async (partidaId, usuario) => {
    const result = await partidasService.solicitarUnirse(partidaId, usuario);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const aceptarSolicitud = async (jugadorId, partidaId) => {
    const result = await partidasService.aceptarSolicitud(jugadorId, partidaId, userId);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const rechazarSolicitud = async (jugadorId, partidaId) => {
    const result = await partidasService.rechazarSolicitud(jugadorId, partidaId);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const cancelarSolicitud = async (partidaId) => {
    const result = await partidasService.cancelarSolicitud(partidaId, userId);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const desapuntarse = async (partidaId) => {
    const result = await partidasService.desapuntarsePartida(partidaId, userId);
    if (result.success) {
      // Pequeño delay para que Supabase propague el cambio
      await new Promise(resolve => setTimeout(resolve, 300));
      onSuccess?.();
    }
    return result;
  };

  const editarPartida = async (partidaId, updates) => {
    setActionLoading(true);
    const result = await partidasService.editarPartida(partidaId, userId, updates);
    setActionLoading(false);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const eliminarJugador = async (jugadorId, partidaId) => {
    const result = await partidasService.eliminarJugador(jugadorId, partidaId, userId);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const anadirJugadorAPartida = async (partidaId, jugadorData) => {
    const result = await partidasService.anadirJugadorAPartida(partidaId, userId, jugadorData);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  return {
    actionLoading,
    crearPartida,
    cancelarPartida,
    solicitarUnirse,
    aceptarSolicitud,
    rechazarSolicitud,
    cancelarSolicitud,
    desapuntarse,
    editarPartida,
    eliminarJugador,
    anadirJugadorAPartida,
  };
}

/**
 * Hook para gestionar el modal de crear partida
 */
export function useCrearPartidaModal(userId) {
  const [visible, setVisible] = useState(false);
  const [modalState, setModalState] = useState({
    tipo: 'abierta',
    reservaSeleccionada: null,
    mensaje: '',
    nivelPreferido: null,
    saving: false,
  });
  const [jugadores, setJugadores] = useState([]);
  const [reservasConPartida, setReservasConPartida] = useState([]);

  const abrir = async () => {
    setJugadores([]);
    setModalState({
      tipo: 'abierta',
      reservaSeleccionada: null,
      mensaje: '',
      nivelPreferido: null,
      saving: false,
    });

    // Cargar reservas que ya tienen partida
    const result = await partidasService.obtenerReservasConPartida(userId);
    if (result.success) {
      setReservasConPartida(result.data);
    }

    setVisible(true);
  };

  const cerrar = () => {
    setVisible(false);
  };

  const addJugador = (jugador) => {
    if (jugadores.length >= 3) return false;
    setJugadores(prev => [...prev, jugador]);
    return true;
  };

  const removeJugador = (index) => {
    setJugadores(prev => prev.filter((_, i) => i !== index));
  };

  const setSaving = (saving) => {
    setModalState(prev => ({ ...prev, saving }));
  };

  return {
    visible,
    modalState,
    setModalState,
    jugadores,
    reservasConPartida,
    abrir,
    cerrar,
    addJugador,
    removeJugador,
    setSaving,
  };
}

/**
 * Hook para gestionar el modal de añadir jugador
 */
export function useAddJugadorModal(onAddJugador) {
  const [visible, setVisible] = useState(false);
  const [modalState, setModalState] = useState({
    tipo: 'urbanizacion',
    busqueda: '',
    nombreExterno: '',
    nivelExterno: null,
  });

  const abrir = () => {
    setModalState({
      tipo: 'urbanizacion',
      busqueda: '',
      nombreExterno: '',
      nivelExterno: null,
    });
    setVisible(true);
  };

  const cerrar = () => {
    setVisible(false);
  };

  const addUrbanizacion = (usuario) => {
    const jugador = {
      tipo: 'urbanizacion',
      usuario,
      nombre: usuario.nombre,
      vivienda: usuario.vivienda,
      nivel: usuario.nivelJuego,
    };

    if (onAddJugador(jugador)) {
      cerrar();
      return true;
    }
    return false;
  };

  const addExterno = () => {
    const { nombreExterno, nivelExterno } = modalState;

    if (!nombreExterno.trim()) {
      return { success: false, error: 'Introduce el nombre del jugador' };
    }

    const jugador = {
      tipo: 'externo',
      nombre: nombreExterno.trim(),
      vivienda: null,
      nivel: nivelExterno,
    };

    if (onAddJugador(jugador)) {
      cerrar();
      return { success: true };
    }
    return { success: false, error: 'La partida ya está completa' };
  };

  return {
    visible,
    modalState,
    setModalState,
    abrir,
    cerrar,
    addUrbanizacion,
    addExterno,
  };
}
