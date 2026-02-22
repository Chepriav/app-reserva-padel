import { useState, useEffect } from 'react';
import { scheduleConfigService } from '../../services/scheduleConfigService';

/**
 * Manages schedule configuration state, loading, and saving.
 */
export function useScheduleConfig(userId, showAlert) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    openingTime: '08:00',
    closingTime: '22:00',
    slotDuration: 30,
    breakStart: '',
    breakEnd: '',
    breakReason: 'Hora de comida',
    breakWeekdays: null,
    useDifferentiatedSchedules: false,
    weekdayOpeningTime: '08:00',
    weekdayClosingTime: '22:00',
    weekendOpeningTime: '09:00',
    weekendClosingTime: '23:00',
    weekendBreakStart: '',
    weekendBreakEnd: '',
    weekendBreakReason: 'Hora de comida',
    weekendBreakWeekdays: null,
  });
  const [breakEnabled, setBreakEnabled] = useState(false);
  const [weekendBreakEnabled, setWeekendBreakEnabled] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const result = await scheduleConfigService.getConfig();
    if (result.success) {
      const cleanConfig = {
        ...result.data,
        openingTime: result.data.openingTime?.slice(0, 5) || '08:00',
        closingTime: result.data.closingTime?.slice(0, 5) || '22:00',
        breakStart: result.data.breakStart?.slice(0, 5) || '',
        breakEnd: result.data.breakEnd?.slice(0, 5) || '',
        useDifferentiatedSchedules: result.data.useDifferentiatedSchedules || false,
        weekdayOpeningTime: result.data.weekdayOpeningTime?.slice(0, 5) || '08:00',
        weekdayClosingTime: result.data.weekdayClosingTime?.slice(0, 5) || '22:00',
        weekendOpeningTime: result.data.weekendOpeningTime?.slice(0, 5) || '09:00',
        weekendClosingTime: result.data.weekendClosingTime?.slice(0, 5) || '23:00',
        weekendBreakStart: result.data.weekendBreakStart?.slice(0, 5) || '',
        weekendBreakEnd: result.data.weekendBreakEnd?.slice(0, 5) || '',
        weekendBreakReason: result.data.weekendBreakReason || 'Hora de comida',
        weekendBreakWeekdays: result.data.weekendBreakWeekdays || null,
      };
      setConfig(cleanConfig);
      setBreakEnabled(!!result.data.breakStart && !!result.data.breakEnd);
      setWeekendBreakEnabled(!!result.data.weekendBreakStart && !!result.data.weekendBreakEnd);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (config.useDifferentiatedSchedules) {
      if (!config.weekdayOpeningTime || !config.weekdayClosingTime) {
        showAlert('Error', 'Debes especificar horarios de lunes a viernes');
        return;
      }
      if (!config.weekendOpeningTime || !config.weekendClosingTime) {
        showAlert('Error', 'Debes especificar horarios de fin de semana');
        return;
      }
    } else {
      if (!config.openingTime || !config.closingTime) {
        showAlert('Error', 'Debes especificar hora de apertura y cierre');
        return;
      }
    }

    if (breakEnabled && (!config.breakStart || !config.breakEnd)) {
      showAlert('Error', 'Debes especificar hora de inicio y fin de la pausa');
      return;
    }

    if (weekendBreakEnabled && config.useDifferentiatedSchedules && (!config.weekendBreakStart || !config.weekendBreakEnd)) {
      showAlert('Error', 'Debes especificar hora de inicio y fin de la pausa de fin de semana');
      return;
    }

    const configToSave = {
      ...config,
      breakStart: breakEnabled ? config.breakStart : null,
      breakEnd: breakEnabled ? config.breakEnd : null,
      breakReason: breakEnabled ? config.breakReason : null,
      breakWeekdays: breakEnabled ? config.breakWeekdays : null,
      weekendBreakStart: (weekendBreakEnabled && config.useDifferentiatedSchedules) ? config.weekendBreakStart : null,
      weekendBreakEnd: (weekendBreakEnabled && config.useDifferentiatedSchedules) ? config.weekendBreakEnd : null,
      weekendBreakReason: (weekendBreakEnabled && config.useDifferentiatedSchedules) ? config.weekendBreakReason : null,
      weekendBreakWeekdays: (weekendBreakEnabled && config.useDifferentiatedSchedules) ? config.weekendBreakWeekdays : null,
    };

    setSaving(true);

    try {
      const result = await scheduleConfigService.updateConfig(userId, configToSave);
      setSaving(false);

      if (result.success) {
        showAlert('Éxito', 'Configuración guardada correctamente');
        await loadConfig();
      } else {
        showAlert('Error', result.error || 'Error al guardar configuración');
      }
    } catch (error) {
      setSaving(false);
      showAlert('Error', 'Error inesperado al guardar: ' + error.message);
    }
  };

  return {
    loading,
    saving,
    config,
    setConfig,
    breakEnabled,
    setBreakEnabled,
    weekendBreakEnabled,
    setWeekendBreakEnabled,
    handleSave,
  };
}
