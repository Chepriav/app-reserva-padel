import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Tarjeta de usuario en la lista de usuarios
 */
export function UserCard({
  user,
  currentUserId,
  onToggleAdmin,
  onEditApartment,
  onDelete,
}) {
  const isMyAccount = user.id === currentUserId;
  const canDelete = !isMyAccount && !user.isManager;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{user.name}</Text>
          {isMyAccount && <Text style={styles.yourAccount}>(Tú)</Text>}
        </View>
        <View style={styles.badgesContainer}>
          {user.isManager && (
            <View style={styles.managerBadge}>
              <Text style={styles.badgeText}>Gestor</Text>
            </View>
          )}
          {user.isAdmin && !user.isManager && (
            <View style={styles.adminBadge}>
              <Text style={styles.badgeText}>Admin</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vivienda:</Text>
          <Text style={styles.infoValue}>{user.apartment}</Text>
        </View>
      </View>

      <View style={styles.adminToggleContainer}>
        <Text style={styles.adminToggleLabel}>Administrador</Text>
        <Switch
          value={user.isAdmin}
          onValueChange={() => onToggleAdmin(user)}
          trackColor={{ false: colors.border, true: colors.secondary }}
          thumbColor={user.isAdmin ? colors.primary : colors.disabled}
          disabled={user.isManager}
        />
      </View>

      <TouchableOpacity
        style={styles.editApartmentButton}
        onPress={() => onEditApartment(user)}
      >
        <Text style={styles.editApartmentButtonText}>Cambiar vivienda</Text>
      </TouchableOpacity>

      {canDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(user)}
        >
          <Text style={styles.deleteButtonText}>Eliminar usuario</Text>
        </TouchableOpacity>
      )}
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
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  yourAccount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  adminBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  managerBadge: {
    backgroundColor: colors.accent,
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
  adminToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  adminToggleLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  editApartmentButton: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editApartmentButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
});
