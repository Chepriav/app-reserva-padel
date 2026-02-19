import { useState, useEffect, useCallback } from 'react';
import { authService } from '../../services/authService.supabase';

/**
 * Hook to load and manage admin panel data
 */
export function useAdminData() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    const [pendientesResult, usuariosResult, cambiosResult] = await Promise.all([
      authService.getUsuariosPendientes(),
      authService.getTodosUsuarios(),
      authService.getSolicitudesCambioVivienda(),
    ]);
    if (pendientesResult.success) {
      setPendingUsers(pendientesResult.data);
    }
    if (usuariosResult.success) {
      setAllUsers(usuariosResult.data);
    }
    if (cambiosResult.success) {
      setChangeRequests(cambiosResult.data);
    }
    setLoading(false);
  }, []);

  const loadTabData = useCallback(async (tabActiva, cargarAnunciosCallback, cargarUsuariosCallback) => {
    if (tabActiva === 'solicitudes') {
      const [pendientesResult, cambiosResult] = await Promise.all([
        authService.getUsuariosPendientes(),
        authService.getSolicitudesCambioVivienda(),
      ]);
      if (pendientesResult.success) {
        setPendingUsers(pendientesResult.data);
      }
      if (cambiosResult.success) {
        setChangeRequests(cambiosResult.data);
      }
    } else if (tabActiva === 'usuarios') {
      const result = await authService.getTodosUsuarios();
      if (result.success) {
        setAllUsers(result.data);
      }
    } else if (tabActiva === 'mensajes' && cargarAnunciosCallback && cargarUsuariosCallback) {
      await Promise.all([cargarAnunciosCallback(), cargarUsuariosCallback()]);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [loadAllData]);

  // Functions to update local state
  const removePendingUser = useCallback((userId) => {
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const removeChangeRequest = useCallback((userId) => {
    setChangeRequests((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const updateUser = useCallback((userId, updates) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
  }, []);

  const removeUser = useCallback((userId) => {
    setAllUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    pendingUsers,
    allUsers,
    changeRequests,
    loading,
    refreshing,
    loadAllData,
    loadTabData,
    onRefresh,
    removePendingUser,
    removeChangeRequest,
    updateUser,
    removeUser,
  };
}
