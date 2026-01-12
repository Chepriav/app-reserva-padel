import { useState, useEffect, useCallback } from 'react';
import { partidasService } from '../services/matchesService';

/**
 * Hook to manage match/game logic
 */
export function useMatches(userId, activeTab) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      if (activeTab === 'disponibles') {
        const result = await partidasService.obtenerPartidasActivas();
        if (result.success) {
          // Filter: only matches from OTHER users (not mine)
          const matchesFromOthers = result.data.filter((p) => p.creadorId !== userId);
          setMatches(matchesFromOthers.map((p) => ({ ...p, esCreador: false })));
        }
      } else {
        const [created, joined] = await Promise.all([
          partidasService.obtenerMisPartidas(userId),
          partidasService.obtenerPartidasApuntado(userId),
        ]);

        const all = [];
        if (created.success) {
          created.data.forEach((p) => {
            p.esCreador = true;
            all.push(p);
          });
        }
        if (joined.success) {
          joined.data.forEach((p) => {
            if (!all.find((t) => t.id === p.id)) {
              p.esCreador = false;
              all.push(p);
            }
          });
        }
        setMatches(all);
      }
    } catch (error) {
      // Silent error, user will see empty list
    }
    setLoading(false);
  }, [userId, activeTab]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  return {
    matches,
    loading,
    refreshing,
    loadMatches,
    onRefresh,
  };
}

/**
 * Hook for match actions
 */
export function useMatchesActions(userId, onSuccess) {
  const [actionLoading, setActionLoading] = useState(false);

  const createMatch = async (matchData) => {
    setActionLoading(true);
    const result = await partidasService.crearPartida(matchData);
    setActionLoading(false);

    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const cancelMatch = async (matchId) => {
    const result = await partidasService.cancelarPartida(matchId, userId);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const requestToJoin = async (matchId, user) => {
    const result = await partidasService.solicitarUnirse(matchId, user);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const acceptRequest = async (playerId, matchId) => {
    const result = await partidasService.aceptarSolicitud(playerId, matchId, userId);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const rejectRequest = async (playerId, matchId) => {
    const result = await partidasService.rechazarSolicitud(playerId, matchId);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const cancelRequest = async (matchId) => {
    const result = await partidasService.cancelarSolicitud(matchId, userId);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const leaveMatch = async (matchId) => {
    const result = await partidasService.desapuntarsePartida(matchId, userId);
    if (result.success) {
      // Small delay for Supabase to propagate the change
      await new Promise(resolve => setTimeout(resolve, 300));
      onSuccess?.();
    }
    return result;
  };

  const editMatch = async (matchId, updates) => {
    setActionLoading(true);
    const result = await partidasService.editarPartida(matchId, userId, updates);
    setActionLoading(false);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const removePlayer = async (playerId, matchId) => {
    const result = await partidasService.eliminarJugador(playerId, matchId, userId);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const addPlayerToMatch = async (matchId, playerData) => {
    const result = await partidasService.anadirJugadorAPartida(matchId, userId, playerData);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  const closeClass = async (matchId) => {
    const result = await partidasService.cerrarClase(matchId, userId);
    if (result.success) {
      onSuccess?.();
    }
    return result;
  };

  return {
    actionLoading,
    createMatch,
    cancelMatch,
    requestToJoin,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    leaveMatch,
    editMatch,
    removePlayer,
    addPlayerToMatch,
    closeClass,
  };
}

/**
 * Hook to manage the create match/class modal
 */
export function useCreateMatchModal(userId) {
  const [visible, setVisible] = useState(false);
  const [modalState, setModalState] = useState({
    type: 'abierta',
    selectedReservation: null,
    message: '',
    preferredLevel: null,
    saving: false,
    // Class fields
    isClass: false,
    levels: [],
    minParticipants: 2,
    maxParticipants: 8,
    pricePerStudent: '',
    pricePerGroup: '',
  });
  const [players, setPlayers] = useState([]);
  const [reservationsWithMatch, setReservationsWithMatch] = useState([]);

  const open = async () => {
    setPlayers([]);
    setModalState({
      type: 'abierta',
      selectedReservation: null,
      message: '',
      preferredLevel: null,
      saving: false,
      // Class fields
      isClass: false,
      levels: [],
      minParticipants: 2,
      maxParticipants: 8,
      pricePerStudent: '',
      pricePerGroup: '',
    });

    // Load reservations that already have a match
    const result = await partidasService.obtenerReservasConPartida(userId);
    if (result.success) {
      setReservationsWithMatch(result.data);
    }

    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  const addPlayer = (player) => {
    // For classes: max is maxParticipants - 1 (creator counts as 1)
    // For matches: max is 3 (creator + 3 = 4)
    const maxPlayers = modalState.isClass ? modalState.maxParticipants - 1 : 3;
    if (players.length >= maxPlayers) return false;
    setPlayers(prev => [...prev, player]);
    return true;
  };

  const removePlayer = (index) => {
    setPlayers(prev => prev.filter((_, i) => i !== index));
  };

  const setSaving = (saving) => {
    setModalState(prev => ({ ...prev, saving }));
  };

  return {
    visible,
    modalState,
    setModalState,
    players,
    reservationsWithMatch,
    open,
    close,
    addPlayer,
    removePlayer,
    setSaving,
  };
}

/**
 * Hook to manage the add player modal
 */
export function useAddPlayerModal(onAddPlayer) {
  const [visible, setVisible] = useState(false);
  const [modalState, setModalState] = useState({
    type: 'community',
    search: '',
    externalName: '',
    externalLevel: null,
  });

  const open = () => {
    setModalState({
      type: 'community',
      search: '',
      externalName: '',
      externalLevel: null,
    });
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  const addCommunityUser = (user) => {
    const player = {
      tipo: 'urbanizacion',
      usuario: user,
      nombre: user.nombre,
      vivienda: user.vivienda,
      nivel: user.nivelJuego,
    };

    if (onAddPlayer(player)) {
      close();
      return true;
    }
    return false;
  };

  const addExternalPlayer = () => {
    const { externalName, externalLevel } = modalState;

    if (!externalName.trim()) {
      return { success: false, error: 'Introduce el nombre del jugador' };
    }

    const player = {
      tipo: 'externo',
      nombre: externalName.trim(),
      vivienda: null,
      nivel: externalLevel,
    };

    if (onAddPlayer(player)) {
      close();
      return { success: true };
    }
    return { success: false, error: 'La partida ya está completa' };
  };

  return {
    visible,
    modalState,
    setModalState,
    open,
    close,
    addCommunityUser,
    addExternalPlayer,
  };
}
