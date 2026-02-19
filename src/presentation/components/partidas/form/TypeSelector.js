import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../../constants/colors';

/**
 * Selector to choose type: Open date or With reservation
 */
export default function TypeSelector({ type, isClass, onChange }) {
  return (
    <>
      <Text style={styles.label}>{isClass ? 'Tipo de clase' : 'Tipo de partida'}</Text>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.button, type === 'abierta' && styles.buttonActive]}
          onPress={() => onChange('abierta')}
        >
          <Text style={[styles.buttonText, type === 'abierta' && styles.buttonTextActive]}>
            Fecha abierta
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, type === 'con_reserva' && styles.buttonActive]}
          onPress={() => onChange('con_reserva')}
        >
          <Text style={[styles.buttonText, type === 'con_reserva' && styles.buttonTextActive]}>
            Con reserva
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// Legacy alias
export { TypeSelector as TipoSelector };

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 14,
    color: colors.text,
  },
  buttonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
