import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { formatShortDate, formatTime } from '../../../utils/dateHelpers';
import { hasStarted } from '../../../utils/nextReservation';

export { pickNextReservation } from '../../../utils/nextReservation';

/**
 * "Tu próxima reserva" card at the top of Inicio.
 */
export function NextReservationCard({ reservation, onOpen, onFindPlayers }) {
  if (!reservation) return null;

  const playingNow = hasStarted(reservation);
  const when = playingNow ? 'Ahora' : formatShortDate(reservation.date);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.main}
        onPress={onOpen}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Tu próxima reserva: ${when}, de ${formatTime(reservation.startTime)} a ${formatTime(reservation.endTime)}`}
      >
        <View style={styles.iconCircle}>
          <Ionicons name={playingNow ? 'tennisball' : 'calendar'} size={20} color={colors.success} />
        </View>
        <View style={styles.body}>
          <Text style={styles.label}>{playingNow ? 'En juego' : 'Tu próxima reserva'}</Text>
          <Text style={styles.when} numberOfLines={1}>
            {when} · {formatTime(reservation.startTime)}–{formatTime(reservation.endTime)}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>{reservation.courtName}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {!playingNow && onFindPlayers && (
        <TouchableOpacity
          style={styles.action}
          onPress={onFindPlayers}
          accessibilityRole="button"
        >
          <Ionicons name="people-outline" size={16} color={colors.primary} />
          <Text style={styles.actionText}>Buscar jugadores</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.success + '55',
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.success,
  },
  when: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
