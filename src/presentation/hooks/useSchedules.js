import { useState, useEffect, useCallback } from 'react';
import { esFechaValida } from '../../utils/dateHelpers';

/**
 * Hook to manage schedule loading (day and week views)
 */
export function useSchedules({
  selectedCourt,
  selectedDate,
  currentView,
  getAvailability,
  reservasVersion,
  mostrarAlerta,
}) {
  const [schedules, setSchedules] = useState([]);
  const [weeklySchedules, setWeeklySchedules] = useState({});
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Load day schedules
  const loadSchedules = useCallback(async () => {
    if (!selectedCourt) return;

    setLoadingSchedules(true);

    try {
      const result = await getAvailability(
        selectedCourt.id,
        selectedDate
      );
      setLoadingSchedules(false);

      if (result.success) {
        setSchedules(result.data);
      } else {
        mostrarAlerta(
          'Error al cargar horarios',
          result.error || 'No se pudieron cargar los horarios.'
        );
        setSchedules([]);
      }
    } catch (error) {
      setLoadingSchedules(false);
      mostrarAlerta(
        'Error de conexión',
        'No se pudieron cargar los horarios. Verifica tu conexión a internet.'
      );
      setSchedules([]);
    }
  }, [selectedCourt, selectedDate, getAvailability, mostrarAlerta]);

  // Load week schedules
  const loadWeekSchedules = useCallback(async () => {
    if (!selectedCourt) return;

    setLoadingSchedules(true);

    try {
      const horariosTemp = {};

      const [año, mes, dia] = selectedDate.split('-').map(Number);
      const fechaActual = new Date(Date.UTC(año, mes - 1, dia));

      const diaSemana = fechaActual.getUTCDay();
      const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;

      const lunes = new Date(fechaActual);
      lunes.setUTCDate(fechaActual.getUTCDate() - diasHastaLunes);

      for (let i = 0; i < 7; i++) {
        const fecha = new Date(lunes);
        fecha.setUTCDate(lunes.getUTCDate() + i);
        const fechaStr = fecha.toISOString().split('T')[0];

        if (esFechaValida(fechaStr)) {
          const result = await getAvailability(selectedCourt.id, fechaStr);
          if (result.success) {
            horariosTemp[fechaStr] = result.data;
          }
        }
      }

      setWeeklySchedules(horariosTemp);
      setLoadingSchedules(false);
    } catch (error) {
      setLoadingSchedules(false);
      mostrarAlerta('Error', 'No se pudieron cargar los horarios de la semana');
      setWeeklySchedules({});
    }
  }, [selectedCourt, selectedDate, getAvailability, mostrarAlerta]);

  // Reload schedules based on current view
  const reloadSchedules = useCallback(() => {
    if (currentView === 'dia') {
      loadSchedules();
    } else {
      loadWeekSchedules();
    }
  }, [currentView, loadSchedules, loadWeekSchedules]);

  // Effect to load schedules when dependencies change
  useEffect(() => {
    if (selectedCourt) {
      if (currentView === 'dia') {
        loadSchedules();
      } else {
        loadWeekSchedules();
      }
    }
  }, [selectedCourt, selectedDate, currentView, reservasVersion]);

  return {
    schedules,
    weeklySchedules,
    loadingSchedules,
    reloadSchedules,
    loadSchedules,
    loadWeekSchedules,
  };
}
