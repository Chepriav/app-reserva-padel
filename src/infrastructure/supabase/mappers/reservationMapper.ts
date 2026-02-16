import type {
  Reservation,
  CreateReservationData,
  ReservationStatus,
  ReservationPriority,
  ConversionInfo,
} from '@domain/entities/Reservation';

// ---- Enum translations ----

const PRIORITY_TO_DOMAIN: Record<string, ReservationPriority> = {
  primera: 'guaranteed',
  segunda: 'provisional',
};

const PRIORITY_TO_DB: Record<ReservationPriority, string> = {
  guaranteed: 'primera',
  provisional: 'segunda',
};

const STATUS_TO_DOMAIN: Record<string, ReservationStatus> = {
  confirmada: 'confirmed',
  cancelada: 'cancelled',
  completada: 'completed',
};

const STATUS_TO_DB: Record<ReservationStatus, string> = {
  confirmed: 'confirmada',
  cancelled: 'cancelada',
  completed: 'completada',
};

export function priorityToDomain(dbValue: string | null | undefined): ReservationPriority {
  return PRIORITY_TO_DOMAIN[dbValue ?? ''] ?? 'guaranteed';
}

export function priorityToDb(value: ReservationPriority): string {
  return PRIORITY_TO_DB[value];
}

export function statusToDomain(dbValue: string | null | undefined): ReservationStatus {
  return STATUS_TO_DOMAIN[dbValue ?? ''] ?? 'confirmed';
}

export function statusToDb(value: ReservationStatus): string {
  return STATUS_TO_DB[value];
}

// ---- Row mappers ----

export function toDomain(row: Record<string, unknown>): Reservation {
  return {
    id: row.id as string,
    courtId: row.pista_id as string,
    courtName: row.pista_nombre as string,
    userId: row.usuario_id as string,
    userName: row.usuario_nombre as string,
    apartment: row.vivienda as string,
    date: row.fecha as string,
    startTime: row.hora_inicio as string,
    endTime: row.hora_fin as string,
    duration: row.duracion as number,
    status: statusToDomain(row.estado as string),
    priority: priorityToDomain(row.prioridad as string),
    players: (row.jugadores as string[]) ?? [],
    conversionTimestamp: (row.conversion_timestamp as string) ?? null,
    conversionRule: (row.conversion_rule as string) ?? null,
    convertedAt: (row.converted_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function toConversionInfoDomain(row: Record<string, unknown>): ConversionInfo {
  const conversionTimestamp = (row.conversion_timestamp as string) ?? null;
  return {
    id: row.id as string,
    priority: priorityToDomain(row.prioridad as string),
    conversionTimestamp,
    conversionRule: (row.conversion_rule as string) ?? null,
    convertedAt: (row.converted_at as string) ?? null,
    timeRemaining: conversionTimestamp
      ? Math.max(0, new Date(conversionTimestamp).getTime() - Date.now())
      : null,
  };
}

export function toDbInsert(data: CreateReservationData, courtName: string, priority: ReservationPriority): Record<string, unknown> {
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  const duration = (endH * 60 + endM) - (startH * 60 + startM);

  return {
    pista_id: data.courtId,
    pista_nombre: courtName,
    usuario_id: data.userId,
    usuario_nombre: data.userName,
    vivienda: data.apartment,
    fecha: data.date,
    hora_inicio: data.startTime,
    hora_fin: data.endTime,
    duracion: duration,
    estado: 'confirmada',
    prioridad: priorityToDb(priority),
    jugadores: data.players ?? [],
  };
}

export function toLegacyFormat(reservation: Reservation): Record<string, unknown> {
  return {
    id: reservation.id,
    pistaId: reservation.courtId,
    pistaNombre: reservation.courtName,
    usuarioId: reservation.userId,
    usuarioNombre: reservation.userName,
    vivienda: reservation.apartment,
    fecha: reservation.date,
    horaInicio: reservation.startTime,
    horaFin: reservation.endTime,
    duracion: reservation.duration,
    estado: statusToDb(reservation.status),
    prioridad: priorityToDb(reservation.priority),
    jugadores: reservation.players,
    conversionTimestamp: reservation.conversionTimestamp,
    conversionRule: reservation.conversionRule,
    convertedAt: reservation.convertedAt,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
  };
}

export function fromLegacyCreateData(data: Record<string, unknown>): CreateReservationData {
  return {
    courtId: data.pistaId as string,
    userId: data.usuarioId as string,
    userName: data.usuarioNombre as string,
    apartment: data.vivienda as string,
    date: data.fecha as string,
    startTime: data.horaInicio as string,
    endTime: data.horaFin as string,
    players: (data.jugadores as string[]) ?? [],
    forceDisplacement: (data.forzarDesplazamiento as boolean) ?? false,
  };
}
