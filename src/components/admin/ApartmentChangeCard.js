import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { formatearVivienda } from '../../constants/config';

/**
 * Tarjeta de solicitud de cambio de vivienda
 */
export function CambioViviendaCard({ usuario, onAprobar, onRechazar }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.nombre}>{usuario.nombre}</Text>
        <View style={styles.cambioBadge}>
          <Text style={styles.badgeText}>Cambio</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{usuario.email}</Text>
        </View>
        <View style={styles.cambioViviendaContainer}>
          <Text style={styles.cambioValue}>
            {formatearVivienda(usuario.vivienda)}
          </Text>
          <Text style={styles.cambioArrow}>→</Text>
          <Text style={[styles.cambioValue, styles.cambioNueva]}>
            {formatearVivienda(usuario.viviendaSolicitada)}
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
  cambioBadge: {
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
  cambioViviendaContainer: {
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
  cambioValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  cambioNueva: {
    color: colors.primary,
    fontWeight: '600',
  },
  cambioArrow: {
    fontSize: 18,
    color: colors.textSecondary,
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

// Export with English name for consistency
export { CambioViviendaCard as ApartmentChangeCard };
