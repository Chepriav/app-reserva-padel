import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { formatearFechaLegible } from '../../../utils/dateHelpers';

/**
 * Selector de reserva para vincular partida/clase
 */
export default function ReservaSelector({ reservas, seleccionada, onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Selecciona tu reserva</Text>
      {reservas.length === 0 ? (
        <Text style={styles.noReservas}>No tienes reservas futuras disponibles</Text>
      ) : (
        reservas.map((reserva) => (
          <TouchableOpacity
            key={reserva.id}
            style={[
              styles.option,
              seleccionada?.id === reserva.id && styles.optionSelected,
            ]}
            onPress={() => onSelect(reserva)}
          >
            <Text style={styles.optionText}>
              {formatearFechaLegible(reserva.fecha)} • {reserva.horaInicio?.slice(0, 5)}
            </Text>
            <Text style={styles.optionPista}>{reserva.pistaNombre}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  noReservas: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  option: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  optionPista: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
