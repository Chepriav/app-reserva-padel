import { supabase } from './supabaseConfig';

/**
 * Service for managing schedule configuration
 * Handles break times (lunch hours), opening/closing times
 */
export const scheduleConfigService = {
  /**
   * Get current schedule configuration
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getConfig() {
    try {
      const { data, error } = await supabase
        .rpc('get_schedule_config');

      if (error) {
        return { success: false, error: 'Error al obtener configuración de horarios' };
      }

      // RPC returns array, get first element
      const config = data?.[0];

      console.log('[scheduleConfigService] getConfig raw data:', config);

      if (!config) {
        // Return default config if none exists
        return {
          success: true,
          data: {
            horaApertura: '08:00',
            horaCierre: '22:00',
            duracionBloque: 30,
            pausaInicio: null,
            pausaFin: null,
            motivoPausa: 'Hora de comida',
            pausaDiasSemana: null,
          },
        };
      }

      return {
        success: true,
        data: {
          horaApertura: config.hora_apertura,
          horaCierre: config.hora_cierre,
          duracionBloque: config.duracion_bloque,
          pausaInicio: config.pausa_inicio,
          pausaFin: config.pausa_fin,
          motivoPausa: config.motivo_pausa,
          pausaDiasSemana: config.pausa_dias_semana,
          usarHorariosDiferenciados: config.usar_horarios_diferenciados || false,
          semanaHoraApertura: config.semana_hora_apertura,
          semanaHoraCierre: config.semana_hora_cierre,
          findeHoraApertura: config.finde_hora_apertura,
          findeHoraCierre: config.finde_hora_cierre,
          findePausaInicio: config.finde_pausa_inicio,
          findePausaFin: config.finde_pausa_fin,
          findeMotivoPausa: config.finde_motivo_pausa,
          findePausaDiasSemana: config.finde_pausa_dias_semana,
        },
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener configuración de horarios' };
    }
  },

  /**
   * Update schedule configuration (admin only)
   * @param {string} userId - User ID
   * @param {object} config - Configuration to update
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async updateConfig(userId, config) {
    try {
      console.log('[scheduleConfigService] updateConfig called with:', {
        findePausaInicio: config.findePausaInicio,
        findePausaFin: config.findePausaFin,
        usarHorariosDiferenciados: config.usarHorariosDiferenciados,
      });

      const { data, error} = await supabase
        .rpc('update_schedule_config', {
          p_user_id: userId,
          p_hora_apertura: config.horaApertura,
          p_hora_cierre: config.horaCierre,
          p_duracion_bloque: config.duracionBloque,
          p_pausa_inicio: config.pausaInicio,
          p_pausa_fin: config.pausaFin,
          p_motivo_pausa: config.motivoPausa,
          p_pausa_dias_semana: config.pausaDiasSemana,
          p_usar_horarios_diferenciados: config.usarHorariosDiferenciados,
          p_semana_hora_apertura: config.semanaHoraApertura,
          p_semana_hora_cierre: config.semanaHoraCierre,
          p_finde_hora_apertura: config.findeHoraApertura,
          p_finde_hora_cierre: config.findeHoraCierre,
          p_finde_pausa_inicio: config.findePausaInicio,
          p_finde_pausa_fin: config.findePausaFin,
          p_finde_motivo_pausa: config.findeMotivoPausa,
          p_finde_pausa_dias_semana: config.findePausaDiasSemana,
        });

      console.log('[scheduleConfigService] RPC response:', { data, error });

      if (error) {
        return { success: false, error: error.message || 'Error al actualizar configuración' };
      }

      // La función RPC retorna un objeto con {success, error?, config?}
      if (!data) {
        return { success: false, error: 'No se recibió respuesta del servidor' };
      }

      // Si data es un objeto directo (no array)
      if (data.success === false) {
        return { success: false, error: data.error || 'Error al actualizar configuración' };
      }

      return {
        success: true,
        data: data.config || data,
      };
    } catch (error) {
      return { success: false, error: error.message || 'Error al actualizar configuración' };
    }
  },

  /**
   * Check if a time slot falls within the break period for a given date
   * @param {string} slotStart - Slot start time (HH:MM)
   * @param {string} slotEnd - Slot end time (HH:MM)
   * @param {object} config - Schedule configuration
   * @param {Date|string} date - Date to check (for day of week)
   * @returns {boolean} True if slot overlaps with break time
   */
  isSlotInBreakTime(slotStart, slotEnd, config, date = new Date()) {
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

    // Determine which break configuration to use
    let pausaInicio, pausaFin, pausaDiasSemana;

    if (config.usarHorariosDiferenciados) {
      // When using differentiated schedules, use specific breaks for each day type
      if (isWeekend) {
        // Weekend: only use weekend break if configured
        pausaInicio = config.findePausaInicio;
        pausaFin = config.findePausaFin;
        pausaDiasSemana = config.findePausaDiasSemana;
        console.log('[isSlotInBreakTime] Weekend break:', { pausaInicio, pausaFin, isWeekend, dayOfWeek });
      } else {
        // Weekday: use weekday break
        pausaInicio = config.pausaInicio;
        pausaFin = config.pausaFin;
        pausaDiasSemana = config.pausaDiasSemana;
        console.log('[isSlotInBreakTime] Weekday break:', { pausaInicio, pausaFin, isWeekend, dayOfWeek });
      }
    } else {
      // Not using differentiated schedules: use general break for all days
      pausaInicio = config.pausaInicio;
      pausaFin = config.pausaFin;
      pausaDiasSemana = config.pausaDiasSemana;
      console.log('[isSlotInBreakTime] General break:', { pausaInicio, pausaFin, isWeekend, dayOfWeek });
    }

    // No break configured for this day type
    if (!pausaInicio || !pausaFin) {
      return false;
    }

    // Check if break applies to this specific day of week
    if (pausaDiasSemana && Array.isArray(pausaDiasSemana)) {
      if (!pausaDiasSemana.includes(dayOfWeek)) {
        return false; // Break doesn't apply to this day
      }
    }

    // Convert times to minutes for comparison
    const timeToMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const slotStartMin = timeToMinutes(slotStart);
    const slotEndMin = timeToMinutes(slotEnd);
    const breakStartMin = timeToMinutes(pausaInicio);
    const breakEndMin = timeToMinutes(pausaFin);

    // Check if slot overlaps with break time
    // Slot overlaps if:
    // - Slot starts during break
    // - Slot ends during break
    // - Slot completely contains break
    return (
      (slotStartMin >= breakStartMin && slotStartMin < breakEndMin) ||
      (slotEndMin > breakStartMin && slotEndMin <= breakEndMin) ||
      (slotStartMin <= breakStartMin && slotEndMin >= breakEndMin)
    );
  },

  /**
   * Filter out slots that fall within break time
   * @param {Array} slots - Array of time slots
   * @param {object} config - Schedule configuration
   * @param {Date|string} date - Date to check
   * @returns {Array} Filtered slots
   */
  filterBreakTimeSlots(slots, config, date = new Date()) {
    return slots.filter(slot =>
      !this.isSlotInBreakTime(slot.horaInicio, slot.horaFin, config, date)
    );
  },
};
