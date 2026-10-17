import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useReservations } from '../context/ReservationsContext';
import { useAuth } from '../context/AuthContext';
import { formatDateReadable, formatTime } from '../../utils/dateHelpers';
import { puedeCancel } from '../../utils/validators';
import { CustomAlert } from '../components/CustomAlert';
import { TabBar } from '../components/TabBar';
import { ReservationCard } from '../components/reservations/ReservationCard';
import { EmptyState } from '../components/EmptyState';
import { styles } from './ReservationsScreenStyles';
import { showToast } from '../components/Toast';

export default function ReservationsScreen({ navigation }) {
  const {
    getUpcomingReservations: getReservationsUpcoming,
    getPastReservations: getReservationsPast,
    cancelReservation: cancelReservation,
    reloadReservations
  } = useReservations();
  const { user, notificationMessage, clearNotificationMessage } = useAuth();
  const [tabActiva, setTabActiva] = useState('proximas');

  const reservationsUpcoming = getReservationsUpcoming();
  const reservationsPast = getReservationsPast();

  // Estado para CustomAlert
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  // Mostrar mensaje si viene de una notificación push
  useEffect(() => {
    if (notificationMessage) {
      setAlertConfig({
        visible: true,
        title: notificationMessage.title,
        message: notificationMessage.text,
        buttons: [{
          text: 'OK',
          onPress: () => {
            clearNotificationMessage();
            reloadReservations?.();
          }
        }],
      });
    }
  }, [notificationMessage, clearNotificationMessage, reloadReservations]);

  useFocusEffect(
    useCallback(() => {
      reloadReservations?.();
    }, [reloadReservations])
  );

  const handleCancel = (reservation) => {
    // Block demo users from cancelling
    if (user?.isDemo) {
      setAlertConfig({
        visible: true,
        title: 'Cuenta demo',
        message: 'Esta es una cuenta demo de solo lectura. No puedes hacer reservas ni modificaciones.',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    const validacion = puedeCancel(reservation);

    if (!validacion.valido) {
      setAlertConfig({
        visible: true,
        title: 'No puedes cancelar',
        message: validacion.error,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    setAlertConfig({
      visible: true,
      title: 'Cancelar Reserva',
      message: `¿Estás seguro de cancelar tu reserva del ${formatDateReadable(
        reservation.date
      )} a las ${formatTime(reservation.startTime)}?`,
      buttons: [
        { text: 'No', style: 'cancel', onPress: () => {} },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            const result = await cancelReservation(reservation.id);
            if (result.success) {
              showToast('Reserva cancelada');
            } else {
              setAlertConfig({
                visible: true,
                title: 'Error',
                message: result.error,
                buttons: [{ text: 'OK', onPress: () => {} }],
              });
            }
          },
        },
      ],
    });
  };

  const renderReservation = (reservation) => (
    <ReservationCard
      key={reservation.id}
      reservation={reservation}
      isPast={tabActiva === 'pasadas'}
      currentUserId={user?.id}
      onCancel={handleCancel}
    />
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <TabBar
        tabs={[
          { key: 'proximas', label: 'Próximas', count: reservationsUpcoming.length },
          { key: 'pasadas', label: 'Pasadas', count: reservationsPast.length },
        ]}
        activeKey={tabActiva}
        onChange={setTabActiva}
      />

      {/* Contenido */}
      <ScrollView style={styles.content}>
        {tabActiva === 'proximas' ? (
          reservationsUpcoming.length > 0 ? (
            reservationsUpcoming.map(renderReservation)
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="Sin reservas próximas"
              text="Tu vivienda no tiene ninguna reserva activa."
              actionLabel="Reservar pista"
              onAction={() => navigation?.navigate('Inicio')}
            />
          )
        ) : reservationsPast.length > 0 ? (
          reservationsPast.map(renderReservation)
        ) : (
          <EmptyState
            icon="time-outline"
            title="Sin reservas pasadas"
            text="Aquí verás las reservas de los últimos dos meses."
          />
        )}
      </ScrollView>

      {/* CustomAlert component */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}
