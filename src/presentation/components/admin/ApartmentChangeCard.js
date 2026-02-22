import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../constants/colors';
import { formatApartment } from '../../../constants/config';

/**
 * Tarjeta de solicitud de cambio de vivienda
 */
export function ChangeApartmentCard({ user, onApprove, onReject }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{user.name}</Text>
        <View style={styles.changeBadge}>
          <Text style={styles.badgeText}>Cambio</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.changeApartmentContainer}>
          <Text style={styles.changeValue}>
            {formatApartment(user.apartment)}
          </Text>
          <Text style={styles.changeArrow}>→</Text>
          <Text style={[styles.changeValue, styles.changeNew]}>
            {formatApartment(user.requestedApartment)}
          </Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.buttonApprove}
          onPress={() => onApprove(user)}
        >
          <Text style={styles.buttonApproveText}>Aprobar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonReject}
          onPress={() => onReject(user)}
        >
          <Text style={styles.buttonRejectText}>Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  changeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  info: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  changeApartmentContainer: {
    marginTop: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  changeValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  changeNew: {
    color: colors.primary,
    fontWeight: '600',
  },
  changeArrow: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonApprove: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonApproveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonReject: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  buttonRejectText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
});

// Export with English name for consistency
export { ChangeApartmentCard as ApartmentChangeCard };
