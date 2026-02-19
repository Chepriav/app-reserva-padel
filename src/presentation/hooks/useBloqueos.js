import { useState, useCallback, useEffect } from 'react';
import { reservasService } from '../../services/reservationsService.supabase';

/**
 * Hook to manage schedule blockouts (admin only)
 * Handles multi-selection and blockout operations
 */
export function useBlockouts({ selectedCourt, userId, mostrarAlerta, onReloadSchedules }) {
  const [blockoutMode, setBlockoutMode] = useState(false);
  const [slotsToBlock, setSlotsToBlock] = useState([]);
  const [slotsToUnblock, setSlotsToUnblock] = useState([]);
  const [blockoutModal, setBlockoutModal] = useState({ visible: false, motivo: '' });
  const [processing, setProcessing] = useState(false);

  // Clear selection when blockout mode is deactivated
  useEffect(() => {
    if (!blockoutMode) {
      setSlotsToBlock([]);
      setSlotsToUnblock([]);
    }
  }, [blockoutMode]);

  // Toggle selection for blocking
  const toggleSlotToBlock = useCallback((horario, fecha) => {
    const yaSeleccionado = slotsToBlock.some(b =>
      b.fecha === fecha && b.horaInicio === horario.horaInicio
    );

    if (yaSeleccionado) {
      setSlotsToBlock(prev => prev.filter(b =>
        !(b.fecha === fecha && b.horaInicio === horario.horaInicio)
      ));
    } else {
      setSlotsToBlock(prev => [...prev, {
        fecha,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
      }]);
    }
  }, [slotsToBlock]);

  // Toggle selection for unblocking
  const toggleSlotToUnblock = useCallback((horario, fecha) => {
    const yaSeleccionado = slotsToUnblock.some(b =>
      b.fecha === fecha && b.horaInicio === horario.horaInicio
    );

    if (yaSeleccionado) {
      setSlotsToUnblock(prev => prev.filter(b =>
        !(b.fecha === fecha && b.horaInicio === horario.horaInicio)
      ));
    } else {
      setSlotsToUnblock(prev => [...prev, {
        fecha,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
        bloqueoId: horario.bloqueoId,
      }]);
    }
  }, [slotsToUnblock]);

  // Clear all selection
  const clearBlockoutSelection = useCallback(() => {
    setSlotsToBlock([]);
    setSlotsToUnblock([]);
  }, []);

  // Open blockout modal
  const openBlockoutModal = useCallback(() => {
    setBlockoutModal({ visible: true, motivo: '' });
  }, []);

  // Close blockout modal
  const closeBlockoutModal = useCallback(() => {
    setBlockoutModal({ visible: false, motivo: '' });
  }, []);

  // Update modal reason
  const setBlockoutReason = useCallback((motivo) => {
    setBlockoutModal(prev => ({ ...prev, motivo }));
  }, []);

  // Create multiple blockouts
  const createBlockouts = useCallback(async () => {
    if (slotsToBlock.length === 0 || !selectedCourt) return;

    setProcessing(true);
    const motivo = blockoutModal.motivo || 'Bloqueado por administración';
    let exitosos = 0;
    const errores = [];

    for (const bloque of slotsToBlock) {
      const result = await reservasService.crearBloqueo(
        selectedCourt.id,
        bloque.fecha,
        bloque.horaInicio,
        bloque.horaFin,
        motivo,
        userId
      );
      if (result.success) {
        exitosos++;
      } else {
        errores.push(`${bloque.horaInicio}: ${result.error}`);
      }
    }

    setProcessing(false);
    closeBlockoutModal();
    setSlotsToBlock([]);

    if (exitosos > 0) {
      const mensaje = exitosos === slotsToBlock.length
        ? `Se han bloqueado ${exitosos} horario${exitosos > 1 ? 's' : ''}.`
        : `Se bloquearon ${exitosos} de ${slotsToBlock.length} horarios.${errores.length > 0 ? '\n\nErrores:\n' + errores.join('\n') : ''}`;
      mostrarAlerta('Horarios bloqueados', mensaje);
    } else {
      mostrarAlerta('Error', 'No se pudo bloquear ningún horario.\n\n' + errores.join('\n'));
    }

    onReloadSchedules();
  }, [slotsToBlock, selectedCourt, userId, blockoutModal.motivo, mostrarAlerta, closeBlockoutModal, onReloadSchedules]);

  // Delete multiple blockouts
  const deleteBlockouts = useCallback(async () => {
    if (slotsToUnblock.length === 0) return;

    setProcessing(true);
    let exitosos = 0;
    const errores = [];

    for (const bloque of slotsToUnblock) {
      const result = await reservasService.eliminarBloqueo(bloque.bloqueoId);
      if (result.success) {
        exitosos++;
      } else {
        errores.push(`${bloque.horaInicio}: ${result.error}`);
      }
    }

    setProcessing(false);
    setSlotsToUnblock([]);

    if (exitosos > 0) {
      const mensaje = exitosos === slotsToUnblock.length
        ? `Se han desbloqueado ${exitosos} horario${exitosos > 1 ? 's' : ''}.`
        : `Se desbloquearon ${exitosos} de ${slotsToUnblock.length} horarios.${errores.length > 0 ? '\n\nErrores:\n' + errores.join('\n') : ''}`;
      mostrarAlerta('Horarios desbloqueados', mensaje);
    } else {
      mostrarAlerta('Error', 'No se pudo desbloquear ningún horario.\n\n' + errores.join('\n'));
    }

    onReloadSchedules();
  }, [slotsToUnblock, mostrarAlerta, onReloadSchedules]);

  // Show blockout reason
  const handleTapBlocked = useCallback((horario) => {
    mostrarAlerta(
      '🔒 Horario Bloqueado',
      horario.motivoBloqueo || 'Bloqueado por administración'
    );
  }, [mostrarAlerta]);

  return {
    blockoutMode,
    setBlockoutMode,
    slotsToBlock,
    slotsToUnblock,
    blockoutModal,
    processing,
    toggleSlotToBlock,
    toggleSlotToUnblock,
    clearBlockoutSelection,
    openBlockoutModal,
    closeBlockoutModal,
    setBlockoutReason,
    createBlockouts,
    deleteBlockouts,
    handleTapBlocked,
  };
}
