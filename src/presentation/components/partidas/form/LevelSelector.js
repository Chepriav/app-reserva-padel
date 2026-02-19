import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../../constants/colors';
import { NIVELES_JUEGO } from '../../../../constants/config';

/**
 * Single level selector for matches
 */
export default function LevelSelector({ level, onChange }) {
  return (
    <>
      <Text style={styles.label}>Nivel preferido (opcional)</Text>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.option, !level && styles.optionSelected]}
          onPress={() => onChange(null)}
        >
          <Text style={[styles.optionText, !level && styles.optionTextSelected]}>
            Cualquiera
          </Text>
        </TouchableOpacity>
        {NIVELES_JUEGO.map((n) => (
          <TouchableOpacity
            key={n.value}
            style={[styles.option, level === n.value && styles.optionSelected]}
            onPress={() => onChange(n.value)}
          >
            <Text style={[styles.optionText, level === n.value && styles.optionTextSelected]}>
              {n.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

// Legacy alias
export { LevelSelector as NivelSelector };

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
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 13,
    color: colors.text,
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
});
