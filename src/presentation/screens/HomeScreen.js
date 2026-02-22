import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, ActivityIndicator, findNodeHandle } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationsContext';
import { colors } from '../../constants/colors';
import { getDateToday, formatDateReadable } from '../../utils/dateHelpers';
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
  ViewSelector,
  DateSelector,
  CourtSelector,
  Leyenda,
  TimeSlotsContainer,
  ButtonReservar,
  ButtonsBlockout,
  ModalBlockout,
  TimeSlotsHeader,
  SelectionInfo,
} from '../components/home';

export default function HomeScreen({ navigation }) {
  const { user, notificationsPending, markNotificationsRead } = useAuth();
  const {
    courts: courts,
    createReservation: createReservation,
    getAvailability: getAvailability,
    reservations: reservations,
    reservationsVersion: reservationsVersion
  } = useReservations();

  const [dateSelected, setDateSelected] = useState(getDateToday());
  const [courtSelected, setCourtSelected] = useState(null);
  const [viewActual, setViewActual] = useState('dia');
  const [notificationMostrada, setNotificationMostrada] = useState(false);

  const scrollViewRef = useRef(null);
  const scheduleContainerRef = useRef(null);
  const prevSelectionCount = useRef(0);

  const {
    alertConfig,
    showAlerta,
    showAlertaPersonalizada,
    closeAlerta,
  } = useAlert();

  const {
    schedules: timeSlots,
    weeklySchedules: timeSlotsSemanales,
    loadingSchedules: loadingTimeSlots,
    reloadSchedules: recargarTimeSlots,
  } = useSchedules({
    selectedCourt: courtSelected,
    selectedDate: dateSelected,
    currentView: viewActual,
    getAvailability: getAvailability,
    reservationsVersion,
    showAlerta,
  });

  const {
    selectedSlots: selectedSlots,
    toggleSlotSelected: toggleSlotSelected,
    clearSelection: limpiarSelection,
    getReservationData: getDataReservation,
  } = useSlotSelection({ showAlerta });

  const blockoutsHook = useBlockouts({
    selectedCourt: courtSelected,
    userId: user?.id,
    showAlerta,
    onReloadSchedules: recargarTimeSlots,
  });

  useEffect(() => {
    if (courts.length > 0 && !courtSelected) {
      setCourtSelected(courts[0]);
    }
  }, [courts, courtSelected]);

  useEffect(() => {
    limpiarSelection();
  }, [dateSelected, viewActual]);

  useEffect(() => {
    const currentCount = selectedSlots.length;
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
  }, [selectedSlots.length]);

  useEffect(() => {
    if (notificationsPending.length > 0 && !notificationMostrada) {
      const notif = notificationsPending[0];
      setNotificationMostrada(true);
      showAlertaPersonalizada({
        title: 'Reserva Desplazada',
        message: `Tu reserva provisional del ${formatDateReadable(notif.reservationDate)} a las ${notif.startTime} en ${notif.courtName} fue desplazada por otra vivienda.\n\nPuedes hacer una nueva reserva cuando quieras.`,
        buttons: [{
          text: 'Entendido',
          onPress: () => markNotificationsRead(),
        }],
      });
    }
  }, [notificationsPending, notificationMostrada]);

  const { reservando, cambiarDate, handleTimeSlotPress, confirmarReservation } = useHomeActions({
    dateSelected, setDateSelected, viewActual,
    courtSelected, reservations, selectedSlots,
    user, createReservation, limpiarSelection, recargarTimeSlots,
    toggleSlotSelected, blockoutsHook, getDataReservation,
    showAlerta, showAlertaPersonalizada,
  });

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <HomeHeader
          userName={user?.name}
          isAdmin={user?.isAdmin}
          blockoutMode={blockoutsHook.blockoutMode}
          onModoBlockoutChange={blockoutsHook.setBlockoutMode}
        />

        <ViewSelector
          viewActual={viewActual}
          onViewChange={setViewActual}
        />

        <DateSelector
          dateSelected={dateSelected}
          viewActual={viewActual}
          onCambiarDate={cambiarDate}
        />

        <CourtSelector
          courts={courts}
          courtSelected={courtSelected}
          onCourtSelect={setCourtSelected}
        />

        {courtSelected && (
          <View ref={scheduleContainerRef} style={styles.section}>
            <TimeSlotsHeader
              viewActual={viewActual}
              countSelected={selectedSlots.length}
              onLimpiar={limpiarSelection}
            />

            <SelectionInfo countSlots={selectedSlots.length} />

            <Leyenda />

            <TimeSlotsContainer
              loading={loadingTimeSlots}
              viewActual={viewActual}
              timeSlots={timeSlots}
              timeSlotsSemanales={timeSlotsSemanales}
              dateSelected={dateSelected}
              userApartment={user?.apartment}
              selectedSlots={selectedSlots}
              slotsToBlock={blockoutsHook.slotsToBlock}
              slotsToUnblock={blockoutsHook.slotsToUnblock}
              blockoutMode={blockoutsHook.blockoutMode}
              isAdmin={user?.isAdmin}
              reservando={reservando || blockoutsHook.processing}
              onTimeSlotPress={handleTimeSlotPress}
            />
          </View>
        )}
      </ScrollView>

      {!blockoutsHook.blockoutMode && (
        <ButtonReservar
          countSlots={selectedSlots.length}
          onPress={confirmarReservation}
          disabled={reservando}
        />
      )}

      {blockoutsHook.blockoutMode && (
        <ButtonsBlockout
          countBlock={blockoutsHook.slotsToBlock.length}
          countUnblock={blockoutsHook.slotsToUnblock.length}
          onBlock={blockoutsHook.openBlockoutModal}
          onUnblock={blockoutsHook.deleteBlockouts}
          onLimpiar={blockoutsHook.clearBlockoutSelection}
          disabled={blockoutsHook.processing}
        />
      )}

      <ModalBlockout
        visible={blockoutsHook.blockoutModal.visible}
        reason={blockoutsHook.blockoutModal.reason}
        countTimeSlots={blockoutsHook.slotsToBlock.length}
        onReasonChange={blockoutsHook.setBlockoutReason}
        onConfirmar={blockoutsHook.createBlockouts}
        onCancel={blockoutsHook.closeBlockoutModal}
        disabled={blockoutsHook.processing}
      />

      {(reservando || blockoutsHook.processing) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={closeAlerta}
      />
    </View>
  );
}
