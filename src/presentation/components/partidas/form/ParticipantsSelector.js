import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { CLASE_CONFIG } from '../../../constants/config';

/**
 * Selector for min/max participants for classes
 */
export default function ParticipantsSelector({
  minParticipants,
  maxParticipants,
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
                  minParticipants === num && styles.buttonSelected,
                ]}
                onPress={() => {
                  onChangeMin(num);
                  if (maxParticipants < num) {
                    onChangeMax(num);
                  }
                }}
              >
                <Text style={[
                  styles.buttonText,
                  minParticipants === num && styles.buttonTextSelected,
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
                  maxParticipants === num && styles.buttonSelected,
                  num < minParticipants && styles.buttonDisabled,
                ]}
                onPress={() => num >= minParticipants && onChangeMax(num)}
                disabled={num < minParticipants}
              >
                <Text style={[
                  styles.buttonText,
                  maxParticipants === num && styles.buttonTextSelected,
                  num < minParticipants && styles.buttonTextDisabled,
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

// Legacy alias
export { ParticipantsSelector as ParticipantesSelector };

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
    backgroundColor: colors.classColor,
    borderColor: colors.classColor,
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
