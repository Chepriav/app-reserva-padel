import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useReservations } from '../context/ReservationsContext';
import { useAuth } from '../context/AuthContext';
import { formatDateReadable, formatTime, hoursUntil } from '../../utils/dateHelpers';
import { puedeCancel } from '../../utils/validators';
import { CustomAlert } from '../components/CustomAlert';
import { styles } from './ReservationsScreenStyles';

export default function ReservationsScreen() {
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
              setAlertConfig({
                visible: true,
                title: 'Cancelada',
                message: 'Tu reserva ha sido cancelada',
                buttons: [{ text: 'OK', onPress: () => {} }],
              });
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

  const renderReservation = (reservation) => {
    const isPast = tabActiva === 'pasadas';
    const puedeCancelarla =
      reservation.status === 'confirmed' && !isPast;

    // Calcular si está protegida (< 24h)
    const hoursRemaining = hoursUntil(reservation.date, reservation.startTime);
    const estaProtegida = hoursRemaining < 24;

    // Determinar tipo de prioridad a mostrar
    const isGuaranteed = reservation.priority === 'guaranteed' || estaProtegida;
    const isProvisional = reservation.priority === 'provisional' && !estaProtegida;

    // Reserva pasada disfrutada (confirmada que ya pasó)
    const isDisfrutada = isPast && reservation.status === 'confirmed';

    // Verificar si la reserva fue hecha por otro usuario de la vivienda
    const isOfOtroUser = reservation.userId !== user?.id;

    return (
      <View
        key={reservation.id}
        style={styles.reservationCard}
      >
        <View style={styles.reservationHeader}>
          <Text style={styles.courtName}>{reservation.courtName}</Text>
          <View style={styles.badgesContainer}>
            {/* Badge de prioridad - solo para reservas confirmadas próximas */}
            {reservation.status === 'confirmed' && !isPast && (
              <View
                style={[
                  styles.priorityBadge,
                  isGuaranteed && styles.guaranteedPriority,
                  isProvisional && styles.provisionalPriority,
                ]}
              >
                <Text style={styles.priorityText}>
                  {isGuaranteed ? 'Garantizada' : 'Provisional'}
                </Text>
              </View>
            )}
            {/* Badge para reserva disfrutada */}
            {isDisfrutada && (
              <View style={styles.statusDisfrutada}>
                <Text style={styles.statusText}>Disfrutada</Text>
              </View>
            )}
            {/* Badge de estado - no mostrar para disfrutadas */}
            {!isDisfrutada && (
              <View
                style={[
                  styles.statusBadge,
                  reservation.status === 'confirmed' && styles.statusConfirmada,
                  reservation.status === 'cancelled' && styles.statusCancelled,
                  reservation.status === 'completed' && styles.statusCompletada,
                ]}
              >
                <Text style={styles.statusText}>
                  {reservation.status === 'confirmed' && 'Confirmada'}
                  {reservation.status === 'cancelled' && 'Cancelada'}
                  {reservation.status === 'completed' && 'Completada'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.reservationInfo}>
          <Text style={styles.date}>
            {formatDateReadable(reservation.date)}
          </Text>
          <Text style={styles.timeSlot}>
            {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
          </Text>

          {/* Mostrar quién hizo la reserva si es de otro usuario */}
          {isOfOtroUser && (
            <Text style={styles.reservedBy}>
              Reservada por: {reservation.userName}
            </Text>
          )}

          {/* Aviso para reservas provisionales */}
          {isProvisional && reservation.status === 'confirmed' && !isPast && (
            <View style={styles.noticeProvisional}>
              <Text style={styles.noticeProvisionalText}>
                Esta reserva puede ser desplazada si otra vivienda necesita este horario como su primera reserva.
                Se convertirá en garantizada en {Math.round(hoursRemaining - 24)} horas.
              </Text>
            </View>
          )}

          {reservation.players.length > 0 && (
            <View style={styles.playersContainer}>
              <Text style={styles.playersLabel}>Otros jugadores:</Text>
              {reservation.players.map((player, index) => (
                <Text key={index} style={styles.playerName}>
                  • {player}
                </Text>
              ))}
            </View>
          )}
        </View>

        {puedeCancelarla && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancel(reservation)}
          >
            <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            tabActiva === 'proximas' && styles.tabActive,
          ]}
          onPress={() => setTabActiva('proximas')}
        >
          <Text
            style={[
              styles.tabText,
              tabActiva === 'proximas' && styles.tabTextActive,
            ]}
          >
            Próximas ({reservationsUpcoming.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            tabActiva === 'pasadas' && styles.tabActive,
          ]}
          onPress={() => setTabActiva('pasadas')}
        >
          <Text
            style={[
              styles.tabText,
              tabActiva === 'pasadas' && styles.tabTextActive,
            ]}
          >
            Pasadas ({reservationsPast.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <ScrollView style={styles.content}>
        {tabActiva === 'proximas' ? (
          reservationsUpcoming.length > 0 ? (
            reservationsUpcoming.map(renderReservation)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay reservas próximas</Text>
              <Text style={styles.emptySubtext}>
                Tu vivienda no tiene reservas activas.{'\n'}Ve a Inicio para hacer una reserva.
              </Text>
            </View>
          )
        ) : reservationsPast.length > 0 ? (
          reservationsPast.map(renderReservation)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay reservas pasadas</Text>
          </View>
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
