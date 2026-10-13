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
    columnGap: 12,
    rowGap: 4,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendColorReserved: {
    backgroundColor: colors.displaceable,
    borderWidth: 1.5,
    borderColor: colors.guaranteedReservation,
  },
  legendColorBlocked: {
    backgroundColor: colors.disabled,
    borderWidth: 1.5,
    borderColor: colors.blockout,
    opacity: 0.7,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
