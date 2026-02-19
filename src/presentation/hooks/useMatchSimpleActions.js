/**
 * Simple match action handlers that show a confirmation dialog then call an action.
 */
export function useMatchSimpleActions({ user, actions, showAlert }) {
  const handleCancel = (match) => {
    showAlert('Cancelar partida', '¿Seguro que quieres cancelar esta partida?', [
      { text: 'No', style: 'cancel', onPress: () => {} },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          const result = await actions.cancelMatch(match.id);
          if (!result.success) showAlert('Error', result.error);
        },
      },
    ]);
  };

  const handleRequestToJoin = (match) => {
    if (user?.esDemo) {
      showAlert('Demo Account', 'This is a view-only demo account. You cannot make reservations or modifications.');
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
          if (!result.success) showAlert('Error', result.error);
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
          if (!result.success) showAlert('Error', result.error);
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

  return {
    handleCancel,
    handleRequestToJoin,
    handleCancelRequest,
    handleLeave,
    handleAcceptRequest,
    handleRejectRequest,
    handleCloseClass,
  };
}
