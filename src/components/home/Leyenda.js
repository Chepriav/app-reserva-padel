import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

/**
 * Leyenda de colores para los horarios
 */
export function Leyenda() {
  return (
    <View style={styles.leyendaContainer}>
      <View style={styles.leyendaItem}>
        <View style={[styles.leyendaColor, { backgroundColor: colors.primary }]} />
        <Text style={styles.leyendaText}>Libre</Text>
      </View>
      <View style={styles.leyendaItem}>
        <View style={[styles.leyendaColor, { backgroundColor: colors.reservaGarantizada }]} />
        <Text style={styles.leyendaText}>Garantizada</Text>
      </View>
      <View style={styles.leyendaItem}>
        <View style={[styles.leyendaColor, { backgroundColor: colors.reservaProvisional }]} />
        <Text style={styles.leyendaText}>Provisional</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  leyendaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leyendaColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  leyendaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
