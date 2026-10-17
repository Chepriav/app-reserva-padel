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
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout, updateProfile, refreshUser, notificationMessage, clearNotificationMessage } = useAuth();

  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', buttons: [] });
  const [apartmentUsers, setApartmentUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

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
      if (!user?.apartment) return;
      setLoadingUsers(true);
      const result = await authService.getUsersMismaApartment(user.apartment);
      if (result.success) setApartmentUsers(result.data);
      setLoadingUsers(false);
    };
    load();
  }, [user?.apartment]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- react to a new notification message only
  }, [notificationMessage]);

  return (
    <ScrollView style={styles.container}>
      <ProfileHeader
        user={user}
        editMode={edit.editMode}
        profilePhoto={edit.profilePhoto}
        imageError={edit.imageError}
        onImageError={() => edit.setImageError(true)}
        onPickImage={edit.handlePickImage}
        onDeleteImage={edit.handleDeleteImage}
        onEditPress={() => edit.setEditMode(true)}
      />

      <ProfilePersonalInfo
        user={user}
        editMode={edit.editMode}
        name={edit.name} setName={edit.setName}
        phone={edit.phone} setPhone={edit.setPhone}
        staircase={edit.staircase} setStaircase={edit.setStaircase}
        floor={edit.floor} setFloor={edit.setFloor}
        door={edit.door} setDoor={edit.setDoor}
        skillLevel={edit.skillLevel} setSkillLevel={edit.setSkillLevel}
        showLevelPicker={edit.showLevelPicker} setShowLevelPicker={edit.setShowLevelPicker}
        cancelingRequest={apartment.cancelingRequest}
        onCancelRequest={apartment.handleCancelRequest}
        onRequestChange={apartment.openRequestModal}
      />

      <ProfileApartmentUsers
        user={user}
        apartmentUsers={apartmentUsers}
        loadingUsers={loadingUsers}
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
              <Text style={styles.saveButtonText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={edit.cancelEdit} disabled={edit.saving}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications (web only) */}
      {Platform.OS === 'web' && (notifications.notificationsEnabled ? (
        <View style={styles.notificationsCard}>
          <View style={styles.notificationsStatus}>
            <Ionicons name="checkmark-circle" size={22} color={colors.guaranteedReservation} />
            <View style={styles.notificationsStatusText}>
              <Text style={styles.notificationsTitle}>Notificaciones activadas</Text>
              <Text style={styles.notificationsSubtitle}>En este dispositivo</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.testButton, notifications.sendingTest && styles.buttonDisabled]}
            onPress={notifications.handleSendTest}
            disabled={notifications.sendingTest}
          >
            {notifications.sendingTest ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={16} color={colors.primary} />
                <Text style={styles.testButtonText}>Probar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.notificationsCard}>
          <View style={styles.notificationsStatus}>
            <Ionicons name="notifications-outline" size={22} color={colors.secondary} />
            <View style={styles.notificationsStatusText}>
              <Text style={styles.notificationsTitle}>Notificaciones</Text>
              <Text style={styles.notificationsSubtitle}>Avisos de reservas y partidas</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.enableButton, notifications.enablingNotifications && styles.buttonDisabled]}
            onPress={notifications.handleEnableNotifications}
            disabled={notifications.enablingNotifications}
          >
            {notifications.enablingNotifications ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.enableButtonText}>Activar</Text>
            )}
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutButton} onPress={actions.handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.text} />
        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>

      {/* Danger zone */}
      <View style={styles.dangerSection}>
        <Text style={styles.dangerSectionTitle}>Eliminar cuenta</Text>
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
              <ActivityIndicator color={colors.error} size="small" />
            ) : (
              <Text style={styles.deleteAccountButtonText}>Eliminar mi cuenta</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>


      <ApartmentChangeModal
        requestModal={apartment.requestModal}
        setRequestModal={apartment.setRequestModal}
        onClose={apartment.closeRequestModal}
        onSubmit={apartment.handleSubmitRequest}
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
  enableButton: {
    backgroundColor: colors.primary, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12, minWidth: 92, alignItems: 'center',
  },
  enableButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  notificationsCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    margin: 16, marginBottom: 0,
    borderWidth: 1, borderColor: colors.border,
  },
  notificationsStatus: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  notificationsStatusText: { flex: 1 },
  notificationsTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  notificationsSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  testButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    minWidth: 92, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: colors.primary,
  },
  testButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  logoutButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14,
    margin: 16, marginBottom: 0, borderWidth: 1, borderColor: colors.border,
  },
  logoutButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  dangerSection: { marginHorizontal: 16, marginTop: 28, marginBottom: 32 },
  dangerSectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  dangerCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  dangerText: { fontSize: 13, color: colors.textSecondary, marginBottom: 12, lineHeight: 19 },
  deleteAccountButton: {
    borderRadius: 8, paddingVertical: 10, borderWidth: 1, borderColor: colors.error,
    paddingHorizontal: 16, alignItems: 'center', minHeight: 42, justifyContent: 'center',
  },
  deleteAccountButtonDisabled: { opacity: 0.5 },
  deleteAccountButtonText: { color: colors.error, fontSize: 14, fontWeight: '600' },
});
