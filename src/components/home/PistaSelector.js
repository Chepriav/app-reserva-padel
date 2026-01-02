import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';

/**
 * Lista de pistas para seleccionar
 */
export function PistaSelector({ pistas, pistaSeleccionada, onPistaSelect }) {
  if (pistas.length <= 1) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Pistas Disponibles</Text>
      {pistas.map((pista) => (
        <TouchableOpacity
          key={pista.id}
          style={[
            styles.pistaCard,
            pistaSeleccionada?.id === pista.id && styles.pistaCardSelected,
          ]}
          onPress={() => onPistaSelect(pista)}
        >
          <Text style={styles.pistaNombre}>{pista.nombre}</Text>
          <Text style={styles.pistaDescripcion}>{pista.descripcion}</Text>
          <View style={styles.pistaFeatures}>
            {pista.techada && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Techada</Text>
              </View>
            )}
            {pista.conLuz && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Con Luz</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  pistaCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pistaCardSelected: {
    borderColor: colors.primary,
  },
  pistaNombre: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  pistaDescripcion: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  pistaFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
});
