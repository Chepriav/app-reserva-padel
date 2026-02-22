import { useState } from 'react';
import { matchesService } from '../../services/matchesService';

export function useMatchesActions(userId, onSuccess) {
  const [actionLoading, setActionLoading] = useState(false);

  const createMatch = async (matchData) => {
    setActionLoading(true);
    const result = await matchesService.createMatch(matchData);
    setActionLoading(false);
    if (result.success) onSuccess?.();
    return result;
  };

  const cancelMatch = async (matchId) => {
    const result = await matchesService.cancelMatch(matchId, userId);
    if (result.success) onSuccess?.();
    return result;
  };

  const requestToJoin = async (matchId, user) => {
    const result = await matchesService.requestToJoin(matchId, user);
    if (result.success) onSuccess?.();
    return result;
  };

  const acceptRequest = async (playerId, matchId) => {
    const result = await matchesService.acceptRequest(playerId, matchId, userId);
    if (result.success) onSuccess?.();
    return result;
  };

  const rejectRequest = async (playerId, matchId) => {
    const result = await matchesService.rejectRequest(playerId, matchId);
    if (result.success) onSuccess?.();
    return result;
  };

  const cancelRequest = async (matchId) => {
    const result = await matchesService.cancelRequest(matchId, userId);
    if (result.success) onSuccess?.();
    return result;
  };

  const leaveMatch = async (matchId) => {
    const result = await matchesService.leaveMatch(matchId, userId);
    if (result.success) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      onSuccess?.();
    }
    return result;
  };

  const editMatch = async (matchId, updates) => {
    setActionLoading(true);
    const result = await matchesService.editMatch(matchId, userId, updates);
    setActionLoading(false);
    if (result.success) onSuccess?.();
    return result;
  };

  const removePlayer = async (playerId, matchId) => {
    const result = await matchesService.removePlayer(playerId, matchId, userId);
    if (result.success) onSuccess?.();
    return result;
  };

  const addPlayerToMatch = async (matchId, playerData) => {
    const result = await matchesService.addPlayerToMatch(matchId, userId, playerData);
    if (result.success) onSuccess?.();
    return result;
  };

  const closeClass = async (matchId) => {
    const result = await matchesService.closeClass(matchId, userId);
    if (result.success) onSuccess?.();
    return result;
  };

  return {
    actionLoading,
    createMatch, cancelMatch, requestToJoin, acceptRequest, rejectRequest,
    cancelRequest, leaveMatch, editMatch, removePlayer, addPlayerToMatch, closeClass,
  };
}
