import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../../constants/colors';

/**
 * Selector to choose between Match and Class
 */
export default function ModeSelector({ isClass, onChange }) {
  return (
    <>
      <Text style={styles.label}>¿Qué quieres organizar?</Text>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.button, !isClass && styles.buttonActive]}
          onPress={() => onChange(false)}
        >
          <Text style={[styles.buttonText, !isClass && styles.buttonTextActive]}>
            Partida
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            isClass && styles.buttonActive,
            isClass && styles.buttonClass,
          ]}
          onPress={() => onChange(true)}
        >
          <Text style={[styles.buttonText, isClass && styles.buttonTextActive]}>
            Clase
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// Legacy alias
export { ModeSelector as ModalidadSelector };

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
  buttonClass: {
    backgroundColor: colors.classColor,
    borderColor: colors.classColor,
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
