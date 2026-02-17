import {
  toDomain as notificationToDomain,
  toLegacyFormat as notificationToLegacy,
  notificationTypeToDomain,
  notificationTypeToDb,
} from '@infrastructure/supabase/mappers/userNotificationMapper';
import {
  toDomain as announcementToDomain,
  toLegacyFormat as announcementToLegacy,
  announcementTypeToDomain,
  announcementTypeToDb,
  recipientsToDomain,
  recipientsToDb,
} from '@infrastructure/supabase/mappers/announcementMapper';

// ---- Shared test data ----

const makeNotificationRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'notif-1',
  usuario_id: 'user-1',
  tipo: 'desplazamiento',
  titulo: 'Reserva desplazada',
  mensaje: 'Tu reserva ha sido desplazada',
  datos: { reservaId: 'res-1' },
  leida: false,
  expira_en: '2027-01-10T00:00:00Z',
  created_at: '2027-01-01T10:00:00Z',
  ...overrides,
});

const makeAnnouncementRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'anuncio-1',
  creador_id: 'admin-1',
  creador_nombre: 'Admin',
  titulo: 'Corte de agua',
  mensaje: 'El agua se cortará el lunes',
  tipo: 'aviso',
  destinatarios: 'todos',
  expira_en: '2027-02-01T00:00:00Z',
  created_at: '2027-01-01T10:00:00Z',
  ...overrides,
});

// ============================================================
// UserNotificationMapper
// ============================================================

describe('UserNotificationMapper — enum translations', () => {
  it('maps all Spanish notification types to domain', () => {
    expect(notificationTypeToDomain('desplazamiento')).toBe('displacement');
    expect(notificationTypeToDomain('bloqueo_cancelacion')).toBe('blockout_cancellation');
    expect(notificationTypeToDomain('partida_solicitud')).toBe('match_request');
    expect(notificationTypeToDomain('clase_solicitud')).toBe('class_request');
    expect(notificationTypeToDomain('partida_aceptada')).toBe('match_accepted');
    expect(notificationTypeToDomain('clase_aceptada')).toBe('class_accepted');
    expect(notificationTypeToDomain('partida_completa')).toBe('match_full');
    expect(notificationTypeToDomain('partida_cancelada')).toBe('match_cancelled');
    expect(notificationTypeToDomain('clase_cancelada')).toBe('class_cancelled');
    expect(notificationTypeToDomain('partida_cancelada_reserva')).toBe('match_cancelled_by_reservation');
    expect(notificationTypeToDomain('clase_cancelada_reserva')).toBe('class_cancelled_by_reservation');
  });

  it('maps all domain notification types to DB', () => {
    expect(notificationTypeToDb('displacement')).toBe('desplazamiento');
    expect(notificationTypeToDb('match_request')).toBe('partida_solicitud');
    expect(notificationTypeToDb('match_cancelled_by_reservation')).toBe('partida_cancelada_reserva');
  });

  it('defaults unknown type to match_request', () => {
    expect(notificationTypeToDomain('unknown_type')).toBe('match_request');
  });
});

describe('UserNotificationMapper — toDomain', () => {
  it('maps DB row to domain entity', () => {
    const n = notificationToDomain(makeNotificationRow());
    expect(n.id).toBe('notif-1');
    expect(n.userId).toBe('user-1');
    expect(n.type).toBe('displacement');
    expect(n.title).toBe('Reserva desplazada');
    expect(n.isRead).toBe(false);
    expect(n.data).toEqual({ reservaId: 'res-1' });
  });

  it('defaults data to empty object when null', () => {
    const n = notificationToDomain(makeNotificationRow({ datos: null }));
    expect(n.data).toEqual({});
  });
});

describe('UserNotificationMapper — toLegacyFormat', () => {
  it('converts domain notification to legacy camelCase Spanish', () => {
    const n = notificationToDomain(makeNotificationRow());
    const legacy = notificationToLegacy(n) as Record<string, unknown>;

    expect(legacy.id).toBe('notif-1');
    expect(legacy.usuarioId).toBe('user-1');
    expect(legacy.tipo).toBe('desplazamiento'); // back to Spanish
    expect(legacy.titulo).toBe('Reserva desplazada');
    expect(legacy.leida).toBe(false);
  });

  it('roundtrip: DB → domain → legacy preserves tipo in Spanish', () => {
    const row = makeNotificationRow({ tipo: 'partida_completa' });
    const legacy = notificationToLegacy(notificationToDomain(row)) as Record<string, unknown>;
    expect(legacy.tipo).toBe('partida_completa');
  });
});

// ============================================================
// AnnouncementMapper
// ============================================================

describe('AnnouncementMapper — enum translations', () => {
  it('maps Spanish announcement types to domain', () => {
    expect(announcementTypeToDomain('info')).toBe('info');
    expect(announcementTypeToDomain('aviso')).toBe('warning');
    expect(announcementTypeToDomain('urgente')).toBe('urgent');
    expect(announcementTypeToDomain('mantenimiento')).toBe('maintenance');
  });

  it('maps domain announcement types to DB', () => {
    expect(announcementTypeToDb('info')).toBe('info');
    expect(announcementTypeToDb('warning')).toBe('aviso');
    expect(announcementTypeToDb('urgent')).toBe('urgente');
    expect(announcementTypeToDb('maintenance')).toBe('mantenimiento');
  });

  it('maps recipient types both ways', () => {
    expect(recipientsToDomain('todos')).toBe('all');
    expect(recipientsToDomain('seleccionados')).toBe('selected');
    expect(recipientsToDb('all')).toBe('todos');
    expect(recipientsToDb('selected')).toBe('seleccionados');
  });

  it('defaults unknown type to info', () => {
    expect(announcementTypeToDomain('unknown')).toBe('info');
  });
});

describe('AnnouncementMapper — toDomain', () => {
  it('maps DB row to domain entity with isRead=false by default', () => {
    const a = announcementToDomain(makeAnnouncementRow());
    expect(a.id).toBe('anuncio-1');
    expect(a.creatorId).toBe('admin-1');
    expect(a.type).toBe('warning');
    expect(a.recipients).toBe('all');
    expect(a.isRead).toBe(false);
  });

  it('maps DB row with explicit isRead=true', () => {
    const a = announcementToDomain(makeAnnouncementRow(), true);
    expect(a.isRead).toBe(true);
  });
});

describe('AnnouncementMapper — toLegacyFormat', () => {
  it('converts domain announcement to legacy camelCase Spanish', () => {
    const a = announcementToDomain(makeAnnouncementRow(), false);
    const legacy = announcementToLegacy(a) as Record<string, unknown>;

    expect(legacy.id).toBe('anuncio-1');
    expect(legacy.creadorId).toBe('admin-1');
    expect(legacy.tipo).toBe('aviso'); // back to Spanish
    expect(legacy.destinatarios).toBe('todos'); // back to Spanish
    expect(legacy.leido).toBe(false);
  });

  it('roundtrip: DB → domain → legacy preserves tipo and destinatarios', () => {
    const row = makeAnnouncementRow({ tipo: 'urgente', destinatarios: 'seleccionados' });
    const legacy = announcementToLegacy(announcementToDomain(row)) as Record<string, unknown>;
    expect(legacy.tipo).toBe('urgente');
    expect(legacy.destinatarios).toBe('seleccionados');
  });
});
