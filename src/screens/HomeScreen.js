import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useReservas } from '../context/ReservasContext';
import { colors } from '../constants/colors';
import {
  obtenerFechaHoy,
  formatearFechaLegible,
  esFechaValida,
  bloqueTerminado,
} from '../utils/dateHelpers';
import { puedeReservar } from '../utils/validators';
import { CustomAlert } from '../components/CustomAlert';

// Hooks
import {
  useAlert,
  useSeleccionHorarios,
  useBloqueos,
  useHorarios,
} from '../hooks';

// Componentes
import {
  HomeHeader,
  VistaSelector,
  FechaSelector,
  PistaSelector,
  Leyenda,
  HorariosContainer,
  BotonReservar,
  BotonesBloqueo,
  ModalBloqueo,
  HorariosHeader,
  SeleccionInfo,
} from '../components/home';

export default function HomeScreen({ navigation }) {
  const { user, notificacionesPendientes, marcarNotificacionesLeidas } = useAuth();
  const { pistas, crearReserva, obtenerDisponibilidad, reservas, reservasVersion } = useReservas();

  // Estado de navegación
  const [fechaSeleccionada, setFechaSeleccionada] = useState(obtenerFechaHoy());
  const [pistaSeleccionada, setPistaSeleccionada] = useState(null);
  const [vistaActual, setVistaActual] = useState('dia');
  const [reservando, setReservando] = useState(false);
  const [notificacionMostrada, setNotificacionMostrada] = useState(false);

  // Hook de alertas
  const {
    alertConfig,
    mostrarAlerta,
    mostrarAlertaPersonalizada,
    cerrarAlerta,
  } = useAlert();

  // Hook de horarios
  const {
    horarios,
    horariosSemanales,
    loadingHorarios,
    recargarHorarios,
  } = useHorarios({
    pistaSeleccionada,
    fechaSeleccionada,
    vistaActual,
    obtenerDisponibilidad,
    reservasVersion,
    mostrarAlerta,
  });

  // Hook de selección de horarios
  const {
    bloquesSeleccionados,
    toggleBloqueSeleccionado,
    limpiarSeleccion,
    getDatosReserva,
  } = useSeleccionHorarios({ mostrarAlerta });

  // Hook de bloqueos (admin)
  const bloqueosHook = useBloqueos({
    pistaSeleccionada,
    userId: user?.id,
    mostrarAlerta,
    onRecargarHorarios: recargarHorarios,
  });

  // Seleccionar primera pista automáticamente
  useEffect(() => {
    if (pistas.length > 0 && !pistaSeleccionada) {
      setPistaSeleccionada(pistas[0]);
    }
  }, [pistas, pistaSeleccionada]);

  // Limpiar selección cuando cambia fecha o vista
  useEffect(() => {
    limpiarSeleccion();
  }, [fechaSeleccionada, vistaActual]);

  // Mostrar notificación de desplazamiento
  useEffect(() => {
    if (notificacionesPendientes.length > 0 && !notificacionMostrada) {
      const notif = notificacionesPendientes[0];
      setNotificacionMostrada(true);
      mostrarAlertaPersonalizada({
        title: 'Reserva Desplazada',
        message: `Tu reserva provisional del ${formatearFechaLegible(notif.fechaReserva)} a las ${notif.horaInicio} en ${notif.pistaNombre} fue desplazada por otra vivienda.\n\nPuedes hacer una nueva reserva cuando quieras.`,
        buttons: [{
          text: 'Entendido',
          onPress: () => marcarNotificacionesLeidas(),
        }],
      });
    }
  }, [notificacionesPendientes, notificacionMostrada]);

  // Cambiar fecha (día o semana)
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
  }, [fechaSeleccionada, vistaActual, mostrarAlerta]);

  // Manejar tap en horario
  const handleHorarioPress = useCallback((horario, fecha) => {
    const esPasado = bloqueTerminado(fecha, horario.horaFin);
    if (esPasado) return;

    const estaBloqueado = horario.bloqueado;
    const esMiVivienda = horario.reservaExistente?.vivienda === user?.vivienda;
    const esPrimeraOProtegida = horario.prioridad === 'primera' || horario.estaProtegida;
    const esSegundaDesplazable = horario.prioridad === 'segunda' && !horario.estaProtegida;
    const esOtraProvisional = !horario.disponible && !estaBloqueado && !esMiVivienda && esSegundaDesplazable;

    // Modo bloqueo (admin)
    if (bloqueosHook.modoBloqueo && user?.esAdmin) {
      if (estaBloqueado) {
        bloqueosHook.toggleBloqueADesbloquear(horario, fecha);
      } else if (horario.disponible) {
        bloqueosHook.toggleBloqueABloquear(horario, fecha);
      } else {
        mostrarAlerta('No se puede bloquear', 'Este horario tiene una reserva activa');
      }
      return;
    }

    // Modo normal
    if (estaBloqueado) {
      bloqueosHook.handleTapBloqueado(horario);
    } else if (horario.disponible || esOtraProvisional) {
      toggleBloqueSeleccionado(horario, fecha);
    }
  }, [user, bloqueosHook, toggleBloqueSeleccionado, mostrarAlerta]);

  // Confirmar reserva
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
    fechaSeleccionada, crearReserva, limpiarSeleccion, recargarHorarios,
    mostrarAlerta, mostrarAlertaPersonalizada
  ]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <HomeHeader
          userName={user?.nombre}
          esAdmin={user?.esAdmin}
          modoBloqueo={bloqueosHook.modoBloqueo}
          onModoBloqueoChange={bloqueosHook.setModoBloqueo}
        />

        <VistaSelector
          vistaActual={vistaActual}
          onVistaChange={setVistaActual}
        />

        <FechaSelector
          fechaSeleccionada={fechaSeleccionada}
          vistaActual={vistaActual}
          onCambiarFecha={cambiarFecha}
        />

        <PistaSelector
          pistas={pistas}
          pistaSeleccionada={pistaSeleccionada}
          onPistaSelect={setPistaSeleccionada}
        />

        {pistaSeleccionada && (
          <View style={styles.section}>
            <HorariosHeader
              vistaActual={vistaActual}
              cantidadSeleccionados={bloquesSeleccionados.length}
              onLimpiar={limpiarSeleccion}
            />

            <SeleccionInfo cantidadBloques={bloquesSeleccionados.length} />

            <Leyenda />

            <HorariosContainer
              loading={loadingHorarios}
              vistaActual={vistaActual}
              horarios={horarios}
              horariosSemanales={horariosSemanales}
              fechaSeleccionada={fechaSeleccionada}
              userVivienda={user?.vivienda}
              bloquesSeleccionados={bloquesSeleccionados}
              bloquesABloquear={bloqueosHook.bloquesABloquear}
              bloquesADesbloquear={bloqueosHook.bloquesADesbloquear}
              modoBloqueo={bloqueosHook.modoBloqueo}
              esAdmin={user?.esAdmin}
              reservando={reservando || bloqueosHook.procesando}
              onHorarioPress={handleHorarioPress}
            />
          </View>
        )}
      </ScrollView>

      {/* Botón Reservar (modo normal) */}
      {!bloqueosHook.modoBloqueo && (
        <BotonReservar
          cantidadBloques={bloquesSeleccionados.length}
          onPress={confirmarReserva}
          disabled={reservando}
        />
      )}

      {/* Botones Bloquear/Desbloquear (modo admin) */}
      {bloqueosHook.modoBloqueo && (
        <BotonesBloqueo
          cantidadBloquear={bloqueosHook.bloquesABloquear.length}
          cantidadDesbloquear={bloqueosHook.bloquesADesbloquear.length}
          onBloquear={bloqueosHook.abrirModalBloqueo}
          onDesbloquear={bloqueosHook.eliminarBloqueos}
          onLimpiar={bloqueosHook.limpiarSeleccionBloqueo}
          disabled={bloqueosHook.procesando}
        />
      )}

      {/* Modal de bloqueo */}
      <ModalBloqueo
        visible={bloqueosHook.modalBloqueo.visible}
        motivo={bloqueosHook.modalBloqueo.motivo}
        cantidadHorarios={bloqueosHook.bloquesABloquear.length}
        onMotivoChange={bloqueosHook.setMotivoBloqueo}
        onConfirmar={bloqueosHook.crearBloqueos}
        onCancelar={bloqueosHook.cerrarModalBloqueo}
        disabled={bloqueosHook.procesando}
      />

      {/* Loading overlay */}
      {(reservando || bloqueosHook.procesando) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={cerrarAlerta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    margin: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
