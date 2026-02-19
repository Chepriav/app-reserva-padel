import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../constants/colors';
import { formatearFechaLegible } from '../../../utils/dateHelpers';

/**
 * Tarjeta de solicitud de registro pendiente
 */
export function SolicitudCard({ usuario, onAprobar, onRechazar }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.nombre}>{usuario.nombre}</Text>
        <View style={styles.pendienteBadge}>
          <Text style={styles.badgeText}>Pendiente</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{usuario.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Teléfono:</Text>
          <Text style={styles.infoValue}>{usuario.telefono}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vivienda:</Text>
          <Text style={styles.infoValue}>{usuario.vivienda}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Solicitud:</Text>
          <Text style={styles.infoValue}>
            {formatearFechaLegible(usuario.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.botonesContainer}>
        <TouchableOpacity
          style={styles.botonAprobar}
          onPress={() => onAprobar(usuario)}
        >
          <Text style={styles.botonAprobarText}>Aprobar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonRechazar}
          onPress={() => onRechazar(usuario)}
        >
          <Text style={styles.botonRechazarText}>Rechazar</Text>
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
  nombre: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  pendienteBadge: {
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
  botonesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  botonAprobar: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  botonAprobarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  botonRechazar: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  botonRechazarText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
});
