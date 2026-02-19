import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../../constants/colors';
import { CustomAlert } from '../components/CustomAlert';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfilePersonalInfo } from '../components/profile/ProfilePersonalInfo';
import { ProfileApartmentUsers } from '../components/profile/ProfileApartmentUsers';
import { ApartmentChangeModal } from '../components/profile/ApartmentChangeModal';
import { useProfileEdit } from '../hooks/profile/useProfileEdit';
import { useProfileNotifications } from '../hooks/profile/useProfileNotifications';
import { useApartmentChange } from '../hooks/profile/useApartmentChange';
import { useProfileActions } from '../hooks/profile/useProfileActions';
import { authService } from '../../services/authService.supabase';

export default function PerfilScreen() {
  const { user, logout, updateProfile, refreshUser, notificationMessage, clearNotificationMessage } = useAuth();

  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', buttons: [] });
  const [usuariosVivienda, setUsuariosVivienda] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => {} }]) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const edit = useProfileEdit(user, updateProfile, showAlert);
  const notifications = useProfileNotifications(user, showAlert);
  const apartment = useApartmentChange(user, updateProfile, showAlert);
  const actions = useProfileActions(user, logout, showAlert);

  // Load users in same apartment
  useEffect(() => {
    const load = async () => {
      if (!user?.vivienda) return;
      setLoadingUsuarios(true);
      const result = await authService.getUsuariosMismaVivienda(user.vivienda);
      if (result.success) setUsuariosVivienda(result.data);
      setLoadingUsuarios(false);
    };
    load();
  }, [user?.vivienda]);

  // Show notification message if arriving from push
  useEffect(() => {
    if (!notificationMessage) return;
    if (refreshUser) {
      refreshUser().catch(() => {});
    }
    showAlert(notificationMessage.title, notificationMessage.text, [{
      text: 'OK',
      onPress: () => clearNotificationMessage(),
    }]);
  }, [notificationMessage]);

  return (
    <ScrollView style={styles.container}>
      <ProfileHeader
        user={user}
        editMode={edit.editMode}
        fotoPerfil={edit.fotoPerfil}
        imageError={edit.imageError}
        onImageError={() => edit.setImageError(true)}
        onPickImage={edit.handlePickImage}
        onDeleteImage={edit.handleDeleteImage}
        onEditPress={() => edit.setEditMode(true)}
      />

      <ProfilePersonalInfo
        user={user}
        editMode={edit.editMode}
        nombre={edit.nombre} setNombre={edit.setNombre}
        telefono={edit.telefono} setTelefono={edit.setTelefono}
        escalera={edit.escalera} setEscalera={edit.setEscalera}
        piso={edit.piso} setPiso={edit.setPiso}
        puerta={edit.puerta} setPuerta={edit.setPuerta}
        nivelJuego={edit.nivelJuego} setNivelJuego={edit.setNivelJuego}
        showNivelPicker={edit.showNivelPicker} setShowNivelPicker={edit.setShowNivelPicker}
        cancelingSolicitud={apartment.cancelingSolicitud}
        onCancelarSolicitud={apartment.handleCancelarSolicitud}
        onSolicitarCambio={apartment.openSolicitudModal}
      />

      <ProfileApartmentUsers
        user={user}
        usuariosVivienda={usuariosVivienda}
        loadingUsuarios={loadingUsuarios}
      />

      {/* Save/Cancel buttons in edit mode */}
      {edit.editMode && (
        <View style={styles.editButtons}>
          <TouchableOpacity
            style={[styles.saveButton, edit.saving && styles.buttonDisabled]}
            onPress={edit.handleSave}
            disabled={edit.saving}
          >
            {edit.saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={edit.cancelEdit} disabled={edit.saving}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications button (web only) */}
      {Platform.OS === 'web' && (
        <TouchableOpacity
          style={[styles.notificationButton, notifications.enablingNotifications && styles.buttonDisabled]}
          onPress={notifications.handleEnableNotifications}
          disabled={notifications.enablingNotifications}
        >
          {notifications.enablingNotifications ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.notificationButtonText}>🔔 Activar Notificaciones</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={actions.handleLogout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Danger zone */}
      <View style={styles.dangerSection}>
        <Text style={styles.dangerSectionTitle}>Zona de Peligro</Text>
        <View style={styles.dangerCard}>
          <Text style={styles.dangerText}>
            Eliminar tu cuenta borrará permanentemente todos tus datos y reservas.
          </Text>
          <TouchableOpacity
            style={[styles.deleteAccountButton, actions.deleting && styles.deleteAccountButtonDisabled]}
            onPress={actions.handleDeleteAccount}
            disabled={actions.deleting}
          >
            {actions.deleting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.deleteAccountButtonText}>Eliminar mi cuenta</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footer}>Desarrollado con React Native y Expo</Text>

      <ApartmentChangeModal
        solicitudModal={apartment.solicitudModal}
        setSolicitudModal={apartment.setSolicitudModal}
        onClose={apartment.closeSolicitudModal}
        onSubmit={apartment.handleEnviarSolicitud}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  editButtons: { padding: 16, paddingTop: 0 },
  saveButton: {
    backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { backgroundColor: colors.disabled },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { marginTop: 12, padding: 16, alignItems: 'center' },
  cancelButtonText: { color: colors.textSecondary, fontSize: 16, fontWeight: '500' },
  notificationButton: {
    backgroundColor: colors.primary, borderRadius: 12, padding: 16,
    margin: 16, marginBottom: 0, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  notificationButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutButton: {
    backgroundColor: colors.error, borderRadius: 12, padding: 16,
    margin: 16, marginTop: 8, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  dangerSection: { marginHorizontal: 16, marginTop: 24 },
  dangerSectionTitle: { fontSize: 16, fontWeight: '600', color: colors.error, marginBottom: 12 },
  dangerCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.error + '40',
  },
  dangerText: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  deleteAccountButton: {
    backgroundColor: colors.error, borderRadius: 8, paddingVertical: 12,
    paddingHorizontal: 16, alignItems: 'center', minHeight: 44, justifyContent: 'center',
  },
  deleteAccountButtonDisabled: { backgroundColor: colors.error + '80' },
  deleteAccountButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  footer: { textAlign: 'center', fontSize: 12, color: colors.textSecondary, paddingVertical: 20 },
});
