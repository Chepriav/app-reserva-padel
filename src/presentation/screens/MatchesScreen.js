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
import { colors } from '../constants/colors';
import { CustomAlert } from '../components/CustomAlert';
import {
  MatchCard,
  CreateMatchModal,
  AddPlayerModal,
} from '../components/partidas';
import {
  useMatches,
  useMatchesActions,
  useCreateMatchModal,
  useAddPlayerModal,
  useCommunityUsers,
} from '../hooks';

export default function MatchesScreen() {
  const { user } = useAuth();
  const { reservations } = useReservations();
  const [activeTab, setActiveTab] = useState('disponibles');
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  // Editing state (null = create mode, match object = edit mode)
  const [isMatchEditing, setMatchEditing] = useState(null);

  // Hooks for matches
  const { matches, loading, refreshing, loadMatches, onRefresh } = useMatches(
    user?.id,
    activeTab
  );

  const actions = useMatchesActions(user?.id, loadMatches);

  // Create/edit match modal
  const createModal = useCreateMatchModal(user?.id);

  // Add player modal
  const addPlayerModal = useAddPlayerModal((newPlayer) => {
    const isExistingPlayer = createModal.players.some(
      player => player.tipo === 'urbanizacion' && player.usuario?.id === newPlayer.usuario?.id
    );
    if (isExistingPlayer) {
      showAlert('Ya añadido', 'Este jugador ya está en la partida');
      return false;
    }
    return createModal.addPlayer(newPlayer);
  });

  // Community users
  const communityUsers = useCommunityUsers(user?.id);

  // Reload matches when screen receives focus
  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches])
  );

  // Helper to show alerts
  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => {} }]) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  // Get future reservations (excluding those with matches, except current one if editing)
  const getFutureReservations = (currentMatch = isMatchEditing) => {
    if (!reservations) return [];
    const now = new Date();
    return reservations.filter((r) => {
      const reservationDate = new Date(r.fecha + 'T' + r.horaInicio);
      // In edit mode, allow the current reservation of the match
      const isCurrentReservation = currentMatch && r.id === currentMatch.reservaId;
      const hasMatch = createModal.reservationsWithMatch.includes(r.id);
      return r.estado === 'confirmada' && reservationDate > now && (!hasMatch || isCurrentReservation);
    });
  };

  // Action handlers
  const handleCancel = (match) => {
    showAlert('Cancelar partida', '¿Seguro que quieres cancelar esta partida?', [
      { text: 'No', style: 'cancel', onPress: () => {} },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          const result = await actions.cancelMatch(match.id);
          if (!result.success) {
            showAlert('Error', result.error);
          }
        },
      },
    ]);
  };

  const handleRequestToJoin = (match) => {
    // Block demo users
    if (user?.esDemo) {
      showAlert(
        'Demo Account',
        'This is a view-only demo account. You cannot make reservations or modifications.'
      );
      return;
    }
    showAlert(
      'Solicitar unirse',
      `¿Quieres enviar una solicitud para unirte a la partida de ${match.creadorNombre}?`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Enviar solicitud',
          onPress: async () => {
            const result = await actions.requestToJoin(match.id, user);
            if (result.success) {
              showAlert('Solicitud enviada', 'Tu solicitud ha sido enviada. El creador debe aceptarla.');
            } else {
              showAlert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = (match) => {
    showAlert('Cancelar solicitud', '¿Seguro que quieres cancelar tu solicitud?', [
      { text: 'No', style: 'cancel', onPress: () => {} },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          const result = await actions.cancelRequest(match.id);
          if (!result.success) {
            showAlert('Error', result.error);
          }
        },
      },
    ]);
  };

  const handleLeave = (match) => {
    showAlert('Desapuntarse', '¿Seguro que quieres desapuntarte de esta partida?', [
      { text: 'Cancelar', style: 'cancel', onPress: () => {} },
      {
        text: 'Desapuntarme',
        style: 'destructive',
        onPress: async () => {
          const result = await actions.leaveMatch(match.id);
          if (!result.success) {
            showAlert('Error', result.error);
          }
        },
      },
    ]);
  };

  const handleAcceptRequest = async (playerId, match) => {
    const result = await actions.acceptRequest(playerId, match.id);
    if (result.success) {
      showAlert('Solicitud aceptada', 'El jugador ha sido añadido a la partida');
    } else {
      showAlert('Error', result.error);
    }
  };

  const handleRejectRequest = async (playerId, match) => {
    await actions.rejectRequest(playerId, match.id);
  };

  const handleCloseClass = (match) => {
    showAlert(
      'Cerrar inscripciones',
      '¿Seguro que quieres cerrar las inscripciones de esta clase? Ya no podrán unirse más alumnos.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Cerrar clase',
          onPress: async () => {
            const result = await actions.closeClass(match.id);
            if (result.success) {
              showAlert('Clase cerrada', 'Las inscripciones han sido cerradas');
            } else {
              showAlert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  // Open modal in create mode
  const handleOpenCreate = async () => {
    // Block demo users
    if (user?.esDemo) {
      showAlert(
        'Demo Account',
        'This is a view-only demo account. You cannot make reservations or modifications.'
      );
      return;
    }
    setMatchEditing(null);
    await createModal.open();
  };

  // Open modal in edit mode
  const handleEdit = async (match) => {
    setMatchEditing(match);
    await createModal.open();

    // Load existing match data (pass match directly because state hasn't updated yet)
    const futureReservations = getFutureReservations(match);
    const currentReservation = match.reservaId
      ? futureReservations.find(r => r.id === match.reservaId)
      : null;

    // Convert confirmed players to modal format
    const confirmedPlayers = (match.jugadores || [])
      .filter(p => p.estado === 'confirmado')
      .map(p => ({
        tipo: p.esExterno ? 'externo' : 'urbanizacion',
        usuario: p.esExterno ? null : {
          id: p.usuarioId,
          nombre: p.usuarioNombre,
          vivienda: p.usuarioVivienda,
          nivelJuego: p.nivelJuego,
        },
        nombre: p.usuarioNombre,
        vivienda: p.usuarioVivienda,
        nivel: p.nivelJuego,
      }));

    // Infer type: if it has reservaId, it's 'con_reserva'
    const inferredType = match.reservaId ? 'con_reserva' : (match.tipo || 'abierta');

    // Set initial modal state
    createModal.setModalState({
      type: inferredType,
      selectedReservation: currentReservation,
      message: match.mensaje || '',
      preferredLevel: match.nivelPreferido || null,
      saving: false,
      // Class fields
      isClass: match.esClase || false,
      levels: match.niveles || [],
      minParticipants: match.minParticipantes || 2,
      maxParticipants: match.maxParticipantes || (match.esClase ? 8 : 4),
      pricePerStudent: match.precioAlumno ? String(match.precioAlumno) : '',
      pricePerGroup: match.precioGrupo ? String(match.precioGrupo) : '',
    });

    // Load existing players
    confirmedPlayers.forEach(p => createModal.addPlayer(p));
  };

  // Create or save match/class
  const handlePublish = async () => {
    const {
      type,
      selectedReservation,
      message,
      preferredLevel,
      // Class fields
      isClass,
      levels,
      minParticipants,
      maxParticipants,
      pricePerStudent,
      pricePerGroup,
    } = createModal.modalState;

    if (type === 'con_reserva' && !selectedReservation) {
      showAlert('Error', `Selecciona una reserva para vincular la ${isClass ? 'clase' : 'partida'}`);
      return;
    }

    createModal.setSaving(true);

    if (isMatchEditing) {
      // EDIT MODE
      const updates = {
        mensaje: message.trim() || null,
        nivelPreferido: isClass ? null : preferredLevel,
        // Class fields
        niveles: isClass ? levels : null,
        minParticipantes: isClass ? minParticipants : 4,
        maxParticipantes: isClass ? maxParticipants : 4,
        precioAlumno: isClass && pricePerStudent ? parseFloat(pricePerStudent.replace(',', '.')) : null,
        precioGrupo: isClass && pricePerGroup ? parseFloat(pricePerGroup.replace(',', '.')) : null,
      };

      if (type === 'abierta') {
        updates.reservaId = null;
        updates.fecha = null;
        updates.horaInicio = null;
        updates.horaFin = null;
        updates.pistaNombre = null;
      } else if (selectedReservation) {
        updates.reservaId = selectedReservation.id;
        updates.fecha = selectedReservation.fecha;
        updates.horaInicio = selectedReservation.horaInicio;
        updates.horaFin = selectedReservation.horaFin;
        updates.pistaNombre = selectedReservation.pistaNombre;
      }

      const result = await actions.editMatch(isMatchEditing.id, updates);
      createModal.setSaving(false);

      if (result.success) {
        createModal.close();
        setMatchEditing(null);
        showAlert(isClass ? 'Clase actualizada' : 'Partida actualizada', 'Los cambios se han guardado correctamente');
      } else {
        showAlert('Error', result.error);
      }
    } else {
      // CREATE MODE
      const matchData = {
        creadorId: user.id,
        creadorNombre: user.nombre,
        creadorVivienda: user.vivienda,
        tipo: type,
        mensaje: message.trim() || null,
        nivelPreferido: isClass ? null : preferredLevel,
        jugadoresIniciales: createModal.players,
        // Class fields
        esClase: isClass,
        niveles: isClass ? levels : null,
        minParticipantes: isClass ? minParticipants : 4,
        maxParticipantes: isClass ? maxParticipants : 4,
        precioAlumno: isClass && pricePerStudent ? parseFloat(pricePerStudent.replace(',', '.')) : null,
        precioGrupo: isClass && pricePerGroup ? parseFloat(pricePerGroup.replace(',', '.')) : null,
      };

      if (type === 'con_reserva' && selectedReservation) {
        matchData.reservaId = selectedReservation.id;
        matchData.fecha = selectedReservation.fecha;
        matchData.horaInicio = selectedReservation.horaInicio;
        matchData.horaFin = selectedReservation.horaFin;
        matchData.pistaNombre = selectedReservation.pistaNombre;
      }

      const result = await actions.createMatch(matchData);
      createModal.setSaving(false);

      if (result.success) {
        createModal.close();
        const total = 1 + createModal.players.length;
        const maxPart = isClass ? maxParticipants : 4;
        const isComplete = total >= maxPart;

        if (isClass) {
          const successMessage = isComplete
            ? `Clase creada con ${total} alumnos. ¡Lista!`
            : 'Tu clase ha sido publicada.';
          showAlert(isComplete ? 'Clase completa' : 'Clase creada', successMessage);
        } else {
          const successMessage = isComplete
            ? 'Partida creada con 4 jugadores. ¡A jugar!'
            : 'Tu solicitud de partida ha sido publicada.';
          showAlert(isComplete ? 'Partida completa' : 'Partida creada', successMessage);
        }
      } else {
        showAlert('Error', result.error);
      }
    }
  };

  // Close modal
  const handleCloseModal = () => {
    createModal.close();
    setMatchEditing(null);
  };

  // Open add player modal
  const handleOpenAddPlayer = () => {
    communityUsers.load();
    addPlayerModal.open();
  };

  // Close modal añadir jugador
  const handleCloseAddPlayer = () => {
    addPlayerModal.close();
  };

  // Add community player
  const handleAddCommunityUser = async (selectedUser) => {
    if (isMatchEditing) {
      // In edit mode, add directly to match in DB
      const matchId = isMatchEditing.id;
      const result = await actions.addPlayerToMatch(matchId, {
        usuarioId: selectedUser.id,
        usuarioNombre: selectedUser.nombre,
        usuarioVivienda: selectedUser.vivienda,
        nivelJuego: selectedUser.nivelJuego,
        esExterno: false,
      });
      if (result.success) {
        addPlayerModal.close();
        // Update editing match directly with new player
        const newPlayer = {
          id: result.jugadorId || Date.now().toString(), // ID temporal si no viene
          usuarioId: selectedUser.id,
          usuarioNombre: selectedUser.nombre,
          usuarioVivienda: selectedUser.vivienda,
          nivelJuego: selectedUser.nivelJuego,
          esExterno: false,
          estado: 'confirmado',
        };
        setMatchEditing(prev => ({
          ...prev,
          jugadores: [...(prev.jugadores || []), newPlayer],
        }));
        // Also reload in background to sync
        loadMatches();
      } else {
        showAlert('Error', result.error);
      }
    } else {
      // In create mode, use hook logic
      if (!addPlayerModal.addCommunityUser(selectedUser)) {
        showAlert('Partida completa', 'Ya tienes 3 jugadores añadidos (4 con el creador)');
      }
    }
  };

  // Add external player
  const handleAddExternal = async () => {
    const { externalName, externalLevel } = addPlayerModal.modalState;

    if (!externalName?.trim()) {
      showAlert('Error', 'Introduce el nombre del jugador');
      return;
    }

    if (isMatchEditing) {
      // In edit mode, add directly to match in DB
      const matchId = isMatchEditing.id;
      const trimmedName = externalName.trim();
      const result = await actions.addPlayerToMatch(matchId, {
        usuarioId: null,
        usuarioNombre: trimmedName,
        usuarioVivienda: null,
        nivelJuego: externalLevel,
        esExterno: true,
      });
      if (result.success) {
        addPlayerModal.close();
        // Update editing match directly with new player
        const newPlayer = {
          id: result.jugadorId || Date.now().toString(),
          usuarioId: null,
          usuarioNombre: trimmedName,
          usuarioVivienda: null,
          nivelJuego: externalLevel,
          esExterno: true,
          estado: 'confirmado',
        };
        setMatchEditing(prev => ({
          ...prev,
          jugadores: [...(prev.jugadores || []), newPlayer],
        }));
        // Also reload in background to sync
        loadMatches();
      } else {
        showAlert('Error', result.error);
      }
    } else {
      // In create mode, use hook logic
      const result = addPlayerModal.addExternalPlayer();
      if (!result.success) {
        showAlert('Error', result.error);
      }
    }
  };

  // Remove player from match (only in edit mode)
  const handleRemovePlayer = async (index) => {
    if (isMatchEditing) {
      // Get player to remove from current match
      const confirmedPlayers = (isMatchEditing.jugadores || [])
        .filter(p => p.estado === 'confirmado');
      const playerToRemove = confirmedPlayers[index];

      if (playerToRemove) {
        const playerId = playerToRemove.id;
        const result = await actions.removePlayer(playerId, isMatchEditing.id);
        if (result.success) {
          // Update editing match directly removing player
          setMatchEditing(prev => ({
            ...prev,
            jugadores: (prev.jugadores || []).filter(p => p.id !== playerId),
          }));
          // Also reload in background to sync
          loadMatches();
        } else {
          showAlert('Error', result.error);
        }
      }
    } else {
      // In create mode, use hook logic
      createModal.removePlayer(index);
    }
  };

  // Get players for modal (in edit mode, from match; in create, from hook)
  const getModalPlayers = () => {
    if (isMatchEditing) {
      return (isMatchEditing.jugadores || [])
        .filter(p => p.estado === 'confirmado')
        .map(p => ({
          tipo: p.esExterno ? 'externo' : 'urbanizacion',
          usuario: p.esExterno ? null : {
            id: p.usuarioId,
            nombre: p.usuarioNombre,
            vivienda: p.usuarioVivienda,
            nivelJuego: p.nivelJuego,
          },
          nombre: p.usuarioNombre,
          vivienda: p.usuarioVivienda,
          nivel: p.nivelJuego,
        }));
    }
    return createModal.players;
  };

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

      {/* Lista de partidas */}
      <ScrollView
        style={styles.lista}
        contentContainerStyle={styles.listaContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'disponibles'
                ? 'No hay partidas buscando jugadores'
                : 'No tienes partidas activas'}
            </Text>
          </View>
        ) : (
          matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              currentUserId={user.id}
              onCancel={handleCancel}
              onEdit={handleEdit}
              onRequestJoin={handleRequestToJoin}
              onCancelRequest={handleCancelRequest}
              onLeave={handleLeave}
              onAcceptRequest={handleAcceptRequest}
              onRejectRequest={handleRejectRequest}
              onCloseClass={handleCloseClass}
            />
          ))
        )}
      </ScrollView>

      {/* Botón crear partida */}
      <TouchableOpacity style={styles.botonCrear} onPress={handleOpenCreate}>
        <Text style={styles.botonCrearText}>+ Buscar jugadores</Text>
      </TouchableOpacity>

      {/* Modal crear/editar partida */}
      <CreateMatchModal
        visible={createModal.visible}
        modalState={createModal.modalState}
        setModalState={createModal.setModalState}
        players={getModalPlayers()}
        user={user}
        futureReservations={getFutureReservations()}
        onOpenPlayerModal={handleOpenAddPlayer}
        onRemovePlayer={handleRemovePlayer}
        onCreate={handlePublish}
        onClose={handleCloseModal}
        editMode={!!isMatchEditing}
      />

      {/* Modal añadir jugador */}
      <AddPlayerModal
        visible={addPlayerModal.visible}
        modalState={addPlayerModal.modalState}
        setModalState={addPlayerModal.setModalState}
        users={communityUsers.users}
        loadingUsers={communityUsers.loading}
        currentPlayers={getModalPlayers()}
        onAddCommunity={handleAddCommunityUser}
        onAddExternal={handleAddExternal}
        onClose={handleCloseAddPlayer}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  tabTextActivo: {
    color: colors.primary,
    fontWeight: '600',
  },
  lista: {
    flex: 1,
  },
  listaContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
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
  botonCrearText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
