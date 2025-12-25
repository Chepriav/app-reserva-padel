import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { NIVELES_JUEGO } from '../../constants/config';

/**
 * Lista de solicitudes pendientes para el creador de la partida
 */
export default function SolicitudesPendientes({ solicitudes, onAceptar, onRechazar }) {
  if (!solicitudes?.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        Solicitudes pendientes ({solicitudes.length}):
      </Text>
      {solicitudes.map((solicitud) => (
        <SolicitudRow
          key={solicitud.usuarioId || solicitud.id}
          solicitud={solicitud}
          onAceptar={() => onAceptar(solicitud.usuarioId)}
          onRechazar={() => onRechazar(solicitud.usuarioId)}
        />
      ))}
    </View>
  );
}

function SolicitudRow({ solicitud, onAceptar, onRechazar }) {
  const nivelLabel = solicitud.nivelJuego
    ? NIVELES_JUEGO.find(n => n.value === solicitud.nivelJuego)?.label || solicitud.nivelJuego
    : null;

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.nombre}>{solicitud.usuarioNombre}</Text>
        <Text style={styles.vivienda}>
          Vivienda {solicitud.usuarioVivienda}
          {nivelLabel && ` • ${nivelLabel}`}
        </Text>
      </View>
      <View style={styles.botones}>
        <TouchableOpacity style={styles.botonAceptar} onPress={onAceptar}>
          <Text style={styles.botonAceptarText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonRechazar} onPress={onRechazar}>
          <Text style={styles.botonRechazarText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.reservaProvisional + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  titulo: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: {
    flex: 1,
  },
  nombre: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  vivienda: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  botones: {
    flexDirection: 'row',
    gap: 8,
  },
  botonAceptar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonAceptarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  botonRechazar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonRechazarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
