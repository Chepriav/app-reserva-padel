import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { NIVELES_JUEGO } from '../../constants/config';

/**
 * Lista de participantes de una partida
 */
export default function ParticipantesList({ creador, jugadores }) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Participantes:</Text>

      {/* Creador siempre primero */}
      <ParticipanteRow
        nombre={creador.nombre}
        vivienda={creador.vivienda}
        foto={creador.foto}
        nivel={creador.nivel}
        esExterno={false}
      />

      {/* Jugadores confirmados */}
      {jugadores.map((jugador) => (
        <ParticipanteRow
          key={jugador.id}
          nombre={jugador.usuarioNombre}
          vivienda={jugador.usuarioVivienda}
          foto={jugador.usuarioFoto}
          nivel={jugador.nivelJuego}
          esExterno={jugador.esExterno}
        />
      ))}
    </View>
  );
}

function ParticipanteRow({ nombre, vivienda, foto, nivel, esExterno = false }) {
  const nivelLabel = nivel
    ? NIVELES_JUEGO.find(n => n.value === nivel)?.label || nivel
    : null;

  return (
    <View style={styles.row}>
      {foto ? (
        <Image source={{ uri: foto }} style={styles.avatarImage} />
      ) : (
        <View style={[styles.avatar, esExterno && styles.avatarExterno]}>
          <Text style={styles.avatarText}>
            {nombre?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.nombre}>{nombre}</Text>
        {esExterno ? (
          <Text style={styles.externo}>
            Externo{nivelLabel && ` • ${nivelLabel}`}
          </Text>
        ) : (
          <Text style={styles.vivienda}>
            Vivienda {vivienda}
            {nivelLabel && ` • ${nivelLabel}`}
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
  titulo: {
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
  avatarExterno: {
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
  nombre: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  vivienda: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  externo: {
    fontSize: 12,
    color: colors.accent,
    fontStyle: 'italic',
  },
});
