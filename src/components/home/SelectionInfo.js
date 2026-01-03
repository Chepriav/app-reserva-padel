import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';

/**
 * Schedule section header with clear button
 */
export function ScheduleHeader({ vistaActual, cantidadSeleccionados, onLimpiar }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {vistaActual === 'dia' ? 'Horarios Disponibles' : 'Horarios de la Semana'}
      </Text>
      {cantidadSeleccionados > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onLimpiar}
        >
          <Text style={styles.clearText}>Limpiar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Selected slots information
 */
export function SelectionInfo({ cantidadBloques }) {
  if (cantidadBloques === 0) return null;

  return (
    <View style={styles.selectionInfo}>
      <Text style={styles.selectionText}>
        {cantidadBloques} bloque{cantidadBloques > 1 ? 's' : ''} seleccionado{cantidadBloques > 1 ? 's' : ''}
        ({cantidadBloques * 30} min)
      </Text>
    </View>
  );
}

// Legacy aliases for backwards compatibility
export const HorariosHeader = ScheduleHeader;
export const SeleccionInfo = SelectionInfo;

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  clearButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectionInfo: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
