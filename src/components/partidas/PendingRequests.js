import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { NIVELES_JUEGO } from '../../constants/config';

/**
 * List of pending requests for the match creator
 */
export default function PendingRequests({ requests, onAccept, onReject }) {
  if (!requests?.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Solicitudes pendientes ({requests.length}):
      </Text>
      {requests.map((request) => (
        <RequestRow
          key={request.usuarioId || request.id}
          request={request}
          onAccept={() => onAccept(request.usuarioId)}
          onReject={() => onReject(request.usuarioId)}
        />
      ))}
    </View>
  );
}

function RequestRow({ request, onAccept, onReject }) {
  const levelLabel = request.nivelJuego
    ? NIVELES_JUEGO.find(n => n.value === request.nivelJuego)?.label || request.nivelJuego
    : null;

  return (
    <View style={styles.row}>
      {request.usuarioFoto ? (
        <Image source={{ uri: request.usuarioFoto }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {request.usuarioNombre?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{request.usuarioNombre}</Text>
        <Text style={styles.apartment}>
          Vivienda {request.usuarioVivienda}
          {levelLabel && ` • ${levelLabel}`}
        </Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptButtonText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
          <Text style={styles.rejectButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.provisionalReservation + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  title: {
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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Legacy alias
export { PendingRequests as SolicitudesPendientes };
