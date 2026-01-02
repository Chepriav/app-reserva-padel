import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Selector para elegir tipo: Fecha abierta o Con reserva
 */
export default function TipoSelector({ tipo, esClase, onChange }) {
  return (
    <>
      <Text style={styles.label}>{esClase ? 'Tipo de clase' : 'Tipo de partida'}</Text>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.button, tipo === 'abierta' && styles.buttonActivo]}
          onPress={() => onChange('abierta')}
        >
          <Text style={[styles.buttonText, tipo === 'abierta' && styles.buttonTextActivo]}>
            Fecha abierta
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, tipo === 'con_reserva' && styles.buttonActivo]}
          onPress={() => onChange('con_reserva')}
        >
          <Text style={[styles.buttonText, tipo === 'con_reserva' && styles.buttonTextActivo]}>
            Con reserva
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

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
  buttonActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 14,
    color: colors.text,
  },
  buttonTextActivo: {
    color: '#fff',
    fontWeight: '600',
  },
});
