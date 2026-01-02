import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';

/**
 * Header de sección de horarios con botón limpiar
 */
export function HorariosHeader({ vistaActual, cantidadSeleccionados, onLimpiar }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {vistaActual === 'dia' ? 'Horarios Disponibles' : 'Horarios de la Semana'}
      </Text>
      {cantidadSeleccionados > 0 && (
        <TouchableOpacity
          style={styles.limpiarButton}
          onPress={onLimpiar}
        >
          <Text style={styles.limpiarText}>Limpiar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Información de bloques seleccionados
 */
export function SeleccionInfo({ cantidadBloques }) {
  if (cantidadBloques === 0) return null;

  return (
    <View style={styles.seleccionInfo}>
      <Text style={styles.seleccionText}>
        {cantidadBloques} bloque{cantidadBloques > 1 ? 's' : ''} seleccionado{cantidadBloques > 1 ? 's' : ''}
        ({cantidadBloques * 30} min)
      </Text>
    </View>
  );
}

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
  limpiarButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  limpiarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  seleccionInfo: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  seleccionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
