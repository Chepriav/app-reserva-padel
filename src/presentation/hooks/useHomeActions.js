import { useState, useCallback } from 'react';
import {
  formatDateReadable,
  isDateValida,
  slotFinished,
} from '../../utils/dateHelpers';
import { puedeReservar } from '../../utils/validators';

/**
 * Encapsulates HomeScreen action handlers:
 * date navigation, slot press, and reservation confirmation.
 */
export function useHomeActions({
  dateSelected,
  setDateSelected,
  viewActual,
  courtSelected,
  reservations,
  selectedSlots,
  user,
  createReservation,
  limpiarSelection,
  recargarTimeSlots,
  toggleSlotSelected,
  blockoutsHook,
  getDataReservation,
  showAlerta,
  showAlertaPersonalizada,
}) {
  const [reservando, setReservando] = useState(false);

  const cambiarDate = useCallback((days) => {
    const [año, mes, day] = dateSelected.split('-').map(Number);
    const date = new Date(Date.UTC(año, mes - 1, day));

    if (viewActual === 'semana') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dayWeek = date.getUTCDay();
      const daysUntilMonday = dayWeek === 0 ? 6 : dayWeek - 1;
      const mondaySelected = new Date(date);
      mondaySelected.setUTCDate(date.getUTCDate() - daysUntilMonday);

      const dayWeekToday = today.getDay();
      const daysUntilMondayToday = dayWeekToday === 0 ? 6 : dayWeekToday - 1;
      const mondayOfEstaWeekMundial = new Date(today);
      mondayOfEstaWeekMundial.setDate(today.getDate() - daysUntilMondayToday);
      mondayOfEstaWeekMundial.setHours(0, 0, 0, 0);

      const nuevaWeek = new Date(mondaySelected);
      nuevaWeek.setUTCDate(mondaySelected.getUTCDate() + (days * 7));

      const mondayNextWeek = new Date(mondayOfEstaWeekMundial);
      mondayNextWeek.setDate(mondayOfEstaWeekMundial.getDate() + 7);

      const nuevaDateStr = nuevaWeek.toISOString().split('T')[0];
      const nuevaDateObj = new Date(nuevaDateStr + 'T00:00:00');

      if (nuevaDateObj < mondayOfEstaWeekMundial) {
        showAlerta('Semana no disponible', 'No puedes ver semanas anteriores a la actual');
        return;
      }

      const maxDate = new Date(mondayNextWeek);
      maxDate.setDate(maxDate.getDate() + 6);

      if (nuevaDateObj > maxDate) {
        showAlerta('Límite alcanzado', 'Solo puedes ver la semana actual y la siguiente');
        return;
      }

      setDateSelected(nuevaDateStr);
    } else {
      date.setUTCDate(date.getUTCDate() + days);
      const nuevaDate = date.toISOString().split('T')[0];

      if (isDateValida(nuevaDate)) {
        setDateSelected(nuevaDate);
      } else {
        showAlerta('Fecha no válida', 'Solo puedes reservar hasta 7 días de anticipación');
      }
    }
  }, [dateSelected, viewActual, showAlerta, setDateSelected]);

  const handleTimeSlotPress = useCallback((timeSlot, date) => {
    const isPast = slotFinished(date, timeSlot.endTime);
    if (isPast) return;

    const isBlocked = timeSlot.blocked;
    const isMyApartment = timeSlot.existingReservation?.apartment === user?.apartment;
    const isProvisionalDisplaceable = timeSlot.priority === 'provisional' && !timeSlot.isProtected;
    const isOtherProvisional = !timeSlot.available && !isBlocked && !isMyApartment && isProvisionalDisplaceable;

    if (blockoutsHook.blockoutMode && user?.isAdmin) {
      if (isBlocked) {
        blockoutsHook.toggleSlotToUnblock(timeSlot, date);
      } else {
        blockoutsHook.toggleSlotToBlock(timeSlot, date);
      }
      return;
    }

    if (isBlocked) {
      blockoutsHook.handleTapBlocked(timeSlot);
    } else if (timeSlot.available || isOtherProvisional) {
      toggleSlotSelected(timeSlot, date);
    }
  }, [user, blockoutsHook, toggleSlotSelected]);

  const confirmarReservation = useCallback(async () => {
    const dataReservation = getDataReservation();
    if (!dataReservation) {
      showAlerta('Selecciona horarios', 'Debes seleccionar al menos un bloque de 30 minutos');
      return;
    }

    if (!user) {
      showAlerta('Error', 'Debes iniciar sesión para hacer una reserva');
      return;
    }

    if (!courtSelected) {
      showAlerta('Error', 'Selecciona una pista primero');
      return;
    }

    if (user?.isDemo) {
      showAlerta(
        'Cuenta demo',
        'Esta es una cuenta demo de solo lectura. No puedes hacer reservas ni modificaciones.'
      );
      return;
    }

    const {
      startTime,
      endTime,
      date,
      durationMinutos: durationMinutes,
      slotsDesplazables: displaceableSlots,
    } = dataReservation;

    const validacion = puedeReservar(
      user,
      { date, startTime, courtId: courtSelected.id },
      reservations
    );

    if (!validacion.valido) {
      showAlerta('No se puede reservar', validacion.error);
      return;
    }

    const hasDisplacements = displaceableSlots.length > 0;
    const durationText = durationMinutes === 30 ? '30 minutos' :
                          durationMinutes === 60 ? '1 hora' : '1.5 horas';

    let title = 'Confirmar Reserva';
    let message = `¿Reservar ${courtSelected.name} el ${formatDateReadable(date)} de ${startTime} a ${endTime}?\n\nDuración: ${durationText} (${selectedSlots.length} bloques)`;

    if (hasDisplacements) {
      const apartmentsDisplaced = [...new Set(displaceableSlots.map(b => b.apartmentDisplaced).filter(Boolean))];
      const hoursDisplaced = displaceableSlots.map(b => b.startTime).join(', ');

      title = 'Desplazar y Reservar';
      message = `¿Reservar ${courtSelected.name} el ${formatDateReadable(date)} de ${startTime} a ${endTime}?\n\n`;
      message += `⚠️ ATENCIÓN: Se cancelarán las reservas provisionales de:\n`;
      message += `• Vivienda(s): ${apartmentsDisplaced.join(', ')}\n`;
      message += `• Horario(s): ${hoursDisplaced}\n\n`;
      message += `Tu reserva será GARANTIZADA.`;
    }

    showAlertaPersonalizada({
      title: title,
      message: message,
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: hasDisplacements ? 'Desplazar y Reservar' : 'Confirmar',
          style: hasDisplacements ? 'destructive' : 'default',
          onPress: async () => {
            setReservando(true);
            const result = await createReservation({
              courtId: courtSelected.id,
              date,
              startTime,
              endTime,
              players: [],
              forceDisplacement: hasDisplacements,
            });
            setReservando(false);

            if (result.success) {
              const successMessage = hasDisplacements
                ? 'Tu reserva GARANTIZADA se ha creado correctamente.\nLas reservas provisionales anteriores han sido desplazadas.'
                : 'Tu reserva se ha creado correctamente';
              showAlerta('¡Reserva confirmada!', successMessage);
              limpiarSelection();
              if (date !== dateSelected) {
                setDateSelected(date);
              }
              recargarTimeSlots();
            } else {
              showAlerta('Error', result.error);
            }
          },
        },
      ],
    });
  }, [
    getDataReservation, user, courtSelected, reservations, selectedSlots,
    dateSelected, setDateSelected, createReservation, limpiarSelection,
    recargarTimeSlots, showAlerta, showAlertaPersonalizada,
  ]);

  return { reservando, cambiarDate, handleTimeSlotPress, confirmarReservation };
}
