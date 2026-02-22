import {
  toDomain,
  toLegacyFormat,
} from '../../src/infrastructure/supabase/mappers/displacementNotificationMapper';

const dbRow = {
  id: 'dn-1',
  fecha_reserva: '2025-12-10',
  hora_inicio: '09:00',
  hora_fin: '09:30',
  pista_nombre: 'Pista 1',
  desplazado_por_vivienda: '2-4-C',
  created_at: '2025-12-09T08:00:00Z',
};

describe('displacementNotificationMapper — toDomain', () => {
  it('maps DB row to domain entity with English field names', () => {
    const n = toDomain(dbRow);
    expect(n.id).toBe('dn-1');
    expect(n.reservationDate).toBe('2025-12-10');
    expect(n.startTime).toBe('09:00');
    expect(n.endTime).toBe('09:30');
    expect(n.courtName).toBe('Pista 1');
    expect(n.displacedByApartment).toBe('2-4-C');
    expect(n.createdAt).toBe('2025-12-09T08:00:00Z');
  });

  it('does NOT expose DB column names as properties', () => {
    const n = toDomain(dbRow) as Record<string, unknown>;
    expect(n.fecha_reserva).toBeUndefined();
    expect(n.hora_inicio).toBeUndefined();
    expect(n.pista_nombre).toBeUndefined();
    expect(n.desplazado_por_vivienda).toBeUndefined();
  });
});

describe('displacementNotificationMapper — toLegacyFormat', () => {
  it('maps domain entity to camelCase object', () => {
    const domain = toDomain(dbRow);
    const legacy = toLegacyFormat(domain);
    expect(legacy.id).toBe('dn-1');
    expect(legacy.reservationDate).toBe('2025-12-10');
    expect(legacy.startTime).toBe('09:00');
    expect(legacy.endTime).toBe('09:30');
    expect(legacy.courtName).toBe('Pista 1');
    expect(legacy.displacedByApartment).toBe('2-4-C');
    expect(legacy.createdAt).toBe('2025-12-09T08:00:00Z');
  });

  it('roundtrip preserves all data', () => {
    const domain = toDomain(dbRow);
    const legacy = toLegacyFormat(domain);
    expect(legacy.reservationDate).toBe(dbRow.fecha_reserva);
    expect(legacy.startTime).toBe(dbRow.hora_inicio);
    expect(legacy.endTime).toBe(dbRow.hora_fin);
    expect(legacy.courtName).toBe(dbRow.pista_nombre);
    expect(legacy.displacedByApartment).toBe(dbRow.desplazado_por_vivienda);
  });
});
