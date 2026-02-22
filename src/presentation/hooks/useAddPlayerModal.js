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
      type: 'urbanizacion',
      user: user,
      name: user.name,
      apartment: user.apartment,
      level: user.skillLevel,
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
    const player = { type: 'externo', name: externalName.trim(), apartment: null, level: externalLevel };
    if (onAddPlayer(player)) {
      close();
      return { success: true };
    }
    return { success: false, error: 'La partida ya está completa' };
  };

  return { visible, modalState, setModalState, open, close, addCommunityUser, addExternalPlayer };
}
