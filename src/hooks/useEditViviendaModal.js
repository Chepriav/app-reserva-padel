import { useState, useCallback } from 'react';
import { parseVivienda } from '../constants/config';

/**
 * Hook para gestionar el modal de editar vivienda
 */
export function useEditViviendaModal() {
  const [modalState, setModalState] = useState({
    visible: false,
    usuario: null,
    escalera: '',
    piso: '',
    puerta: '',
    saving: false,
  });

  const abrir = useCallback((usuario) => {
    const parsed = parseVivienda(usuario.vivienda);
    setModalState({
      visible: true,
      usuario,
      escalera: parsed.escalera,
      piso: parsed.piso,
      puerta: parsed.puerta,
      saving: false,
    });
  }, []);

  const cerrar = useCallback(() => {
    setModalState({
      visible: false,
      usuario: null,
      escalera: '',
      piso: '',
      puerta: '',
      saving: false,
    });
  }, []);

  const setEscalera = useCallback((value) => {
    setModalState((prev) => ({ ...prev, escalera: value }));
  }, []);

  const setPiso = useCallback((value) => {
    setModalState((prev) => ({ ...prev, piso: value }));
  }, []);

  const setPuerta = useCallback((value) => {
    setModalState((prev) => ({ ...prev, puerta: value }));
  }, []);

  const setSaving = useCallback((saving) => {
    setModalState((prev) => ({ ...prev, saving }));
  }, []);

  return {
    modalState,
    abrir,
    cerrar,
    setEscalera,
    setPiso,
    setPuerta,
    setSaving,
  };
}
