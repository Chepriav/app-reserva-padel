import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
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

function formatearFechaCompleta(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AnnouncementModal({ anuncio, visible, onClose, isAdmin, onDelete }) {
  if (!anuncio) return null;

  const config = TIPO_CONFIG[anuncio.tipo] || TIPO_CONFIG.info;

  const handleDelete = () => {
    onClose(); // Close modal first
    if (onDelete) {
      onDelete(anuncio.id);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={[styles.header, { backgroundColor: `${config.color}10` }]}>
            <View style={styles.headerContent}>
              <View style={[styles.tipoBadge, { backgroundColor: config.color }]}>
                <Ionicons name={config.icon} size={16} color="#fff" />
                <Text style={styles.tipoLabel}>{config.label}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.titulo}>{anuncio.titulo}</Text>

            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{anuncio.creadorNombre}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {formatearFechaCompleta(anuncio.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={styles.mensaje}>{anuncio.mensaje}</Text>
          </ScrollView>

          <View style={styles.footer}>
            {isAdmin && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: config.color },
                isAdmin && { flex: 1 }
              ]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      },
    }),
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tipoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  closeButton: {
    padding: 4,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  meta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  body: {
    flexGrow: 1,
  },
  bodyContent: {
    padding: 16,
  },
  mensaje: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.error,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
