import { useState, useCallback } from 'react';

/**
 * Hook to manage time slot selection for reservations
 * Handles multi-selection logic and consecutiveness validation
 */
export function useSlotSelection({ mostrarAlerta }) {
  const [selectedSlots, setSelectedSlots] = useState([]);

  // Validate that slots are consecutive
  const areSlotsConsecutive = useCallback((slots) => {
    if (slots.length <= 1) return true;

    const primeraFecha = slots[0].fecha;
    if (!slots.every(b => b.fecha === primeraFecha)) {
      return false;
    }

    const bloquesOrdenados = [...slots].sort((a, b) =>
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
  const toggleSlotSelected = useCallback((horario, fechaReserva) => {
    const yaSeleccionado = selectedSlots.some(b =>
      b.fecha === fechaReserva && b.horaInicio === horario.horaInicio
    );

    if (yaSeleccionado) {
      setSelectedSlots(prev => prev.filter(b =>
        !(b.fecha === fechaReserva && b.horaInicio === horario.horaInicio)
      ));
      return;
    }

    if (selectedSlots.length >= 3) {
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

    const nuevaSeleccion = [...selectedSlots, nuevoBloque];

    if (!areSlotsConsecutive(nuevaSeleccion)) {
      mostrarAlerta('Bloques no consecutivos', 'Los bloques deben ser consecutivos y del mismo día');
      return;
    }

    setSelectedSlots(nuevaSeleccion);
  }, [selectedSlots, mostrarAlerta, areSlotsConsecutive]);

  const clearSelection = useCallback(() => {
    setSelectedSlots([]);
  }, []);

  // Get sorted reservation data
  const getReservationData = useCallback(() => {
    if (selectedSlots.length === 0) return null;

    const bloquesOrdenados = [...selectedSlots].sort((a, b) =>
      a.horaInicio.localeCompare(b.horaInicio)
    );

    return {
      horaInicio: bloquesOrdenados[0].horaInicio,
      horaFin: bloquesOrdenados[bloquesOrdenados.length - 1].horaFin,
      fecha: bloquesOrdenados[0].fecha,
      duracionMinutos: selectedSlots.length * 30,
      bloquesDesplazables: bloquesOrdenados.filter(b => b.esDesplazable),
    };
  }, [selectedSlots]);

  return {
    selectedSlots,
    toggleSlotSelected,
    clearSelection,
    getReservationData,
  };
}
