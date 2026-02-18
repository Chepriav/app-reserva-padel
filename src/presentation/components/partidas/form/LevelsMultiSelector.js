import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { NIVELES_JUEGO } from '../../../constants/config';

/**
 * Multi-level selector for classes
 */
export default function LevelsMultiSelector({ levels = [], onChange }) {
  const toggleLevel = (value) => {
    if (levels.includes(value)) {
      onChange(levels.filter((n) => n !== value));
    } else {
      onChange([...levels, value]);
    }
  };

  return (
    <>
      <Text style={styles.label}>Niveles de la clase (opcional)</Text>
      <View style={styles.container}>
        {NIVELES_JUEGO.map((n) => (
          <TouchableOpacity
            key={n.value}
            style={[
              styles.option,
              levels.includes(n.value) && styles.optionSelected,
            ]}
            onPress={() => toggleLevel(n.value)}
          >
            <Text style={[
              styles.optionText,
              levels.includes(n.value) && styles.optionTextSelected,
            ]}>
              {n.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {levels.length > 0 && (
        <Text style={styles.preview}>
          Niveles: {levels.map(n => NIVELES_JUEGO.find(nj => nj.value === n)?.label).join(' / ')}
        </Text>
      )}
    </>
  );
}

// Legacy alias
export { LevelsMultiSelector as NivelesMultiSelector };

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
    backgroundColor: colors.classColor,
    borderColor: colors.classColor,
  },
  optionText: {
    fontSize: 13,
    color: colors.text,
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  preview: {
    fontSize: 12,
    color: colors.classColor,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
