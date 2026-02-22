import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Floating reserve button
 */
export function ReserveButton({ countSlots, onPress, disabled }) {
  if (countSlots === 0) return null;

  return (
    <View style={styles.fixedButtonContainer}>
      <TouchableOpacity
        style={styles.reserveButton}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={styles.reserveButtonText}>
          Reservar {countSlots} bloque{countSlots > 1 ? 's' : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Floating block/unblock buttons
 */
export function BlockoutButtons({
  countBlock,
  countUnblock,
  onBlock,
  onUnblock,
  onLimpiar,
  disabled,
}) {
  // Show block button
  if (countBlock > 0 && countUnblock === 0) {
    return (
      <View style={styles.fixedButtonContainer}>
        <View style={styles.blockoutButtonsContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onLimpiar}
          >
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.blockButton}
            onPress={onBlock}
            disabled={disabled}
          >
            <Text style={styles.blockButtonText}>
              🔒 Bloquear {countBlock} franja{countBlock > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show unblock button
  if (countUnblock > 0 && countBlock === 0) {
    return (
      <View style={styles.fixedButtonContainer}>
        <View style={styles.blockoutButtonsContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onLimpiar}
          >
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.unblockButton}
            onPress={onUnblock}
            disabled={disabled}
          >
            <Text style={styles.unblockButtonText}>
              🔓 Desbloquear {countUnblock} franja{countUnblock > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

// Legacy aliases for backwards compatibility
export const ButtonReservar = ReserveButton;
export const ButtonsBlockout = BlockoutButtons;

const styles = StyleSheet.create({
  fixedButtonContainer: {
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
  reserveButton: {
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
  reserveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  blockoutButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  blockButton: {
    flex: 1,
    backgroundColor: colors.blockout,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  blockButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  unblockButton: {
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
  unblockButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
