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
  Switch,
} from 'react-native';
import { authService } from '../services/authService.supabase';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { formatearFechaLegible } from '../utils/dateHelpers';
import { CustomAlert } from '../components/CustomAlert';

export default function AdminScreen() {
  const { user } = useAuth();
  const [tabActiva, setTabActiva] = useState('solicitudes');
  const [usuariosPendientes, setUsuariosPendientes] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  useEffect(() => {
    cargarTodosDatos();
  }, []);

  useEffect(() => {
    cargarDatosTab();
  }, [tabActiva]);

  const cargarTodosDatos = async () => {
    setLoading(true);
    const [pendientesResult, usuariosResult] = await Promise.all([
      authService.getUsuariosPendientes(),
      authService.getTodosUsuarios(),
    ]);
    if (pendientesResult.success) {
      setUsuariosPendientes(pendientesResult.data);
    }
    if (usuariosResult.success) {
      setTodosUsuarios(usuariosResult.data);
    }
    setLoading(false);
  };

  const cargarDatosTab = async () => {
    if (tabActiva === 'solicitudes') {
      const result = await authService.getUsuariosPendientes();
      if (result.success) {
        setUsuariosPendientes(result.data);
      }
    } else {
      const result = await authService.getTodosUsuarios();
      if (result.success) {
        setTodosUsuarios(result.data);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarTodosDatos();
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
              setUsuariosPendientes((prev) =>
                prev.filter((u) => u.id !== usuario.id)
              );
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
              setUsuariosPendientes((prev) =>
                prev.filter((u) => u.id !== usuario.id)
              );
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

  const handleToggleAdmin = (usuario) => {
    const nuevoRol = !usuario.esAdmin;
    const accion = nuevoRol ? 'dar permisos de administrador a' : 'quitar permisos de administrador a';

    // No permitir quitar admin a uno mismo
    if (usuario.id === user.id && !nuevoRol) {
      setAlertConfig({
        visible: true,
        title: 'No permitido',
        message: 'No puedes quitarte los permisos de administrador a ti mismo',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    // No permitir quitar admin a un manager
    if (usuario.esManager && !nuevoRol) {
      setAlertConfig({
        visible: true,
        title: 'No permitido',
        message: 'No puedes quitar los permisos de administrador a un manager',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    setAlertConfig({
      visible: true,
      title: nuevoRol ? 'Hacer Administrador' : 'Quitar Administrador',
      message: `¿Deseas ${accion} ${usuario.nombre}?`,
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Confirmar',
          onPress: async () => {
            const result = await authService.toggleAdminRole(usuario.id, nuevoRol);
            if (result.success) {
              setTodosUsuarios((prev) =>
                prev.map((u) =>
                  u.id === usuario.id ? { ...u, esAdmin: nuevoRol } : u
                )
              );
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

  const handleDeleteUser = (usuario) => {
    // No permitir eliminar a uno mismo
    if (usuario.id === user.id) {
      setAlertConfig({
        visible: true,
        title: 'No permitido',
        message: 'No puedes eliminarte a ti mismo',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    // No permitir eliminar a un manager
    if (usuario.esManager) {
      setAlertConfig({
        visible: true,
        title: 'No permitido',
        message: 'No puedes eliminar a un manager',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    setAlertConfig({
      visible: true,
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de eliminar a ${usuario.nombre}?\n\nEsta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await authService.deleteUser(usuario.id);
            if (result.success) {
              setTodosUsuarios((prev) =>
                prev.filter((u) => u.id !== usuario.id)
              );
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

  const renderSolicitud = (usuario) => (
    <View key={usuario.id} style={styles.usuarioCard}>
      <View style={styles.usuarioHeader}>
        <Text style={styles.usuarioNombre}>{usuario.nombre}</Text>
        <View style={styles.pendienteBadge}>
          <Text style={styles.badgeText}>Pendiente</Text>
        </View>
      </View>

      <View style={styles.usuarioInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{usuario.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Teléfono:</Text>
          <Text style={styles.infoValue}>{usuario.telefono}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vivienda:</Text>
          <Text style={styles.infoValue}>{usuario.vivienda}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Solicitud:</Text>
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
          <Text style={styles.botonAprobarText}>Aprobar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonRechazar}
          onPress={() => handleRechazar(usuario)}
        >
          <Text style={styles.botonRechazarText}>Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUsuario = (usuario) => (
    <View key={usuario.id} style={styles.usuarioCard}>
      <View style={styles.usuarioHeader}>
        <View style={styles.usuarioNombreContainer}>
          <Text style={styles.usuarioNombre}>{usuario.nombre}</Text>
          {usuario.id === user.id && (
            <Text style={styles.tuCuenta}>(Tú)</Text>
          )}
        </View>
        <View style={styles.badgesContainer}>
          {usuario.esManager && (
            <View style={styles.managerBadge}>
              <Text style={styles.badgeText}>Manager</Text>
            </View>
          )}
          {usuario.esAdmin && !usuario.esManager && (
            <View style={styles.adminBadge}>
              <Text style={styles.badgeText}>Admin</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.usuarioInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{usuario.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vivienda:</Text>
          <Text style={styles.infoValue}>{usuario.vivienda}</Text>
        </View>
      </View>

      <View style={styles.adminToggleContainer}>
        <Text style={styles.adminToggleLabel}>Administrador</Text>
        <Switch
          value={usuario.esAdmin}
          onValueChange={() => handleToggleAdmin(usuario)}
          trackColor={{ false: colors.border, true: colors.secondary }}
          thumbColor={usuario.esAdmin ? colors.primary : colors.disabled}
          disabled={usuario.esManager}
        />
      </View>

      {usuario.id !== user.id && !usuario.esManager && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteUser(usuario)}
        >
          <Text style={styles.deleteButtonText}>Eliminar Usuario</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Administración</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, tabActiva === 'solicitudes' && styles.tabActive]}
          onPress={() => setTabActiva('solicitudes')}
        >
          <Text
            style={[
              styles.tabText,
              tabActiva === 'solicitudes' && styles.tabTextActive,
            ]}
          >
            Solicitudes ({usuariosPendientes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tabActiva === 'usuarios' && styles.tabActive]}
          onPress={() => setTabActiva('usuarios')}
        >
          <Text
            style={[
              styles.tabText,
              tabActiva === 'usuarios' && styles.tabTextActive,
            ]}
          >
            Usuarios ({todosUsuarios.length})
          </Text>
        </TouchableOpacity>
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
        ) : tabActiva === 'solicitudes' ? (
          usuariosPendientes.length > 0 ? (
            usuariosPendientes.map(renderSolicitud)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
              <Text style={styles.emptySubtext}>
                Las nuevas solicitudes aparecerán aquí
              </Text>
            </View>
          )
        ) : todosUsuarios.length > 0 ? (
          todosUsuarios.map(renderUsuario)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay usuarios</Text>
          </View>
        )}
      </ScrollView>

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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.accent,
    fontWeight: '600',
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
    marginBottom: 12,
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
    marginBottom: 12,
  },
  usuarioNombreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  usuarioNombre: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  tuCuenta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  pendienteBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  adminBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  managerBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  usuarioInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
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
    fontSize: 15,
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
    fontSize: 15,
    fontWeight: '600',
  },
  adminToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  adminToggleLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
});
