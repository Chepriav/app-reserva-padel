import { useState, useCallback } from 'react';
import { parseVivienda } from '../constants/config';

/**
 * Hook to manage the edit apartment modal
 */
export function useEditApartmentModal() {
  const [modalState, setModalState] = useState({
    visible: false,
    usuario: null,
    staircase: '',
    floor: '',
    door: '',
    saving: false,
  });

  const open = useCallback((usuario) => {
    const parsed = parseVivienda(usuario.vivienda);
    setModalState({
      visible: true,
      usuario,
      staircase: parsed.escalera,
      floor: parsed.piso,
      door: parsed.puerta,
      saving: false,
    });
  }, []);

  const close = useCallback(() => {
    setModalState({
      visible: false,
      usuario: null,
      staircase: '',
      floor: '',
      door: '',
      saving: false,
    });
  }, []);

  const setStaircase = useCallback((value) => {
    setModalState((prev) => ({ ...prev, staircase: value }));
  }, []);

  const setFloor = useCallback((value) => {
    setModalState((prev) => ({ ...prev, floor: value }));
  }, []);

  const setDoor = useCallback((value) => {
    setModalState((prev) => ({ ...prev, door: value }));
  }, []);

  const setSaving = useCallback((saving) => {
    setModalState((prev) => ({ ...prev, saving }));
  }, []);

  return {
    modalState,
    open,
    close,
    setStaircase,
    setFloor,
    setDoor,
    setSaving,
  };
}
