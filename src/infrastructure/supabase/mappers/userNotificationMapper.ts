import type { UserNotification, NotificationType } from '@domain/entities/UserNotification';

// ---- Enum translations ----

const TYPE_TO_DOMAIN: Record<string, NotificationType> = {
  desplazamiento: 'displacement',
  bloqueo_cancelacion: 'blockout_cancellation',
  partida_solicitud: 'match_request',
  clase_solicitud: 'class_request',
  partida_aceptada: 'match_accepted',
  clase_aceptada: 'class_accepted',
  partida_completa: 'match_full',
  partida_cancelada: 'match_cancelled',
  clase_cancelada: 'class_cancelled',
  partida_cancelada_reserva: 'match_cancelled_by_reservation',
  clase_cancelada_reserva: 'class_cancelled_by_reservation',
};

const TYPE_TO_DB: Record<NotificationType, string> = {
  displacement: 'desplazamiento',
  blockout_cancellation: 'bloqueo_cancelacion',
  match_request: 'partida_solicitud',
  class_request: 'clase_solicitud',
  match_accepted: 'partida_aceptada',
  class_accepted: 'clase_aceptada',
  match_full: 'partida_completa',
  match_cancelled: 'partida_cancelada',
  class_cancelled: 'clase_cancelada',
  match_cancelled_by_reservation: 'partida_cancelada_reserva',
  class_cancelled_by_reservation: 'clase_cancelada_reserva',
};

export function notificationTypeToDomain(v: string | null | undefined): NotificationType {
  return TYPE_TO_DOMAIN[v ?? ''] ?? 'match_request';
}

export function notificationTypeToDb(v: NotificationType): string {
  return TYPE_TO_DB[v];
}

// ---- Row mapper ----

export function toDomain(row: Record<string, unknown>): UserNotification {
  return {
    id: row.id as string,
    userId: row.usuario_id as string,
    type: notificationTypeToDomain(row.tipo as string),
    title: row.titulo as string,
    message: row.mensaje as string,
    data: (row.datos as Record<string, unknown>) ?? {},
    isRead: (row.leida as boolean) ?? false,
    expiresAt: row.expira_en as string,
    createdAt: row.created_at as string,
  };
}

export function toLegacyFormat(notification: UserNotification): Record<string, unknown> {
  return {
    id: notification.id,
    usuarioId: notification.userId,
    tipo: notificationTypeToDb(notification.type),
    titulo: notification.title,
    mensaje: notification.message,
    datos: notification.data,
    leida: notification.isRead,
    expiraEn: notification.expiresAt,
    createdAt: notification.createdAt,
  };
}
