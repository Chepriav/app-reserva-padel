import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/colors';
import { formatearFechaLegible, bloqueTerminado } from '../../utils/dateHelpers';
import { HorarioChip } from './HorarioChip';

/**
 * Grid de horarios para vista día
 */
export function HorariosGridDia({
  horarios,
  fecha,
  userVivienda,
  bloquesSeleccionados,
  bloquesABloquear,
  bloquesADesbloquear,
  modoBloqueo,
  esAdmin,
  reservando,
  onHorarioPress,
}) {
  return (
    <View style={styles.horariosGrid}>
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

        const esPasado = bloqueTerminado(fecha, horario.horaFin);
        const estaBloqueado = horario.bloqueado;
        const esMiVivienda = horario.reservaExistente?.vivienda === userVivienda;
        const esPrimeraOProtegida = horario.prioridad === 'primera' || horario.estaProtegida;
        const esOtraGarantizada = !horario.disponible && !estaBloqueado && !esMiVivienda && esPrimeraOProtegida;

        const isDisabled = reservando ||
          (esPasado && !modoBloqueo) ||
          (!modoBloqueo && !estaBloqueado && (esOtraGarantizada || esMiVivienda));

        return (
          <HorarioChip
            key={index}
            horario={horario}
            fecha={fecha}
            userVivienda={userVivienda}
            estaSeleccionado={estaSeleccionado}
            estaSeleccionadoParaBloquear={estaSeleccionadoParaBloquear}
            estaSeleccionadoParaDesbloquear={estaSeleccionadoParaDesbloquear}
            modoBloqueo={modoBloqueo}
            disabled={isDisabled}
            onPress={() => onHorarioPress(horario, fecha)}
          />
        );
      })}
    </View>
  );
}

/**
 * Grid de horarios para vista semana
 */
export function HorariosGridSemana({
  horariosSemanales,
  userVivienda,
  bloquesSeleccionados,
  bloquesABloquear,
  bloquesADesbloquear,
  modoBloqueo,
  esAdmin,
  reservando,
  onHorarioPress,
}) {
  const fechas = Object.keys(horariosSemanales);

  if (fechas.length === 0) {
    return <Text style={styles.emptyText}>No hay horarios disponibles esta semana</Text>;
  }

  return (
    <>
      {fechas.map((fecha) => {
        const horariosDelDia = horariosSemanales[fecha];
        const disponiblesCount = horariosDelDia.filter(h =>
          (h.disponible || h.esDesplazable) && !h.bloqueado
        ).length;

        return (
          <View key={fecha} style={styles.diaCard}>
            <View style={styles.diaHeader}>
              <Text style={styles.diaFecha}>
                {formatearFechaLegible(fecha)}
              </Text>
              <View style={styles.disponiblesBadge}>
                <Text style={styles.disponiblesText}>
                  {disponiblesCount} disponibles
                </Text>
              </View>
            </View>

            <View style={styles.horariosGrid}>
              {horariosDelDia.map((horario, index) => {
                const estaSeleccionado = bloquesSeleccionados.some(b =>
                  b.fecha === fecha && b.horaInicio === horario.horaInicio
                );
                const estaSeleccionadoParaBloquear = bloquesABloquear.some(b =>
                  b.fecha === fecha && b.horaInicio === horario.horaInicio
                );
                const estaSeleccionadoParaDesbloquear = bloquesADesbloquear.some(b =>
                  b.fecha === fecha && b.horaInicio === horario.horaInicio
                );

                const esPasado = bloqueTerminado(fecha, horario.horaFin);
                const estaBloqueado = horario.bloqueado;
                const esMiVivienda = horario.reservaExistente?.vivienda === userVivienda;
                const esPrimeraOProtegida = horario.prioridad === 'primera' || horario.estaProtegida;
                const esOtraGarantizada = !horario.disponible && !estaBloqueado && !esMiVivienda && esPrimeraOProtegida;

                const isDisabled = reservando ||
                  (esPasado && !modoBloqueo) ||
                  (!modoBloqueo && !estaBloqueado && (esOtraGarantizada || esMiVivienda));

                return (
                  <HorarioChip
                    key={index}
                    horario={horario}
                    fecha={fecha}
                    userVivienda={userVivienda}
                    estaSeleccionado={estaSeleccionado}
                    estaSeleccionadoParaBloquear={estaSeleccionadoParaBloquear}
                    estaSeleccionadoParaDesbloquear={estaSeleccionadoParaDesbloquear}
                    modoBloqueo={modoBloqueo}
                    disabled={isDisabled}
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
 * Contenedor principal de horarios
 */
export function HorariosContainer({
  loading,
  vistaActual,
  horarios,
  horariosSemanales,
  fechaSeleccionada,
  userVivienda,
  bloquesSeleccionados,
  bloquesABloquear,
  bloquesADesbloquear,
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
      <HorariosGridDia
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
    <HorariosGridSemana
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

const styles = StyleSheet.create({
  horariosGrid: {
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
  diaCard: {
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
  diaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  diaFecha: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  disponiblesBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  disponiblesText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
});
