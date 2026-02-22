import { useState, useCallback } from 'react';

/**
 * Hook to manage time slot selection for reservations
 * Handles multi-selection logic and consecutiveness validation
 */
export function useSlotSelection({ showAlerta }) {
  const [selectedSlots, setSelectedSlots] = useState([]);

  // Validate that slots are consecutive
  const areSlotsConsecutive = useCallback((slots) => {
    if (slots.length <= 1) return true;

    const primeraDate = slots[0].date;
    if (!slots.every(b => b.date === primeraDate)) {
      return false;
    }

    const slotsOrdenados = [...slots].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    for (let i = 0; i < slotsOrdenados.length - 1; i++) {
      if (slotsOrdenados[i].endTime !== slotsOrdenados[i + 1].startTime) {
        return false;
      }
    }

    return true;
  }, []);

  // Select/deselect a time slot
  const toggleSlotSelected = useCallback((timeSlot, reservationDate) => {
    const yaSelected = selectedSlots.some(b =>
      b.date === reservationDate && b.startTime === timeSlot.startTime
    );

    if (yaSelected) {
      setSelectedSlots(prev => prev.filter(b =>
        !(b.date === reservationDate && b.startTime === timeSlot.startTime)
      ));
      return;
    }

    if (selectedSlots.length >= 3) {
      showAlerta('Máximo 3 bloques', 'Solo puedes seleccionar hasta 3 bloques consecutivos (1.5 horas)');
      return;
    }

    const isDisplaceable = !timeSlot.available && timeSlot.priority === 'provisional' && !timeSlot.isProtected;

    const nuevoSlot = {
      date: reservationDate,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      isDisplaceable,
      apartmentDisplaced: isDisplaceable ? timeSlot.existingReservation?.apartment : null,
    };

    const nuevaSelection = [...selectedSlots, nuevoSlot];

    if (!areSlotsConsecutive(nuevaSelection)) {
      showAlerta('Bloques no consecutivos', 'Los bloques deben ser consecutivos y del mismo día');
      return;
    }

    setSelectedSlots(nuevaSelection);
  }, [selectedSlots, showAlerta, areSlotsConsecutive]);

  const clearSelection = useCallback(() => {
    setSelectedSlots([]);
  }, []);

  // Get sorted reservation data
  const getReservationData = useCallback(() => {
    if (selectedSlots.length === 0) return null;

    const slotsOrdenados = [...selectedSlots].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    return {
      startTime: slotsOrdenados[0].startTime,
      endTime: slotsOrdenados[slotsOrdenados.length - 1].endTime,
      date: slotsOrdenados[0].date,
      durationMinutos: selectedSlots.length * 30,
      slotsDesplazables: slotsOrdenados.filter(b => b.isDisplaceable),
    };
  }, [selectedSlots]);

  return {
    selectedSlots,
    toggleSlotSelected,
    clearSelection,
    getReservationData,
  };
}
