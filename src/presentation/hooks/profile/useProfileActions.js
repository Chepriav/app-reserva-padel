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
        showAlert('No se pudo eliminar la cuenta', result.error || 'No se pudo eliminar la cuenta');
      }
    } catch {
      setDeleting(false);
      showAlert('No se pudo eliminar la cuenta', 'Inténtalo de nuevo en unos segundos.');
    }
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Eliminar cuenta',
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y se eliminarán todos tus datos.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            showAlert(
              'Eliminar cuenta definitivamente',
              '¿Realmente deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
              [
                { text: 'Cancelar', style: 'cancel', onPress: () => {} },
                { text: 'Sí, eliminar', style: 'destructive', onPress: executeDeleteAccount },
              ]
            );
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    showAlert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (!result.success) {
              showAlert('No se pudo cerrar sesión', result.error || 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  return { deleting, handleDeleteAccount, handleLogout };
}
