import { useState } from 'react';

export function useAddPlayerModal(onAddPlayer) {
  const [visible, setVisible] = useState(false);
  const [modalState, setModalState] = useState({
    type: 'community',
    search: '',
    externalName: '',
    externalLevel: null,
  });

  const open = () => {
    setModalState({ type: 'community', search: '', externalName: '', externalLevel: null });
    setVisible(true);
  };

  const close = () => setVisible(false);

  const addCommunityUser = (user) => {
    const player = {
      tipo: 'urbanizacion',
      usuario: user,
      nombre: user.nombre,
      vivienda: user.vivienda,
      nivel: user.nivelJuego,
    };
    if (onAddPlayer(player)) {
      close();
      return true;
    }
    return false;
  };

  const addExternalPlayer = () => {
    const { externalName, externalLevel } = modalState;
    if (!externalName.trim()) {
      return { success: false, error: 'Introduce el nombre del jugador' };
    }
    const player = { tipo: 'externo', nombre: externalName.trim(), vivienda: null, nivel: externalLevel };
    if (onAddPlayer(player)) {
      close();
      return { success: true };
    }
    return { success: false, error: 'La partida ya está completa' };
  };

  return { visible, modalState, setModalState, open, close, addCommunityUser, addExternalPlayer };
}
