import { useState, useEffect } from 'react';
import { scheduleConfigService } from '../../services/scheduleConfigService';

/**
 * Manages schedule configuration state, loading, and saving.
 */
export function useScheduleConfig(userId, showAlert) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    horaApertura: '08:00',
    horaCierre: '22:00',
    duracionBloque: 30,
    pausaInicio: '',
    pausaFin: '',
    motivoPausa: 'Hora de comida',
    pausaDiasSemana: null,
    usarHorariosDiferenciados: false,
    semanaHoraApertura: '08:00',
    semanaHoraCierre: '22:00',
    findeHoraApertura: '09:00',
    findeHoraCierre: '23:00',
    findePausaInicio: '',
    findePausaFin: '',
    findeMotivoPausa: 'Hora de comida',
    findePausaDiasSemana: null,
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
        horaApertura: result.data.horaApertura?.slice(0, 5) || '08:00',
        horaCierre: result.data.horaCierre?.slice(0, 5) || '22:00',
        pausaInicio: result.data.pausaInicio?.slice(0, 5) || '',
        pausaFin: result.data.pausaFin?.slice(0, 5) || '',
        usarHorariosDiferenciados: result.data.usarHorariosDiferenciados || false,
        semanaHoraApertura: result.data.semanaHoraApertura?.slice(0, 5) || '08:00',
        semanaHoraCierre: result.data.semanaHoraCierre?.slice(0, 5) || '22:00',
        findeHoraApertura: result.data.findeHoraApertura?.slice(0, 5) || '09:00',
        findeHoraCierre: result.data.findeHoraCierre?.slice(0, 5) || '23:00',
        findePausaInicio: result.data.findePausaInicio?.slice(0, 5) || '',
        findePausaFin: result.data.findePausaFin?.slice(0, 5) || '',
        findeMotivoPausa: result.data.findeMotivoPausa || 'Hora de comida',
        findePausaDiasSemana: result.data.findePausaDiasSemana || null,
      };
      setConfig(cleanConfig);
      setBreakEnabled(!!result.data.pausaInicio && !!result.data.pausaFin);
      setWeekendBreakEnabled(!!result.data.findePausaInicio && !!result.data.findePausaFin);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (config.usarHorariosDiferenciados) {
      if (!config.semanaHoraApertura || !config.semanaHoraCierre) {
        showAlert('Error', 'Debes especificar horarios de lunes a viernes');
        return;
      }
      if (!config.findeHoraApertura || !config.findeHoraCierre) {
        showAlert('Error', 'Debes especificar horarios de fin de semana');
        return;
      }
    } else {
      if (!config.horaApertura || !config.horaCierre) {
        showAlert('Error', 'Debes especificar hora de apertura y cierre');
        return;
      }
    }

    if (breakEnabled && (!config.pausaInicio || !config.pausaFin)) {
      showAlert('Error', 'Debes especificar hora de inicio y fin de la pausa');
      return;
    }

    if (weekendBreakEnabled && config.usarHorariosDiferenciados && (!config.findePausaInicio || !config.findePausaFin)) {
      showAlert('Error', 'Debes especificar hora de inicio y fin de la pausa de fin de semana');
      return;
    }

    const configToSave = {
      ...config,
      pausaInicio: breakEnabled ? config.pausaInicio : null,
      pausaFin: breakEnabled ? config.pausaFin : null,
      motivoPausa: breakEnabled ? config.motivoPausa : null,
      pausaDiasSemana: breakEnabled ? config.pausaDiasSemana : null,
      findePausaInicio: (weekendBreakEnabled && config.usarHorariosDiferenciados) ? config.findePausaInicio : null,
      findePausaFin: (weekendBreakEnabled && config.usarHorariosDiferenciados) ? config.findePausaFin : null,
      findeMotivoPausa: (weekendBreakEnabled && config.usarHorariosDiferenciados) ? config.findeMotivoPausa : null,
      findePausaDiasSemana: (weekendBreakEnabled && config.usarHorariosDiferenciados) ? config.findePausaDiasSemana : null,
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
