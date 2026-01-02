import { useState, useCallback } from 'react';

/**
 * Hook to manage time slot selection for reservations
 * Handles multi-selection logic and consecutiveness validation
 */
export function useSeleccionHorarios({ mostrarAlerta }) {
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState([]);

  // Validate that blocks are consecutive
  const sonBloquesConsecutivos = useCallback((bloques) => {
    if (bloques.length <= 1) return true;

    const primeraFecha = bloques[0].fecha;
    if (!bloques.every(b => b.fecha === primeraFecha)) {
      return false;
    }

    const bloquesOrdenados = [...bloques].sort((a, b) =>
      a.horaInicio.localeCompare(b.horaInicio)
    );

    for (let i = 0; i < bloquesOrdenados.length - 1; i++) {
      if (bloquesOrdenados[i].horaFin !== bloquesOrdenados[i + 1].horaInicio) {
        return false;
      }
    }

    return true;
  }, []);

  // Select/deselect a time slot
  const toggleBloqueSeleccionado = useCallback((horario, fechaReserva) => {
    const yaSeleccionado = bloquesSeleccionados.some(b =>
      b.fecha === fechaReserva && b.horaInicio === horario.horaInicio
    );

    if (yaSeleccionado) {
      setBloquesSeleccionados(prev => prev.filter(b =>
        !(b.fecha === fechaReserva && b.horaInicio === horario.horaInicio)
      ));
      return;
    }

    if (bloquesSeleccionados.length >= 3) {
      mostrarAlerta('Máximo 3 bloques', 'Solo puedes seleccionar hasta 3 bloques consecutivos (1.5 horas)');
      return;
    }

    const esDesplazable = !horario.disponible && horario.prioridad === 'segunda' && !horario.estaProtegida;

    const nuevoBloque = {
      fecha: fechaReserva,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      esDesplazable,
      viviendaDesplazada: esDesplazable ? horario.reservaExistente?.vivienda : null,
    };

    const nuevaSeleccion = [...bloquesSeleccionados, nuevoBloque];

    if (!sonBloquesConsecutivos(nuevaSeleccion)) {
      mostrarAlerta('Bloques no consecutivos', 'Los bloques deben ser consecutivos y del mismo día');
      return;
    }

    setBloquesSeleccionados(nuevaSeleccion);
  }, [bloquesSeleccionados, mostrarAlerta, sonBloquesConsecutivos]);

  const limpiarSeleccion = useCallback(() => {
    setBloquesSeleccionados([]);
  }, []);

  // Get sorted reservation data
  const getDatosReserva = useCallback(() => {
    if (bloquesSeleccionados.length === 0) return null;

    const bloquesOrdenados = [...bloquesSeleccionados].sort((a, b) =>
      a.horaInicio.localeCompare(b.horaInicio)
    );

    return {
      horaInicio: bloquesOrdenados[0].horaInicio,
      horaFin: bloquesOrdenados[bloquesOrdenados.length - 1].horaFin,
      fecha: bloquesOrdenados[0].fecha,
      duracionMinutos: bloquesSeleccionados.length * 30,
      bloquesDesplazables: bloquesOrdenados.filter(b => b.esDesplazable),
    };
  }, [bloquesSeleccionados]);

  return {
    bloquesSeleccionados,
    toggleBloqueSeleccionado,
    limpiarSeleccion,
    getDatosReserva,
  };
}
