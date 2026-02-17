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
      usersMap[u.id] = { foto: u.foto_perfil ?? null, nivel: u.nivel_juego ?? null };
    });

    return matches.map((m) => ({
      ...m,
      creatorPhoto: usersMap[m.creatorId]?.foto ?? m.creatorPhoto,
      creatorLevel: usersMap[m.creatorId]?.nivel
        ? skillLevelToDomain(usersMap[m.creatorId].nivel)
        : m.creatorLevel,
    }));
  } catch {
    return matches;
  }
}

export const partidasService = {
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
        map[u.id] = { foto: u.foto_perfil ?? null, nivel: u.nivel_juego ?? null };
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

  async getMyMatches(usuarioId) {
    const result = await getMyMatchesUC.execute(usuarioId);
    if (!result.success) return toFail(result.error);

    const enriched = await enrichCreatorData(result.value);
    return { success: true, data: enriched.map(toLegacyFormat) };
  },

  async getEnrolledMatches(usuarioId) {
    const result = await getEnrolledMatchesUC.execute(usuarioId);
    if (!result.success) return toFail(result.error);

    const enriched = await enrichCreatorData(result.value);
    return { success: true, data: enriched.map(toLegacyFormat) };
  },

  async getReservationsWithMatch(usuarioId) {
    const result = await getReservationsWithMatchUC.execute(usuarioId);
    if (!result.success) return toFail(result.error);
    return { success: true, data: result.value };
  },

  // ---- Match CRUD ----

  async createMatch(partidaData) {
    const {
      creadorId, creadorNombre, creadorVivienda,
      reservaId, fecha, horaInicio, horaFin, pistaNombre,
      tipo, mensaje, nivelPreferido,
      jugadoresIniciales,
      esClase, niveles, minParticipantes, maxParticipantes,
      precioAlumno, precioGrupo,
    } = partidaData;

    const initialPlayers = (jugadoresIniciales ?? []).map((j) => ({
      userId: j.tipo === 'urbanizacion' ? (j.usuario?.id ?? null) : null,
      userName: j.nombre,
      userApartment: j.tipo === 'urbanizacion' ? (j.vivienda ?? null) : null,
      skillLevel: j.nivel ? skillLevelToDomain(j.nivel) : null,
      isExternal: j.tipo === 'externo',
      userPhoto: null,
      status: 'confirmed',
    }));

    const domainData = {
      creatorId: creadorId,
      creatorName: creadorNombre,
      creatorApartment: creadorVivienda,
      reservationId: reservaId ?? null,
      date: fecha ?? null,
      startTime: horaInicio ?? null,
      endTime: horaFin ?? null,
      courtName: pistaNombre ?? null,
      type: tipo === 'con_reserva' ? 'with_reservation' : 'open',
      message: mensaje ?? null,
      preferredLevel: nivelPreferido ?? null,
      isClass: esClase ?? false,
      levels: (niveles?.length > 0) ? niveles : null,
      minParticipants: esClase ? (minParticipantes ?? 2) : 4,
      maxParticipants: esClase ? (maxParticipantes ?? 8) : 4,
      studentPrice: precioAlumno ?? null,
      groupPrice: precioGrupo ?? null,
      initialPlayers,
    };

    const result = await createMatchUC.execute(domainData);
    if (!result.success) return toFail(result.error);
    return { success: true, data: toLegacyFormat(result.value) };
  },

  async editMatch(partidaId, creadorId, updates) {
    const domainUpdates = {};
    if (updates.mensaje !== undefined) domainUpdates.message = updates.mensaje;
    if (updates.nivelPreferido !== undefined) domainUpdates.preferredLevel = updates.nivelPreferido;
    if (updates.fecha !== undefined) domainUpdates.date = updates.fecha;
    if (updates.horaInicio !== undefined) domainUpdates.startTime = updates.horaInicio;
    if (updates.horaFin !== undefined) domainUpdates.endTime = updates.horaFin;
    if (updates.pistaNombre !== undefined) domainUpdates.courtName = updates.pistaNombre;
    if (updates.reservaId !== undefined) {
      domainUpdates.reservationId = updates.reservaId;
      domainUpdates.type = updates.reservaId ? 'with_reservation' : 'open';
    }
    if (updates.niveles !== undefined) domainUpdates.levels = updates.niveles;
    if (updates.minParticipantes !== undefined) domainUpdates.minParticipants = updates.minParticipantes;
    if (updates.maxParticipantes !== undefined) domainUpdates.maxParticipants = updates.maxParticipantes;
    if (updates.precioAlumno !== undefined) domainUpdates.studentPrice = updates.precioAlumno;
    if (updates.precioGrupo !== undefined) domainUpdates.groupPrice = updates.precioGrupo;

    const result = await editMatchUC.execute(partidaId, creadorId, domainUpdates);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async cancelMatch(partidaId, creadorId) {
    const result = await cancelMatchUC.execute(partidaId, creadorId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async deleteMatch(partidaId, creadorId) {
    const result = await deleteMatchUC.execute(partidaId, creadorId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async closeClass(partidaId, creadorId) {
    const result = await closeClassUC.execute(partidaId, creadorId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  // ---- Player operations ----

  async requestToJoin(partidaId, usuario) {
    const playerData = {
      userId: usuario.id,
      userName: usuario.nombre,
      userApartment: usuario.vivienda ?? null,
      skillLevel: usuario.nivelJuego ? skillLevelToDomain(usuario.nivelJuego) : null,
      isExternal: false,
    };

    const result = await requestToJoinUC.execute(partidaId, playerData);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async acceptRequest(jugadorId, partidaId, creadorId) {
    // jugadorId is usuario_id in legacy — resolve to player row id
    const playerResult = await playerRepository.findByMatchAndUser(partidaId, jugadorId);
    if (!playerResult.success) return toFail(playerResult.error);
    if (!playerResult.value) return { success: false, error: 'Jugador no encontrado' };

    const result = await acceptRequestUC.execute(playerResult.value.id, partidaId, creadorId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async rejectRequest(jugadorId, partidaId) {
    // jugadorId is usuario_id in legacy — resolve to player row id
    const playerResult = await playerRepository.findByMatchAndUser(partidaId, jugadorId);
    if (!playerResult.success) return toFail(playerResult.error);
    if (!playerResult.value) return { success: false, error: 'Jugador no encontrado' };

    const matchResult = await matchRepository.findById(partidaId);
    if (!matchResult.success) return toFail(matchResult.error);
    if (!matchResult.value) return { success: false, error: ERROR_MESSAGES.MATCH_NOT_FOUND };

    const result = await rejectRequestUC.execute(
      playerResult.value.id,
      partidaId,
      matchResult.value.creatorId,
    );
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async cancelRequest(partidaId, usuarioId) {
    const result = await cancelRequestUC.execute(partidaId, usuarioId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async leaveMatch(partidaId, usuarioId) {
    const result = await leaveMatchUC.execute(partidaId, usuarioId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  async addPlayerToMatch(partidaId, creadorId, jugadorData) {
    const playerData = {
      userId: jugadorData.usuarioId ?? null,
      userName: jugadorData.usuarioNombre,
      userApartment: jugadorData.usuarioVivienda ?? null,
      skillLevel: jugadorData.nivelJuego ? skillLevelToDomain(jugadorData.nivelJuego) : null,
      isExternal: jugadorData.esExterno ?? false,
    };

    const result = await addPlayerToMatchUC.execute(partidaId, creadorId, playerData);
    if (!result.success) return toFail(result.error);
    return { success: true, data: playerToLegacy(result.value) };
  },

  async removePlayer(jugadorId, partidaId, creadorId) {
    // jugadorId is the partidas_jugadores row ID (not usuario_id)
    const result = await removePlayerUC.execute(jugadorId, partidaId, creadorId);
    if (!result.success) return toFail(result.error);
    return { success: true };
  },

  // ---- Match cancellation via reservation ----

  async cancelMatchByReservation(reservaId, motivo = 'reserva_cancelada') {
    const result = await cancelMatchByReservationUC.execute(reservaId, motivo);
    if (!result.success) return { success: true, hadPartida: false }; // Non-critical
    return {
      success: true,
      hadPartida: result.value.hadMatch,
      partidaId: result.value.matchId,
    };
  },

  // ============================================================================
  // LEGACY ALIASES - For backwards compatibility
  // ============================================================================
  obtenerFotoUsuario(...args) { return this.getUserPhoto(...args); },
  obtenerDatosUsuarios(...args) { return this.getUsersData(...args); },
  obtenerPartidasActivas(...args) { return this.getActiveMatches(...args); },
  obtenerMisPartidas(...args) { return this.getMyMatches(...args); },
  obtenerPartidasApuntado(...args) { return this.getEnrolledMatches(...args); },
  crearPartida(...args) { return this.createMatch(...args); },
  solicitarUnirse(...args) { return this.requestToJoin(...args); },
  aceptarSolicitud(...args) { return this.acceptRequest(...args); },
  rechazarSolicitud(...args) { return this.rejectRequest(...args); },
  desapuntarsePartida(...args) { return this.leaveMatch(...args); },
  cancelarPartida(...args) { return this.cancelMatch(...args); },
  eliminarPartida(...args) { return this.deleteMatch(...args); },
  obtenerReservasConPartida(...args) { return this.getReservationsWithMatch(...args); },
  cancelarSolicitud(...args) { return this.cancelRequest(...args); },
  editarPartida(...args) { return this.editMatch(...args); },
  anadirJugadorAPartida(...args) { return this.addPlayerToMatch(...args); },
  eliminarJugador(...args) { return this.removePlayer(...args); },
  cerrarClase(...args) { return this.closeClass(...args); },
  cancelarPartidaPorReserva(...args) { return this.cancelMatchByReservation(...args); },
};

// Re-export with English name
export { partidasService as matchesService };
