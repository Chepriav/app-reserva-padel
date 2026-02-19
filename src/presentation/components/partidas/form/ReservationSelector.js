import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../../constants/colors';
import { formatReadableDate } from '../../../../utils/dateHelpers';

/**
 * Reservation selector to link match/class
 */
export default function ReservationSelector({ reservations = [], selected, onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Selecciona tu reserva</Text>
      {reservations.length === 0 ? (
        <Text style={styles.noReservations}>No tienes reservas futuras disponibles</Text>
      ) : (
        reservations.map((reservation) => (
          <TouchableOpacity
            key={reservation.id}
            style={[
              styles.option,
              selected?.id === reservation.id && styles.optionSelected,
            ]}
            onPress={() => onSelect(reservation)}
          >
            <Text style={styles.optionText}>
              {formatReadableDate(reservation.fecha)} • {reservation.horaInicio?.slice(0, 5)}
            </Text>
            <Text style={styles.optionCourt}>{reservation.pistaNombre}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

// Legacy alias
export { ReservationSelector as ReservaSelector };

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  noReservations: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  option: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  optionCourt: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
