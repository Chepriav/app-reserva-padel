import type { DisplacementNotification } from '@domain/entities/DisplacementNotification';

export function toDomain(row: Record<string, unknown>): DisplacementNotification {
  return {
    id: row.id as string,
    reservationDate: row.fecha_reserva as string,
    startTime: row.hora_inicio as string,
    endTime: row.hora_fin as string,
    courtName: row.pista_nombre as string,
    displacedByApartment: row.desplazado_por_vivienda as string,
    createdAt: row.created_at as string,
  };
}

export function toLegacyFormat(n: DisplacementNotification): Record<string, unknown> {
  return {
    id: n.id,
    fechaReserva: n.reservationDate,
    horaInicio: n.startTime,
    horaFin: n.endTime,
    pistaNombre: n.courtName,
    desplazadoPorVivienda: n.displacedByApartment,
    createdAt: n.createdAt,
  };
}
