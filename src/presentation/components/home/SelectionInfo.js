import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Schedule section header. The selection summary and "Limpiar" live on the
 * same row as the title, so selecting a slot never shifts the grid.
 */
export function ScheduleHeader({ viewActual, countSelected, onLimpiar }) {
  const hasSelection = countSelected > 0;
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {viewActual === 'dia' ? 'Horarios disponibles' : 'Horarios de la semana'}
      </Text>
      {hasSelection && (
        <View style={styles.selectionRow}>
          <View style={styles.selectionChip}>
            <Text style={styles.selectionChipText}>
              {countSelected * 30} min
            </Text>
          </View>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onLimpiar}
            accessibilityLabel="Limpiar selección"
          >
            <Text style={styles.clearText}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/**
 * Kept for API compatibility: the summary now lives in ScheduleHeader.
 */
export function SelectionInfo() {
  return null;
}

// Legacy aliases for backwards compatibility
export const TimeSlotsHeader = ScheduleHeader;

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    minHeight: 32,
    marginBottom: 8,
  },
  sectionTitle: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectionChip: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  selectionChipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  clearButton: {
    borderWidth: 1,
    borderColor: colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  clearText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
});
