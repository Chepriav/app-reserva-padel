import { useMatchSimpleActions } from './useMatchSimpleActions';

/**
 * Aggregates all MatchesScreen action handlers.
 * Simple confirmation handlers are in useMatchSimpleActions.
 */
export function useMatchHandlers({
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
}) {
  const simpleActions = useMatchSimpleActions({ user, actions, showAlert });

  const getFutureReservations = (currentMatch = isMatchEditing) => {
    if (!reservations) return [];
    const now = new Date();
    return reservations.filter((r) => {
      const reservationDate = new Date(r.date + 'T' + r.startTime);
      const isCurrentReservation = currentMatch && r.id === currentMatch.reservationId;
      const hasMatch = createModal.reservationsWithMatch.includes(r.id);
      return r.status === 'confirmed' && reservationDate > now && (!hasMatch || isCurrentReservation);
    });
  };

  const getModalPlayers = () => {
    if (isMatchEditing) {
      return (isMatchEditing.players || [])
        .filter((p) => p.status === 'confirmed')
        .map((p) => ({
          type: p.isExternal ? 'externo' : 'urbanizacion',
          user: p.isExternal ? null : {
            id: p.userId, name: p.userName,
            apartment: p.userApartment, skillLevel: p.skillLevel,
          },
          name: p.userName, apartment: p.userApartment, level: p.skillLevel,
        }));
    }
    return createModal.players;
  };

  const handleOpenCreate = async () => {
    if (user?.isDemo) {
      showAlert('Cuenta demo', 'Esta es una cuenta demo de solo lectura. No puedes hacer reservas ni modificaciones.');
      return;
    }
    setMatchEditing(null);
    await createModal.open();
  };

  const handleEdit = async (match) => {
    setMatchEditing(match);
    await createModal.open();

    const futureReservations = getFutureReservations(match);
    const currentReservation = match.reservationId
      ? futureReservations.find((r) => r.id === match.reservationId)
      : null;

    const confirmedPlayers = (match.players || [])
      .filter((p) => p.status === 'confirmed')
      .map((p) => ({
        type: p.isExternal ? 'externo' : 'urbanizacion',
        user: p.isExternal ? null : {
          id: p.userId, name: p.userName,
          apartment: p.userApartment, skillLevel: p.skillLevel,
        },
        name: p.userName, apartment: p.userApartment, level: p.skillLevel,
      }));

    createModal.setModalState({
      type: match.reservationId ? 'with_reservation' : (match.type || 'open'),
      selectedReservation: currentReservation,
      message: match.message || '',
      preferredLevel: match.preferredLevel || null,
      saving: false,
      isClass: match.isLesson || false,
      levels: match.levels || [],
      minParticipants: match.minParticipants || 2,
      maxParticipants: match.maxParticipants || (match.isLesson ? 8 : 4),
      pricePerStudent: match.studentPrice ? String(match.studentPrice) : '',
      pricePerGroup: match.groupPrice ? String(match.groupPrice) : '',
    });

    confirmedPlayers.forEach((p) => createModal.addPlayer(p));
  };

  const handlePublish = async () => {
    const {
      type, selectedReservation, message, preferredLevel,
      isClass, levels, minParticipants, maxParticipants, pricePerStudent, pricePerGroup,
    } = createModal.modalState;

    const isWithReservation = type === 'con_reserva' || type === 'with_reservation';
    if (isWithReservation && !selectedReservation) {
      showAlert('Error', `Selecciona una reserva para vincular la ${isClass ? 'clase' : 'partida'}`);
      return;
    }

    createModal.setSaving(true);
    const toPrice = (val) => (val ? parseFloat(val.replace(',', '.')) : null);

    if (isMatchEditing) {
      const updates = {
        message: message.trim() || null,
        preferredLevel: isClass ? null : preferredLevel,
        levels: isClass ? levels : null,
        minParticipants: isClass ? minParticipants : 4,
        maxParticipants: isClass ? maxParticipants : 4,
        studentPrice: isClass ? toPrice(pricePerStudent) : null,
        groupPrice: isClass ? toPrice(pricePerGroup) : null,
      };
      if (type === 'abierta' || type === 'open') {
        Object.assign(updates, { reservationId: null, date: null, startTime: null, endTime: null, courtName: null });
      } else if (selectedReservation) {
        Object.assign(updates, {
          reservationId: selectedReservation.id, date: selectedReservation.date,
          startTime: selectedReservation.startTime, endTime: selectedReservation.endTime,
          courtName: selectedReservation.courtName,
        });
      }
      const result = await actions.editMatch(isMatchEditing.id, updates);
      createModal.setSaving(false);
      if (result.success) {
        createModal.close(); setMatchEditing(null);
        showAlert(isClass ? 'Clase actualizada' : 'Partida actualizada', 'Los cambios se han guardado correctamente');
      } else {
        showAlert('Error', result.error);
      }
      return;
    }

    // Create mode
    const matchData = {
      creatorId: user.id, creatorName: user.name, creatorApartment: user.apartment,
      type: type, message: message.trim() || null,
      preferredLevel: isClass ? null : preferredLevel,
      initialPlayers: createModal.players,
      isLesson: isClass, levels: isClass ? levels : null,
      minParticipants: isClass ? minParticipants : 4,
      maxParticipants: isClass ? maxParticipants : 4,
      studentPrice: isClass ? toPrice(pricePerStudent) : null,
      groupPrice: isClass ? toPrice(pricePerGroup) : null,
    };
    if (isWithReservation && selectedReservation) {
      Object.assign(matchData, {
        reservationId: selectedReservation.id, date: selectedReservation.date,
        startTime: selectedReservation.startTime, endTime: selectedReservation.endTime,
        courtName: selectedReservation.courtName,
      });
    }
    const result = await actions.createMatch(matchData);
    createModal.setSaving(false);
    if (result.success) {
      createModal.close();
      const total = 1 + createModal.players.length;
      const isComplete = total >= (isClass ? maxParticipants : 4);
      if (isClass) {
        showAlert(isComplete ? 'Clase completa' : 'Clase creada', isComplete ? `Clase creada con ${total} alumnos. ¡Lista!` : 'Tu clase ha sido publicada.');
      } else {
        showAlert(isComplete ? 'Partida completa' : 'Partida creada', isComplete ? 'Partida creada con 4 jugadores. ¡A jugar!' : 'Tu solicitud de partida ha sido publicada.');
      }
    } else {
      showAlert('Error', result.error);
    }
  };

  const handleCloseModal = () => {
    createModal.close();
    setMatchEditing(null);
  };

  const handleOpenAddPlayer = () => {
    communityUsers.load();
    addPlayerModal.open();
  };

  const handleAddCommunityUser = async (selectedUser) => {
    if (isMatchEditing) {
      const result = await actions.addPlayerToMatch(isMatchEditing.id, {
        userId: selectedUser.id, userName: selectedUser.name,
        userApartment: selectedUser.apartment, skillLevel: selectedUser.skillLevel, isExternal: false,
      });
      if (result.success) {
        addPlayerModal.close();
        setMatchEditing((prev) => ({
          ...prev,
          players: [...(prev.players || []), {
            id: result.playerId || Date.now().toString(),
            userId: selectedUser.id, userName: selectedUser.name,
            userApartment: selectedUser.apartment, skillLevel: selectedUser.skillLevel,
            isExternal: false, status: 'confirmed',
          }],
        }));
        loadMatches();
      } else {
        showAlert('Error', result.error);
      }
    } else if (!addPlayerModal.addCommunityUser(selectedUser)) {
      showAlert('Partida completa', 'Ya tienes 3 jugadores añadidos (4 con el creador)');
    }
  };

  const handleAddExternal = async () => {
    const { externalName, externalLevel } = addPlayerModal.modalState;
    if (!externalName?.trim()) {
      showAlert('Error', 'Introduce el nombre del jugador');
      return;
    }
    if (isMatchEditing) {
      const trimmedName = externalName.trim();
      const result = await actions.addPlayerToMatch(isMatchEditing.id, {
        userId: null, userName: trimmedName,
        userApartment: null, skillLevel: externalLevel, isExterno: true,
      });
      if (result.success) {
        addPlayerModal.close();
        setMatchEditing((prev) => ({
          ...prev,
          players: [...(prev.players || []), {
            id: result.playerId || Date.now().toString(),
            userId: null, userName: trimmedName,
            userApartment: null, skillLevel: externalLevel,
            isExternal: true, status: 'confirmed',
          }],
        }));
        loadMatches();
      } else {
        showAlert('Error', result.error);
      }
    } else {
      const result = addPlayerModal.addExternalPlayer();
      if (!result.success) showAlert('Error', result.error);
    }
  };

  const handleRemovePlayer = async (index) => {
    if (isMatchEditing) {
      const confirmedPlayers = (isMatchEditing.players || []).filter((p) => p.status === 'confirmed');
      const playerToRemove = confirmedPlayers[index];
      if (playerToRemove) {
        const result = await actions.removePlayer(playerToRemove.id, isMatchEditing.id);
        if (result.success) {
          setMatchEditing((prev) => ({
            ...prev,
            players: (prev.players || []).filter((p) => p.id !== playerToRemove.id),
          }));
          loadMatches();
        } else {
          showAlert('Error', result.error);
        }
      }
    } else {
      createModal.removePlayer(index);
    }
  };

  return {
    ...simpleActions,
    getFutureReservations,
    getModalPlayers,
    handleOpenCreate,
    handleEdit,
    handlePublish,
    handleCloseModal,
    handleOpenAddPlayer,
    handleAddCommunityUser,
    handleAddExternal,
    handleRemovePlayer,
  };
}
