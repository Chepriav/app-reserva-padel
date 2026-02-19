import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, ActivityIndicator, findNodeHandle } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationsContext';
import { colors } from '../../constants/colors';
import { obtenerFechaHoy, formatearFechaLegible } from '../../utils/dateHelpers';
import { CustomAlert } from '../components/CustomAlert';
import { useHomeActions } from '../hooks/useHomeActions';
import { styles } from './HomeScreenStyles';

// Hooks
import {
  useAlert,
  useSlotSelection,
  useBlockouts,
  useSchedules,
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
  const {
    courts: pistas,
    createReservation: crearReserva,
    getAvailability: obtenerDisponibilidad,
    reservations: reservas,
    reservationsVersion: reservasVersion
  } = useReservations();

  const [fechaSeleccionada, setFechaSeleccionada] = useState(obtenerFechaHoy());
  const [pistaSeleccionada, setPistaSeleccionada] = useState(null);
  const [vistaActual, setVistaActual] = useState('dia');
  const [notificacionMostrada, setNotificacionMostrada] = useState(false);

  const scrollViewRef = useRef(null);
  const scheduleContainerRef = useRef(null);
  const prevSelectionCount = useRef(0);

  const {
    alertConfig,
    mostrarAlerta,
    mostrarAlertaPersonalizada,
    cerrarAlerta,
  } = useAlert();

  const {
    schedules: horarios,
    weeklySchedules: horariosSemanales,
    loadingSchedules: loadingHorarios,
    reloadSchedules: recargarHorarios,
  } = useSchedules({
    selectedCourt: pistaSeleccionada,
    selectedDate: fechaSeleccionada,
    currentView: vistaActual,
    getAvailability: obtenerDisponibilidad,
    reservasVersion,
    mostrarAlerta,
  });

  const {
    selectedSlots: bloquesSeleccionados,
    toggleSlotSelected: toggleBloqueSeleccionado,
    clearSelection: limpiarSeleccion,
    getReservationData: getDatosReserva,
  } = useSlotSelection({ mostrarAlerta });

  const bloqueosHook = useBlockouts({
    selectedCourt: pistaSeleccionada,
    userId: user?.id,
    mostrarAlerta,
    onReloadSchedules: recargarHorarios,
  });

  useEffect(() => {
    if (pistas.length > 0 && !pistaSeleccionada) {
      setPistaSeleccionada(pistas[0]);
    }
  }, [pistas, pistaSeleccionada]);

  useEffect(() => {
    limpiarSeleccion();
  }, [fechaSeleccionada, vistaActual]);

  useEffect(() => {
    const currentCount = bloquesSeleccionados.length;
    const wasEmpty = prevSelectionCount.current === 0;
    prevSelectionCount.current = currentCount;

    if (currentCount === 1 && wasEmpty && scheduleContainerRef.current && scrollViewRef.current) {
      scheduleContainerRef.current.measureLayout(
        findNodeHandle(scrollViewRef.current),
        (_x, y) => {
          scrollViewRef.current.scrollTo({ y: Math.max(0, y - 50), animated: true });
        },
        () => {}
      );
    }
  }, [bloquesSeleccionados.length]);

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

  const { reservando, cambiarFecha, handleHorarioPress, confirmarReserva } = useHomeActions({
    fechaSeleccionada, setFechaSeleccionada, vistaActual,
    pistaSeleccionada, reservas, bloquesSeleccionados,
    user, crearReserva, limpiarSeleccion, recargarHorarios,
    toggleBloqueSeleccionado, bloqueosHook, getDatosReserva,
    mostrarAlerta, mostrarAlertaPersonalizada,
  });

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <HomeHeader
          userName={user?.nombre}
          esAdmin={user?.esAdmin}
          modoBloqueo={bloqueosHook.blockoutMode}
          onModoBloqueoChange={bloqueosHook.setBlockoutMode}
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
          <View ref={scheduleContainerRef} style={styles.section}>
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
              bloquesABloquear={bloqueosHook.slotsToBlock}
              bloquesADesbloquear={bloqueosHook.slotsToUnblock}
              modoBloqueo={bloqueosHook.blockoutMode}
              esAdmin={user?.esAdmin}
              reservando={reservando || bloqueosHook.processing}
              onHorarioPress={handleHorarioPress}
            />
          </View>
        )}
      </ScrollView>

      {!bloqueosHook.blockoutMode && (
        <BotonReservar
          cantidadBloques={bloquesSeleccionados.length}
          onPress={confirmarReserva}
          disabled={reservando}
        />
      )}

      {bloqueosHook.blockoutMode && (
        <BotonesBloqueo
          cantidadBloquear={bloqueosHook.slotsToBlock.length}
          cantidadDesbloquear={bloqueosHook.slotsToUnblock.length}
          onBloquear={bloqueosHook.openBlockoutModal}
          onDesbloquear={bloqueosHook.deleteBlockouts}
          onLimpiar={bloqueosHook.clearBlockoutSelection}
          disabled={bloqueosHook.processing}
        />
      )}

      <ModalBloqueo
        visible={bloqueosHook.blockoutModal.visible}
        motivo={bloqueosHook.blockoutModal.motivo}
        cantidadHorarios={bloqueosHook.slotsToBlock.length}
        onMotivoChange={bloqueosHook.setBlockoutReason}
        onConfirmar={bloqueosHook.createBlockouts}
        onCancelar={bloqueosHook.closeBlockoutModal}
        disabled={bloqueosHook.processing}
      />

      {(reservando || bloqueosHook.processing) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

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
