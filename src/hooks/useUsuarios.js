import { useState } from 'react';
import { authService } from '../services/authService.supabase';

/**
 * Hook para cargar usuarios de la urbanización
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
      // Filtrar el usuario actual
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
