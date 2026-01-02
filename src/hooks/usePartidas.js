import { useState, useEffect, useCallback } from 'react';
import { partidasService } from '../services/partidasService';

/**
 * Hook to manage match/game logic
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
          // Filter: only matches from OTHER users (not mine)
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
      // Silent error, user will see empty list
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
 * Hook for match actions
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
      // Small delay for Supabase to propagate the change
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

  const cerrarClase = async (partidaId) => {
    const result = await partidasService.cerrarClase(partidaId, userId);
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
    cerrarClase,
  };
}

/**
 * Hook to manage the create match/class modal
 */
export function useCrearPartidaModal(userId) {
  const [visible, setVisible] = useState(false);
  const [modalState, setModalState] = useState({
    tipo: 'abierta',
    reservaSeleccionada: null,
    mensaje: '',
    nivelPreferido: null,
    saving: false,
    // Class fields
    esClase: false,
    niveles: [],
    minParticipantes: 2,
    maxParticipantes: 8,
    precioAlumno: '',
    precioGrupo: '',
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
      // Class fields
      esClase: false,
      niveles: [],
      minParticipantes: 2,
      maxParticipantes: 8,
      precioAlumno: '',
      precioGrupo: '',
    });

    // Load reservations that already have a match
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
    // For classes: max is maxParticipantes - 1 (creator counts as 1)
    // For matches: max is 3 (creator + 3 = 4)
    const maxJugadores = modalState.esClase ? modalState.maxParticipantes - 1 : 3;
    if (jugadores.length >= maxJugadores) return false;
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
 * Hook to manage the add player modal
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
