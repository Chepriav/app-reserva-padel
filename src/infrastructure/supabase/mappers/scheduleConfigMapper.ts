import type { ScheduleConfig } from '@domain/entities/ScheduleConfig';
import { DEFAULT_SCHEDULE_CONFIG } from '@domain/entities/ScheduleConfig';

/** Row shape returned by the get_schedule_config RPC */
interface ScheduleConfigRow {
  hora_apertura: string;
  hora_cierre: string;
  duracion_bloque: number;
  pausa_inicio: string | null;
  pausa_fin: string | null;
  motivo_pausa: string;
  pausa_dias_semana: number[] | null;
  usar_horarios_diferenciados: boolean;
  semana_hora_apertura: string | null;
  semana_hora_cierre: string | null;
  finde_hora_apertura: string | null;
  finde_hora_cierre: string | null;
  finde_pausa_inicio: string | null;
  finde_pausa_fin: string | null;
  finde_motivo_pausa: string | null;
  finde_pausa_dias_semana: number[] | null;
}

/** Legacy format used by existing consumers (Spanish camelCase) */
export interface LegacyScheduleConfig {
  openingTime: string;
  closingTime: string;
  slotDuration: number;
  breakStart: string | null;
  breakEnd: string | null;
  breakReason: string;
  breakWeekdays: number[] | null;
  useDifferentiatedSchedules: boolean;
  weekdayOpeningTime: string | null;
  weekdayClosingTime: string | null;
  weekendOpeningTime: string | null;
  weekendClosingTime: string | null;
  weekendBreakStart: string | null;
  weekendBreakEnd: string | null;
  weekendBreakReason: string | null;
  weekendBreakWeekdays: number[] | null;
}

/** DB snake_case → domain entity */
export function toDomain(row: ScheduleConfigRow | null): ScheduleConfig {
  if (!row) return { ...DEFAULT_SCHEDULE_CONFIG };

  return {
    openingTime: row.hora_apertura,
    closingTime: row.hora_cierre,
    slotDuration: row.duracion_bloque,
    breakStart: row.pausa_inicio,
    breakEnd: row.pausa_fin,
    breakReason: row.motivo_pausa,
    breakDaysOfWeek: row.pausa_dias_semana,
    useDifferentiatedSchedules: row.usar_horarios_diferenciados || false,
    weekdayOpeningTime: row.semana_hora_apertura,
    weekdayClosingTime: row.semana_hora_cierre,
    weekendOpeningTime: row.finde_hora_apertura,
    weekendClosingTime: row.finde_hora_cierre,
    weekendBreakStart: row.finde_pausa_inicio,
    weekendBreakEnd: row.finde_pausa_fin,
    weekendBreakReason: row.finde_motivo_pausa,
    weekendBreakDaysOfWeek: row.finde_pausa_dias_semana,
  };
}

/** Domain entity → RPC parameters for update_schedule_config */
export function toRpcParams(userId: string, config: ScheduleConfig) {
  return {
    p_user_id: userId,
    p_hora_apertura: config.openingTime,
    p_hora_cierre: config.closingTime,
    p_duracion_bloque: config.slotDuration,
    p_pausa_inicio: config.breakStart,
    p_pausa_fin: config.breakEnd,
    p_motivo_pausa: config.breakReason,
    p_pausa_dias_semana: config.breakDaysOfWeek,
    p_usar_horarios_diferenciados: config.useDifferentiatedSchedules,
    p_semana_hora_apertura: config.weekdayOpeningTime,
    p_semana_hora_cierre: config.weekdayClosingTime,
    p_finde_hora_apertura: config.weekendOpeningTime,
    p_finde_hora_cierre: config.weekendClosingTime,
    p_finde_pausa_inicio: config.weekendBreakStart,
    p_finde_pausa_fin: config.weekendBreakEnd,
    p_finde_motivo_pausa: config.weekendBreakReason,
    p_finde_pausa_dias_semana: config.weekendBreakDaysOfWeek,
  };
}

/** Domain entity → legacy Spanish camelCase (for facade backward compat) */
export function toLegacyFormat(config: ScheduleConfig): LegacyScheduleConfig {
  return {
    openingTime: config.openingTime,
    closingTime: config.closingTime,
    slotDuration: config.slotDuration,
    breakStart: config.breakStart,
    breakEnd: config.breakEnd,
    breakReason: config.breakReason,
    breakWeekdays: config.breakDaysOfWeek,
    useDifferentiatedSchedules: config.useDifferentiatedSchedules,
    weekdayOpeningTime: config.weekdayOpeningTime,
    weekdayClosingTime: config.weekdayClosingTime,
    weekendOpeningTime: config.weekendOpeningTime,
    weekendClosingTime: config.weekendClosingTime,
    weekendBreakStart: config.weekendBreakStart,
    weekendBreakEnd: config.weekendBreakEnd,
    weekendBreakReason: config.weekendBreakReason,
    weekendBreakWeekdays: config.weekendBreakDaysOfWeek,
  };
}

/** Legacy Spanish camelCase → domain entity (for facade inbound) */
export function fromLegacyFormat(legacy: LegacyScheduleConfig): ScheduleConfig {
  return {
    openingTime: legacy.openingTime,
    closingTime: legacy.closingTime,
    slotDuration: legacy.slotDuration,
    breakStart: legacy.breakStart,
    breakEnd: legacy.breakEnd,
    breakReason: legacy.breakReason,
    breakDaysOfWeek: legacy.breakWeekdays,
    useDifferentiatedSchedules: legacy.useDifferentiatedSchedules,
    weekdayOpeningTime: legacy.weekdayOpeningTime,
    weekdayClosingTime: legacy.weekdayClosingTime,
    weekendOpeningTime: legacy.weekendOpeningTime,
    weekendClosingTime: legacy.weekendClosingTime,
    weekendBreakStart: legacy.weekendBreakStart,
    weekendBreakEnd: legacy.weekendBreakEnd,
    weekendBreakReason: legacy.weekendBreakReason,
    weekendBreakDaysOfWeek: legacy.weekendBreakWeekdays,
  };
}
