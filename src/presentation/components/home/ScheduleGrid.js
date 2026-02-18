import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/colors';
import { formatReadableDate, hasSlotEnded } from '../../utils/dateHelpers';
import { TimeSlotChip } from './TimeSlotChip';

/**
 * Schedule grid for day view
 */
export function DayScheduleGrid({
  horarios,
  fecha,
  userVivienda,
  bloquesSeleccionados = [],
  bloquesABloquear = [],
  bloquesADesbloquear = [],
  modoBloqueo,
  esAdmin,
  reservando,
  onHorarioPress,
}) {
  if (!horarios || horarios.length === 0) {
    return <Text style={styles.emptyText}>No hay horarios disponibles</Text>;
  }

  return (
    <View style={styles.slotsGrid}>
      {horarios.map((horario, index) => {
        const estaSeleccionado = bloquesSeleccionados.some(b =>
          b.fecha === fecha && b.horaInicio === horario.horaInicio
        );
        const estaSeleccionadoParaBloquear = bloquesABloquear.some(b =>
          b.fecha === fecha && b.horaInicio === horario.horaInicio
        );
        const estaSeleccionadoParaDesbloquear = bloquesADesbloquear.some(b =>
          b.fecha === fecha && b.horaInicio === horario.horaInicio
        );

        const esPasado = hasSlotEnded(fecha, horario.horaFin);
        const estaBloqueado = horario.bloqueado;
        const esMiVivienda = horario.reservaExistente?.vivienda === userVivienda;
        const esPrimeraOProtegida = horario.prioridad === 'primera' || horario.estaProtegida;
        const esOtraGarantizada = !horario.disponible && !estaBloqueado && !esMiVivienda && esPrimeraOProtegida;

        const estaDeshabilitado = reservando ||
          (esPasado && !modoBloqueo) ||
          (!modoBloqueo && !estaBloqueado && (esOtraGarantizada || esMiVivienda));

        return (
          <TimeSlotChip
            key={index}
            horario={horario}
            fecha={fecha}
            userVivienda={userVivienda}
            estaSeleccionado={estaSeleccionado}
            estaSeleccionadoParaBloquear={estaSeleccionadoParaBloquear}
            estaSeleccionadoParaDesbloquear={estaSeleccionadoParaDesbloquear}
            modoBloqueo={modoBloqueo}
            disabled={estaDeshabilitado}
            onPress={() => onHorarioPress(horario, fecha)}
          />
        );
      })}
    </View>
  );
}

/**
 * Schedule grid for week view
 */
export function WeekScheduleGrid({
  horariosSemanales,
  userVivienda,
  bloquesSeleccionados = [],
  bloquesABloquear = [],
  bloquesADesbloquear = [],
  modoBloqueo,
  esAdmin,
  reservando,
  onHorarioPress,
}) {
  if (!horariosSemanales) {
    return <Text style={styles.emptyText}>No hay horarios disponibles esta semana</Text>;
  }
  const fechas = Object.keys(horariosSemanales);

  if (fechas.length === 0) {
    return <Text style={styles.emptyText}>No hay horarios disponibles esta semana</Text>;
  }

  return (
    <>
      {fechas.map((fecha) => {
        const horariosDia = horariosSemanales[fecha];
        const cantidadDisponibles = horariosDia.filter(h =>
          (h.disponible || h.esDesplazable) && !h.bloqueado
        ).length;

        return (
          <View key={fecha} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayDate}>
                {formatReadableDate(fecha)}
              </Text>
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>
                  {cantidadDisponibles} disponibles
                </Text>
              </View>
            </View>

            <View style={styles.slotsGrid}>
              {horariosDia.map((horario, index) => {
                const estaSeleccionado = bloquesSeleccionados.some(b =>
                  b.fecha === fecha && b.horaInicio === horario.horaInicio
                );
                const estaSeleccionadoParaBloquear = bloquesABloquear.some(b =>
                  b.fecha === fecha && b.horaInicio === horario.horaInicio
                );
                const estaSeleccionadoParaDesbloquear = bloquesADesbloquear.some(b =>
                  b.fecha === fecha && b.horaInicio === horario.horaInicio
                );

                const esPasado = hasSlotEnded(fecha, horario.horaFin);
                const estaBloqueado = horario.bloqueado;
                const esMiVivienda = horario.reservaExistente?.vivienda === userVivienda;
                const esPrimeraOProtegida = horario.prioridad === 'primera' || horario.estaProtegida;
                const esOtraGarantizada = !horario.disponible && !estaBloqueado && !esMiVivienda && esPrimeraOProtegida;

                const estaDeshabilitado = reservando ||
                  (esPasado && !modoBloqueo) ||
                  (!modoBloqueo && !estaBloqueado && (esOtraGarantizada || esMiVivienda));

                return (
                  <TimeSlotChip
                    key={index}
                    horario={horario}
                    fecha={fecha}
                    userVivienda={userVivienda}
                    estaSeleccionado={estaSeleccionado}
                    estaSeleccionadoParaBloquear={estaSeleccionadoParaBloquear}
                    estaSeleccionadoParaDesbloquear={estaSeleccionadoParaDesbloquear}
                    modoBloqueo={modoBloqueo}
                    disabled={estaDeshabilitado}
                    onPress={() => onHorarioPress(horario, fecha)}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
    </>
  );
}

/**
 * Main schedule container
 */
export function ScheduleContainer({
  loading,
  vistaActual,
  horarios,
  horariosSemanales,
  fechaSeleccionada,
  userVivienda,
  bloquesSeleccionados = [],
  bloquesABloquear = [],
  bloquesADesbloquear = [],
  modoBloqueo,
  esAdmin,
  reservando,
  onHorarioPress,
}) {
  if (loading) {
    return <ActivityIndicator size="large" color={colors.primary} />;
  }

  if (vistaActual === 'dia') {
    return (
      <DayScheduleGrid
        horarios={horarios}
        fecha={fechaSeleccionada}
        userVivienda={userVivienda}
        bloquesSeleccionados={bloquesSeleccionados}
        bloquesABloquear={bloquesABloquear}
        bloquesADesbloquear={bloquesADesbloquear}
        modoBloqueo={modoBloqueo}
        esAdmin={esAdmin}
        reservando={reservando}
        onHorarioPress={onHorarioPress}
      />
    );
  }

  return (
    <WeekScheduleGrid
      horariosSemanales={horariosSemanales}
      userVivienda={userVivienda}
      bloquesSeleccionados={bloquesSeleccionados}
      bloquesABloquear={bloquesABloquear}
      bloquesADesbloquear={bloquesADesbloquear}
      modoBloqueo={modoBloqueo}
      esAdmin={esAdmin}
      reservando={reservando}
      onHorarioPress={onHorarioPress}
    />
  );
}

// Legacy aliases for backwards compatibility
export const HorariosGridDia = DayScheduleGrid;
export const HorariosGridSemana = WeekScheduleGrid;
export const HorariosContainer = ScheduleContainer;

const styles = StyleSheet.create({
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  availableBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
});
