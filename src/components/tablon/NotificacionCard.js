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

const TIPO_ICONS = {
  desplazamiento: 'swap-horizontal',
  partida_solicitud: 'people',
  partida_aceptada: 'checkmark-circle',
  partida_completa: 'trophy',
  partida_cancelada: 'close-circle',
  reserva_recordatorio: 'alarm',
  default: 'notifications',
};

const TIPO_COLORS = {
  desplazamiento: colors.anuncioAviso,
  partida_solicitud: colors.primary,
  partida_aceptada: colors.success,
  partida_completa: colors.success,
  partida_cancelada: colors.error,
  reserva_recordatorio: colors.anuncioInfo,
  default: colors.primary,
};

function formatearFechaRelativa(fechaStr) {
  const fecha = new Date(fechaStr);
  const ahora = new Date();
  const diffMs = ahora - fecha;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMs / 3600000);
  const diffDias = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHoras < 24) return `Hace ${diffHoras}h`;
  if (diffDias < 7) return `Hace ${diffDias}d`;

  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function NotificacionCard({ notificacion, onMarcarLeida, onEliminar }) {
  const icon = TIPO_ICONS[notificacion.tipo] || TIPO_ICONS.default;
  const iconColor = TIPO_COLORS[notificacion.tipo] || TIPO_COLORS.default;

  const handlePress = () => {
    if (!notificacion.leida && onMarcarLeida) {
      onMarcarLeida(notificacion.id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        notificacion.leida && styles.containerLeida,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.titulo, notificacion.leida && styles.tituloLeido]}>
            {notificacion.titulo}
          </Text>
          {!notificacion.leida && <View style={styles.badgeNoLeido} />}
        </View>

        <Text style={styles.mensaje} numberOfLines={2}>
          {notificacion.mensaje}
        </Text>

        <Text style={styles.fecha}>
          {formatearFechaRelativa(notificacion.createdAt)}
        </Text>
      </View>

      {onEliminar && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onEliminar(notificacion.id)}
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
  containerLeida: {
    backgroundColor: colors.notificacionLeida,
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
  titulo: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  tituloLeido: {
    color: colors.textSecondary,
  },
  badgeNoLeido: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.badgeRojo,
    marginLeft: 8,
  },
  mensaje: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  fecha: {
    fontSize: 12,
    color: colors.disabled,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
