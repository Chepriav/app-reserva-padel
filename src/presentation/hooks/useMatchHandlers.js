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
      const reservationDate = new Date(r.fecha + 'T' + r.horaInicio);
      const isCurrentReservation = currentMatch && r.id === currentMatch.reservaId;
      const hasMatch = createModal.reservationsWithMatch.includes(r.id);
      return r.estado === 'confirmada' && reservationDate > now && (!hasMatch || isCurrentReservation);
    });
  };

  const getModalPlayers = () => {
    if (isMatchEditing) {
      return (isMatchEditing.jugadores || [])
        .filter((p) => p.estado === 'confirmado')
        .map((p) => ({
          tipo: p.esExterno ? 'externo' : 'urbanizacion',
          usuario: p.esExterno ? null : {
            id: p.usuarioId, nombre: p.usuarioNombre,
            vivienda: p.usuarioVivienda, nivelJuego: p.nivelJuego,
          },
          nombre: p.usuarioNombre, vivienda: p.usuarioVivienda, nivel: p.nivelJuego,
        }));
    }
    return createModal.players;
  };

  const handleOpenCreate = async () => {
    if (user?.esDemo) {
      showAlert('Demo Account', 'This is a view-only demo account. You cannot make reservations or modifications.');
      return;
    }
    setMatchEditing(null);
    await createModal.open();
  };

  const handleEdit = async (match) => {
    setMatchEditing(match);
    await createModal.open();

    const futureReservations = getFutureReservations(match);
    const currentReservation = match.reservaId
      ? futureReservations.find((r) => r.id === match.reservaId)
      : null;

    const confirmedPlayers = (match.jugadores || [])
      .filter((p) => p.estado === 'confirmado')
      .map((p) => ({
        tipo: p.esExterno ? 'externo' : 'urbanizacion',
        usuario: p.esExterno ? null : {
          id: p.usuarioId, nombre: p.usuarioNombre,
          vivienda: p.usuarioVivienda, nivelJuego: p.nivelJuego,
        },
        nombre: p.usuarioNombre, vivienda: p.usuarioVivienda, nivel: p.nivelJuego,
      }));

    createModal.setModalState({
      type: match.reservaId ? 'con_reserva' : (match.tipo || 'abierta'),
      selectedReservation: currentReservation,
      message: match.mensaje || '',
      preferredLevel: match.nivelPreferido || null,
      saving: false,
      isClass: match.esClase || false,
      levels: match.niveles || [],
      minParticipants: match.minParticipantes || 2,
      maxParticipants: match.maxParticipantes || (match.esClase ? 8 : 4),
      pricePerStudent: match.precioAlumno ? String(match.precioAlumno) : '',
      pricePerGroup: match.precioGrupo ? String(match.precioGrupo) : '',
    });

    confirmedPlayers.forEach((p) => createModal.addPlayer(p));
  };

  const handlePublish = async () => {
    const {
      type, selectedReservation, message, preferredLevel,
      isClass, levels, minParticipants, maxParticipants, pricePerStudent, pricePerGroup,
    } = createModal.modalState;

    if (type === 'con_reserva' && !selectedReservation) {
      showAlert('Error', `Selecciona una reserva para vincular la ${isClass ? 'clase' : 'partida'}`);
      return;
    }

    createModal.setSaving(true);
    const toPrice = (val) => (val ? parseFloat(val.replace(',', '.')) : null);

    if (isMatchEditing) {
      const updates = {
        mensaje: message.trim() || null,
        nivelPreferido: isClass ? null : preferredLevel,
        niveles: isClass ? levels : null,
        minParticipantes: isClass ? minParticipants : 4,
        maxParticipantes: isClass ? maxParticipants : 4,
        precioAlumno: isClass ? toPrice(pricePerStudent) : null,
        precioGrupo: isClass ? toPrice(pricePerGroup) : null,
      };
      if (type === 'abierta') {
        Object.assign(updates, { reservaId: null, fecha: null, horaInicio: null, horaFin: null, pistaNombre: null });
      } else if (selectedReservation) {
        Object.assign(updates, {
          reservaId: selectedReservation.id, fecha: selectedReservation.fecha,
          horaInicio: selectedReservation.horaInicio, horaFin: selectedReservation.horaFin,
          pistaNombre: selectedReservation.pistaNombre,
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
      creadorId: user.id, creadorNombre: user.nombre, creadorVivienda: user.vivienda,
      tipo: type, mensaje: message.trim() || null,
      nivelPreferido: isClass ? null : preferredLevel,
      jugadoresIniciales: createModal.players,
      esClase: isClass, niveles: isClass ? levels : null,
      minParticipantes: isClass ? minParticipants : 4,
      maxParticipantes: isClass ? maxParticipants : 4,
      precioAlumno: isClass ? toPrice(pricePerStudent) : null,
      precioGrupo: isClass ? toPrice(pricePerGroup) : null,
    };
    if (type === 'con_reserva' && selectedReservation) {
      Object.assign(matchData, {
        reservaId: selectedReservation.id, fecha: selectedReservation.fecha,
        horaInicio: selectedReservation.horaInicio, horaFin: selectedReservation.horaFin,
        pistaNombre: selectedReservation.pistaNombre,
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
        usuarioId: selectedUser.id, usuarioNombre: selectedUser.nombre,
        usuarioVivienda: selectedUser.vivienda, nivelJuego: selectedUser.nivelJuego, esExterno: false,
      });
      if (result.success) {
        addPlayerModal.close();
        setMatchEditing((prev) => ({
          ...prev,
          jugadores: [...(prev.jugadores || []), {
            id: result.jugadorId || Date.now().toString(),
            usuarioId: selectedUser.id, usuarioNombre: selectedUser.nombre,
            usuarioVivienda: selectedUser.vivienda, nivelJuego: selectedUser.nivelJuego,
            esExterno: false, estado: 'confirmado',
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
        usuarioId: null, usuarioNombre: trimmedName,
        usuarioVivienda: null, nivelJuego: externalLevel, esExterno: true,
      });
      if (result.success) {
        addPlayerModal.close();
        setMatchEditing((prev) => ({
          ...prev,
          jugadores: [...(prev.jugadores || []), {
            id: result.jugadorId || Date.now().toString(),
            usuarioId: null, usuarioNombre: trimmedName,
            usuarioVivienda: null, nivelJuego: externalLevel,
            esExterno: true, estado: 'confirmado',
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
      const confirmedPlayers = (isMatchEditing.jugadores || []).filter((p) => p.estado === 'confirmado');
      const playerToRemove = confirmedPlayers[index];
      if (playerToRemove) {
        const result = await actions.removePlayer(playerToRemove.id, isMatchEditing.id);
        if (result.success) {
          setMatchEditing((prev) => ({
            ...prev,
            jugadores: (prev.jugadores || []).filter((p) => p.id !== playerToRemove.id),
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
