import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { SKILL_LEVELS } from '../../../constants/config';

/**
 * List of pending requests for the match creator
 */
export default function PendingRequests({ requests, onAccept, onReject }) {
  if (!requests?.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Requests pending ({requests.length}):
      </Text>
      {requests.map((request) => (
        <RequestRow
          key={request.userId || request.id}
          request={request}
          onAccept={() => onAccept(request.userId)}
          onReject={() => onReject(request.userId)}
        />
      ))}
    </View>
  );
}

function RequestRow({ request, onAccept, onReject }) {
  const levelLabel = request.skillLevel
    ? SKILL_LEVELS.find(n => n.value === request.skillLevel)?.label || request.skillLevel
    : null;

  return (
    <View style={styles.row}>
      {request.userPhoto ? (
        <Image source={{ uri: request.userPhoto }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {request.userName?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{request.userName}</Text>
        <Text style={styles.apartment}>
          Apartment {request.userApartment}
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
export { PendingRequests as RequestsPending };
