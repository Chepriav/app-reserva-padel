import { useState } from 'react';
import { authService } from '../services/authService.supabase';

/**
 * Hook to load community users
 * Fetches all approved users from the community, excluding the current user
 */
export function useUsuariosUrbanizacion(usuarioActualId) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const cargar = async () => {
    if (loaded) return;

    setLoading(true);
    const result = await authService.getTodosUsuarios();
    if (result.success) {
      // Filter out the current user
      setUsuarios(result.data.filter(u => u.id !== usuarioActualId));
    }
    setLoading(false);
    setLoaded(true);
  };

  return {
    usuarios,
    loading,
    cargar,
  };
}
