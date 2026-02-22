import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * List of courts for selection
 */
export function CourtSelector({ courts, courtSelected, onCourtSelect }) {
  if (!courts || courts.length <= 1) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Pistas disponibles</Text>
      {courts.map((court) => (
        <TouchableOpacity
          key={court.id}
          style={[
            styles.courtCard,
            courtSelected?.id === court.id && styles.courtCardSelected,
          ]}
          onPress={() => onCourtSelect(court)}
        >
          <Text style={styles.courtName}>{court.name}</Text>
          <Text style={styles.courtDescription}>{court.description}</Text>
          <View style={styles.courtFeatures}>
            {court.techada && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Techada</Text>
              </View>
            )}
            {court.withLuz && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Con luz</Text>
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
  courtCard: {
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
  courtCardSelected: {
    borderColor: colors.primary,
  },
  courtName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  courtDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  courtFeatures: {
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
