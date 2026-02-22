import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { SKILL_LEVELS } from '../../../constants/config';

/**
 * List of match participants
 */
export default function ParticipantsList({ creator, players = [] }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Participantes:</Text>

      {/* Creator always first */}
      <ParticipantRow
        name={creator.name}
        apartment={creator.apartment}
        photo={creator.photo}
        level={creator.level}
        isExternal={false}
      />

      {/* Confirmed players */}
      {players.map((player) => (
        <ParticipantRow
          key={player.id}
          name={player.userName}
          apartment={player.userApartment}
          photo={player.userPhoto}
          level={player.skillLevel}
          isExternal={player.isExternal}
        />
      ))}
    </View>
  );
}

function ParticipantRow({ name, apartment, photo, level, isExternal = false }) {
  const levelLabel = level
    ? SKILL_LEVELS.find(n => n.value === level)?.label || level
    : null;

  return (
    <View style={styles.row}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.avatarImage} />
      ) : (
        <View style={[styles.avatar, isExternal && styles.avatarExternal]}>
          <Text style={styles.avatarText}>
            {name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        {isExternal ? (
          <Text style={styles.external}>
            Externo{levelLabel && ` • ${levelLabel}`}
          </Text>
        ) : (
          <Text style={styles.apartment}>
            Apartment {apartment}
            {levelLabel && ` • ${levelLabel}`}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  avatarExternal: {
    backgroundColor: colors.accent,
  },
  avatarText: {
    color: '#fff',
    fontSize: 13,
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
  apartment: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  external: {
    fontSize: 12,
    color: colors.accent,
    fontStyle: 'italic',
  },
});

// Legacy alias
export { ParticipantsList as ParticipantesList };
