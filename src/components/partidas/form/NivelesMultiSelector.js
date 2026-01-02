import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { NIVELES_JUEGO } from '../../../constants/config';

/**
 * Selector múltiple de niveles para clases
 */
export default function NivelesMultiSelector({ niveles, onChange }) {
  const toggleNivel = (value) => {
    if (niveles.includes(value)) {
      onChange(niveles.filter((n) => n !== value));
    } else {
      onChange([...niveles, value]);
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
              niveles.includes(n.value) && styles.optionSelected,
            ]}
            onPress={() => toggleNivel(n.value)}
          >
            <Text style={[
              styles.optionText,
              niveles.includes(n.value) && styles.optionTextSelected,
            ]}>
              {n.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {niveles.length > 0 && (
        <Text style={styles.preview}>
          Niveles: {niveles.map(n => NIVELES_JUEGO.find(nj => nj.value === n)?.label).join(' / ')}
        </Text>
      )}
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
    backgroundColor: colors.clase,
    borderColor: colors.clase,
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
    color: colors.clase,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
