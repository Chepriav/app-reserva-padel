import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Tarjeta de usuario en la lista de usuarios
 */
export function UsuarioCard({
  usuario,
  currentUserId,
  onToggleAdmin,
  onEditVivienda,
  onDelete,
}) {
  const esMiCuenta = usuario.id === currentUserId;
  const puedeEliminar = !esMiCuenta && !usuario.esManager;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.nombreContainer}>
          <Text style={styles.nombre}>{usuario.nombre}</Text>
          {esMiCuenta && <Text style={styles.tuCuenta}>(Tú)</Text>}
        </View>
        <View style={styles.badgesContainer}>
          {usuario.esManager && (
            <View style={styles.managerBadge}>
              <Text style={styles.badgeText}>Manager</Text>
            </View>
          )}
          {usuario.esAdmin && !usuario.esManager && (
            <View style={styles.adminBadge}>
              <Text style={styles.badgeText}>Admin</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{usuario.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vivienda:</Text>
          <Text style={styles.infoValue}>{usuario.vivienda}</Text>
        </View>
      </View>

      <View style={styles.adminToggleContainer}>
        <Text style={styles.adminToggleLabel}>Administrador</Text>
        <Switch
          value={usuario.esAdmin}
          onValueChange={() => onToggleAdmin(usuario)}
          trackColor={{ false: colors.border, true: colors.secondary }}
          thumbColor={usuario.esAdmin ? colors.primary : colors.disabled}
          disabled={usuario.esManager}
        />
      </View>

      <TouchableOpacity
        style={styles.editViviendaButton}
        onPress={() => onEditVivienda(usuario)}
      >
        <Text style={styles.editViviendaButtonText}>Cambiar Vivienda</Text>
      </TouchableOpacity>

      {puedeEliminar && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(usuario)}
        >
          <Text style={styles.deleteButtonText}>Eliminar Usuario</Text>
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
  nombreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  tuCuenta: {
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
  editViviendaButton: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editViviendaButtonText: {
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
