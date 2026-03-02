import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';

const STATUS_LABELS = {
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

const STATUS_COLORS = {
  confirmed: colors.success,
  cancelled: colors.error,
  completed: colors.textSecondary,
};

const PRIORITY_LABELS = {
  guaranteed: 'G',
  provisional: 'P',
};

/**
 * Compact card for a single reservation in the admin Registros log.
 */
export function ReservationLogCard({ reservation }) {
  const {
    apartment,
    userName,
    date,
    startTime,
    endTime,
    courtName,
    duration,
    status,
    priority,
    createdAt,
  } = reservation;

  const statusColor = STATUS_COLORS[status] ?? colors.textSecondary;
  const statusLabel = STATUS_LABELS[status] ?? status;
  const priorityLabel = PRIORITY_LABELS[priority] ?? priority;

  // Format date: YYYY-MM-DD → DD/MM/YYYY
  const formattedDate = date
    ? date.split('-').reverse().join('/')
    : '—';

  // Format createdAt to DD/MM/YYYY HH:MM
  const formattedCreatedAt = createdAt
    ? (() => {
        const d = new Date(createdAt);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hh}:${mm}`;
      })()
    : '—';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.apartment}>{apartment}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText}>{statusLabel}</Text>
        </View>
        <Text style={styles.priority}>{priorityLabel}</Text>
      </View>

      <Text style={styles.userName}>{userName}</Text>

      <View style={styles.row}>
        <Text style={styles.detail}>{formattedDate}</Text>
        <Text style={styles.separator}>·</Text>
        <Text style={styles.detail}>{startTime}–{endTime}</Text>
        <Text style={styles.separator}>·</Text>
        <Text style={styles.detail}>{courtName}</Text>
        {duration != null && (
          <>
            <Text style={styles.separator}>·</Text>
            <Text style={styles.detail}>{duration} min</Text>
          </>
        )}
      </View>

      <Text style={styles.createdAt}>Reservada el {formattedCreatedAt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  apartment: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  priority: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    marginLeft: 2,
  },
  userName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  separator: {
    fontSize: 12,
    color: colors.border,
  },
  createdAt: {
    fontSize: 11,
    color: colors.disabled,
    marginTop: 4,
  },
});
