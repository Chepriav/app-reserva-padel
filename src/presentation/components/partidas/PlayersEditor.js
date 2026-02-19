import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { NIVELES_JUEGO } from '../../../constants/config';

/**
 * Players editor for the create match modal
 */
export default function PlayersEditor({
  // Support both English and Spanish prop names
  players,
  jugadores = players,
  user,
  usuario = user,
  onAddPlayer,
  onAbrirModalJugador = onAddPlayer,
  onRemovePlayer,
  onRemoveJugador = onRemovePlayer,
  isClass,
  esClase = isClass,
  maxParticipants,
  maxParticipantes = maxParticipants,
}) {
  const playersList = jugadores || [];
  const currentUser = usuario;
  const totalPlayers = 1 + playersList.length; // Creator + added
  const maxPlayers = maxParticipantes || 4;
  const maxAddable = maxPlayers - 1; // Exclude creator

  return (
    <>
      <Text style={styles.label}>
        {esClase ? 'Alumnos' : 'Jugadores'} ({totalPlayers}/{maxPlayers})
      </Text>
      <View style={styles.container}>
        {/* Creator always first */}
        <PlayerRow
          name={`${currentUser?.nombre} (Tú)`}
          apartment={currentUser?.vivienda}
          isExternal={false}
        />

        {/* Added players */}
        {playersList.map((player, index) => (
          <PlayerRow
            key={index}
            name={player.nombre}
            apartment={player.vivienda}
            level={player.nivel}
            isExternal={player.tipo === 'externo'}
            onRemove={() => onRemoveJugador(index)}
          />
        ))}

        {/* Add button */}
        {playersList.length < maxAddable && (
          <TouchableOpacity style={styles.addButton} onPress={onAbrirModalJugador}>
            <Text style={styles.addButtonText}>
              + Añadir {esClase ? 'alumno' : 'jugador'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

function PlayerRow({ name, apartment, level, isExternal = false, onRemove }) {
  const levelLabel = level
    ? NIVELES_JUEGO.find(n => n.value === level)?.label || level
    : null;

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, isExternal && styles.avatarExternal]}>
        <Text style={styles.avatarText}>
          {name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.detail}>
          {isExternal ? 'Jugador externo' : `Vivienda ${apartment}`}
          {levelLabel && ` • ${levelLabel}`}
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
  avatarExternal: {
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
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  detail: {
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

// Legacy alias
export { PlayersEditor as JugadoresEditor };
