import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Selector para elegir entre Partida y Clase
 */
export default function ModalidadSelector({ esClase, onChange }) {
  return (
    <>
      <Text style={styles.label}>¿Qué quieres organizar?</Text>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.button, !esClase && styles.buttonActivo]}
          onPress={() => onChange(false)}
        >
          <Text style={[styles.buttonText, !esClase && styles.buttonTextActivo]}>
            Partida
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            esClase && styles.buttonActivo,
            esClase && styles.buttonClase,
          ]}
          onPress={() => onChange(true)}
        >
          <Text style={[styles.buttonText, esClase && styles.buttonTextActivo]}>
            Clase
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
  buttonClase: {
    backgroundColor: colors.clase,
    borderColor: colors.clase,
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
