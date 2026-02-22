import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';

const TYPE_ICONS = {
  desplazamiento: 'swap-horizontal',
  partida_solicitud: 'people',
  partida_aceptada: 'checkmark-circle',
  partida_completa: 'trophy',
  partida_cancelada: 'close-circle',
  reserva_recordatorio: 'alarm',
  default: 'notifications',
};

const TYPE_COLORS = {
  desplazamiento: colors.announcementNotice,
  partida_solicitud: colors.primary,
  partida_aceptada: colors.success,
  partida_completa: colors.success,
  partida_cancelada: colors.error,
  reserva_recordatorio: colors.announcementInfo,
  default: colors.primary,
};

function formatDateRelativa(dateStr) {
  const date = new Date(dateStr);
  const ahora = new Date();
  const diffMs = ahora - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function NotificationCard({ notification, onMarkRead, onDelete }) {
  const icon = TYPE_ICONS[notification.type] || TYPE_ICONS.default;
  const iconColor = TYPE_COLORS[notification.type] || TYPE_COLORS.default;

  const handlePress = () => {
    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        notification.read && styles.containerRead,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, notification.read && styles.titleRead]}>
            {notification.title}
          </Text>
          {!notification.read && <View style={styles.badgeNoRead} />}
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>

        <Text style={styles.date}>
          {formatDateRelativa(notification.createdAt)}
        </Text>
      </View>

      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(notification.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
    }),
  },
  containerRead: {
    backgroundColor: colors.notificationRead,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  titleRead: {
    color: colors.textSecondary,
  },
  badgeNoRead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.badgeRojo,
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: colors.disabled,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
