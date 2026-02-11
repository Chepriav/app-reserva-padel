/**
 * Schedule Config Service — FACADE
 *
 * Delegates to domain use cases while maintaining the legacy API.
 * Consumers (reservationsService, ScheduleConfigSection) need zero changes.
 */
import {
  getScheduleConfig,
  updateScheduleConfig,
  checkSlotInBreakTime,
} from '../di/container';
import {
  toLegacyFormat,
  fromLegacyFormat,
} from '../infrastructure/supabase/mappers/scheduleConfigMapper';

export const scheduleConfigService = {
  /**
   * Get current schedule configuration.
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getConfig() {
    const result = await getScheduleConfig.execute();

    if (!result.success) {
      return { success: false, error: 'Error al obtener configuración de horarios' };
    }

    return { success: true, data: toLegacyFormat(result.value) };
  },

  /**
   * Update schedule configuration (admin only).
   * @param {string} userId
   * @param {object} config - Legacy format (Spanish camelCase)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async updateConfig(userId, config) {
    const domainConfig = fromLegacyFormat(config);
    const result = await updateScheduleConfig.execute(userId, domainConfig);

    if (!result.success) {
      return { success: false, error: result.error.message || 'Error al actualizar configuración' };
    }

    return { success: true, data: toLegacyFormat(result.value) };
  },

  /**
   * Check if a time slot falls within the break period for a given date.
   * @param {string} slotStart - HH:MM
   * @param {string} slotEnd - HH:MM
   * @param {object} config - Legacy format (Spanish camelCase)
   * @param {Date|string} date
   * @returns {boolean}
   */
  isSlotInBreakTime(slotStart, slotEnd, config, date = new Date()) {
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const domainConfig = fromLegacyFormat(config);
    return checkSlotInBreakTime.execute(
      { start: slotStart, end: slotEnd },
      domainConfig,
      dateObj,
    );
  },

  /**
   * Filter out slots that fall within break time.
   * @param {Array} slots - Array with { horaInicio, horaFin }
   * @param {object} config - Legacy format (Spanish camelCase)
   * @param {Date|string} date
   * @returns {Array}
   */
  filterBreakTimeSlots(slots, config, date = new Date()) {
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const domainConfig = fromLegacyFormat(config);
    return checkSlotInBreakTime.filterSlots(slots, domainConfig, dateObj);
  },
};
