import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

export function EmptyState({ type = 'notificaciones' }) {
  const config = {
    notificaciones: {
      icon: 'notifications-off-outline',
      title: 'Sin notificaciones',
      message: 'No tienes notificaciones nuevas',
    },
    anuncios: {
      icon: 'megaphone-outline',
      title: 'Sin anuncios',
      message: 'No hay anuncios publicados',
    },
  };

  const { icon, title, message } = config[type] || config.notificaciones;

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
