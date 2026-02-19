import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../constants/colors';
import { hasSlotEnded } from '../../../utils/dateHelpers';

/**
 * Individual time slot chip with all visual states
 */
export function TimeSlotChip({
  horario,
  fecha,
  userVivienda,
  estaSeleccionado,
  estaSeleccionadoParaBloquear,
  estaSeleccionadoParaDesbloquear,
  modoBloqueo,
  disabled,
  onPress,
}) {
  // Calculate slot states
  const states = useMemo(() => {
    const esPasado = hasSlotEnded(fecha, horario.horaFin);
    const estaBloqueado = horario.bloqueado;
    const esMiVivienda = horario.reservaExistente?.vivienda === userVivienda;
    const esPrimeraOProtegida = horario.prioridad === 'primera' || horario.estaProtegida;
    const esSegundaDesplazable = horario.prioridad === 'segunda' && !horario.estaProtegida;

    const esMiGarantizada = !horario.disponible && !estaBloqueado && esMiVivienda && esPrimeraOProtegida;
    const esMiProvisional = !horario.disponible && !estaBloqueado && esMiVivienda && esSegundaDesplazable;
    const esOtraGarantizada = !horario.disponible && !estaBloqueado && !esMiVivienda && esPrimeraOProtegida;
    const esOtraProvisional = !horario.disponible && !estaBloqueado && !esMiVivienda && esSegundaDesplazable;

    return {
      esPasado,
      estaBloqueado,
      esMiVivienda,
      esMiGarantizada,
      esMiProvisional,
      esOtraGarantizada,
      esOtraProvisional,
    };
  }, [horario, fecha, userVivienda]);

  const {
    esPasado,
    estaBloqueado,
    esMiGarantizada,
    esMiProvisional,
    esOtraGarantizada,
    esOtraProvisional,
  } = states;

  // Show lock icon for blocked slots
  const mostrarIconoBloqueado = !esPasado && estaBloqueado && !estaSeleccionadoParaDesbloquear;
  // Show displaceable icon
  const mostrarIconoDesplazable = !esPasado && !estaBloqueado && esOtraProvisional;

  return (
    <TouchableOpacity
      style={[
        styles.slotChip,
        esPasado && styles.slotChipPast,
        !esPasado && estaBloqueado && styles.slotChipBlocked,
        !esPasado && !estaBloqueado && esMiGarantizada && styles.slotChipMyGuaranteed,
        !esPasado && !estaBloqueado && esMiProvisional && styles.slotChipMyProvisional,
        !esPasado && !estaBloqueado && esOtraGarantizada && styles.slotChipOtherGuaranteed,
        !esPasado && !estaBloqueado && esOtraProvisional && styles.slotChipOtherProvisional,
        estaSeleccionado && styles.slotChipSelected,
        estaSeleccionadoParaBloquear && styles.slotChipSelectedBlock,
        estaSeleccionadoParaDesbloquear && styles.slotChipSelectedUnblock,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.slotChipText,
          esPasado && styles.slotChipTextPast,
          !esPasado && estaBloqueado && !estaSeleccionadoParaDesbloquear && styles.slotChipTextBlocked,
          !esPasado && !estaBloqueado && (esMiGarantizada || esMiProvisional) && styles.slotChipTextWhite,
          !esPasado && !estaBloqueado && (esOtraGarantizada || esOtraProvisional) && styles.slotChipTextDark,
          estaSeleccionado && styles.slotChipTextSelected,
          (estaSeleccionadoParaBloquear || estaSeleccionadoParaDesbloquear) && styles.slotChipTextSelected,
        ]}
      >
        {horario.horaInicio}
      </Text>

      {mostrarIconoBloqueado && (
        <View style={styles.blockedIcon}>
          <Text style={styles.blockedIconText}>🔒</Text>
        </View>
      )}

      {mostrarIconoDesplazable && (
        <View style={styles.displaceableIcon}>
          <Text style={styles.displaceableIconText}>!</Text>
        </View>
      )}

      {estaSeleccionado && (
        <View style={styles.checkMark}>
          <Text style={styles.checkMarkText}>✓</Text>
        </View>
      )}

      {estaSeleccionadoParaBloquear && (
        <View style={styles.checkMarkBlock}>
          <Text style={styles.checkMarkText}>✓</Text>
        </View>
      )}

      {estaSeleccionadoParaDesbloquear && (
        <View style={styles.checkMarkUnblock}>
          <Text style={styles.checkMarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Legacy alias for backwards compatibility
export const HorarioChip = TimeSlotChip;

const styles = StyleSheet.create({
  slotChip: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Past states
  slotChipPast: {
    backgroundColor: colors.disabled,
    opacity: 0.4,
  },
  slotChipTextPast: {
    color: colors.textSecondary,
  },
  // Blocked states
  slotChipBlocked: {
    backgroundColor: colors.disabled,
    borderWidth: 2,
    borderColor: colors.blockout,
    opacity: 0.7,
  },
  slotChipTextBlocked: {
    color: colors.textSecondary,
  },
  // My apartment
  slotChipMyGuaranteed: {
    backgroundColor: colors.guaranteedReservation,
  },
  slotChipMyProvisional: {
    backgroundColor: colors.provisionalReservation,
  },
  slotChipTextWhite: {
    color: '#fff',
  },
  // Other apartment
  slotChipOtherGuaranteed: {
    backgroundColor: colors.displaceable,
    borderWidth: 2,
    borderColor: colors.guaranteedReservation,
  },
  slotChipOtherProvisional: {
    backgroundColor: colors.displaceable,
    borderWidth: 2,
    borderColor: colors.provisionalReservation,
  },
  slotChipTextDark: {
    color: colors.text,
  },
  // Selected for reservation
  slotChipSelected: {
    backgroundColor: colors.accent,
  },
  slotChipTextSelected: {
    color: '#fff',
  },
  // Selected for block
  slotChipSelectedBlock: {
    backgroundColor: colors.blockout,
    borderWidth: 2,
    borderColor: '#b71c1c',
  },
  // Selected for unblock
  slotChipSelectedUnblock: {
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: '#1b5e20',
  },
  // Icons
  blockedIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.blockout,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockedIconText: {
    fontSize: 10,
  },
  displaceableIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.provisionalReservation,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displaceableIconText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Checkmarks
  checkMark: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: 'bold',
  },
  checkMarkBlock: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.blockout,
  },
  checkMarkUnblock: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
  },
});
