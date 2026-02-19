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

const TIPO_CONFIG = {
  info: {
    icon: 'information-circle',
    color: colors.anuncioInfo,
    label: 'Info',
  },
  aviso: {
    icon: 'warning',
    color: colors.anuncioAviso,
    label: 'Aviso',
  },
  urgente: {
    icon: 'alert-circle',
    color: colors.anuncioUrgente,
    label: 'Urgente',
  },
  mantenimiento: {
    icon: 'construct',
    color: colors.anuncioMantenimiento,
    label: 'Manten.',
  },
};

function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AnuncioAdminCard({ anuncio, onEliminar }) {
  const config = TIPO_CONFIG[anuncio.tipo] || TIPO_CONFIG.info;

  const handleEliminar = () => {
    // Call parent handler with the announcement id
    // Parent component handles confirmation dialog
    onEliminar?.(anuncio.id);
  };

  return (
    <View style={[styles.container, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <View style={[styles.tipoBadge, { backgroundColor: `${config.color}15` }]}>
          <Ionicons name={config.icon} size={14} color={config.color} />
          <Text style={[styles.tipoLabel, { color: config.color }]}>
            {config.label}
          </Text>
        </View>

        <View style={[styles.destinatariosBadge,
          anuncio.destinatarios === 'todos' ? styles.destinatariosTodos : styles.destinatariosSeleccionados
        ]}>
          <Ionicons
            name={anuncio.destinatarios === 'todos' ? 'people' : 'person'}
            size={12}
            color={anuncio.destinatarios === 'todos' ? colors.success : colors.primary}
          />
          <Text style={[styles.destinatariosLabel,
            { color: anuncio.destinatarios === 'todos' ? colors.success : colors.primary }
          ]}>
            {anuncio.destinatarios === 'todos' ? 'Todos' : 'Seleccionados'}
          </Text>
        </View>
      </View>

      <Text style={styles.titulo} numberOfLines={1}>
        {anuncio.titulo}
      </Text>

      <Text style={styles.mensaje} numberOfLines={2}>
        {anuncio.mensaje}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.fecha}>
          <Ionicons name="time-outline" size={12} color={colors.disabled} />
          {' '}{formatearFecha(anuncio.createdAt)}
        </Text>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleEliminar}
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
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  tipoLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  destinatariosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  destinatariosTodos: {
    backgroundColor: `${colors.success}15`,
  },
  destinatariosSeleccionados: {
    backgroundColor: `${colors.primary}15`,
  },
  destinatariosLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  titulo: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  mensaje: {
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
  fecha: {
    fontSize: 12,
    color: colors.disabled,
  },
  deleteButton: {
    padding: 4,
  },
});

// Export with English name for consistency
export { AnuncioAdminCard as AnnouncementAdminCard };
