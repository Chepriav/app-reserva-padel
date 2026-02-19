import { useState, useCallback } from 'react';
import {
  formatearFechaLegible,
  esFechaValida,
  bloqueTerminado,
} from '../../utils/dateHelpers';
import { puedeReservar } from '../../utils/validators';

/**
 * Encapsulates HomeScreen action handlers:
 * date navigation, slot press, and reservation confirmation.
 */
export function useHomeActions({
  fechaSeleccionada,
  setFechaSeleccionada,
  vistaActual,
  pistaSeleccionada,
  reservas,
  bloquesSeleccionados,
  user,
  crearReserva,
  limpiarSeleccion,
  recargarHorarios,
  toggleBloqueSeleccionado,
  bloqueosHook,
  getDatosReserva,
  mostrarAlerta,
  mostrarAlertaPersonalizada,
}) {
  const [reservando, setReservando] = useState(false);

  const cambiarFecha = useCallback((dias) => {
    const [año, mes, dia] = fechaSeleccionada.split('-').map(Number);
    const fecha = new Date(Date.UTC(año, mes - 1, dia));

    if (vistaActual === 'semana') {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const diaSemana = fecha.getUTCDay();
      const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
      const lunesSeleccionado = new Date(fecha);
      lunesSeleccionado.setUTCDate(fecha.getUTCDate() - diasHastaLunes);

      const diaSemanaHoy = hoy.getDay();
      const diasHastaLunesHoy = diaSemanaHoy === 0 ? 6 : diaSemanaHoy - 1;
      const lunesDeEstaSemanaMundial = new Date(hoy);
      lunesDeEstaSemanaMundial.setDate(hoy.getDate() - diasHastaLunesHoy);
      lunesDeEstaSemanaMundial.setHours(0, 0, 0, 0);

      const nuevaSemana = new Date(lunesSeleccionado);
      nuevaSemana.setUTCDate(lunesSeleccionado.getUTCDate() + (dias * 7));

      const lunesSiguienteSemana = new Date(lunesDeEstaSemanaMundial);
      lunesSiguienteSemana.setDate(lunesDeEstaSemanaMundial.getDate() + 7);

      const nuevaFechaStr = nuevaSemana.toISOString().split('T')[0];
      const nuevaFechaObj = new Date(nuevaFechaStr + 'T00:00:00');

      if (nuevaFechaObj < lunesDeEstaSemanaMundial) {
        mostrarAlerta('Semana no disponible', 'No puedes ver semanas anteriores a la actual');
        return;
      }

      const maxFecha = new Date(lunesSiguienteSemana);
      maxFecha.setDate(maxFecha.getDate() + 6);

      if (nuevaFechaObj > maxFecha) {
        mostrarAlerta('Límite alcanzado', 'Solo puedes ver la semana actual y la siguiente');
        return;
      }

      setFechaSeleccionada(nuevaFechaStr);
    } else {
      fecha.setUTCDate(fecha.getUTCDate() + dias);
      const nuevaFecha = fecha.toISOString().split('T')[0];

      if (esFechaValida(nuevaFecha)) {
        setFechaSeleccionada(nuevaFecha);
      } else {
        mostrarAlerta('Fecha no válida', 'Solo puedes reservar hasta 7 días de anticipación');
      }
    }
  }, [fechaSeleccionada, vistaActual, mostrarAlerta, setFechaSeleccionada]);

  const handleHorarioPress = useCallback((horario, fecha) => {
    const esPasado = bloqueTerminado(fecha, horario.horaFin);
    if (esPasado) return;

    const estaBloqueado = horario.bloqueado;
    const esMiVivienda = horario.reservaExistente?.vivienda === user?.vivienda;
    const esSegundaDesplazable = horario.prioridad === 'segunda' && !horario.estaProtegida;
    const esOtraProvisional = !horario.disponible && !estaBloqueado && !esMiVivienda && esSegundaDesplazable;

    if (bloqueosHook.blockoutMode && user?.esAdmin) {
      if (estaBloqueado) {
        bloqueosHook.toggleSlotToUnblock(horario, fecha);
      } else {
        bloqueosHook.toggleSlotToBlock(horario, fecha);
      }
      return;
    }

    if (estaBloqueado) {
      bloqueosHook.handleTapBlocked(horario);
    } else if (horario.disponible || esOtraProvisional) {
      toggleBloqueSeleccionado(horario, fecha);
    }
  }, [user, bloqueosHook, toggleBloqueSeleccionado]);

  const confirmarReserva = useCallback(async () => {
    const datosReserva = getDatosReserva();
    if (!datosReserva) {
      mostrarAlerta('Selecciona horarios', 'Debes seleccionar al menos un bloque de 30 minutos');
      return;
    }

    if (!user) {
      mostrarAlerta('Error', 'Debes iniciar sesión para hacer una reserva');
      return;
    }

    if (!pistaSeleccionada) {
      mostrarAlerta('Error', 'Selecciona una pista primero');
      return;
    }

    if (user?.esDemo) {
      mostrarAlerta(
        'Demo Account',
        'This is a view-only demo account. You cannot make reservations or modifications.'
      );
      return;
    }

    const { horaInicio, horaFin, fecha, duracionMinutos, bloquesDesplazables } = datosReserva;

    const validacion = puedeReservar(
      user,
      { fecha, horaInicio, pistaId: pistaSeleccionada.id },
      reservas
    );

    if (!validacion.valido) {
      mostrarAlerta('No se puede reservar', validacion.error);
      return;
    }

    const hayDesplazamientos = bloquesDesplazables.length > 0;
    const duracionTexto = duracionMinutos === 30 ? '30 minutos' :
                          duracionMinutos === 60 ? '1 hora' : '1.5 horas';

    let titulo = 'Confirmar Reserva';
    let mensaje = `¿Reservar ${pistaSeleccionada.nombre} el ${formatearFechaLegible(fecha)} de ${horaInicio} a ${horaFin}?\n\nDuración: ${duracionTexto} (${bloquesSeleccionados.length} bloques)`;

    if (hayDesplazamientos) {
      const viviendasDesplazadas = [...new Set(bloquesDesplazables.map(b => b.viviendaDesplazada).filter(Boolean))];
      const horasDesplazadas = bloquesDesplazables.map(b => b.horaInicio).join(', ');

      titulo = 'Desplazar y Reservar';
      mensaje = `¿Reservar ${pistaSeleccionada.nombre} el ${formatearFechaLegible(fecha)} de ${horaInicio} a ${horaFin}?\n\n`;
      mensaje += `⚠️ ATENCIÓN: Se cancelarán las reservas provisionales de:\n`;
      mensaje += `• Vivienda(s): ${viviendasDesplazadas.join(', ')}\n`;
      mensaje += `• Horario(s): ${horasDesplazadas}\n\n`;
      mensaje += `Tu reserva será GARANTIZADA.`;
    }

    mostrarAlertaPersonalizada({
      title: titulo,
      message: mensaje,
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: hayDesplazamientos ? 'Desplazar y Reservar' : 'Confirmar',
          style: hayDesplazamientos ? 'destructive' : 'default',
          onPress: async () => {
            setReservando(true);
            const result = await crearReserva({
              pistaId: pistaSeleccionada.id,
              fecha,
              horaInicio,
              horaFin,
              jugadores: [],
              forzarDesplazamiento: hayDesplazamientos,
            });
            setReservando(false);

            if (result.success) {
              const mensajeExito = hayDesplazamientos
                ? 'Tu reserva GARANTIZADA se ha creado correctamente.\nLas reservas provisionales anteriores han sido desplazadas.'
                : 'Tu reserva se ha creado correctamente';
              mostrarAlerta('¡Reserva confirmada!', mensajeExito);
              limpiarSeleccion();
              if (fecha !== fechaSeleccionada) {
                setFechaSeleccionada(fecha);
              }
              recargarHorarios();
            } else {
              mostrarAlerta('Error', result.error);
            }
          },
        },
      ],
    });
  }, [
    getDatosReserva, user, pistaSeleccionada, reservas, bloquesSeleccionados,
    fechaSeleccionada, setFechaSeleccionada, crearReserva, limpiarSeleccion,
    recargarHorarios, mostrarAlerta, mostrarAlertaPersonalizada,
  ]);

  return { reservando, cambiarFecha, handleHorarioPress, confirmarReserva };
}
