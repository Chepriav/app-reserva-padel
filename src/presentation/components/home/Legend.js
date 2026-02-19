import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Color legend for time slots
 */
export function Legend() {
  return (
    <View style={styles.legendContainer}>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: colors.primary }]} />
        <Text style={styles.legendText}>Libre</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: colors.guaranteedReservation }]} />
        <Text style={styles.legendText}>Tu reserva</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, styles.legendColorReserved]} />
        <Text style={styles.legendText}>Reservado</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, styles.legendColorBlocked]} />
        <Text style={styles.legendText}>No disponible</Text>
      </View>
    </View>
  );
}

// Legacy alias for backwards compatibility
export const Leyenda = Legend;

const styles = StyleSheet.create({
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendColorReserved: {
    backgroundColor: colors.displaceable,
    borderWidth: 2,
    borderColor: colors.guaranteedReservation,
  },
  legendColorBlocked: {
    backgroundColor: colors.disabled,
    borderWidth: 2,
    borderColor: colors.blockout,
    opacity: 0.7,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
