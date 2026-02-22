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

const TYPE_CONFIG = {
  info: {
    icon: 'information-circle',
    color: colors.announcementInfo,
    label: 'Información',
  },
  notice: {
    icon: 'warning',
    color: colors.announcementNotice,
    label: 'Aviso',
  },
  urgent: {
    icon: 'alert-circle',
    color: colors.announcementUrgent,
    label: 'Urgente',
  },
  maintenance: {
    icon: 'construct',
    color: colors.announcementMaintenance,
    label: 'Mantenimiento',
  },
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const ahora = new Date();
  const diffMs = ahora - date;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function AnnouncementCard({ announcement, onPress, isAdmin, onDelete }) {
  const config = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.info;

  const handleDelete = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation(); // Prevent card press
    }
    if (onDelete) {
      onDelete(announcement.id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        announcement.read && styles.containerRead,
        { borderLeftColor: config.color },
      ]}
      onPress={() => onPress(announcement)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: `${config.color}15` }]}>
          <Ionicons name={config.icon} size={14} color={config.color} />
          <Text style={[styles.typeLabel, { color: config.color }]}>
            {config.label}
          </Text>
        </View>

        {!announcement.read && <View style={styles.badgeNoRead} />}
      </View>

      {isAdmin && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      )}

      <Text style={[styles.title, announcement.read && styles.titleRead]} numberOfLines={1}>
        {announcement.title}
      </Text>

      <Text style={styles.message} numberOfLines={2}>
        {announcement.message}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.autor}>
          <Ionicons name="person-outline" size={12} color={colors.disabled} />
          {' '}{announcement.creatorName}
        </Text>
        <Text style={styles.date}>
          {formatDate(announcement.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  badgeNoRead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.badgeRojo,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  titleRead: {
    color: colors.textSecondary,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autor: {
    fontSize: 12,
    color: colors.disabled,
  },
  date: {
    fontSize: 12,
    color: colors.disabled,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    zIndex: 10,
  },
});
