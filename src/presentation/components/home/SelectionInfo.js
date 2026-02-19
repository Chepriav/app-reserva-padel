import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../constants/colors';

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
 * Always renders to reserve space and prevent layout shift
 */
export function SelectionInfo({ cantidadBloques }) {
  const hasSelection = cantidadBloques > 0;

  return (
    <View style={[styles.selectionInfo, !hasSelection && styles.selectionInfoHidden]}>
      <Text style={[styles.selectionText, !hasSelection && styles.selectionTextHidden]}>
        {hasSelection
          ? `${cantidadBloques} bloque${cantidadBloques > 1 ? 's' : ''} seleccionado${cantidadBloques > 1 ? 's' : ''} (${cantidadBloques * 30} min)`
          : 'Selecciona horarios para reservar'
        }
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
  selectionInfoHidden: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  selectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectionTextHidden: {
    color: colors.textSecondary,
    fontWeight: '400',
  },
});
