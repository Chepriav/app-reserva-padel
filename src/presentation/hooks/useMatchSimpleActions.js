import { showToast } from '../components/Toast';

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
          if (!result.success) showAlert('No se pudo cancelar la partida', result.error);
        },
      },
    ]);
  };

  const handleRequestToJoin = (match) => {
    if (user?.isDemo) {
      showAlert('Cuenta demo', 'Esta es una cuenta demo de solo lectura. No puedes hacer reservas ni modificaciones.');
      return;
    }
    showAlert(
      'Solicitar unirse',
      `¿Quieres enviar una solicitud para unirte a la partida de ${match.creatorName}?`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Enviar solicitud',
          onPress: async () => {
            const result = await actions.requestToJoin(match.id, user);
            if (result.success) {
              showToast('Solicitud enviada. El organizador debe aceptarla.');
            } else {
              showAlert('No se pudo enviar la solicitud', result.error);
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
          if (!result.success) showAlert('No se pudo cancelar la solicitud', result.error);
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
          if (!result.success) showAlert('No se pudo desapuntar', result.error);
        },
      },
    ]);
  };

  const handleAcceptRequest = async (playerId, match) => {
    const result = await actions.acceptRequest(playerId, match.id);
    if (result.success) {
      showToast('Jugador añadido a la partida');
    } else {
      showAlert('No se pudo aceptar', result.error);
    }
  };

  const handleRejectRequest = async (playerId, match) => {
    const result = await actions.rejectRequest(playerId, match.id);
    if (!result?.success) {
      showAlert('No se pudo rechazar', result?.error || 'No se pudo rechazar la solicitud');
    }
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
              showToast('Inscripciones cerradas');
            } else {
              showAlert('No se pudo cerrar la clase', result.error);
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
