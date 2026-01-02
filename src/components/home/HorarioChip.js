import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { bloqueTerminado } from '../../utils/dateHelpers';

/**
 * Chip individual de horario con todos los estados visuales
 */
export function HorarioChip({
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
  // Calcular estados del horario
  const estados = useMemo(() => {
    const esPasado = bloqueTerminado(fecha, horario.horaFin);
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
  } = estados;

  // Mostrar icono de candado para bloqueados
  const mostrarIconoBloqueado = !esPasado && estaBloqueado && !estaSeleccionadoParaDesbloquear;
  // Mostrar icono de desplazable
  const mostrarIconoDesplazable = !esPasado && !estaBloqueado && esOtraProvisional;

  return (
    <TouchableOpacity
      style={[
        styles.horarioChip,
        esPasado && styles.horarioChipPasado,
        !esPasado && estaBloqueado && styles.horarioChipBloqueado,
        !esPasado && !estaBloqueado && esMiGarantizada && styles.horarioChipMiGarantizada,
        !esPasado && !estaBloqueado && esMiProvisional && styles.horarioChipMiProvisional,
        !esPasado && !estaBloqueado && esOtraGarantizada && styles.horarioChipOtraGarantizada,
        !esPasado && !estaBloqueado && esOtraProvisional && styles.horarioChipOtraProvisional,
        estaSeleccionado && styles.horarioChipSeleccionado,
        estaSeleccionadoParaBloquear && styles.horarioChipSeleccionadoBloqueo,
        estaSeleccionadoParaDesbloquear && styles.horarioChipSeleccionadoDesbloqueo,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.horarioChipText,
          esPasado && styles.horarioChipTextPasado,
          !esPasado && estaBloqueado && !estaSeleccionadoParaDesbloquear && styles.horarioChipTextBloqueado,
          !esPasado && !estaBloqueado && (esMiGarantizada || esMiProvisional) && styles.horarioChipTextBlanco,
          !esPasado && !estaBloqueado && (esOtraGarantizada || esOtraProvisional) && styles.horarioChipTextOscuro,
          estaSeleccionado && styles.horarioChipTextSeleccionado,
          (estaSeleccionadoParaBloquear || estaSeleccionadoParaDesbloquear) && styles.horarioChipTextSeleccionado,
        ]}
      >
        {horario.horaInicio}
      </Text>

      {mostrarIconoBloqueado && (
        <View style={styles.iconoBloqueado}>
          <Text style={styles.iconoBloqueadoText}>🔒</Text>
        </View>
      )}

      {mostrarIconoDesplazable && (
        <View style={styles.iconoDesplazable}>
          <Text style={styles.iconoDesplazableText}>!</Text>
        </View>
      )}

      {estaSeleccionado && (
        <View style={styles.checkMark}>
          <Text style={styles.checkMarkText}>✓</Text>
        </View>
      )}

      {estaSeleccionadoParaBloquear && (
        <View style={styles.checkMarkBloqueo}>
          <Text style={styles.checkMarkText}>✓</Text>
        </View>
      )}

      {estaSeleccionadoParaDesbloquear && (
        <View style={styles.checkMarkDesbloqueo}>
          <Text style={styles.checkMarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  horarioChip: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  horarioChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Estados pasados
  horarioChipPasado: {
    backgroundColor: colors.disabled,
    opacity: 0.4,
  },
  horarioChipTextPasado: {
    color: colors.textSecondary,
  },
  // Estados bloqueados
  horarioChipBloqueado: {
    backgroundColor: colors.disabled,
    borderWidth: 2,
    borderColor: colors.bloqueado,
    opacity: 0.7,
  },
  horarioChipTextBloqueado: {
    color: colors.textSecondary,
  },
  // Mi vivienda
  horarioChipMiGarantizada: {
    backgroundColor: colors.reservaGarantizada,
  },
  horarioChipMiProvisional: {
    backgroundColor: colors.reservaProvisional,
  },
  horarioChipTextBlanco: {
    color: '#fff',
  },
  // Otra vivienda
  horarioChipOtraGarantizada: {
    backgroundColor: colors.reservaDesplazable,
    borderWidth: 2,
    borderColor: colors.reservaGarantizada,
  },
  horarioChipOtraProvisional: {
    backgroundColor: colors.reservaDesplazable,
    borderWidth: 2,
    borderColor: colors.reservaProvisional,
  },
  horarioChipTextOscuro: {
    color: colors.text,
  },
  // Seleccionado para reservar
  horarioChipSeleccionado: {
    backgroundColor: colors.accent,
  },
  horarioChipTextSeleccionado: {
    color: '#fff',
  },
  // Seleccionado para bloquear
  horarioChipSeleccionadoBloqueo: {
    backgroundColor: colors.bloqueado,
    borderWidth: 2,
    borderColor: '#b71c1c',
  },
  // Seleccionado para desbloquear
  horarioChipSeleccionadoDesbloqueo: {
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: '#1b5e20',
  },
  // Iconos
  iconoBloqueado: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.bloqueado,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconoBloqueadoText: {
    fontSize: 10,
  },
  iconoDesplazable: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.reservaProvisional,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconoDesplazableText: {
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
  checkMarkBloqueo: {
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
    borderColor: colors.bloqueado,
  },
  checkMarkDesbloqueo: {
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
