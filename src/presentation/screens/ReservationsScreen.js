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
import { formatearFechaLegible, formatearHora, horasHasta } from '../../utils/dateHelpers';
import { puedeCancelar } from '../../utils/validators';
import { CustomAlert } from '../components/CustomAlert';
import { styles } from './ReservationsScreenStyles';

export default function ReservasScreen() {
  const {
    getUpcomingReservations: getReservasProximas,
    getPastReservations: getReservasPasadas,
    cancelReservation: cancelarReserva,
    reloadReservations
  } = useReservations();
  const { user, notificationMessage, clearNotificationMessage } = useAuth();
  const [tabActiva, setTabActiva] = useState('proximas');

  const reservasProximas = getReservasProximas();
  const reservasPasadas = getReservasPasadas();

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

  const handleCancelar = (reserva) => {
    // Block demo users from cancelling
    if (user?.esDemo) {
      setAlertConfig({
        visible: true,
        title: 'Demo Account',
        message: 'This is a view-only demo account. You cannot make reservations or modifications.',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    const validacion = puedeCancelar(reserva);

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
      message: `¿Estás seguro de cancelar tu reserva del ${formatearFechaLegible(
        reserva.fecha
      )} a las ${formatearHora(reserva.horaInicio)}?`,
      buttons: [
        { text: 'No', style: 'cancel', onPress: () => {} },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            const result = await cancelarReserva(reserva.id);
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

  const renderReserva = (reserva) => {
    const esPasada = tabActiva === 'pasadas';
    const puedeCancelarla =
      reserva.estado === 'confirmada' && !esPasada;

    // Calcular si está protegida (< 24h)
    const horasRestantes = horasHasta(reserva.fecha, reserva.horaInicio);
    const estaProtegida = horasRestantes < 24;

    // Determinar tipo de prioridad a mostrar
    const esGarantizada = reserva.prioridad === 'primera' || estaProtegida;
    const esProvisional = reserva.prioridad === 'segunda' && !estaProtegida;

    // Reserva pasada disfrutada (confirmada que ya pasó)
    const esDisfrutada = esPasada && reserva.estado === 'confirmada';

    // Verificar si la reserva fue hecha por otro usuario de la vivienda
    const esDeOtroUsuario = reserva.usuarioId !== user?.id;

    return (
      <View
        key={reserva.id}
        style={styles.reservaCard}
      >
        <View style={styles.reservaHeader}>
          <Text style={styles.pistaNombre}>{reserva.pistaNombre}</Text>
          <View style={styles.badgesContainer}>
            {/* Badge de prioridad - solo para reservas confirmadas próximas */}
            {reserva.estado === 'confirmada' && !esPasada && (
              <View
                style={[
                  styles.prioridadBadge,
                  esGarantizada && styles.prioridadGarantizada,
                  esProvisional && styles.prioridadProvisional,
                ]}
              >
                <Text style={styles.prioridadText}>
                  {esGarantizada ? 'Garantizada' : 'Provisional'}
                </Text>
              </View>
            )}
            {/* Badge para reserva disfrutada */}
            {esDisfrutada && (
              <View style={styles.estadoDisfrutada}>
                <Text style={styles.estadoText}>Disfrutada</Text>
              </View>
            )}
            {/* Badge de estado - no mostrar para disfrutadas */}
            {!esDisfrutada && (
              <View
                style={[
                  styles.estadoBadge,
                  reserva.estado === 'confirmada' && styles.estadoConfirmada,
                  reserva.estado === 'cancelada' && styles.estadoCancelada,
                  reserva.estado === 'completada' && styles.estadoCompletada,
                ]}
              >
                <Text style={styles.estadoText}>
                  {reserva.estado === 'confirmada' && 'Confirmada'}
                  {reserva.estado === 'cancelada' && 'Cancelada'}
                  {reserva.estado === 'completada' && 'Completada'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.reservaInfo}>
          <Text style={styles.fecha}>
            {formatearFechaLegible(reserva.fecha)}
          </Text>
          <Text style={styles.horario}>
            {formatearHora(reserva.horaInicio)} - {formatearHora(reserva.horaFin)}
          </Text>

          {/* Mostrar quién hizo la reserva si es de otro usuario */}
          {esDeOtroUsuario && (
            <Text style={styles.reservadoPor}>
              Reservado por: {reserva.usuarioNombre}
            </Text>
          )}

          {/* Aviso para reservas provisionales */}
          {esProvisional && reserva.estado === 'confirmada' && !esPasada && (
            <View style={styles.avisoProvisional}>
              <Text style={styles.avisoProvisionalText}>
                Esta reserva puede ser desplazada si otra vivienda necesita este horario como su primera reserva.
                Se convertirá en garantizada en {Math.round(horasRestantes - 24)} horas.
              </Text>
            </View>
          )}

          {reserva.jugadores.length > 0 && (
            <View style={styles.jugadoresContainer}>
              <Text style={styles.jugadoresLabel}>Otros jugadores:</Text>
              {reserva.jugadores.map((jugador, index) => (
                <Text key={index} style={styles.jugadorNombre}>
                  • {jugador}
                </Text>
              ))}
            </View>
          )}
        </View>

        {puedeCancelarla && (
          <TouchableOpacity
            style={styles.cancelarButton}
            onPress={() => handleCancelar(reserva)}
          >
            <Text style={styles.cancelarButtonText}>Cancelar Reserva</Text>
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
            Próximas ({reservasProximas.length})
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
            Pasadas ({reservasPasadas.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <ScrollView style={styles.content}>
        {tabActiva === 'proximas' ? (
          reservasProximas.length > 0 ? (
            reservasProximas.map(renderReserva)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay reservas próximas</Text>
              <Text style={styles.emptySubtext}>
                Tu vivienda no tiene reservas activas.{'\n'}Ve a Inicio para hacer una reserva.
              </Text>
            </View>
          )
        ) : reservasPasadas.length > 0 ? (
          reservasPasadas.map(renderReserva)
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
