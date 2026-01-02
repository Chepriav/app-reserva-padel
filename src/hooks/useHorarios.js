import { useState, useEffect, useCallback } from 'react';
import { esFechaValida } from '../utils/dateHelpers';

/**
 * Hook para gestionar la carga de horarios (día y semana)
 */
export function useHorarios({
  pistaSeleccionada,
  fechaSeleccionada,
  vistaActual,
  obtenerDisponibilidad,
  reservasVersion,
  mostrarAlerta,
}) {
  const [horarios, setHorarios] = useState([]);
  const [horariosSemanales, setHorariosSemanales] = useState({});
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  // Cargar horarios del día
  const cargarHorarios = useCallback(async () => {
    if (!pistaSeleccionada) return;

    setLoadingHorarios(true);

    try {
      const result = await obtenerDisponibilidad(
        pistaSeleccionada.id,
        fechaSeleccionada
      );
      setLoadingHorarios(false);

      if (result.success) {
        setHorarios(result.data);
      } else {
        mostrarAlerta(
          'Error al cargar horarios',
          result.error || 'No se pudieron cargar los horarios.'
        );
        setHorarios([]);
      }
    } catch (error) {
      setLoadingHorarios(false);
      mostrarAlerta(
        'Error de conexión',
        'No se pudieron cargar los horarios. Verifica tu conexión a internet.'
      );
      setHorarios([]);
    }
  }, [pistaSeleccionada, fechaSeleccionada, obtenerDisponibilidad, mostrarAlerta]);

  // Cargar horarios de la semana
  const cargarHorariosSemana = useCallback(async () => {
    if (!pistaSeleccionada) return;

    setLoadingHorarios(true);

    try {
      const horariosTemp = {};

      const [año, mes, dia] = fechaSeleccionada.split('-').map(Number);
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
          const result = await obtenerDisponibilidad(pistaSeleccionada.id, fechaStr);
          if (result.success) {
            horariosTemp[fechaStr] = result.data;
          }
        }
      }

      setHorariosSemanales(horariosTemp);
      setLoadingHorarios(false);
    } catch (error) {
      setLoadingHorarios(false);
      mostrarAlerta('Error', 'No se pudieron cargar los horarios de la semana');
      setHorariosSemanales({});
    }
  }, [pistaSeleccionada, fechaSeleccionada, obtenerDisponibilidad, mostrarAlerta]);

  // Recargar horarios según la vista actual
  const recargarHorarios = useCallback(() => {
    if (vistaActual === 'dia') {
      cargarHorarios();
    } else {
      cargarHorariosSemana();
    }
  }, [vistaActual, cargarHorarios, cargarHorariosSemana]);

  // Efecto para cargar horarios cuando cambian las dependencias
  useEffect(() => {
    if (pistaSeleccionada) {
      if (vistaActual === 'dia') {
        cargarHorarios();
      } else {
        cargarHorariosSemana();
      }
    }
  }, [pistaSeleccionada, fechaSeleccionada, vistaActual, reservasVersion]);

  return {
    horarios,
    horariosSemanales,
    loadingHorarios,
    recargarHorarios,
    cargarHorarios,
    cargarHorariosSemana,
  };
}
