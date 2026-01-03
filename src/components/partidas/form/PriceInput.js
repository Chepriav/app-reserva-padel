import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Price input for classes (per student and per group)
 */
export default function PriceInput({ pricePerStudent, pricePerGroup, onChange }) {
  return (
    <>
      <Text style={styles.label}>Precio (opcional)</Text>
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Por alumno:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={pricePerStudent}
              onChangeText={(text) => onChange({ precioAlumno: text.replace(/[^0-9.,]/g, '') })}
            />
            <Text style={styles.symbol}>€</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Por grupo:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={pricePerGroup}
              onChangeText={(text) => onChange({ precioGrupo: text.replace(/[^0-9.,]/g, '') })}
            />
            <Text style={styles.symbol}>€</Text>
          </View>
        </View>
      </View>
      <Text style={styles.hint}>Solo informativo - el pago se gestiona entre vecinos</Text>
    </>
  );
}

// Legacy alias
export { PriceInput as PrecioInput };

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
    width: 90,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    width: 80,
    textAlign: 'right',
  },
  symbol: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 6,
    fontWeight: '500',
  },
  hint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
