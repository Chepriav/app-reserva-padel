import {
  toDomain,
  toRpcParams,
  toLegacyFormat,
  fromLegacyFormat,
} from '../../src/infrastructure/supabase/mappers/scheduleConfigMapper';
import { DEFAULT_SCHEDULE_CONFIG } from '../../src/domain/entities/ScheduleConfig';

describe('scheduleConfigMapper', () => {
  const dbRow = {
    hora_apertura: '09:00',
    hora_cierre: '21:00',
    duracion_bloque: 60,
    pausa_inicio: '14:00',
    pausa_fin: '15:00',
    motivo_pausa: 'Almuerzo',
    pausa_dias_semana: [1, 2, 3, 4, 5],
    usar_horarios_diferenciados: true,
    semana_hora_apertura: '08:00',
    semana_hora_cierre: '22:00',
    finde_hora_apertura: '10:00',
    finde_hora_cierre: '20:00',
    finde_pausa_inicio: '13:00',
    finde_pausa_fin: '14:00',
    finde_motivo_pausa: 'Comida finde',
    finde_pausa_dias_semana: [0, 6],
  };

  describe('toDomain', () => {
    it('maps DB row to domain entity', () => {
      const entity = toDomain(dbRow);
      expect(entity.openingTime).toBe('09:00');
      expect(entity.closingTime).toBe('21:00');
      expect(entity.slotDuration).toBe(60);
      expect(entity.breakStart).toBe('14:00');
      expect(entity.breakEnd).toBe('15:00');
      expect(entity.breakReason).toBe('Almuerzo');
      expect(entity.breakDaysOfWeek).toEqual([1, 2, 3, 4, 5]);
      expect(entity.useDifferentiatedSchedules).toBe(true);
      expect(entity.weekdayOpeningTime).toBe('08:00');
      expect(entity.weekendOpeningTime).toBe('10:00');
      expect(entity.weekendBreakStart).toBe('13:00');
      expect(entity.weekendBreakDaysOfWeek).toEqual([0, 6]);
    });

    it('returns default config for null row', () => {
      const entity = toDomain(null);
      expect(entity).toEqual(DEFAULT_SCHEDULE_CONFIG);
    });
  });

  describe('toRpcParams', () => {
    it('maps domain entity to RPC parameters', () => {
      const entity = toDomain(dbRow);
      const params = toRpcParams('user-1', entity);
      expect(params.p_user_id).toBe('user-1');
      expect(params.p_hora_apertura).toBe('09:00');
      expect(params.p_hora_cierre).toBe('21:00');
      expect(params.p_pausa_inicio).toBe('14:00');
      expect(params.p_usar_horarios_diferenciados).toBe(true);
      expect(params.p_finde_hora_apertura).toBe('10:00');
    });
  });

  describe('toLegacyFormat / fromLegacyFormat roundtrip', () => {
    it('converts domain → legacy → domain without data loss', () => {
      const entity = toDomain(dbRow);
      const legacy = toLegacyFormat(entity);
      const roundtripped = fromLegacyFormat(legacy);

      expect(roundtripped).toEqual(entity);
    });

    it('maps to correct Spanish field names', () => {
      const entity = toDomain(dbRow);
      const legacy = toLegacyFormat(entity);
      expect(legacy.horaApertura).toBe('09:00');
      expect(legacy.horaCierre).toBe('21:00');
      expect(legacy.pausaInicio).toBe('14:00');
      expect(legacy.usarHorariosDiferenciados).toBe(true);
      expect(legacy.findeHoraApertura).toBe('10:00');
    });
  });
});
