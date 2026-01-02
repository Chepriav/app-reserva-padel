import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { formatearFechaLegible } from '../../utils/dateHelpers';

/**
 * Navegador de fechas con flechas
 */
export function FechaSelector({ fechaSeleccionada, vistaActual, onCambiarFecha }) {
  return (
    <View style={styles.fechaContainer}>
      <TouchableOpacity
        style={styles.fechaButton}
        onPress={() => onCambiarFecha(-1)}
      >
        <Text style={styles.fechaButtonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.fechaInfo}>
        <Text style={styles.fechaText}>
          {vistaActual === 'dia'
            ? formatearFechaLegible(fechaSeleccionada)
            : 'Semana del ' + formatearFechaLegible(fechaSeleccionada)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.fechaButton}
        onPress={() => onCambiarFecha(1)}
      >
        <Text style={styles.fechaButtonText}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fechaContainer: {
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
  fechaButton: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  fechaButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  fechaInfo: {
    flex: 1,
    alignItems: 'center',
  },
  fechaText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
