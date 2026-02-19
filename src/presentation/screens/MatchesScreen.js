import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationsContext';
import { colors } from '../../constants/colors';
import { CustomAlert } from '../components/CustomAlert';
import { MatchCard, CreateMatchModal, AddPlayerModal } from '../components/partidas';
import {
  useMatches,
  useMatchesActions,
  useCreateMatchModal,
  useAddPlayerModal,
  useCommunityUsers,
} from '../hooks';
import { useMatchHandlers } from '../hooks/useMatchHandlers';

export default function MatchesScreen() {
  const { user } = useAuth();
  const { reservations } = useReservations();
  const [activeTab, setActiveTab] = useState('disponibles');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', buttons: [] });
  const [isMatchEditing, setMatchEditing] = useState(null);

  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => {} }]) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const { matches, loading, refreshing, loadMatches, onRefresh } = useMatches(user?.id, activeTab);
  const actions = useMatchesActions(user?.id, loadMatches);
  const createModal = useCreateMatchModal(user?.id);
  const addPlayerModal = useAddPlayerModal((newPlayer) => {
    const isExistingPlayer = createModal.players.some(
      (p) => p.tipo === 'urbanizacion' && p.usuario?.id === newPlayer.usuario?.id
    );
    if (isExistingPlayer) {
      showAlert('Ya añadido', 'Este jugador ya está en la partida');
      return false;
    }
    return createModal.addPlayer(newPlayer);
  });
  const communityUsers = useCommunityUsers(user?.id);

  const handlers = useMatchHandlers({
    user,
    loadMatches,
    actions,
    createModal,
    addPlayerModal,
    communityUsers,
    reservations,
    isMatchEditing,
    setMatchEditing,
    showAlert,
  });

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches])
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'disponibles' && styles.activeTab]}
          onPress={() => setActiveTab('disponibles')}
        >
          <Text style={[styles.tabText, activeTab === 'disponibles' && styles.tabTextActivo]}>
            Buscan jugadores
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mis_partidas' && styles.activeTab]}
          onPress={() => setActiveTab('mis_partidas')}
        >
          <Text style={[styles.tabText, activeTab === 'mis_partidas' && styles.tabTextActivo]}>
            Mis partidas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Match list */}
      <ScrollView
        style={styles.lista}
        contentContainerStyle={styles.listaContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'disponibles' ? 'No hay partidas buscando jugadores' : 'No tienes partidas activas'}
            </Text>
          </View>
        ) : (
          matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              currentUserId={user.id}
              onCancel={handlers.handleCancel}
              onEdit={handlers.handleEdit}
              onRequestJoin={handlers.handleRequestToJoin}
              onCancelRequest={handlers.handleCancelRequest}
              onLeave={handlers.handleLeave}
              onAcceptRequest={handlers.handleAcceptRequest}
              onRejectRequest={handlers.handleRejectRequest}
              onCloseClass={handlers.handleCloseClass}
            />
          ))
        )}
      </ScrollView>

      {/* Create button */}
      <TouchableOpacity style={styles.botonCrear} onPress={handlers.handleOpenCreate}>
        <Text style={styles.botonCrearText}>+ Buscar jugadores</Text>
      </TouchableOpacity>

      <CreateMatchModal
        visible={createModal.visible}
        modalState={createModal.modalState}
        setModalState={createModal.setModalState}
        players={handlers.getModalPlayers()}
        user={user}
        futureReservations={handlers.getFutureReservations()}
        onOpenPlayerModal={handlers.handleOpenAddPlayer}
        onRemovePlayer={handlers.handleRemovePlayer}
        onCreate={handlers.handlePublish}
        onClose={handlers.handleCloseModal}
        editMode={!!isMatchEditing}
      />

      <AddPlayerModal
        visible={addPlayerModal.visible}
        modalState={addPlayerModal.modalState}
        setModalState={addPlayerModal.setModalState}
        users={communityUsers.users}
        loadingUsers={communityUsers.loading}
        currentPlayers={handlers.getModalPlayers()}
        onAddCommunity={handlers.handleAddCommunityUser}
        onAddExternal={handlers.handleAddExternal}
        onClose={addPlayerModal.close}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 15, color: colors.textSecondary },
  tabTextActivo: { color: colors.primary, fontWeight: '600' },
  lista: { flex: 1 },
  listaContent: { padding: 16, paddingBottom: 100 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center' },
  botonCrear: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 20 : 30,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  botonCrearText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
