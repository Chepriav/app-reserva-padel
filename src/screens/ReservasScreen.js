import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useReservas } from '../context/ReservasContext';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { formatearFechaLegible, formatearHora, horasHasta } from '../utils/dateHelpers';
import { puedeCancelar } from '../utils/validators';
import { CustomAlert } from '../components/CustomAlert';

export default function ReservasScreen() {
  const { getReservasProximas, getReservasPasadas, cancelarReserva } =
    useReservas();
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
          }
        }],
      });
    }
  }, [notificationMessage]);

  const handleCancelar = (reserva) => {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: Platform.OS === 'web' ? 0 : 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  reservaCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reservaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pistaNombre: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoConfirmada: {
    backgroundColor: colors.secondary,
  },
  estadoCancelada: {
    backgroundColor: colors.error,
  },
  estadoCompletada: {
    backgroundColor: colors.disabled,
  },
  estadoText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  reservaInfo: {
    marginBottom: 12,
  },
  fecha: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  horario: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  reservadoPor: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  jugadoresContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  jugadoresLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  jugadorNombre: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cancelarButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Estilos para sistema de prioridades
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  prioridadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prioridadGarantizada: {
    backgroundColor: colors.reservaGarantizada,
  },
  prioridadProvisional: {
    backgroundColor: colors.reservaProvisional,
  },
  prioridadText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  avisoProvisional: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.reservaProvisional,
  },
  avisoProvisionalText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  // Estilos para reservas disfrutadas (pasadas confirmadas)
  estadoDisfrutada: {
    backgroundColor: colors.reservaPasada,  // Verde grisáceo
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
