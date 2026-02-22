import { useState, useCallback, useEffect } from 'react';
import { reservationsService } from '../../services/reservationsService.supabase';

/**
 * Hook to manage schedule blockouts (admin only)
 * Handles multi-selection and blockout operations
 */
export function useBlockouts({ selectedCourt, userId, showAlerta, onReloadSchedules }) {
  const [blockoutMode, setBlockoutMode] = useState(false);
  const [slotsToBlock, setSlotsToBlock] = useState([]);
  const [slotsToUnblock, setSlotsToUnblock] = useState([]);
  const [blockoutModal, setBlockoutModal] = useState({ visible: false, reason: '' });
  const [processing, setProcessing] = useState(false);

  // Clear selection when blockout mode is deactivated
  useEffect(() => {
    if (!blockoutMode) {
      setSlotsToBlock([]);
      setSlotsToUnblock([]);
    }
  }, [blockoutMode]);

  // Toggle selection for blocking
  const toggleSlotToBlock = useCallback((timeSlot, date) => {
    const yaSelected = slotsToBlock.some(b =>
      b.date === date && b.startTime === timeSlot.startTime
    );

    if (yaSelected) {
      setSlotsToBlock(prev => prev.filter(b =>
        !(b.date === date && b.startTime === timeSlot.startTime)
      ));
    } else {
      setSlotsToBlock(prev => [...prev, {
        date,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
      }]);
    }
  }, [slotsToBlock]);

  // Toggle selection for unblocking
  const toggleSlotToUnblock = useCallback((timeSlot, date) => {
    const yaSelected = slotsToUnblock.some(b =>
      b.date === date && b.startTime === timeSlot.startTime
    );

    if (yaSelected) {
      setSlotsToUnblock(prev => prev.filter(b =>
        !(b.date === date && b.startTime === timeSlot.startTime)
      ));
    } else {
      setSlotsToUnblock(prev => [...prev, {
        date,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        blockoutId: timeSlot.blockoutId,
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
    setBlockoutModal({ visible: true, reason: '' });
  }, []);

  // Close blockout modal
  const closeBlockoutModal = useCallback(() => {
    setBlockoutModal({ visible: false, reason: '' });
  }, []);

  // Update modal reason
  const setBlockoutReason = useCallback((reason) => {
    setBlockoutModal(prev => ({ ...prev, reason }));
  }, []);

  // Create multiple blockouts
  const createBlockouts = useCallback(async () => {
    if (slotsToBlock.length === 0 || !selectedCourt) return;

    setProcessing(true);
    const reason = blockoutModal.reason || 'Bloqueado por administración';
    let exitosos = 0;
    const errores = [];

    for (const slot of slotsToBlock) {
      const result = await reservationsService.createBlockout(
        selectedCourt.id,
        slot.date,
        slot.startTime,
        slot.endTime,
        reason,
        userId
      );
      if (result.success) {
        exitosos++;
      } else {
        errores.push(`${slot.startTime}: ${result.error}`);
      }
    }

    setProcessing(false);
    closeBlockoutModal();
    setSlotsToBlock([]);

    if (exitosos > 0) {
      const message = exitosos === slotsToBlock.length
        ? `Se han bloqueado ${exitosos} horario${exitosos > 1 ? 's' : ''}.`
        : `Se bloquearon ${exitosos} de ${slotsToBlock.length} horarios.${errores.length > 0 ? '\n\nErrores:\n' + errores.join('\n') : ''}`;
      showAlerta('Horarios bloqueados', message);
    } else {
      showAlerta('Error', 'No se pudo bloquear ningún horario.\n\n' + errores.join('\n'));
    }

    onReloadSchedules();
  }, [slotsToBlock, selectedCourt, userId, blockoutModal.reason, showAlerta, closeBlockoutModal, onReloadSchedules]);

  // Delete multiple blockouts
  const deleteBlockouts = useCallback(async () => {
    if (slotsToUnblock.length === 0) return;

    setProcessing(true);
    let exitosos = 0;
    const errores = [];

    for (const slot of slotsToUnblock) {
      const result = await reservationsService.deleteBlockout(slot.blockoutId);
      if (result.success) {
        exitosos++;
      } else {
        errores.push(`${slot.startTime}: ${result.error}`);
      }
    }

    setProcessing(false);
    setSlotsToUnblock([]);

    if (exitosos > 0) {
      const message = exitosos === slotsToUnblock.length
        ? `Se han desbloqueado ${exitosos} horario${exitosos > 1 ? 's' : ''}.`
        : `Se desbloquearon ${exitosos} de ${slotsToUnblock.length} horarios.${errores.length > 0 ? '\n\nErrores:\n' + errores.join('\n') : ''}`;
      showAlerta('Horarios desbloqueados', message);
    } else {
      showAlerta('Error', 'No se pudo desbloquear ningún horario.\n\n' + errores.join('\n'));
    }

    onReloadSchedules();
  }, [slotsToUnblock, showAlerta, onReloadSchedules]);

  // Show blockout reason
  const handleTapBlocked = useCallback((timeSlot) => {
    showAlerta(
      '🔒 Horario Bloqueado',
      timeSlot.blockoutReason || 'Bloqueado por administración'
    );
  }, [showAlerta]);

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
