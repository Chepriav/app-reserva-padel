import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';

/**
 * Botón flotante de reservar
 */
export function BotonReservar({ cantidadBloques, onPress, disabled }) {
  if (cantidadBloques === 0) return null;

  return (
    <View style={styles.botonContainerFijo}>
      <TouchableOpacity
        style={styles.botonReservar}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={styles.botonReservarText}>
          Reservar {cantidadBloques} bloque{cantidadBloques > 1 ? 's' : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Botones flotantes de bloquear/desbloquear
 */
export function BotonesBloqueo({
  cantidadBloquear,
  cantidadDesbloquear,
  onBloquear,
  onDesbloquear,
  onLimpiar,
  disabled,
}) {
  // Mostrar botón de bloquear
  if (cantidadBloquear > 0 && cantidadDesbloquear === 0) {
    return (
      <View style={styles.botonContainerFijo}>
        <View style={styles.botonesBloqueoContainer}>
          <TouchableOpacity
            style={styles.botonLimpiar}
            onPress={onLimpiar}
          >
            <Text style={styles.botonLimpiarText}>Limpiar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.botonBloquear}
            onPress={onBloquear}
            disabled={disabled}
          >
            <Text style={styles.botonBloquearText}>
              🔒 Bloquear {cantidadBloquear} horario{cantidadBloquear > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Mostrar botón de desbloquear
  if (cantidadDesbloquear > 0 && cantidadBloquear === 0) {
    return (
      <View style={styles.botonContainerFijo}>
        <View style={styles.botonesBloqueoContainer}>
          <TouchableOpacity
            style={styles.botonLimpiar}
            onPress={onLimpiar}
          >
            <Text style={styles.botonLimpiarText}>Limpiar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.botonDesbloquear}
            onPress={onDesbloquear}
            disabled={disabled}
          >
            <Text style={styles.botonDesbloquearText}>
              🔓 Desbloquear {cantidadDesbloquear} horario{cantidadDesbloquear > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  botonContainerFijo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  botonReservar: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  botonReservarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  botonesBloqueoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  botonLimpiar: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  botonLimpiarText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  botonBloquear: {
    flex: 1,
    backgroundColor: colors.bloqueado,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  botonBloquearText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  botonDesbloquear: {
    flex: 1,
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  botonDesbloquearText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
