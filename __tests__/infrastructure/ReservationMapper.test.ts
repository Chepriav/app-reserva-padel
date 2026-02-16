import {
  toDomain,
  toLegacyFormat,
  fromLegacyCreateData,
  toDbInsert,
  priorityToDomain,
  priorityToDb,
  statusToDomain,
  statusToDb,
} from '../../src/infrastructure/supabase/mappers/reservationMapper';

const dbRow = {
  id: 'r-1',
  pista_id: 'court-1',
  pista_nombre: 'Pista 1',
  usuario_id: 'user-1',
  usuario_nombre: 'Test User',
  vivienda: '1-3-B',
  fecha: '2025-12-01',
  hora_inicio: '10:00',
  hora_fin: '11:00',
  duracion: 60,
  estado: 'confirmada',
  prioridad: 'primera',
  jugadores: ['Player A'],
  conversion_timestamp: null,
  conversion_rule: null,
  converted_at: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
};

describe('reservationMapper', () => {
  describe('toDomain', () => {
    it('maps DB row to domain entity with English fields', () => {
      const r = toDomain(dbRow);
      expect(r.id).toBe('r-1');
      expect(r.courtId).toBe('court-1');
      expect(r.courtName).toBe('Pista 1');
      expect(r.userId).toBe('user-1');
      expect(r.apartment).toBe('1-3-B');
      expect(r.date).toBe('2025-12-01');
      expect(r.startTime).toBe('10:00');
      expect(r.endTime).toBe('11:00');
      expect(r.status).toBe('confirmed');
      expect(r.priority).toBe('guaranteed');
      expect(r.players).toEqual(['Player A']);
    });
  });

  describe('toLegacyFormat', () => {
    it('maps domain entity to legacy Spanish camelCase', () => {
      const r = toDomain(dbRow);
      const legacy = toLegacyFormat(r);
      expect(legacy.pistaId).toBe('court-1');
      expect(legacy.pistaNombre).toBe('Pista 1');
      expect(legacy.vivienda).toBe('1-3-B');
      expect(legacy.estado).toBe('confirmada');
      expect(legacy.prioridad).toBe('primera');
    });
  });

  describe('roundtrip DB → domain → legacy', () => {
    it('preserves all data', () => {
      const legacy = toLegacyFormat(toDomain(dbRow));
      expect(legacy.pistaId).toBe(dbRow.pista_id);
      expect(legacy.pistaNombre).toBe(dbRow.pista_nombre);
      expect(legacy.vivienda).toBe(dbRow.vivienda);
      expect(legacy.fecha).toBe(dbRow.fecha);
      expect(legacy.horaInicio).toBe(dbRow.hora_inicio);
      expect(legacy.horaFin).toBe(dbRow.hora_fin);
      expect(legacy.estado).toBe(dbRow.estado);
      expect(legacy.prioridad).toBe(dbRow.prioridad);
    });
  });

  describe('fromLegacyCreateData', () => {
    it('maps legacy create data to domain CreateReservationData', () => {
      const legacy = {
        pistaId: 'court-1',
        usuarioId: 'user-1',
        usuarioNombre: 'Test User',
        vivienda: '1-3-B',
        fecha: '2025-12-01',
        horaInicio: '10:00',
        horaFin: '11:00',
        jugadores: [],
        forzarDesplazamiento: false,
      };
      const data = fromLegacyCreateData(legacy);
      expect(data.courtId).toBe('court-1');
      expect(data.userId).toBe('user-1');
      expect(data.apartment).toBe('1-3-B');
      expect(data.date).toBe('2025-12-01');
      expect(data.startTime).toBe('10:00');
      expect(data.endTime).toBe('11:00');
      expect(data.forceDisplacement).toBe(false);
    });
  });

  describe('toDbInsert', () => {
    it('creates DB insert row with correct fields', () => {
      const data = {
        courtId: 'court-1',
        userId: 'user-1',
        userName: 'Test',
        apartment: '1-3-B',
        date: '2025-12-01',
        startTime: '10:00',
        endTime: '10:30',
        players: [],
      };
      const row = toDbInsert(data, 'Pista 1', 'guaranteed');
      expect(row.pista_id).toBe('court-1');
      expect(row.vivienda).toBe('1-3-B');
      expect(row.duracion).toBe(30);
      expect(row.estado).toBe('confirmada');
      expect(row.prioridad).toBe('primera');
    });
  });

  describe('enum translators', () => {
    it('translates priority to domain', () => {
      expect(priorityToDomain('primera')).toBe('guaranteed');
      expect(priorityToDomain('segunda')).toBe('provisional');
      expect(priorityToDomain(null)).toBe('guaranteed'); // default
    });

    it('translates priority to DB', () => {
      expect(priorityToDb('guaranteed')).toBe('primera');
      expect(priorityToDb('provisional')).toBe('segunda');
    });

    it('translates status to domain', () => {
      expect(statusToDomain('confirmada')).toBe('confirmed');
      expect(statusToDomain('cancelada')).toBe('cancelled');
      expect(statusToDomain('completada')).toBe('completed');
    });

    it('translates status to DB', () => {
      expect(statusToDb('confirmed')).toBe('confirmada');
      expect(statusToDb('cancelled')).toBe('cancelada');
      expect(statusToDb('completed')).toBe('completada');
    });
  });
});
