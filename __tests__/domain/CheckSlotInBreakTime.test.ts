import { CheckSlotInBreakTime } from '../../src/domain/useCases/CheckSlotInBreakTime';
import { DEFAULT_SCHEDULE_CONFIG } from '../../src/domain/entities/ScheduleConfig';
import type { ScheduleConfig } from '../../src/domain/entities/ScheduleConfig';

describe('CheckSlotInBreakTime', () => {
  const useCase = new CheckSlotInBreakTime();

  const configWithBreak: ScheduleConfig = {
    ...DEFAULT_SCHEDULE_CONFIG,
    breakStart: '14:00',
    breakEnd: '15:00',
  };

  // Wednesday = day 3
  const wednesday = new Date('2025-01-15T12:00:00');
  // Saturday = day 6
  const saturday = new Date('2025-01-18T12:00:00');

  describe('no break configured', () => {
    it('returns false when no break is set', () => {
      const result = useCase.execute(
        { start: '14:00', end: '14:30' },
        DEFAULT_SCHEDULE_CONFIG,
        wednesday,
      );
      expect(result).toBe(false);
    });
  });

  describe('slot overlaps with break', () => {
    it('detects slot starting during break', () => {
      expect(
        useCase.execute({ start: '14:15', end: '14:45' }, configWithBreak, wednesday),
      ).toBe(true);
    });

    it('detects slot ending during break', () => {
      expect(
        useCase.execute({ start: '13:30', end: '14:15' }, configWithBreak, wednesday),
      ).toBe(true);
    });

    it('detects slot containing entire break', () => {
      expect(
        useCase.execute({ start: '13:00', end: '16:00' }, configWithBreak, wednesday),
      ).toBe(true);
    });

    it('detects slot exactly matching break', () => {
      expect(
        useCase.execute({ start: '14:00', end: '15:00' }, configWithBreak, wednesday),
      ).toBe(true);
    });
  });

  describe('slot does not overlap', () => {
    it('slot before break', () => {
      expect(
        useCase.execute({ start: '12:00', end: '12:30' }, configWithBreak, wednesday),
      ).toBe(false);
    });

    it('slot after break', () => {
      expect(
        useCase.execute({ start: '15:00', end: '15:30' }, configWithBreak, wednesday),
      ).toBe(false);
    });

    it('slot ending exactly at break start', () => {
      expect(
        useCase.execute({ start: '13:30', end: '14:00' }, configWithBreak, wednesday),
      ).toBe(false);
    });
  });

  describe('day-of-week filter', () => {
    const configWithDayFilter: ScheduleConfig = {
      ...configWithBreak,
      breakDaysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri only
    };

    it('applies break on matching day', () => {
      expect(
        useCase.execute({ start: '14:00', end: '14:30' }, configWithDayFilter, wednesday),
      ).toBe(true);
    });

    it('skips break on non-matching day', () => {
      expect(
        useCase.execute({ start: '14:00', end: '14:30' }, configWithDayFilter, saturday),
      ).toBe(false);
    });
  });

  describe('differentiated schedules', () => {
    const diffConfig: ScheduleConfig = {
      ...DEFAULT_SCHEDULE_CONFIG,
      useDifferentiatedSchedules: true,
      breakStart: '14:00',
      breakEnd: '15:00',
      weekendBreakStart: '13:00',
      weekendBreakEnd: '14:00',
      weekdayOpeningTime: '08:00',
      weekdayClosingTime: '22:00',
      weekendOpeningTime: '09:00',
      weekendClosingTime: '21:00',
    };

    it('uses weekday break on weekday', () => {
      expect(
        useCase.execute({ start: '14:00', end: '14:30' }, diffConfig, wednesday),
      ).toBe(true);
      expect(
        useCase.execute({ start: '13:00', end: '13:30' }, diffConfig, wednesday),
      ).toBe(false);
    });

    it('uses weekend break on weekend', () => {
      expect(
        useCase.execute({ start: '13:00', end: '13:30' }, diffConfig, saturday),
      ).toBe(true);
      expect(
        useCase.execute({ start: '14:00', end: '14:30' }, diffConfig, saturday),
      ).toBe(false);
    });
  });

  describe('filterSlots', () => {
    const slots = [
      { horaInicio: '12:00', horaFin: '12:30' },
      { horaInicio: '14:00', horaFin: '14:30' },
      { horaInicio: '15:00', horaFin: '15:30' },
    ];

    it('removes slots that overlap with break', () => {
      const filtered = useCase.filterSlots(slots, configWithBreak, wednesday);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].horaInicio).toBe('12:00');
      expect(filtered[1].horaInicio).toBe('15:00');
    });
  });
});
