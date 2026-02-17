import type { Match, Player, CreateMatchData, MatchStatus, MatchType, PlayerStatus } from '@domain/entities/Match';
import type { SkillLevel } from '@domain/entities/User';
import { skillLevelToDomain, skillLevelToDb } from './userMapper';

// ---- Enum translations ----

const STATUS_TO_DOMAIN: Record<string, MatchStatus> = {
  buscando: 'searching',
  completa: 'full',
  cancelada: 'cancelled',
};

const STATUS_TO_DB: Record<MatchStatus, string> = {
  searching: 'buscando',
  full: 'completa',
  cancelled: 'cancelada',
};

const TYPE_TO_DOMAIN: Record<string, MatchType> = {
  abierta: 'open',
  con_reserva: 'with_reservation',
};

const TYPE_TO_DB: Record<MatchType, string> = {
  open: 'abierta',
  with_reservation: 'con_reserva',
};

const PLAYER_STATUS_TO_DOMAIN: Record<string, PlayerStatus> = {
  confirmado: 'confirmed',
  pendiente: 'pending',
  rechazado: 'rejected',
};

const PLAYER_STATUS_TO_DB: Record<PlayerStatus, string> = {
  confirmed: 'confirmado',
  pending: 'pendiente',
  rejected: 'rechazado',
};

export function matchStatusToDomain(v: string | null | undefined): MatchStatus {
  return STATUS_TO_DOMAIN[v ?? ''] ?? 'searching';
}
export function matchStatusToDb(v: MatchStatus): string {
  return STATUS_TO_DB[v];
}
export function matchTypeToDomain(v: string | null | undefined): MatchType {
  return TYPE_TO_DOMAIN[v ?? ''] ?? 'open';
}
export function matchTypeToDb(v: MatchType): string {
  return TYPE_TO_DB[v];
}
export function playerStatusToDomain(v: string | null | undefined): PlayerStatus {
  return PLAYER_STATUS_TO_DOMAIN[v ?? ''] ?? 'confirmed';
}
export function playerStatusToDb(v: PlayerStatus): string {
  return PLAYER_STATUS_TO_DB[v];
}

// ---- Row mappers ----

export function playerToDomain(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    matchId: row.partida_id as string,
    userId: (row.usuario_id as string) ?? null,
    userName: row.usuario_nombre as string,
    userApartment: (row.usuario_vivienda as string) ?? null,
    userPhoto: (row.usuario_foto as string) ?? null,
    skillLevel: skillLevelToDomain(row.nivel_juego as string),
    isExternal: (row.es_externo as boolean) ?? false,
    status: playerStatusToDomain(row.estado as string),
    createdAt: row.created_at as string,
  };
}

export function matchToDomain(row: Record<string, unknown>, players: Player[] = []): Match {
  return {
    id: row.id as string,
    creatorId: row.creador_id as string,
    creatorName: row.creador_nombre as string,
    creatorApartment: row.creador_vivienda as string,
    creatorPhoto: (row.creador_foto as string) ?? null,
    creatorLevel: skillLevelToDomain(row.creador_nivel as string),
    reservationId: (row.reserva_id as string) ?? null,
    date: (row.fecha as string) ?? null,
    startTime: (row.hora_inicio as string) ?? null,
    endTime: (row.hora_fin as string) ?? null,
    courtName: (row.pista_nombre as string) ?? null,
    type: matchTypeToDomain(row.tipo as string),
    message: (row.mensaje as string) ?? null,
    preferredLevel: (row.nivel_preferido as string) ?? null,
    status: matchStatusToDomain(row.estado as string),
    isClass: (row.es_clase as boolean) ?? false,
    levels: (row.niveles as string[]) ?? null,
    minParticipants: (row.min_participantes as number) ?? 4,
    maxParticipants: (row.max_participantes as number) ?? 4,
    studentPrice: (row.precio_alumno as number) ?? null,
    groupPrice: (row.precio_grupo as number) ?? null,
    players,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function toDbInsert(data: CreateMatchData): Record<string, unknown> {
  return {
    creador_id: data.creatorId,
    creador_nombre: data.creatorName,
    creador_vivienda: data.creatorApartment,
    reserva_id: data.reservationId ?? null,
    fecha: data.date ?? null,
    hora_inicio: data.startTime ?? null,
    hora_fin: data.endTime ?? null,
    pista_nombre: data.courtName ?? null,
    tipo: data.type ? matchTypeToDb(data.type) : 'abierta',
    mensaje: data.message ?? null,
    nivel_preferido: data.preferredLevel ?? null,
    estado: 'buscando',
    es_clase: data.isClass ?? false,
    niveles: data.levels ?? null,
    min_participantes: data.minParticipants ?? 4,
    max_participantes: data.maxParticipants ?? 4,
    precio_alumno: data.studentPrice ?? null,
    precio_grupo: data.groupPrice ?? null,
  };
}

export function toLegacyFormat(match: Match): Record<string, unknown> {
  return {
    id: match.id,
    creadorId: match.creatorId,
    creadorNombre: match.creatorName,
    creadorVivienda: match.creatorApartment,
    creadorFoto: match.creatorPhoto,
    creadorNivel: match.creatorLevel ? skillLevelToDb(match.creatorLevel) : null,
    reservaId: match.reservationId,
    fecha: match.date,
    horaInicio: match.startTime,
    horaFin: match.endTime,
    pistaNombre: match.courtName,
    tipo: matchTypeToDb(match.type),
    mensaje: match.message,
    nivelPreferido: match.preferredLevel,
    estado: matchStatusToDb(match.status),
    esClase: match.isClass,
    niveles: match.levels,
    minParticipantes: match.minParticipants,
    maxParticipantes: match.maxParticipants,
    precioAlumno: match.studentPrice,
    precioGrupo: match.groupPrice,
    jugadores: match.players.map(playerToLegacy),
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  };
}

export function playerToLegacy(player: Player): Record<string, unknown> {
  return {
    id: player.id,
    partidaId: player.matchId,
    usuarioId: player.userId,
    usuarioNombre: player.userName,
    usuarioVivienda: player.userApartment,
    usuarioFoto: player.userPhoto,
    nivelJuego: player.skillLevel ? skillLevelToDb(player.skillLevel) : null,
    esExterno: player.isExternal,
    estado: playerStatusToDb(player.status),
    createdAt: player.createdAt,
  };
}
