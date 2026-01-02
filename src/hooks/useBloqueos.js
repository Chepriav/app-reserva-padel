import { useState, useCallback, useEffect } from 'react';
import { reservasService } from '../services/reservasService.supabase';

/**
 * Hook to manage schedule blockouts (admin only)
 * Handles multi-selection and blockout operations
 */
export function useBloqueos({ pistaSeleccionada, userId, mostrarAlerta, onRecargarHorarios }) {
  const [modoBloqueo, setModoBloqueo] = useState(false);
  const [bloquesABloquear, setBloquesABloquear] = useState([]);
  const [bloquesADesbloquear, setBloquesADesbloquear] = useState([]);
  const [modalBloqueo, setModalBloqueo] = useState({ visible: false, motivo: '' });
  const [procesando, setProcesando] = useState(false);

  // Clear selection when blockout mode is deactivated
  useEffect(() => {
    if (!modoBloqueo) {
      setBloquesABloquear([]);
      setBloquesADesbloquear([]);
    }
  }, [modoBloqueo]);

  // Toggle selection for blocking
  const toggleBloqueABloquear = useCallback((horario, fecha) => {
    const yaSeleccionado = bloquesABloquear.some(b =>
      b.fecha === fecha && b.horaInicio === horario.horaInicio
    );

    if (yaSeleccionado) {
      setBloquesABloquear(prev => prev.filter(b =>
        !(b.fecha === fecha && b.horaInicio === horario.horaInicio)
      ));
    } else {
      setBloquesABloquear(prev => [...prev, {
        fecha,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
      }]);
    }
  }, [bloquesABloquear]);

  // Toggle selection for unblocking
  const toggleBloqueADesbloquear = useCallback((horario, fecha) => {
    const yaSeleccionado = bloquesADesbloquear.some(b =>
      b.fecha === fecha && b.horaInicio === horario.horaInicio
    );

    if (yaSeleccionado) {
      setBloquesADesbloquear(prev => prev.filter(b =>
        !(b.fecha === fecha && b.horaInicio === horario.horaInicio)
      ));
    } else {
      setBloquesADesbloquear(prev => [...prev, {
        fecha,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
        bloqueoId: horario.bloqueoId,
      }]);
    }
  }, [bloquesADesbloquear]);

  // Clear all selection
  const limpiarSeleccionBloqueo = useCallback(() => {
    setBloquesABloquear([]);
    setBloquesADesbloquear([]);
  }, []);

  // Open blockout modal
  const abrirModalBloqueo = useCallback(() => {
    setModalBloqueo({ visible: true, motivo: '' });
  }, []);

  // Close blockout modal
  const cerrarModalBloqueo = useCallback(() => {
    setModalBloqueo({ visible: false, motivo: '' });
  }, []);

  // Update modal reason
  const setMotivoBloqueo = useCallback((motivo) => {
    setModalBloqueo(prev => ({ ...prev, motivo }));
  }, []);

  // Create multiple blockouts
  const crearBloqueos = useCallback(async () => {
    if (bloquesABloquear.length === 0 || !pistaSeleccionada) return;

    setProcesando(true);
    const motivo = modalBloqueo.motivo || 'Bloqueado por administración';
    let exitosos = 0;
    const errores = [];

    for (const bloque of bloquesABloquear) {
      const result = await reservasService.crearBloqueo(
        pistaSeleccionada.id,
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

    setProcesando(false);
    cerrarModalBloqueo();
    setBloquesABloquear([]);

    if (exitosos > 0) {
      const mensaje = exitosos === bloquesABloquear.length
        ? `Se han bloqueado ${exitosos} horario${exitosos > 1 ? 's' : ''}.`
        : `Se bloquearon ${exitosos} de ${bloquesABloquear.length} horarios.${errores.length > 0 ? '\n\nErrores:\n' + errores.join('\n') : ''}`;
      mostrarAlerta('Horarios bloqueados', mensaje);
    } else {
      mostrarAlerta('Error', 'No se pudo bloquear ningún horario.\n\n' + errores.join('\n'));
    }

    onRecargarHorarios();
  }, [bloquesABloquear, pistaSeleccionada, userId, modalBloqueo.motivo, mostrarAlerta, cerrarModalBloqueo, onRecargarHorarios]);

  // Delete multiple blockouts
  const eliminarBloqueos = useCallback(async () => {
    if (bloquesADesbloquear.length === 0) return;

    setProcesando(true);
    let exitosos = 0;
    const errores = [];

    for (const bloque of bloquesADesbloquear) {
      const result = await reservasService.eliminarBloqueo(bloque.bloqueoId);
      if (result.success) {
        exitosos++;
      } else {
        errores.push(`${bloque.horaInicio}: ${result.error}`);
      }
    }

    setProcesando(false);
    setBloquesADesbloquear([]);

    if (exitosos > 0) {
      const mensaje = exitosos === bloquesADesbloquear.length
        ? `Se han desbloqueado ${exitosos} horario${exitosos > 1 ? 's' : ''}.`
        : `Se desbloquearon ${exitosos} de ${bloquesADesbloquear.length} horarios.${errores.length > 0 ? '\n\nErrores:\n' + errores.join('\n') : ''}`;
      mostrarAlerta('Horarios desbloqueados', mensaje);
    } else {
      mostrarAlerta('Error', 'No se pudo desbloquear ningún horario.\n\n' + errores.join('\n'));
    }

    onRecargarHorarios();
  }, [bloquesADesbloquear, mostrarAlerta, onRecargarHorarios]);

  // Show blockout reason
  const handleTapBloqueado = useCallback((horario) => {
    mostrarAlerta(
      '🔒 Horario Bloqueado',
      horario.motivoBloqueo || 'Bloqueado por administración'
    );
  }, [mostrarAlerta]);

  return {
    modoBloqueo,
    setModoBloqueo,
    bloquesABloquear,
    bloquesADesbloquear,
    modalBloqueo,
    procesando,
    toggleBloqueABloquear,
    toggleBloqueADesbloquear,
    limpiarSeleccionBloqueo,
    abrirModalBloqueo,
    cerrarModalBloqueo,
    setMotivoBloqueo,
    crearBloqueos,
    eliminarBloqueos,
    handleTapBloqueado,
  };
}
