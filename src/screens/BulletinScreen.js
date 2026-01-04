import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useNotifications, useAnnouncements, refreshBulletinBadge } from '../hooks';
import {
  NotificationCard,
  AnnouncementCard,
  AnnouncementModal,
  EmptyState,
} from '../components/tablon';

export default function TablonScreen() {
  const { user } = useAuth();
  const [tabActivo, setTabActivo] = useState('anuncios');

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
  } = useAnnouncements(user?.id, refreshBulletinBadge);

  useFocusEffect(
    useCallback(() => {
      if (tabActivo === 'notificaciones') {
        loadNotifications();
      } else {
        loadAnnouncements();
      }
    }, [tabActivo, loadNotifications, loadAnnouncements])
  );

  const handleDeleteNotification = async (id) => {
    const result = await deleteNotification(id);
    if (!result.success) {
      Alert.alert('Error', 'No se pudo eliminar la notificación');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (countNotifUnread() === 0) return;

    Alert.alert(
      'Marcar todas como leídas',
      '¿Marcar todas las notificaciones como leídas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar',
          onPress: async () => {
            const result = await markAllAsRead();
            if (!result.success) {
              Alert.alert('Error', 'No se pudieron marcar las notificaciones');
            }
          },
        },
      ]
    );
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
    <AnnouncementCard anuncio={item} onPress={viewAnnouncement} />
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
            contentContainerStyle={styles.listContent}
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
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  marcarTodasButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
  },
  marcarTodasText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    gap: 6,
  },
  tabActivo: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  tabTextActivo: {
    color: colors.primary,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.badgeRojo,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: 10,
  },
});
