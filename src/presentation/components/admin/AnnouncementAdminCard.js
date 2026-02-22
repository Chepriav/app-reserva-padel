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
    label: 'Info',
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
    label: 'Manten.',
  },
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AnnouncementAdminCard({ announcement, onDelete }) {
  const config = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.info;

  const handleDelete = () => {
    // Call parent handler with the announcement id
    // Parent component handles confirmation dialog
    onDelete?.(announcement.id);
  };

  return (
    <View style={[styles.container, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: `${config.color}15` }]}>
          <Ionicons name={config.icon} size={14} color={config.color} />
          <Text style={[styles.typeLabel, { color: config.color }]}>
            {config.label}
          </Text>
        </View>

        <View style={[styles.recipientsBadge,
          announcement.recipients === 'todos' ? styles.recipientsTodos : styles.recipientsSelected
        ]}>
          <Ionicons
            name={announcement.recipients === 'todos' ? 'people' : 'person'}
            size={12}
            color={announcement.recipients === 'todos' ? colors.success : colors.primary}
          />
          <Text style={[styles.recipientsLabel,
            { color: announcement.recipients === 'todos' ? colors.success : colors.primary }
          ]}>
            {announcement.recipients === 'todos' ? 'Todos' : 'Seleccionados'}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {announcement.title}
      </Text>

      <Text style={styles.message} numberOfLines={2}>
        {announcement.message}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.date}>
          <Ionicons name="time-outline" size={12} color={colors.disabled} />
          {' '}{formatDate(announcement.createdAt)}
        </Text>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  recipientsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  recipientsTodos: {
    backgroundColor: `${colors.success}15`,
  },
  recipientsSelected: {
    backgroundColor: `${colors.primary}15`,
  },
  recipientsLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: colors.disabled,
  },
  deleteButton: {
    padding: 4,
  },
});

// Export with English name for consistency
