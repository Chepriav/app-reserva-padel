import type { Blockout } from '@domain/entities/Blockout';

export function toDomain(row: Record<string, unknown>): Blockout {
  return {
    id: row.id as string,
    courtId: row.pista_id as string,
    date: row.fecha as string,
    startTime: row.hora_inicio as string,
    endTime: row.hora_fin as string,
    reason: (row.motivo as string) ?? null,
    createdBy: row.creado_por as string,
    createdAt: row.created_at as string,
  };
}

export function toLegacyFormat(blockout: Blockout): Record<string, unknown> {
  return {
    id: blockout.id,
    courtId: blockout.courtId,
    date: blockout.date,
    startTime: blockout.startTime,
    endTime: blockout.endTime,
    reason: blockout.reason,
    createdBy: blockout.createdBy,
    createdAt: blockout.createdAt,
  };
}
