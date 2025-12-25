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
  Modal,
} from 'react-native';
import { authService } from '../services/authService.supabase';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { formatearFechaLegible } from '../utils/dateHelpers';
import { CustomAlert } from '../components/CustomAlert';
import { ViviendaSelector } from '../components/ViviendaSelector';
import { parseVivienda, combinarVivienda, formatearVivienda } from '../constants/config';
import { validarViviendaComponentes } from '../utils/validators';

export default function AdminScreen() {
  const { user } = useAuth();
  const [tabActiva, setTabActiva] = useState('solicitudes');
  const [usuariosPendientes, setUsuariosPendientes] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [solicitudesCambio, setSolicitudesCambio] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  // Estado para modal de editar vivienda
  const [editViviendaModal, setEditViviendaModal] = useState({
    visible: false,
    usuario: null,
    escalera: '',
    piso: '',
    puerta: '',
    saving: false,
  });

  const openEditVivienda = (usuario) => {
    const parsed = parseVivienda(usuario.vivienda);
    setEditViviendaModal({
      visible: true,
      usuario,
      escalera: parsed.escalera,
      piso: parsed.piso,
      puerta: parsed.puerta,
      saving: false,
    });
  };

  const closeEditVivienda = () => {
    setEditViviendaModal({
      visible: false,
      usuario: null,
      escalera: '',
      piso: '',
      puerta: '',
      saving: false,
    });
  };

  const handleSaveVivienda = async () => {
    const { usuario, escalera, piso, puerta } = editViviendaModal;

    // Validar componentes
    const validacion = validarViviendaComponentes(escalera, piso, puerta);
    if (!validacion.valido) {
      const errorMsg = Object.values(validacion.errores).join('\n');
      setAlertConfig({
        visible: true,
        title: 'Error de validación',
        message: errorMsg,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    setEditViviendaModal((prev) => ({ ...prev, saving: true }));

    const nuevaVivienda = combinarVivienda(escalera, piso, puerta);
    const result = await authService.updateProfile(usuario.id, {
      vivienda: nuevaVivienda,
    });

    if (result.success) {
      // Actualizar lista local
      setTodosUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, vivienda: nuevaVivienda } : u
        )
      );
      closeEditVivienda();
      setAlertConfig({
        visible: true,
        title: 'Vivienda actualizada',
        message: `La vivienda de ${usuario.nombre} ha sido cambiada a ${formatearVivienda(nuevaVivienda)}`,
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    } else {
      setEditViviendaModal((prev) => ({ ...prev, saving: false }));
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: result.error || 'Error al actualizar la vivienda',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  useEffect(() => {
    cargarTodosDatos();
  }, []);

  useEffect(() => {
    cargarDatosTab();
  }, [tabActiva]);

  const cargarTodosDatos = async () => {
    setLoading(true);
    const [pendientesResult, usuariosResult, cambiosResult] = await Promise.all([
      authService.getUsuariosPendientes(),
      authService.getTodosUsuarios(),
      authService.getSolicitudesCambioVivienda(),
    ]);
    if (pendientesResult.success) {
      setUsuariosPendientes(pendientesResult.data);
    }
    if (usuariosResult.success) {
      setTodosUsuarios(usuariosResult.data);
    }
    if (cambiosResult.success) {
      setSolicitudesCambio(cambiosResult.data);
    }
    setLoading(false);
  };

  const cargarDatosTab = async () => {
    if (tabActiva === 'solicitudes') {
      const result = await authService.getUsuariosPendientes();
      if (result.success) {
        setUsuariosPendientes(result.data);
      }
    } else if (tabActiva === 'cambios') {
      const result = await authService.getSolicitudesCambioVivienda();
      if (result.success) {
        setSolicitudesCambio(result.data);
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

  const handleAprobarCambioVivienda = (usuario) => {
    setAlertConfig({
      visible: true,
      title: 'Aprobar Cambio de Vivienda',
      message: `¿Aprobar el cambio de vivienda de ${usuario.nombre}?\n\nActual: ${formatearVivienda(usuario.vivienda)}\nNueva: ${formatearVivienda(usuario.viviendaSolicitada)}`,
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Aprobar',
          onPress: async () => {
            const result = await authService.aprobarCambioVivienda(usuario.id);
            if (result.success) {
              setSolicitudesCambio((prev) =>
                prev.filter((u) => u.id !== usuario.id)
              );

              // Enviar notificación push al usuario
              await notificationService.notifyViviendaChange(
                usuario.id,
                true,
                formatearVivienda(usuario.viviendaSolicitada)
              );

              setAlertConfig({
                visible: true,
                title: 'Cambio Aprobado',
                message: `La vivienda de ${usuario.nombre} ha sido cambiada a ${formatearVivienda(usuario.viviendaSolicitada)}`,
                buttons: [{ text: 'OK', onPress: () => {} }],
              });
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

  const handleRechazarCambioVivienda = (usuario) => {
    setAlertConfig({
      visible: true,
      title: 'Rechazar Cambio de Vivienda',
      message: `¿Rechazar la solicitud de cambio de vivienda de ${usuario.nombre}?\n\nSolicita: ${formatearVivienda(usuario.viviendaSolicitada)}`,
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            const result = await authService.rechazarCambioVivienda(usuario.id);
            if (result.success) {
              setSolicitudesCambio((prev) =>
                prev.filter((u) => u.id !== usuario.id)
              );

              // Enviar notificación push al usuario
              await notificationService.notifyViviendaChange(usuario.id, false, null);
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

      <TouchableOpacity
        style={styles.editViviendaButton}
        onPress={() => openEditVivienda(usuario)}
      >
        <Text style={styles.editViviendaButtonText}>Cambiar Vivienda</Text>
      </TouchableOpacity>

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

  const renderSolicitudCambio = (usuario) => (
    <View key={usuario.id} style={styles.usuarioCard}>
      <View style={styles.usuarioHeader}>
        <Text style={styles.usuarioNombre}>{usuario.nombre}</Text>
        <View style={styles.cambioBadge}>
          <Text style={styles.badgeText}>Cambio</Text>
        </View>
      </View>

      <View style={styles.usuarioInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{usuario.email}</Text>
        </View>
        <View style={styles.cambioViviendaContainer}>
          <Text style={styles.cambioValue}>{formatearVivienda(usuario.vivienda)}</Text>
          <Text style={styles.cambioArrow}>→</Text>
          <Text style={[styles.cambioValue, styles.cambioNueva]}>
            {formatearVivienda(usuario.viviendaSolicitada)}
          </Text>
        </View>
      </View>

      <View style={styles.botonesContainer}>
        <TouchableOpacity
          style={styles.botonAprobar}
          onPress={() => handleAprobarCambioVivienda(usuario)}
        >
          <Text style={styles.botonAprobarText}>Aprobar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonRechazar}
          onPress={() => handleRechazarCambioVivienda(usuario)}
        >
          <Text style={styles.botonRechazarText}>Rechazar</Text>
        </TouchableOpacity>
      </View>
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
          style={[styles.tab, tabActiva === 'cambios' && styles.tabActive]}
          onPress={() => setTabActiva('cambios')}
        >
          <Text
            style={[
              styles.tabText,
              tabActiva === 'cambios' && styles.tabTextActive,
            ]}
          >
            Cambios ({solicitudesCambio.length})
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
        ) : tabActiva === 'cambios' ? (
          solicitudesCambio.length > 0 ? (
            solicitudesCambio.map(renderSolicitudCambio)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay cambios pendientes</Text>
              <Text style={styles.emptySubtext}>
                Las solicitudes de cambio de vivienda aparecerán aquí
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

      <Modal
        visible={editViviendaModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeEditVivienda}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar Vivienda</Text>
            {editViviendaModal.usuario && (
              <Text style={styles.modalSubtitle}>
                Usuario: {editViviendaModal.usuario.nombre}
              </Text>
            )}

            <View style={styles.viviendaSelectorContainer}>
              <ViviendaSelector
                escalera={editViviendaModal.escalera}
                piso={editViviendaModal.piso}
                puerta={editViviendaModal.puerta}
                onChangeEscalera={(value) =>
                  setEditViviendaModal((prev) => ({ ...prev, escalera: value }))
                }
                onChangePiso={(value) =>
                  setEditViviendaModal((prev) => ({ ...prev, piso: value }))
                }
                onChangePuerta={(value) =>
                  setEditViviendaModal((prev) => ({ ...prev, puerta: value }))
                }
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeEditVivienda}
                disabled={editViviendaModal.saving}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  editViviendaModal.saving && styles.modalButtonDisabled,
                ]}
                onPress={handleSaveVivienda}
                disabled={editViviendaModal.saving}
              >
                {editViviendaModal.saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  editViviendaButton: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editViviendaButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  viviendaSelectorContainer: {
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  cambioBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cambioViviendaContainer: {
    marginTop: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  cambioValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  cambioNueva: {
    color: colors.primary,
    fontWeight: '600',
  },
  cambioArrow: {
    fontSize: 18,
    color: colors.textSecondary,
  },
});
