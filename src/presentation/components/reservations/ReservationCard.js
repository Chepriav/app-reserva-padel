import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { formatTime, hoursUntil } from '../../../utils/dateHelpers';

const WEEKDAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const STATUS = {
  upcoming: { label: 'Reservada', color: colors.success },
  provisional: { label: 'Provisional', color: colors.accent },
  played: { label: 'Jugada', color: colors.textSecondary },
  cancelled: { label: 'Cancelada', color: colors.error },
};

const durationLabel = (start, end) => {
  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const minutes = toMin(end) - toMin(start);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};

/**
 * Reservation card for Mis Reservas: date tile, time, court and one status.
 */
export function ReservationCard({ reservation, isPast, currentUserId, onCancel }) {
  const [y, mo, d] = reservation.date.split('-').map(Number);
  const date = new Date(y, mo - 1, d);

  const hoursRemaining = hoursUntil(reservation.date, reservation.startTime);
  // Provisional (second reservation) is only shown when that mode is enabled
  const isProvisional =
    !isPast && reservation.priority === 'provisional' && hoursRemaining >= 24;

  let statusKey = 'upcoming';
  if (reservation.status === 'cancelled') statusKey = 'cancelled';
  else if (isPast || reservation.status === 'completed') statusKey = 'played';
  else if (isProvisional) statusKey = 'provisional';
  const status = STATUS[statusKey];

  const canCancel = reservation.status === 'confirmed' && !isPast;
  const isCancelled = statusKey === 'cancelled';

  return (
    <View style={[styles.card, isCancelled && styles.cardMuted]}>
      <View style={styles.row}>
        <View style={[styles.dateTile, isPast && styles.dateTilePast]}>
          <Text style={[styles.weekday, isPast && styles.mutedText]}>{WEEKDAYS[date.getDay()]}</Text>
          <Text style={[styles.day, isPast && styles.mutedText]}>{date.getDate()}</Text>
          <Text style={[styles.month, isPast && styles.mutedText]}>{MONTHS[date.getMonth()]}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.topLine}>
            <Text style={[styles.time, isCancelled && styles.strike]}>
              {formatTime(reservation.startTime)} – {formatTime(reservation.endTime)}
            </Text>
            <View style={[styles.status, { backgroundColor: status.color + '1A' }]}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <Text style={styles.meta}>
            {reservation.courtName} · {durationLabel(reservation.startTime, reservation.endTime)}
          </Text>
          {reservation.userId !== currentUserId && !!reservation.userName && (
            <Text style={styles.meta}>Reservada por {reservation.userName}</Text>
          )}
          {reservation.players?.length > 0 && (
            <Text style={styles.meta} numberOfLines={2}>
              Con {reservation.players.join(', ')}
            </Text>
          )}
        </View>
      </View>

      {isProvisional && (
        <Text style={styles.notice}>
          Otra vivienda sin reservas puede ocupar este horario hasta 24 h antes.
        </Text>
      )}

      {canCancel && (
        <TouchableOpacity
          style={styles.cancel}
          onPress={() => onCancel(reservation)}
          accessibilityRole="button"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="close-circle-outline" size={17} color={colors.error} />
          <Text style={styles.cancelText}>Cancelar reserva</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  cardMuted: {
    opacity: 0.75,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  dateTile: {
    width: 56,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  dateTilePast: {
    backgroundColor: '#edf2f7',
  },
  weekday: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.75)',
  },
  day: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 26,
  },
  month: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  mutedText: {
    color: colors.textSecondary,
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  time: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  strike: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notice: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
  },
  cancel: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 5,
    marginTop: 10,
    paddingVertical: 4,
  },
  cancelText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
});
