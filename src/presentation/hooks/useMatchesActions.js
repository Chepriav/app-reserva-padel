import { useState } from 'react';
import { partidasService } from '../../services/matchesService';

export function useMatchesActions(userId, onSuccess) {
  const [actionLoading, setActionLoading] = useState(false);

  const createMatch = async (matchData) => {
    setActionLoading(true);
    const result = await partidasService.crearPartida(matchData);
    setActionLoading(false);
    if (result.success) onSuccess?.();
    return result;
  };

  const cancelMatch = async (matchId) => {
    const result = await partidasService.cancelarPartida(matchId, userId);
    if (result.success) onSuccess?.();
    return result;
  };

  const requestToJoin = async (matchId, user) => {
    const result = await partidasService.solicitarUnirse(matchId, user);
    if (result.success) onSuccess?.();
    return result;
  };

  const acceptRequest = async (playerId, matchId) => {
    const result = await partidasService.aceptarSolicitud(playerId, matchId, userId);
    if (result.success) onSuccess?.();
    return result;
  };

  const rejectRequest = async (playerId, matchId) => {
    const result = await partidasService.rechazarSolicitud(playerId, matchId);
    if (result.success) onSuccess?.();
    return result;
  };

  const cancelRequest = async (matchId) => {
    const result = await partidasService.cancelarSolicitud(matchId, userId);
    if (result.success) onSuccess?.();
    return result;
  };

  const leaveMatch = async (matchId) => {
    const result = await partidasService.desapuntarsePartida(matchId, userId);
    if (result.success) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      onSuccess?.();
    }
    return result;
  };

  const editMatch = async (matchId, updates) => {
    setActionLoading(true);
    const result = await partidasService.editarPartida(matchId, userId, updates);
    setActionLoading(false);
    if (result.success) onSuccess?.();
    return result;
  };

  const removePlayer = async (playerId, matchId) => {
    const result = await partidasService.eliminarJugador(playerId, matchId, userId);
    if (result.success) onSuccess?.();
    return result;
  };

  const addPlayerToMatch = async (matchId, playerData) => {
    const result = await partidasService.anadirJugadorAPartida(matchId, userId, playerData);
    if (result.success) onSuccess?.();
    return result;
  };

  const closeClass = async (matchId) => {
    const result = await partidasService.cerrarClase(matchId, userId);
    if (result.success) onSuccess?.();
    return result;
  };

  return {
    actionLoading,
    createMatch, cancelMatch, requestToJoin, acceptRequest, rejectRequest,
    cancelRequest, leaveMatch, editMatch, removePlayer, addPlayerToMatch, closeClass,
  };
}
