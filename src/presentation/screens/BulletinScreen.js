import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { styles } from './BulletinScreenStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useNotifications, useAnnouncements, useAnnouncementsAdmin, refreshBulletinBadge } from '../hooks';
import { useAlert } from '../hooks/useAlert';
import {
  NotificationCard,
  AnnouncementCard,
  AnnouncementModal,
  EmptyState,
} from '../components/tablon';
import { CreateAnnouncementModal } from '../components/admin';
import { CustomAlert } from '../components/CustomAlert';

export default function TablonScreen() {
  const { user } = useAuth();
  const { alertConfig, showAlert, showConfirmation, closeAlert } = useAlert();
  const [tabActivo, setTabActivo] = useState('anuncios');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [usuarios, setUsuarios] = useState([]);

  const isAdmin = user?.esAdmin === true;

  const {
    notifications,
    loading: loadingNotif,
    refreshing: refreshingNotif,
    onRefresh: onRefreshNotif,
    deleteNotification,
    markAsRead,
    markAllAsRead,
    countUnread: countNotifUnread,
    loadNotifications,
  } = useNotifications(user?.id, refreshBulletinBadge);

  // Use admin hook if user is admin, regular hook otherwise
  const adminAnnouncementsHook = useAnnouncementsAdmin(user?.id, refreshBulletinBadge);
  const userAnnouncementsHook = useAnnouncements(user?.id, refreshBulletinBadge);

  const announcementsHook = isAdmin ? adminAnnouncementsHook : userAnnouncementsHook;

  const {
    announcements,
    loading: loadingAnnouncements,
    refreshing: refreshingAnnouncements,
    selectedAnnouncement,
    onRefresh: onRefreshAnnouncements,
    viewAnnouncement,
    closeAnnouncement,
    countUnread: countAnnouncementsUnread,
    loadAnnouncements,
    // Admin-specific functions
    createAnnouncement,
    deleteAnnouncement,
    loadUsers,
  } = announcementsHook;

  useFocusEffect(
    useCallback(() => {
      if (tabActivo === 'notificaciones') {
        loadNotifications();
      } else {
        loadAnnouncements();
      }
    }, [tabActivo, loadNotifications, loadAnnouncements])
  );

  // Load users when admin opens create modal
  const handleOpenCreateModal = async () => {
    if (isAdmin && loadUsers) {
      const usersResult = await loadUsers();
      if (usersResult.success) {
        setUsuarios(usersResult.data || []);
      }
    }
    setCreateModalVisible(true);
  };

  const handleCreateAnnouncement = async (announcementData) => {
    if (!isAdmin || !createAnnouncement) return;

    const result = await createAnnouncement(announcementData);
    if (result.success) {
      setCreateModalVisible(false);
      showAlert('Éxito', 'Mensaje creado correctamente');
      loadAnnouncements();
    } else {
      showAlert('Error', result.error || 'No se pudo crear el mensaje');
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!isAdmin || !deleteAnnouncement) return;

    showConfirmation({
      title: 'Confirmar',
      message: '¿Estás seguro de eliminar este mensaje?',
      destructive: true,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        const result = await deleteAnnouncement(announcementId);
        if (result.success) {
          showAlert('Éxito', 'Mensaje eliminado correctamente');
        } else {
          showAlert('Error', result.error || 'No se pudo eliminar el mensaje');
        }
      },
    });
  };

  const handleDeleteNotification = async (id) => {
    const result = await deleteNotification(id);
    if (!result.success) {
      showAlert('Error', 'No se pudo eliminar la notificación');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (countNotifUnread() === 0) return;

    showConfirmation({
      title: 'Marcar todas como leídas',
      message: '¿Marcar todas las notificaciones como leídas?',
      confirmText: 'Marcar',
      onConfirm: async () => {
        const result = await markAllAsRead();
        if (!result.success) {
          showAlert('Error', 'No se pudieron marcar las notificaciones');
        }
      },
    });
  };

  const unreadNotifCount = countNotifUnread();
  const unreadAnnouncementsCount = countAnnouncementsUnread();

  const renderNotificacion = ({ item }) => (
    <NotificationCard
      notificacion={item}
      onMarcarLeida={markAsRead}
      onEliminar={handleDeleteNotification}
    />
  );

  const renderAnuncio = ({ item }) => (
    <AnnouncementCard
      anuncio={item}
      onPress={viewAnnouncement}
      isAdmin={isAdmin}
      onDelete={handleDeleteAnnouncement}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tablón</Text>
          {tabActivo === 'notificaciones' && unreadNotifCount > 0 && (
            <TouchableOpacity
              style={styles.marcarTodasButton}
              onPress={handleMarkAllAsRead}
            >
              <Text style={styles.marcarTodasText}>Marcar leídas</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tabActivo === 'anuncios' && styles.tabActivo]}
            onPress={() => setTabActivo('anuncios')}
          >
            <Text style={[styles.tabText, tabActivo === 'anuncios' && styles.tabTextActivo]}>
              Anuncios
            </Text>
            {unreadAnnouncementsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadAnnouncementsCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, tabActivo === 'notificaciones' && styles.tabActivo]}
            onPress={() => setTabActivo('notificaciones')}
          >
            <Text style={[styles.tabText, tabActivo === 'notificaciones' && styles.tabTextActivo]}>
              Notificaciones
            </Text>
            {unreadNotifCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotifCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {tabActivo === 'notificaciones' ? (
          <FlatList
            data={notifications}
            renderItem={renderNotificacion}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshingNotif}
                onRefresh={onRefreshNotif}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              !loadingNotif && <EmptyState type="notificaciones" />
            }
          />
        ) : (
          <FlatList
            data={announcements}
            renderItem={renderAnuncio}
            keyExtractor={item => item.id}
            contentContainerStyle={[
              styles.listContent,
              isAdmin && { paddingBottom: 100 }
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshingAnnouncements}
                onRefresh={onRefreshAnnouncements}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              !loadingAnnouncements && <EmptyState type="anuncios" />
            }
          />
        )}

        <AnnouncementModal
          anuncio={selectedAnnouncement}
          visible={!!selectedAnnouncement}
          onClose={closeAnnouncement}
          isAdmin={isAdmin}
          onDelete={handleDeleteAnnouncement}
        />

        {isAdmin && tabActivo === 'anuncios' && (
          <>
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={handleOpenCreateModal}
            >
              <Text style={styles.floatingButtonText}>+ Nuevo mensaje</Text>
            </TouchableOpacity>

            <CreateAnnouncementModal
              visible={createModalVisible}
              onClose={() => setCreateModalVisible(false)}
              onCrear={handleCreateAnnouncement}
              usuarios={usuarios}
            />
          </>
        )}

        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={closeAlert}
        />
      </View>
    </SafeAreaView>
  );
}

