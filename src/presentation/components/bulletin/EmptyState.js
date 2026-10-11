import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';

export function EmptyState({ type = 'notifications' }) {
  const config = {
    notifications: {
      icon: 'notifications-off-outline',
      title: 'Sin notificaciones',
      message: 'No tienes notificaciones nuevas',
    },
    announcements: {
      icon: 'megaphone-outline',
      title: 'Sin anuncios',
      message: 'No hay anuncios publicados',
    },
  };

  // Screens still pass the Spanish tab names
  const key = { notificaciones: 'notifications', anuncios: 'announcements' }[type] ?? type;
  const { icon, title, message } = config[key] || config.notifications;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={48} color={colors.disabled} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.disabled,
    textAlign: 'center',
  },
});
