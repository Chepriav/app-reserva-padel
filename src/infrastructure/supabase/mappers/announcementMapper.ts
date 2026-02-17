import type { Announcement, AnnouncementType, AnnouncementRecipients } from '@domain/entities/Announcement';

// ---- Enum translations ----

const TYPE_TO_DOMAIN: Record<string, AnnouncementType> = {
  info: 'info',
  aviso: 'warning',
  urgente: 'urgent',
  mantenimiento: 'maintenance',
};

const TYPE_TO_DB: Record<AnnouncementType, string> = {
  info: 'info',
  warning: 'aviso',
  urgent: 'urgente',
  maintenance: 'mantenimiento',
};

const RECIPIENTS_TO_DOMAIN: Record<string, AnnouncementRecipients> = {
  todos: 'all',
  seleccionados: 'selected',
};

const RECIPIENTS_TO_DB: Record<AnnouncementRecipients, string> = {
  all: 'todos',
  selected: 'seleccionados',
};

export function announcementTypeToDomain(v: string | null | undefined): AnnouncementType {
  return TYPE_TO_DOMAIN[v ?? ''] ?? 'info';
}

export function announcementTypeToDb(v: AnnouncementType): string {
  return TYPE_TO_DB[v];
}

export function recipientsToDomain(v: string | null | undefined): AnnouncementRecipients {
  return RECIPIENTS_TO_DOMAIN[v ?? ''] ?? 'all';
}

export function recipientsToDb(v: AnnouncementRecipients): string {
  return RECIPIENTS_TO_DB[v];
}

// ---- Row mapper ----

export function toDomain(row: Record<string, unknown>, isRead = false): Announcement {
  return {
    id: row.id as string,
    creatorId: row.creador_id as string,
    creatorName: row.creador_nombre as string,
    title: row.titulo as string,
    message: row.mensaje as string,
    type: announcementTypeToDomain(row.tipo as string),
    recipients: recipientsToDomain(row.destinatarios as string),
    expiresAt: row.expira_en as string,
    createdAt: row.created_at as string,
    isRead,
  };
}

export function toLegacyFormat(announcement: Announcement): Record<string, unknown> {
  return {
    id: announcement.id,
    creadorId: announcement.creatorId,
    creadorNombre: announcement.creatorName,
    titulo: announcement.title,
    mensaje: announcement.message,
    tipo: announcementTypeToDb(announcement.type),
    destinatarios: recipientsToDb(announcement.recipients),
    expiraEn: announcement.expiresAt,
    createdAt: announcement.createdAt,
    leido: announcement.isRead,
  };
}
