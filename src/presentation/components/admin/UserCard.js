import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { formatLastAccess } from '../../../utils/formatLastAccess';

/**
 * Collapsible user row for Admin → Usuarios.
 * Collapsed: name + apartment (and last access when sorting by it).
 * Tap to expand: email, last access, admin toggle and actions.
 */
export function UserCard({
  user,
  currentUserId,
  showLastAccess = false,
  onToggleAdmin,
  onEditApartment,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(false);
  const isMyAccount = user.id === currentUserId;
  const canDelete = !isMyAccount && !user.isManager;

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${user.name}, vivienda ${user.apartment}`}
      >
        <View style={styles.nameBlock}>
          <View style={styles.nameLine}>
            <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
            {isMyAccount && <Text style={styles.yourAccount}>(Tú)</Text>}
            {user.isManager && (
              <View style={[styles.badge, styles.managerBadge]}>
                <Text style={styles.badgeText}>Gestor</Text>
              </View>
            )}
            {user.isAdmin && !user.isManager && (
              <View style={[styles.badge, styles.adminBadge]}>
                <Text style={styles.badgeText}>Admin</Text>
              </View>
            )}
          </View>
          {showLastAccess && !expanded && (
            <Text style={styles.subline} numberOfLines={1}>
              {formatLastAccess(user.lastAccessAt)}
            </Text>
          )}
        </View>
        <Text style={styles.apartment}>{user.apartment}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.details}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} selectable numberOfLines={1}>{user.email}</Text>
          </View>
          {!!user.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue} selectable>{user.phone}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Último acceso</Text>
            <Text style={[styles.infoValue, !user.lastAccessAt && styles.infoMuted]}>
              {formatLastAccess(user.lastAccessAt)}
            </Text>
          </View>

          <View style={styles.adminToggleContainer}>
            <Text style={styles.adminToggleLabel}>Administrador</Text>
            <Switch
              value={user.isAdmin}
              onValueChange={() => onToggleAdmin(user)}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={user.isAdmin ? colors.primary : colors.disabled}
              disabled={user.isManager}
              accessibilityLabel="Administrador"
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEditApartment(user)}
            >
              <Ionicons name="home-outline" size={16} color={colors.primary} />
              <Text style={styles.actionText}>Cambiar vivienda</Text>
            </TouchableOpacity>
            {canDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => onDelete(user)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardExpanded: {
    borderColor: colors.secondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  yourAccount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadge: {
    backgroundColor: colors.primary,
  },
  managerBadge: {
    backgroundColor: colors.accent,
  },
  badgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  subline: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  apartment: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  details: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 110,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  infoMuted: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  adminToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  adminToggleLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    borderColor: colors.error,
  },
  deleteText: {
    color: colors.error,
  },
});
