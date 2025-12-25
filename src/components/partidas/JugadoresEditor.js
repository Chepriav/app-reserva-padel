import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { NIVELES_JUEGO } from '../../constants/config';

/**
 * Editor de jugadores para el modal de crear partida
 */
export default function JugadoresEditor({ jugadores, usuario, onAddJugador, onRemoveJugador }) {
  const totalJugadores = 1 + jugadores.length; // Creador + añadidos

  return (
    <>
      <Text style={styles.label}>Jugadores ({totalJugadores}/4)</Text>
      <View style={styles.container}>
        {/* Creador siempre primero */}
        <JugadorRow
          nombre={`${usuario?.nombre} (Tú)`}
          vivienda={usuario?.vivienda}
          esExterno={false}
        />

        {/* Jugadores añadidos */}
        {jugadores.map((jugador, index) => (
          <JugadorRow
            key={index}
            nombre={jugador.nombre}
            vivienda={jugador.vivienda}
            nivel={jugador.nivel}
            esExterno={jugador.tipo === 'externo'}
            onRemove={() => onRemoveJugador(index)}
          />
        ))}

        {/* Botón añadir */}
        {jugadores.length < 3 && (
          <TouchableOpacity style={styles.addButton} onPress={onAddJugador}>
            <Text style={styles.addButtonText}>+ Añadir jugador</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

function JugadorRow({ nombre, vivienda, nivel, esExterno = false, onRemove }) {
  const nivelLabel = nivel
    ? NIVELES_JUEGO.find(n => n.value === nivel)?.label || nivel
    : null;

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, esExterno && styles.avatarExterno]}>
        <Text style={styles.avatarText}>
          {nombre?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.nombre}>{nombre}</Text>
        <Text style={styles.detalle}>
          {esExterno ? 'Jugador externo' : `Vivienda ${vivienda}`}
          {nivelLabel && ` • ${nivelLabel}`}
        </Text>
      </View>
      {onRemove && (
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarExterno: {
    backgroundColor: colors.accent,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  nombre: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  detalle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
