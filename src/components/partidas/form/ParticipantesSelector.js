import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { CLASE_CONFIG } from '../../../constants/config';

/**
 * Selector de número mínimo/máximo de participantes para clases
 */
export default function ParticipantesSelector({
  minParticipantes,
  maxParticipantes,
  onChangeMin,
  onChangeMax,
}) {
  return (
    <>
      <Text style={styles.label}>Número de alumnos</Text>
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Mínimo:</Text>
          <View style={styles.buttons}>
            {CLASE_CONFIG.OPCIONES_MIN.map((num) => (
              <TouchableOpacity
                key={`min-${num}`}
                style={[
                  styles.button,
                  minParticipantes === num && styles.buttonSelected,
                ]}
                onPress={() => {
                  onChangeMin(num);
                  if (maxParticipantes < num) {
                    onChangeMax(num);
                  }
                }}
              >
                <Text style={[
                  styles.buttonText,
                  minParticipantes === num && styles.buttonTextSelected,
                ]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Máximo:</Text>
          <View style={styles.buttons}>
            {CLASE_CONFIG.OPCIONES_MAX.map((num) => (
              <TouchableOpacity
                key={`max-${num}`}
                style={[
                  styles.button,
                  maxParticipantes === num && styles.buttonSelected,
                  num < minParticipantes && styles.buttonDisabled,
                ]}
                onPress={() => num >= minParticipantes && onChangeMax(num)}
                disabled={num < minParticipantes}
              >
                <Text style={[
                  styles.buttonText,
                  maxParticipantes === num && styles.buttonTextSelected,
                  num < minParticipantes && styles.buttonTextDisabled,
                ]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    width: 70,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSelected: {
    backgroundColor: colors.clase,
    borderColor: colors.clase,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  buttonTextSelected: {
    color: '#fff',
  },
  buttonTextDisabled: {
    color: colors.disabled,
  },
});
