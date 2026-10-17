import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Day/week view selector
 */
export function ViewSelector({ viewActual, onViewChange }) {
  return (
    <View style={styles.viewSelector}>
      <TouchableOpacity
        style={[
          styles.viewButton,
          viewActual === 'dia' && styles.viewButtonActive,
        ]}
        onPress={() => onViewChange('dia')}
      >
        <Text
          style={[
            styles.viewButtonText,
            viewActual === 'dia' && styles.viewButtonTextActive,
          ]}
        >
          Día
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.viewButton,
          viewActual === 'semana' && styles.viewButtonActive,
        ]}
        onPress={() => onViewChange('semana')}
      >
        <Text
          style={[
            styles.viewButtonText,
            viewActual === 'semana' && styles.viewButtonTextActive,
          ]}
        >
          Semana
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonActive: {
    backgroundColor: colors.primary,
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  viewButtonTextActive: {
    color: '#fff',
  },
});
