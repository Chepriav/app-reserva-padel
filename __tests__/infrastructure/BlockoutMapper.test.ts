import { toDomain, toLegacyFormat } from '../../src/infrastructure/supabase/mappers/blockoutMapper';

const dbRow = {
  id: 'b-1',
  pista_id: 'court-1',
  fecha: '2025-12-15',
  hora_inicio: '12:00',
  hora_fin: '12:30',
  motivo: 'Mantenimiento',
  creado_por: 'user-admin',
  created_at: '2025-01-01T00:00:00Z',
};

describe('blockoutMapper — toDomain', () => {
  it('maps DB row to domain entity with English field names', () => {
    const b = toDomain(dbRow);
    expect(b.id).toBe('b-1');
    expect(b.courtId).toBe('court-1');
    expect(b.date).toBe('2025-12-15');
    expect(b.startTime).toBe('12:00');
    expect(b.endTime).toBe('12:30');
    expect(b.reason).toBe('Mantenimiento');
    expect(b.createdBy).toBe('user-admin');
    expect(b.createdAt).toBe('2025-01-01T00:00:00Z');
  });

  it('maps null motivo to null reason', () => {
    const b = toDomain({ ...dbRow, motivo: null });
    expect(b.reason).toBeNull();
  });

  it('maps undefined motivo to null reason', () => {
    const row = { ...dbRow };
    delete (row as Record<string, unknown>).motivo;
    const b = toDomain(row);
    expect(b.reason).toBeNull();
  });
});

describe('blockoutMapper — toLegacyFormat', () => {
  it('maps domain entity to camelCase legacy format', () => {
    const domain = toDomain(dbRow);
    const legacy = toLegacyFormat(domain);
    expect(legacy.id).toBe('b-1');
    expect(legacy.courtId).toBe('court-1');
    expect(legacy.date).toBe('2025-12-15');
    expect(legacy.startTime).toBe('12:00');
    expect(legacy.endTime).toBe('12:30');
    expect(legacy.reason).toBe('Mantenimiento');
    expect(legacy.createdBy).toBe('user-admin');
  });

  it('roundtrip preserves all data', () => {
    const domain = toDomain(dbRow);
    const legacy = toLegacyFormat(domain);
    expect(legacy.courtId).toBe(dbRow.pista_id);
    expect(legacy.date).toBe(dbRow.fecha);
    expect(legacy.startTime).toBe(dbRow.hora_inicio);
    expect(legacy.endTime).toBe(dbRow.hora_fin);
    expect(legacy.reason).toBe(dbRow.motivo);
    expect(legacy.createdBy).toBe(dbRow.creado_por);
  });
});
