import { useCallback } from 'react';
import { authService } from '../services/authService.supabase';
import { notificationService } from '../services/notificationService';
import { formatearVivienda, combinarVivienda } from '../constants/config';
import { validarViviendaComponentes } from '../utils/validators';

/**
 * Hook for admin actions (approve, reject, toggle admin, etc.)
 */
export function useAdminActions({
  currentUserId,
  mostrarAlerta,
  mostrarConfirmacion,
  removeUsuarioPendiente,
  removeSolicitudCambio,
  updateUsuario,
  removeUsuario,
}) {
  // Approve pending user
  const handleAprobar = useCallback((usuario) => {
    mostrarConfirmacion({
      title: 'Aprobar Usuario',
      message: `¿Aprobar el registro de ${usuario.nombre}?\n\nVivienda: ${usuario.vivienda}\nEmail: ${usuario.email}`,
      onConfirm: async () => {
        const result = await authService.aprobarUsuario(usuario.id);
        if (result.success) {
          removeUsuarioPendiente(usuario.id);
        } else {
          mostrarAlerta('Error', result.error);
        }
      },
    });
  }, [mostrarConfirmacion, mostrarAlerta, removeUsuarioPendiente]);

  // Reject pending user
  const handleRechazar = useCallback((usuario) => {
    mostrarConfirmacion({
      title: 'Rechazar Usuario',
      message: `¿Rechazar el registro de ${usuario.nombre}?\n\nVivienda: ${usuario.vivienda}\nEmail: ${usuario.email}`,
      destructive: true,
      confirmText: 'Rechazar',
      onConfirm: async () => {
        const result = await authService.rechazarUsuario(usuario.id);
        if (result.success) {
          removeUsuarioPendiente(usuario.id);
        } else {
          mostrarAlerta('Error', result.error);
        }
      },
    });
  }, [mostrarConfirmacion, mostrarAlerta, removeUsuarioPendiente]);

  // Toggle admin role
  const handleToggleAdmin = useCallback((usuario) => {
    const nuevoRol = !usuario.esAdmin;
    const accion = nuevoRol ? 'dar permisos de administrador a' : 'quitar permisos de administrador a';

    // Don't allow removing admin from oneself
    if (usuario.id === currentUserId && !nuevoRol) {
      mostrarAlerta('No permitido', 'No puedes quitarte los permisos de administrador a ti mismo');
      return;
    }

    // Don't allow removing admin from a manager
    if (usuario.esManager && !nuevoRol) {
      mostrarAlerta('No permitido', 'No puedes quitar los permisos de administrador a un manager');
      return;
    }

    mostrarConfirmacion({
      title: nuevoRol ? 'Hacer Administrador' : 'Quitar Administrador',
      message: `¿Deseas ${accion} ${usuario.nombre}?`,
      onConfirm: async () => {
        const result = await authService.toggleAdminRole(usuario.id, nuevoRol);
        if (result.success) {
          updateUsuario(usuario.id, { esAdmin: nuevoRol });
        } else {
          mostrarAlerta('Error', result.error);
        }
      },
    });
  }, [currentUserId, mostrarAlerta, mostrarConfirmacion, updateUsuario]);

  // Delete user
  const handleDeleteUser = useCallback((usuario) => {
    // Don't allow deleting oneself
    if (usuario.id === currentUserId) {
      mostrarAlerta('No permitido', 'No puedes eliminarte a ti mismo');
      return;
    }

    // Don't allow deleting a manager
    if (usuario.esManager) {
      mostrarAlerta('No permitido', 'No puedes eliminar a un manager');
      return;
    }

    mostrarConfirmacion({
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de eliminar a ${usuario.nombre}?\n\nEsta acción no se puede deshacer.`,
      destructive: true,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        const result = await authService.deleteUser(usuario.id);
        if (result.success) {
          removeUsuario(usuario.id);
        } else {
          mostrarAlerta('Error', result.error);
        }
      },
    });
  }, [currentUserId, mostrarAlerta, mostrarConfirmacion, removeUsuario]);

  // Approve apartment change
  const handleAprobarCambioVivienda = useCallback((usuario) => {
    mostrarConfirmacion({
      title: 'Aprobar Cambio de Vivienda',
      message: `¿Aprobar el cambio de vivienda de ${usuario.nombre}?\n\nActual: ${formatearVivienda(usuario.vivienda)}\nNueva: ${formatearVivienda(usuario.viviendaSolicitada)}`,
      onConfirm: async () => {
        const result = await authService.aprobarCambioVivienda(usuario.id);
        if (result.success) {
          removeSolicitudCambio(usuario.id);
          await notificationService.notifyViviendaChange(
            usuario.id,
            true,
            formatearVivienda(usuario.viviendaSolicitada)
          );
          mostrarAlerta(
            'Cambio Aprobado',
            `La vivienda de ${usuario.nombre} ha sido cambiada a ${formatearVivienda(usuario.viviendaSolicitada)}`
          );
        } else {
          mostrarAlerta('Error', result.error);
        }
      },
    });
  }, [mostrarAlerta, mostrarConfirmacion, removeSolicitudCambio]);

  // Reject apartment change
  const handleRechazarCambioVivienda = useCallback((usuario) => {
    mostrarConfirmacion({
      title: 'Rechazar Cambio de Vivienda',
      message: `¿Rechazar la solicitud de cambio de vivienda de ${usuario.nombre}?\n\nSolicita: ${formatearVivienda(usuario.viviendaSolicitada)}`,
      destructive: true,
      confirmText: 'Rechazar',
      onConfirm: async () => {
        const result = await authService.rechazarCambioVivienda(usuario.id);
        if (result.success) {
          removeSolicitudCambio(usuario.id);
          await notificationService.notifyViviendaChange(usuario.id, false, null);
        } else {
          mostrarAlerta('Error', result.error);
        }
      },
    });
  }, [mostrarAlerta, mostrarConfirmacion, removeSolicitudCambio]);

  // Save apartment change (direct admin edit)
  const handleSaveVivienda = useCallback(async (usuario, escalera, piso, puerta) => {
    const validacion = validarViviendaComponentes(escalera, piso, puerta);
    if (!validacion.valido) {
      const errorMsg = Object.values(validacion.errores).join('\n');
      mostrarAlerta('Error de validación', errorMsg);
      return { success: false };
    }

    const nuevaVivienda = combinarVivienda(escalera, piso, puerta);
    const result = await authService.updateProfile(usuario.id, {
      vivienda: nuevaVivienda,
    });

    if (result.success) {
      updateUsuario(usuario.id, { vivienda: nuevaVivienda });
      mostrarAlerta(
        'Vivienda actualizada',
        `La vivienda de ${usuario.nombre} ha sido cambiada a ${formatearVivienda(nuevaVivienda)}`
      );
      return { success: true };
    } else {
      mostrarAlerta('Error', result.error || 'Error al actualizar la vivienda');
      return { success: false };
    }
  }, [mostrarAlerta, updateUsuario]);

  return {
    handleAprobar,
    handleRechazar,
    handleToggleAdmin,
    handleDeleteUser,
    handleAprobarCambioVivienda,
    handleRechazarCambioVivienda,
    handleSaveVivienda,
  };
}
