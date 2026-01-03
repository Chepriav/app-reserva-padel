import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';

/**
 * Day/week view selector
 */
export function ViewSelector({ vistaActual, onVistaChange }) {
  return (
    <View style={styles.viewSelector}>
      <TouchableOpacity
        style={[
          styles.viewButton,
          vistaActual === 'dia' && styles.viewButtonActive,
        ]}
        onPress={() => onVistaChange('dia')}
      >
        <Text
          style={[
            styles.viewButtonText,
            vistaActual === 'dia' && styles.viewButtonTextActive,
          ]}
        >
          Día
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.viewButton,
          vistaActual === 'semana' && styles.viewButtonActive,
        ]}
        onPress={() => onVistaChange('semana')}
      >
        <Text
          style={[
            styles.viewButtonText,
            vistaActual === 'semana' && styles.viewButtonTextActive,
          ]}
        >
          Semana
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Legacy alias for backwards compatibility
export const VistaSelector = ViewSelector;

const styles = StyleSheet.create({
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonActive: {
    backgroundColor: colors.primary,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  viewButtonTextActive: {
    color: '#fff',
  },
});
