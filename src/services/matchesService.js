/**
 * matchesService — thin facade delegating to domain use cases.
 * Maintains the original API shape for backward compatibility.
 */
import { supabase } from './supabaseConfig';
import {
  getActiveMatches as getActiveMatchesUC,
  getMyMatches as getMyMatchesUC,
  getEnrolledMatches as getEnrolledMatchesUC,
  getReservationsWithMatch as getReservationsWithMatchUC,
  createMatch as createMatchUC,
  editMatch as editMatchUC,
  cancelMatch as cancelMatchUC,
  deleteMatch as deleteMatchUC,
  requestToJoin as requestToJoinUC,
  acceptRequest as acceptRequestUC,
  rejectRequest as rejectRequestUC,
  cancelRequest as cancelRequestUC,
  leaveMatch as leaveMatchUC,
  addPlayerToMatch as addPlayerToMatchUC,
  removePlayer as removePlayerUC,
  closeClass as closeClassUC,
  cancelMatchByReservation as cancelMatchByReservationUC,
  playerRepository,
  matchRepository,
} from '@di/container';
import { toLegacyFormat, playerToLegacy } from '@infrastructure/supabase/mappers/matchMapper';
import { skillLevelToDomain } from '@infrastructure/supabase/mappers/userMapper';

// ---- Error translation ----

const ERROR_MESSAGES = {
  MATCH_NOT_FOUND: 'Partida no encontrada',
  MATCH_PERMISSION: 'Solo el creador puede realizar esta acción',
  MATCH_ALREADY_CANCELLED: 'La partida ya está cancelada',
  PLAYER_ALREADY_JOINED: 'Ya tienes una solicitud o estás apuntado a esta partida',
  MATCH_FULL: 'La partida ya está completa',
  INFRASTRUCTURE: 'Error de conexión. Inténtalo de nuevo.',
};

function translateError(appError) {
  return ERROR_MESSAGES[appError?.code] ?? appError?.message ?? 'Error inesperado';
}

function toFail(appError) {
  return { success: false, error: translateError(appError) };
}

// ---- Creator enrichment ----
// Fetches current photo/level from users table to ensure fresh data.

async function enrichCreatorData(matches) {
  if (!matches || matches.length === 0) return matches;

  const creatorIds = [...new Set(matches.map((m) => m.creatorId).filter(Boolean))];
  if (creatorIds.length === 0) return matches;

  try {
    const { data } = await supabase
      .from('users')
      .select('id, foto_perfil, nivel_juego')
      .in('id', creatorIds);

    const usersMap = {};
    (data ?? []).forEach((u) => {
      usersMap[u.id] = { photo: u.foto_perfil ?? null, level: u.nivel_juego ?? null };
    });

    return matches.map((m) => ({
      ...m,
      creatorPhoto: usersMap[m.creatorId]?.photo ?? m.creatorPhoto,
      creatorLevel: usersMap[m.creatorId]?.level
        ? skillLevelToDomain(usersMap[m.creatorId].level)
        : m.creatorLevel,
    }));
  } catch {
    return matches;
  }
}

export const matchesService = {
  // ---- Utility helpers ----

  async getUserPhoto(userId) {
    if (!userId) return null;
    try {
      const { data } = await supabase
        .from('users')
        .select('foto_perfil')
        .eq('id', userId)
        .single();
      return data?.foto_perfil ?? null;
    } catch {
      return null;
    }
  },

  async getUsersData(userIds) {
    if (!userIds || userIds.length === 0) return {};
    try {
      const { data } = await supabase
        .from('users')
        .select('id, foto_perfil, nivel_juego')
        .in('id', userIds);

      const map = {};
      (data ?? []).forEach((u) => {
        map[u.id] = { photo: u.foto_perfil ?? null, level: u.nivel_juego ?? null };
      });
      return map;
    } catch {
      return {};
    }
  },

  // ---- Query operations ----

  async getActiveMatches() {
    const result = await getActiveMatchesUC.execute();
    if (!result.success) return toFail(result.error);

    const enriched = await enrichCreatorData(result.value);
    return { success: true, data: enriched.map(toLegacyFormat) };
  },

  async getMyMatches(userId) {
    const result = await getMyMatchesUC.execute(userId);
    if (!result.success) return toFail(result.error);

    const enriched = await enrichCreatorData(result.value);
    return { success: true, data: enriched.map(toLegacyFormat) };
  },

  async getEnrolledMatches(userId) {
    const result = await getEnrolledMatchesUC.execute(userId);
    if (!result.success) return toFail(result.error);

    const enriched = await enrichCreatorData(result.value);
    return { success: true, data: enriched.map(toLegacyFormat) };
  },

  async getReservationsWithMatch(userId) {
    const result = await getReservationsWithMatchUC.execute(userId);
    if (!result.success) return toFail(result.error);
    return { success: true, data: result.value };
  },

  // ---- Match CRUD ----

  async createMatch(matchData) {
    const {
      creatorId, creatorName, creatorApartment,
      reservationId, date, startTime, endTime, courtName,
      type, message, preferredLevel,
      initialPlayers,
      isLesson, levels, minParticipants, maxParticipants,
      studentPrice, groupPrice,
    } = matchData;

    const normalizedType =
      type === 'con_reserva' ? 'with_reservation' : type === 'abierta' ? 'open' : (type ?? 'open');

    const initialPlayersPayload = (initialPlayers ?? []).map((j) => ({
      userId: j.type === 'urbanizacion' ? (j.user?.id ?? null) : null,
      userName: j.name,
      userApartment: j.type === 'urbanizacion' ? (j.apartment ?? null) : null,
      skillLevel: j.level ? skillLevelToDomain(j.level) : null,
      isExternal: j.type === 'externo',
      userPhoto: null,
      status: 'confirmed',
    }));

    const domainData = {
      creatorId: creatorId,
      creatorName: creatorName,
      creatorApartment: creatorApartment,
      reservationId: reservationId ?? null,
      date: date ?? null,
      startTime: startTime ?? null,
      endTime: endTime ?? null,
      courtName: courtName ?? null,
      type: normalizedType,
      message: message ?? null,
      preferredLevel: preferredLevel ?? null,
      isClass: isLesson ?? false,
      levels: (levels?.length > 0) ? levels : null,
      minParticipants: isLesson ? (minParticipants ?? 2) : 4,
      maxParticipants: isLesson ? (maxParticipants ?? 8) : 4,
      studentPrice: studentPrice ?? null,
      groupPrice: groupPrice ?? null,
      initialPlayers: initialPlayersPayload,
    };

    const result = await createMatchUC.execute(domainData);
    if (!result.success) return toFail(result.error);
    return { success: true, data: toLegacyFormat(result.value) };
  },

  async editMatch(matchId, creatorId, updates) {
    const domainUpdates = {};
    if (updates.message !== undefined) domainUpdates.message = updates.message;
    if (updates.preferredLevel !== undefined) domainUpdates.preferredLevel = updates.preferredLevel;
    if (updates.date !== undefined) domainUpdates.date = updates.date;
    if (updates.startTime !== undefined) domainUpdates.startTime = updates.startTime;
    if (updates.endTime !== undefined) domainUpdates.endTime = updates.endTime;
    if (updates.courtName !== undefined) domainUpdates.courtName = updates.courtName;
    if (updates.reservationId !== undefined) {
      domainUpdates.reservationId = updates.reservationId;
      domainUpdates.type = updates.reservationId ? 'with_reservation' : 'open';
    }
    if (updates.levels !== undefined) domainUpdates.levels = updates.levels;
    if (updates.minParticipants !== undefined) domainUpdates.minParticipants = updates.minParticipants;
    if (updates.maxParticipants !== undefined) domainUpdates.maxParticipants = updates.maxParticipants;
    if (updates.minParticipantes !== undefined) domainUpdates.minParticipants = updates.minParticipantes;
    if (updates.maxParticipantes !== undefined) domainUpdates.maxParticipants = updates.maxParticipantes;
    if (updates.studentPrice !== undefined) domainUpdates.studentPrice = updates.studentPrice;
    if (updates.groupPrice !== undefined) domainUpdates.groupPrice = updates.groupPrice;

    const result = await editMatchUC.execute(matchId, creatorId, domainUpdates);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async cancelMatch(matchId, creatorId) {
    const result = await cancelMatchUC.execute(matchId, creatorId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async deleteMatch(matchId, creatorId) {
    const result = await deleteMatchUC.execute(matchId, creatorId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async closeClass(matchId, creatorId) {
    const result = await closeClassUC.execute(matchId, creatorId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  // ---- Player operations ----

  async requestToJoin(matchId, user) {
    const playerData = {
      userId: user.id,
      userName: user.name,
      userApartment: user.apartment ?? null,
      skillLevel: user.skillLevel ? skillLevelToDomain(user.skillLevel) : null,
      isExternal: false,
    };

    const result = await requestToJoinUC.execute(matchId, playerData);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async acceptRequest(playerId, matchId, creatorId) {
    // jugadorId is usuario_id in legacy — resolve to player row id
    const playerResult = await playerRepository.findByMatchAndUser(matchId, playerId);
    if (!playerResult.success) return toFail(playerResult.error);
    if (!playerResult.value) return { success: false, error: 'Jugador no encontrado' };

    const result = await acceptRequestUC.execute(playerResult.value.id, matchId, creatorId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async rejectRequest(playerId, matchId) {
    // jugadorId is usuario_id in legacy — resolve to player row id
    const playerResult = await playerRepository.findByMatchAndUser(matchId, playerId);
    if (!playerResult.success) return toFail(playerResult.error);
    if (!playerResult.value) return { success: false, error: 'Jugador no encontrado' };

    const matchResult = await matchRepository.findById(matchId);
    if (!matchResult.success) return toFail(matchResult.error);
    if (!matchResult.value) return { success: false, error: ERROR_MESSAGES.MATCH_NOT_FOUND };

    const result = await rejectRequestUC.execute(
      playerResult.value.id,
      matchId,
      matchResult.value.creatorId,
    );
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async cancelRequest(matchId, userId) {
    const result = await cancelRequestUC.execute(matchId, userId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async leaveMatch(matchId, userId) {
    const result = await leaveMatchUC.execute(matchId, userId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async addPlayerToMatch(matchId, creatorId, playerData) {
    const payload = {
      userId: playerData.userId ?? null,
      userName: playerData.userName,
      userApartment: playerData.userApartment ?? null,
      skillLevel: playerData.skillLevel ? skillLevelToDomain(playerData.skillLevel) : null,
      isExternal: playerData.isExternal ?? false,
    };

    const result = await addPlayerToMatchUC.execute(matchId, creatorId, payload);
    if (!result.success) return toFail(result.error);
    return { success: true, data: playerToLegacy(result.value) };
  },

  async removePlayer(playerId, matchId, creatorId) {
    // jugadorId is the partidas_jugadores row ID (not usuario_id)
    const result = await removePlayerUC.execute(playerId, matchId, creatorId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  // ---- Match cancellation via reservation ----

  async cancelMatchByReservation(reservationId, reason = 'reserva_cancelada') {
    const result = await cancelMatchByReservationUC.execute(reservationId, reason);
    if (!result.success) return { success: true, hadMatch: false }; // Non-critical
    return {
      success: true,
      hadMatch: result.value.hadMatch,
      matchId: result.value.matchId,
    };
  },

  // ============================================================================
  // LEGACY ALIASES - For backwards compatibility
  // ============================================================================
  getPhotoUser(...args) { return this.getUserPhoto(...args); },
  getDataUsers(...args) { return this.getUsersData(...args); },
  getMatchesActivas(...args) { return this.getActiveMatches(...args); },
  getMisMatches(...args) { return this.getMyMatches(...args); },
  getMatchesApuntado(...args) { return this.getEnrolledMatches(...args); },
  requestUnirse(...args) { return this.requestToJoin(...args); },
  desapuntarseMatch(...args) { return this.leaveMatch(...args); },
  anadirPlayerAMatch(...args) { return this.addPlayerToMatch(...args); },
  deletePlayer(...args) { return this.removePlayer(...args); },
  closeLesson(...args) { return this.closeClass(...args); },
};
