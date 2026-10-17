import { useCallback } from 'react';
import { authService } from '../../services/authService.supabase';
import { notificationService } from '../../services/notificationService';
import { formatApartment, combineApartment } from '../../constants/config';
import { validateApartmentComponentes } from '../../utils/validators';
import { showToast } from '../components/Toast';

/**
 * Hook for admin actions (approve, reject, toggle admin, etc.)
 */
export function useAdminActions({
  currentUserId,
  showAlert,
  showConfirmation,
  removePendingUser,
  removeChangeRequest,
  updateUser,
  removeUser,
}) {
  // Approve pending user
  const handleApprove = useCallback((user) => {
    showConfirmation({
      title: 'Aprobar usuario',
      message: `¿Aprobar el registro de ${user.name}?\n\nVivienda: ${user.apartment}\nEmail: ${user.email}`,
      onConfirm: async () => {
        const result = await authService.approveUser(user.id);
        if (result.success) {
          removePendingUser(user.id);
          showToast(`${user.name} aprobado`);
        } else {
          showAlert('No se pudo aprobar', result.error);
        }
      },
    });
  }, [showConfirmation, showAlert, removePendingUser]);

  // Reject pending user
  const handleReject = useCallback((user) => {
    showConfirmation({
      title: 'Rechazar usuario',
      message: `¿Rechazar el registro de ${user.name}?\n\nVivienda: ${user.apartment}\nEmail: ${user.email}`,
      destructive: true,
      confirmText: 'Rechazar',
      onConfirm: async () => {
        const result = await authService.rejectUser(user.id);
        if (result.success) {
          removePendingUser(user.id);
          showToast('Solicitud rechazada');
        } else {
          showAlert('No se pudo rechazar', result.error);
        }
      },
    });
  }, [showConfirmation, showAlert, removePendingUser]);

  // Toggle admin role
  const handleToggleAdmin = useCallback((user) => {
    const newRole = !user.isAdmin;
    const actionText = newRole
      ? 'dar permisos de administrador a'
      : 'quitar permisos de administrador a';

    // Don't allow removing admin from oneself
    if (user.id === currentUserId && !newRole) {
      showAlert('No permitido', 'No puedes quitarte los permisos de administrador a ti mismo');
      return;
    }

    // Don't allow removing admin from a manager
    if (user.isManager && !newRole) {
      showAlert('No permitido', 'No puedes quitar los permisos de administrador a un manager');
      return;
    }

    showConfirmation({
      title: newRole ? 'Hacer administrador' : 'Quitar administrador',
      message: `¿Deseas ${actionText} ${user.name}?`,
      onConfirm: async () => {
        const result = await authService.toggleAdminRole(user.id, newRole);
        if (result.success) {
          updateUser(user.id, { isAdmin: newRole });
          showToast(newRole ? `${user.name} ahora es administrador` : `${user.name} ya no es administrador`);
        } else {
          showAlert('No se pudo cambiar el rol', result.error);
        }
      },
    });
  }, [currentUserId, showAlert, showConfirmation, updateUser]);

  // Delete user
  const handleDeleteUser = useCallback((user) => {
    // Don't allow deleting oneself
    if (user.id === currentUserId) {
      showAlert('No permitido', 'No puedes eliminarte a ti mismo');
      return;
    }

    // Don't allow deleting a manager
    if (user.isManager) {
      showAlert('No permitido', 'No puedes eliminar a un manager');
      return;
    }

    showConfirmation({
      title: 'Eliminar usuario',
      message: `¿Estás seguro de eliminar a ${user.name}?\n\nEsta acción no se puede deshacer.`,
      destructive: true,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        const result = await authService.deleteUser(user.id);
        if (result.success) {
          removeUser(user.id);
          showToast(`${user.name} eliminado`);
        } else {
          showAlert('No se pudo eliminar', result.error);
        }
      },
    });
  }, [currentUserId, showAlert, showConfirmation, removeUser]);

  // Approve apartment change
  const handleApproveApartmentChange = useCallback((user) => {
    showConfirmation({
      title: 'Aprobar cambio de vivienda',
      message: `¿Aprobar el cambio de vivienda de ${user.name}?\n\nActual: ${formatApartment(user.apartment)}\nNueva: ${formatApartment(user.requestedApartment)}`,
      onConfirm: async () => {
        const result = await authService.approveApartmentChange(user.id);
        if (result.success) {
          removeChangeRequest(user.id);
          showToast(`${user.name} ahora está en ${formatApartment(user.requestedApartment)}`);
          await notificationService.notifyApartmentChange(
            user.id,
            true,
            formatApartment(user.requestedApartment)
          );
        } else {
          showAlert('No se pudo aprobar el cambio', result.error);
        }
      },
    });
  }, [showAlert, showConfirmation, removeChangeRequest]);

  // Reject apartment change
  const handleRejectApartmentChange = useCallback((user) => {
    showConfirmation({
      title: 'Rechazar cambio de vivienda',
      message: `¿Rechazar la solicitud de cambio de vivienda de ${user.name}?\n\nSolicita: ${formatApartment(user.requestedApartment)}`,
      destructive: true,
      confirmText: 'Rechazar',
      onConfirm: async () => {
        const result = await authService.rejectApartmentChange(user.id);
        if (result.success) {
          removeChangeRequest(user.id);
          showToast('Cambio de vivienda rechazado');
          await notificationService.notifyApartmentChange(user.id, false, null);
        } else {
          showAlert('No se pudo rechazar el cambio', result.error);
        }
      },
    });
  }, [showAlert, showConfirmation, removeChangeRequest]);

  // Save apartment change (direct admin edit)
  const handleSaveApartment = useCallback(async (user, staircase, floor, door) => {
    const validation = validateApartmentComponentes(staircase, floor, door);
    if (!validation.valido) {
      const errorMsg = Object.values(validation.errores).join('\n');
      showAlert('Error de validación', errorMsg);
      return { success: false };
    }

    const newApartment = combineApartment(staircase, floor, door);
    const result = await authService.updateProfile(user.id, {
      apartment: newApartment,
    });

    if (result.success) {
      updateUser(user.id, { apartment: newApartment });
      showToast(`Vivienda de ${user.name} cambiada a ${formatApartment(newApartment)}`);
      return { success: true };
    } else {
      showAlert('No se pudo cambiar la vivienda', result.error || 'Inténtalo de nuevo en unos segundos.');
      return { success: false };
    }
  }, [showAlert, updateUser]);

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
