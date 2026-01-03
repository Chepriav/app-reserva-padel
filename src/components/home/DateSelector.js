import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { formatReadableDate } from '../../utils/dateHelpers';

/**
 * Date navigator with arrows
 */
export function DateSelector({ fechaSeleccionada, vistaActual, onCambiarFecha }) {
  return (
    <View style={styles.dateContainer}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => onCambiarFecha(-1)}
      >
        <Text style={styles.dateButtonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.dateInfo}>
        <Text style={styles.dateText}>
          {vistaActual === 'dia'
            ? formatReadableDate(fechaSeleccionada)
            : 'Semana del ' + formatReadableDate(fechaSeleccionada)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => onCambiarFecha(1)}
      >
        <Text style={styles.dateButtonText}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

// Legacy alias for backwards compatibility
export const FechaSelector = DateSelector;

const styles = StyleSheet.create({
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateButton: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  dateButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  dateInfo: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
