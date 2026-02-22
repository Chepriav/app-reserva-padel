import { useState, useEffect, useCallback } from 'react';
import { isDateValida } from '../../utils/dateHelpers';

/**
 * Hook to manage schedule loading (day and week views)
 */
export function useSchedules({
  selectedCourt,
  selectedDate,
  currentView,
  getAvailability,
  reservationsVersion,
  showAlerta,
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
        showAlerta(
          'Error al cargar horarios',
          result.error || 'No se pudieron cargar los horarios.'
        );
        setSchedules([]);
      }
    } catch (error) {
      setLoadingSchedules(false);
      showAlerta(
        'Error de conexión',
        'No se pudieron cargar los horarios. Verifica tu conexión a internet.'
      );
      setSchedules([]);
    }
  }, [selectedCourt, selectedDate, getAvailability, showAlerta]);

  // Load week schedules
  const loadWeekSchedules = useCallback(async () => {
    if (!selectedCourt) return;

    setLoadingSchedules(true);

    try {
      const timeSlotsTemp = {};

      const [año, mes, day] = selectedDate.split('-').map(Number);
      const dateActual = new Date(Date.UTC(año, mes - 1, day));

      const dayWeek = dateActual.getUTCDay();
      const daysUntilMonday = dayWeek === 0 ? 6 : dayWeek - 1;

      const monday = new Date(dateActual);
      monday.setUTCDate(dateActual.getUTCDate() - daysUntilMonday);

      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setUTCDate(monday.getUTCDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        if (isDateValida(dateStr)) {
          const result = await getAvailability(selectedCourt.id, dateStr);
          if (result.success) {
            timeSlotsTemp[dateStr] = result.data;
          }
        }
      }

      setWeeklySchedules(timeSlotsTemp);
      setLoadingSchedules(false);
    } catch (error) {
      setLoadingSchedules(false);
      showAlerta('Error', 'No se pudieron cargar los horarios de la semana');
      setWeeklySchedules({});
    }
  }, [selectedCourt, selectedDate, getAvailability, showAlerta]);

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
  }, [selectedCourt, selectedDate, currentView, reservationsVersion]);

  return {
    schedules,
    weeklySchedules,
    loadingSchedules,
    reloadSchedules,
    loadSchedules,
    loadWeekSchedules,
  };
}
