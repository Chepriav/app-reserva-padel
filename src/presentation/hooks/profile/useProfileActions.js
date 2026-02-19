import { useState } from 'react';
import { authService } from '../../../services/authService.supabase';

export function useProfileActions(user, logout, showAlert) {
  const [deleting, setDeleting] = useState(false);

  const executeDeleteAccount = async () => {
    setDeleting(true);
    try {
      const result = await authService.deleteOwnAccount(user.id);
      if (result.success) {
        await logout();
      } else {
        setDeleting(false);
        showAlert('Error', result.error || 'No se pudo eliminar la cuenta');
      }
    } catch (error) {
      setDeleting(false);
      showAlert('Error', 'Error inesperado al eliminar la cuenta');
    }
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Eliminar Cuenta',
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y se eliminarán todos tus datos.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            showAlert(
              'Confirmar Eliminación',
              '¿Realmente deseas eliminar tu cuenta? Esta acción NO se puede deshacer.',
              [
                { text: 'Cancelar', style: 'cancel', onPress: () => {} },
                { text: 'Sí, Eliminar', style: 'destructive', onPress: executeDeleteAccount },
              ]
            );
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    showAlert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (!result.success) {
              showAlert('Error', result.error || 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  return { deleting, handleDeleteAccount, handleLogout };
}
