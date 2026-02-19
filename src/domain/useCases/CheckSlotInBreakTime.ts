import type { ScheduleConfig } from '@domain/entities/ScheduleConfig';

interface TimeSlot {
  start: string;
  end: string;
}

/** Convert "HH:MM" to total minutes */
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Pure-logic use case: checks whether a time slot overlaps with
 * the break period for a given date. No external dependencies.
 */
export class CheckSlotInBreakTime {
  /**
   * @returns true if the slot overlaps with the configured break
   */
  execute(slot: TimeSlot, config: ScheduleConfig, date: Date = new Date()): boolean {
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let breakStart: string | null;
    let breakEnd: string | null;
    let breakDays: number[] | null;

    const useDifferentiatedSchedules =
      config.useDifferentiatedSchedules === undefined ||
      config.useDifferentiatedSchedules === null
        ? config.weekendBreakStart != null ||
          config.weekendBreakEnd != null ||
          config.weekendBreakDaysOfWeek != null ||
          config.weekendOpeningTime != null ||
          config.weekendClosingTime != null
        : config.useDifferentiatedSchedules;

    if (useDifferentiatedSchedules) {
      if (isWeekend) {
        breakStart = config.weekendBreakStart;
        breakEnd = config.weekendBreakEnd;
        breakDays = config.weekendBreakDaysOfWeek;
      } else {
        breakStart = config.breakStart;
        breakEnd = config.breakEnd;
        breakDays = config.breakDaysOfWeek;
      }
    } else {
      breakStart = config.breakStart;
      breakEnd = config.breakEnd;
      breakDays = config.breakDaysOfWeek;
    }

    if (!breakStart || !breakEnd) return false;

    if (breakDays && Array.isArray(breakDays) && !breakDays.includes(dayOfWeek)) {
      return false;
    }

    const slotStartMin = timeToMinutes(slot.start);
    const slotEndMin = timeToMinutes(slot.end);
    const breakStartMin = timeToMinutes(breakStart);
    const breakEndMin = timeToMinutes(breakEnd);

    return (
      (slotStartMin >= breakStartMin && slotStartMin < breakEndMin) ||
      (slotEndMin > breakStartMin && slotEndMin <= breakEndMin) ||
      (slotStartMin <= breakStartMin && slotEndMin >= breakEndMin)
    );
  }

  /**
   * Filter out slots that fall within break time.
   * Compatible with the legacy format where slots have horaInicio/horaFin.
   */
  filterSlots<T extends { horaInicio: string; horaFin: string }>(
    slots: T[],
    config: ScheduleConfig,
    date: Date = new Date(),
  ): T[] {
    return slots.filter(
      (s) => !this.execute({ start: s.horaInicio, end: s.horaFin }, config, date),
    );
  }
}
