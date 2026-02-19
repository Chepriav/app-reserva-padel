import { useCallback } from 'react';
import { authService } from '../../services/authService.supabase';
import { notificationService } from '../../services/notificationService';
import { formatearVivienda, combinarVivienda } from '../../constants/config';
import { validarViviendaComponentes } from '../../utils/validators';

/**
 * Hook for admin actions (approve, reject, toggle admin, etc.)
 */
export function useAdminActions({
  currentUserId,
  mostrarAlerta,
  mostrarConfirmacion,
  removePendingUser,
  removeChangeRequest,
  updateUser,
  removeUser,
}) {
  // Approve pending user
  const handleApprove = useCallback((usuario) => {
    mostrarConfirmacion({
      title: 'Aprobar Usuario',
      message: `¿Aprobar el registro de ${usuario.nombre}?\n\nVivienda: ${usuario.vivienda}\nEmail: ${usuario.email}`,
      onConfirm: async () => {
        const result = await authService.aprobarUsuario(usuario.id);
        if (result.success) {
          removePendingUser(usuario.id);
        } else {
          mostrarAlerta('Error', result.error);
        }
      },
    });
  }, [mostrarConfirmacion, mostrarAlerta, removePendingUser]);

  // Reject pending user
  const handleReject = useCallback((usuario) => {
    mostrarConfirmacion({
      title: 'Rechazar Usuario',
      message: `¿Rechazar el registro de ${usuario.nombre}?\n\nVivienda: ${usuario.vivienda}\nEmail: ${usuario.email}`,
      destructive: true,
      confirmText: 'Rechazar',
      onConfirm: async () => {
        const result = await authService.rechazarUsuario(usuario.id);
        if (result.success) {
          removePendingUser(usuario.id);
        } else {
          mostrarAlerta('Error', result.error);
        }
      },
    });
  }, [mostrarConfirmacion, mostrarAlerta, removePendingUser]);

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
          updateUser(usuario.id, { esAdmin: nuevoRol });
        } else {
          mostrarAlerta('Error', result.error);
        }
      },
    });
  }, [currentUserId, mostrarAlerta, mostrarConfirmacion, updateUser]);

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
          removeUser(usuario.id);
        } else {
          mostrarAlerta('Error', result.error);
        }
      },
    });
  }, [currentUserId, mostrarAlerta, mostrarConfirmacion, removeUser]);

  // Approve apartment change
  const handleApproveApartmentChange = useCallback((usuario) => {
    mostrarConfirmacion({
      title: 'Aprobar Cambio de Vivienda',
      message: `¿Aprobar el cambio de vivienda de ${usuario.nombre}?\n\nActual: ${formatearVivienda(usuario.vivienda)}\nNueva: ${formatearVivienda(usuario.viviendaSolicitada)}`,
      onConfirm: async () => {
        const result = await authService.aprobarCambioVivienda(usuario.id);
        if (result.success) {
          removeChangeRequest(usuario.id);
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
  }, [mostrarAlerta, mostrarConfirmacion, removeChangeRequest]);

  // Reject apartment change
  const handleRejectApartmentChange = useCallback((usuario) => {
    mostrarConfirmacion({
      title: 'Rechazar Cambio de Vivienda',
      message: `¿Rechazar la solicitud de cambio de vivienda de ${usuario.nombre}?\n\nSolicita: ${formatearVivienda(usuario.viviendaSolicitada)}`,
      destructive: true,
      confirmText: 'Rechazar',
      onConfirm: async () => {
        const result = await authService.rechazarCambioVivienda(usuario.id);
        if (result.success) {
          removeChangeRequest(usuario.id);
          await notificationService.notifyViviendaChange(usuario.id, false, null);
        } else {
          mostrarAlerta('Error', result.error);
        }
      },
    });
  }, [mostrarAlerta, mostrarConfirmacion, removeChangeRequest]);

  // Save apartment change (direct admin edit)
  const handleSaveApartment = useCallback(async (usuario, escalera, piso, puerta) => {
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
      updateUser(usuario.id, { vivienda: nuevaVivienda });
      mostrarAlerta(
        'Vivienda actualizada',
        `La vivienda de ${usuario.nombre} ha sido cambiada a ${formatearVivienda(nuevaVivienda)}`
      );
      return { success: true };
    } else {
      mostrarAlerta('Error', result.error || 'Error al actualizar la vivienda');
      return { success: false };
    }
  }, [mostrarAlerta, updateUser]);

  return {
    handleApprove,
    handleReject,
    handleToggleAdmin,
    handleDeleteUser,
    handleApproveApartmentChange,
    handleRejectApartmentChange,
    handleSaveApartment,
  };
}
