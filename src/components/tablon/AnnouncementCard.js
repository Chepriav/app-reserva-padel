import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

const TIPO_CONFIG = {
  info: {
    icon: 'information-circle',
    color: colors.anuncioInfo,
    label: 'Información',
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
    label: 'Mantenimiento',
  },
};

function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  const ahora = new Date();
  const diffMs = ahora - fecha;
  const diffDias = Math.floor(diffMs / 86400000);

  if (diffDias === 0) {
    return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDias === 1) return 'Ayer';
  if (diffDias < 7) return `Hace ${diffDias} días`;

  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function AnnouncementCard({ anuncio, onPress }) {
  const config = TIPO_CONFIG[anuncio.tipo] || TIPO_CONFIG.info;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        anuncio.leido && styles.containerLeido,
        { borderLeftColor: config.color },
      ]}
      onPress={() => onPress(anuncio)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.tipoBadge, { backgroundColor: `${config.color}15` }]}>
          <Ionicons name={config.icon} size={14} color={config.color} />
          <Text style={[styles.tipoLabel, { color: config.color }]}>
            {config.label}
          </Text>
        </View>

        {!anuncio.leido && <View style={styles.badgeNoLeido} />}
      </View>

      <Text style={[styles.titulo, anuncio.leido && styles.tituloLeido]} numberOfLines={1}>
        {anuncio.titulo}
      </Text>

      <Text style={styles.mensaje} numberOfLines={2}>
        {anuncio.mensaje}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.autor}>
          <Ionicons name="person-outline" size={12} color={colors.disabled} />
          {' '}{anuncio.creadorNombre}
        </Text>
        <Text style={styles.fecha}>
          {formatearFecha(anuncio.createdAt)}
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
  containerLeido: {
    backgroundColor: colors.notificacionLeida,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  badgeNoLeido: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.badgeRojo,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  tituloLeido: {
    color: colors.textSecondary,
  },
  mensaje: {
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
  fecha: {
    fontSize: 12,
    color: colors.disabled,
  },
});
