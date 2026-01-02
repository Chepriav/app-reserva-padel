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
import { useNotificaciones, useAnuncios } from '../hooks';
import {
  NotificacionCard,
  AnuncioCard,
  AnuncioModal,
  EmptyState,
} from '../components/tablon';

export default function TablonScreen() {
  const { user } = useAuth();
  const [tabActivo, setTabActivo] = useState('anuncios');

  const {
    notificaciones,
    loading: loadingNotif,
    refreshing: refreshingNotif,
    onRefresh: onRefreshNotif,
    eliminar: eliminarNotif,
    marcarLeida: marcarNotifLeida,
    marcarTodasLeidas,
    contarNoLeidas: contarNotifNoLeidas,
    cargarNotificaciones,
  } = useNotificaciones(user?.id);

  const {
    anuncios,
    loading: loadingAnuncios,
    refreshing: refreshingAnuncios,
    anuncioSeleccionado,
    onRefresh: onRefreshAnuncios,
    verAnuncio,
    cerrarAnuncio,
    contarNoLeidos: contarAnunciosNoLeidos,
    cargarAnuncios,
  } = useAnuncios(user?.id);

  useFocusEffect(
    useCallback(() => {
      if (tabActivo === 'notificaciones') {
        cargarNotificaciones();
      } else {
        cargarAnuncios();
      }
    }, [tabActivo, cargarNotificaciones, cargarAnuncios])
  );

  const handleEliminarNotif = async (id) => {
    const result = await eliminarNotif(id);
    if (!result.success) {
      Alert.alert('Error', 'No se pudo eliminar la notificación');
    }
  };

  const handleMarcarTodasLeidas = async () => {
    if (contarNotifNoLeidas() === 0) return;

    Alert.alert(
      'Marcar todas como leídas',
      '¿Marcar todas las notificaciones como leídas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar',
          onPress: async () => {
            const result = await marcarTodasLeidas();
            if (!result.success) {
              Alert.alert('Error', 'No se pudieron marcar las notificaciones');
            }
          },
        },
      ]
    );
  };

  const notifNoLeidas = contarNotifNoLeidas();
  const anunciosNoLeidos = contarAnunciosNoLeidos();

  const renderNotificacion = ({ item }) => (
    <NotificacionCard
      notificacion={item}
      onMarcarLeida={marcarNotifLeida}
      onEliminar={handleEliminarNotif}
    />
  );

  const renderAnuncio = ({ item }) => (
    <AnuncioCard anuncio={item} onPress={verAnuncio} />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tablón</Text>
          {tabActivo === 'notificaciones' && notifNoLeidas > 0 && (
            <TouchableOpacity
              style={styles.marcarTodasButton}
              onPress={handleMarcarTodasLeidas}
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
            {anunciosNoLeidos > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{anunciosNoLeidos}</Text>
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
            {notifNoLeidas > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifNoLeidas}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {tabActivo === 'notificaciones' ? (
          <FlatList
            data={notificaciones}
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
            data={anuncios}
            renderItem={renderAnuncio}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshingAnuncios}
                onRefresh={onRefreshAnuncios}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              !loadingAnuncios && <EmptyState type="anuncios" />
            }
          />
        )}

        <AnuncioModal
          anuncio={anuncioSeleccionado}
          visible={!!anuncioSeleccionado}
          onClose={cerrarAnuncio}
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
