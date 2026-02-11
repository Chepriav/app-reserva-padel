/** Time range with start and end in HH:MM format */
export interface TimeRange {
  start: string;
  end: string;
}

/**
 * Schedule configuration for padel court availability.
 * All field names are in English; mappers handle translation
 * to/from DB (snake_case) and legacy format (camelCase Spanish).
 */
export interface ScheduleConfig {
  openingTime: string;
  closingTime: string;
  slotDuration: number;

  /** Weekday break (e.g., lunch hour). null = no break */
  breakStart: string | null;
  breakEnd: string | null;
  breakReason: string;
  /** Days of week the break applies (0=Sun..6=Sat). null = every day */
  breakDaysOfWeek: number[] | null;

  /** Whether weekday/weekend have different hours */
  useDifferentiatedSchedules: boolean;

  /** Weekday-specific overrides (only used when useDifferentiatedSchedules=true) */
  weekdayOpeningTime: string | null;
  weekdayClosingTime: string | null;

  /** Weekend-specific overrides */
  weekendOpeningTime: string | null;
  weekendClosingTime: string | null;
  weekendBreakStart: string | null;
  weekendBreakEnd: string | null;
  weekendBreakReason: string | null;
  weekendBreakDaysOfWeek: number[] | null;
}

export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  openingTime: '08:00',
  closingTime: '22:00',
  slotDuration: 30,
  breakStart: null,
  breakEnd: null,
  breakReason: 'Hora de comida',
  breakDaysOfWeek: null,
  useDifferentiatedSchedules: false,
  weekdayOpeningTime: null,
  weekdayClosingTime: null,
  weekendOpeningTime: null,
  weekendClosingTime: null,
  weekendBreakStart: null,
  weekendBreakEnd: null,
  weekendBreakReason: null,
  weekendBreakDaysOfWeek: null,
};
