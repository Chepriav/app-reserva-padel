import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { authService } from '../services/authService.firebase';
import { colors } from '../constants/colors';
import { formatearFechaLegible } from '../utils/dateHelpers';
import { CustomAlert } from '../components/CustomAlert';

export default function AdminScreen() {
  const [usuariosPendientes, setUsuariosPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estado para CustomAlert
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  useEffect(() => {
    cargarUsuariosPendientes();
  }, []);

  const cargarUsuariosPendientes = async () => {
    setLoading(true);
    const result = await authService.getUsuariosPendientes();
    setLoading(false);

    if (result.success) {
      setUsuariosPendientes(result.data);
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: result.error,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarUsuariosPendientes();
    setRefreshing(false);
  };

  const handleAprobar = (usuario) => {
    setAlertConfig({
      visible: true,
      title: 'Aprobar Usuario',
      message: `¿Aprobar el registro de ${usuario.nombre}?\n\nVivienda: ${usuario.vivienda}\nEmail: ${usuario.email}`,
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Aprobar',
          onPress: async () => {
            const result = await authService.aprobarUsuario(usuario.id);
            if (result.success) {
              setAlertConfig({
                visible: true,
                title: 'Aprobado',
                message: `${usuario.nombre} ha sido aprobado`,
                buttons: [{ text: 'OK', onPress: () => {} }],
              });
              cargarUsuariosPendientes();
            } else {
              setAlertConfig({
                visible: true,
                title: 'Error',
                message: result.error,
                buttons: [{ text: 'OK', onPress: () => {} }],
              });
            }
          },
        },
      ],
    });
  };

  const handleRechazar = (usuario) => {
    setAlertConfig({
      visible: true,
      title: 'Rechazar Usuario',
      message: `¿Rechazar el registro de ${usuario.nombre}?\n\nVivienda: ${usuario.vivienda}\nEmail: ${usuario.email}`,
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            const result = await authService.rechazarUsuario(usuario.id);
            if (result.success) {
              setAlertConfig({
                visible: true,
                title: 'Rechazado',
                message: `${usuario.nombre} ha sido rechazado`,
                buttons: [{ text: 'OK', onPress: () => {} }],
              });
              cargarUsuariosPendientes();
            } else {
              setAlertConfig({
                visible: true,
                title: 'Error',
                message: result.error,
                buttons: [{ text: 'OK', onPress: () => {} }],
              });
            }
          },
        },
      ],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Administración</Text>
        <Text style={styles.subtitle}>
          {usuariosPendientes.length} solicitud
          {usuariosPendientes.length !== 1 ? 'es' : ''} pendiente
          {usuariosPendientes.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : usuariosPendientes.length > 0 ? (
          usuariosPendientes.map((usuario) => (
            <View key={usuario.id} style={styles.usuarioCard}>
              <View style={styles.usuarioHeader}>
                <Text style={styles.usuarioNombre}>{usuario.nombre}</Text>
                <View style={styles.pendienteBadge}>
                  <Text style={styles.pendienteText}>Pendiente</Text>
                </View>
              </View>

              <View style={styles.usuarioInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📧 Email:</Text>
                  <Text style={styles.infoValue}>{usuario.email}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📱 Teléfono:</Text>
                  <Text style={styles.infoValue}>{usuario.telefono}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>🏠 Vivienda:</Text>
                  <Text style={styles.infoValue}>{usuario.vivienda}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📅 Solicitud:</Text>
                  <Text style={styles.infoValue}>
                    {formatearFechaLegible(usuario.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.botonesContainer}>
                <TouchableOpacity
                  style={styles.botonAprobar}
                  onPress={() => handleAprobar(usuario)}
                >
                  <Text style={styles.botonAprobarText}>✓ Aprobar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botonRechazar}
                  onPress={() => handleRechazar(usuario)}
                >
                  <Text style={styles.botonRechazarText}>✗ Rechazar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyText}>
              No hay solicitudes pendientes
            </Text>
            <Text style={styles.emptySubtext}>
              Las nuevas solicitudes aparecerán aquí
            </Text>
          </View>
        )}
      </ScrollView>

      {/* CustomAlert component */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.accent,
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  usuarioCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  usuarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  usuarioNombre: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  pendienteBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendienteText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  usuarioInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  botonesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  botonAprobar: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  botonAprobarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  botonRechazar: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  botonRechazarText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
