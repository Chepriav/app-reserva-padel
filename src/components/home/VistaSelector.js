import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';

/**
 * Selector de vista día/semana
 */
export function VistaSelector({ vistaActual, onVistaChange }) {
  return (
    <View style={styles.vistaSelector}>
      <TouchableOpacity
        style={[
          styles.vistaBotón,
          vistaActual === 'dia' && styles.vistaBotónActivo,
        ]}
        onPress={() => onVistaChange('dia')}
      >
        <Text
          style={[
            styles.vistaBotónTexto,
            vistaActual === 'dia' && styles.vistaBotónTextoActivo,
          ]}
        >
          Día
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.vistaBotón,
          vistaActual === 'semana' && styles.vistaBotónActivo,
        ]}
        onPress={() => onVistaChange('semana')}
      >
        <Text
          style={[
            styles.vistaBotónTexto,
            vistaActual === 'semana' && styles.vistaBotónTextoActivo,
          ]}
        >
          Semana
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  vistaSelector: {
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
  vistaBotón: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  vistaBotónActivo: {
    backgroundColor: colors.primary,
  },
  vistaBotónTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  vistaBotónTextoActivo: {
    color: '#fff',
  },
});
