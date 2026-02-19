import { useState } from 'react';
import { partidasService } from '../../services/matchesService';

const DEFAULT_STATE = {
  type: 'abierta',
  selectedReservation: null,
  message: '',
  preferredLevel: null,
  saving: false,
  isClass: false,
  levels: [],
  minParticipants: 2,
  maxParticipants: 8,
  pricePerStudent: '',
  pricePerGroup: '',
};

export function useCreateMatchModal(userId) {
  const [visible, setVisible] = useState(false);
  const [modalState, setModalState] = useState(DEFAULT_STATE);
  const [players, setPlayers] = useState([]);
  const [reservationsWithMatch, setReservationsWithMatch] = useState([]);

  const open = async () => {
    setPlayers([]);
    setModalState(DEFAULT_STATE);
    const result = await partidasService.obtenerReservasConPartida(userId);
    if (result.success) setReservationsWithMatch(result.data);
    setVisible(true);
  };

  const close = () => setVisible(false);

  const addPlayer = (player) => {
    const maxPlayers = modalState.isClass ? modalState.maxParticipants - 1 : 3;
    if (players.length >= maxPlayers) return false;
    setPlayers((prev) => [...prev, player]);
    return true;
  };

  const removePlayer = (index) => setPlayers((prev) => prev.filter((_, i) => i !== index));

  const setSaving = (saving) => setModalState((prev) => ({ ...prev, saving }));

  return {
    visible, modalState, setModalState,
    players, reservationsWithMatch,
    open, close, addPlayer, removePlayer, setSaving,
  };
}
