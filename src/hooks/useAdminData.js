import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService.supabase';

/**
 * Hook to load and manage admin panel data
 */
export function useAdminData() {
  const [usuariosPendientes, setUsuariosPendientes] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [solicitudesCambio, setSolicitudesCambio] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const cargarTodosDatos = useCallback(async () => {
    setLoading(true);
    const [pendientesResult, usuariosResult, cambiosResult] = await Promise.all([
      authService.getUsuariosPendientes(),
      authService.getTodosUsuarios(),
      authService.getSolicitudesCambioVivienda(),
    ]);
    if (pendientesResult.success) {
      setUsuariosPendientes(pendientesResult.data);
    }
    if (usuariosResult.success) {
      setTodosUsuarios(usuariosResult.data);
    }
    if (cambiosResult.success) {
      setSolicitudesCambio(cambiosResult.data);
    }
    setLoading(false);
  }, []);

  const cargarDatosTab = useCallback(async (tabActiva, cargarAnunciosCallback, cargarUsuariosCallback) => {
    if (tabActiva === 'solicitudes') {
      const [pendientesResult, cambiosResult] = await Promise.all([
        authService.getUsuariosPendientes(),
        authService.getSolicitudesCambioVivienda(),
      ]);
      if (pendientesResult.success) {
        setUsuariosPendientes(pendientesResult.data);
      }
      if (cambiosResult.success) {
        setSolicitudesCambio(cambiosResult.data);
      }
    } else if (tabActiva === 'usuarios') {
      const result = await authService.getTodosUsuarios();
      if (result.success) {
        setTodosUsuarios(result.data);
      }
    } else if (tabActiva === 'mensajes' && cargarAnunciosCallback && cargarUsuariosCallback) {
      await Promise.all([cargarAnunciosCallback(), cargarUsuariosCallback()]);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarTodosDatos();
    setRefreshing(false);
  }, [cargarTodosDatos]);

  // Functions to update local state
  const removeUsuarioPendiente = useCallback((userId) => {
    setUsuariosPendientes((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const removeSolicitudCambio = useCallback((userId) => {
    setSolicitudesCambio((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const updateUsuario = useCallback((userId, updates) => {
    setTodosUsuarios((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
  }, []);

  const removeUsuario = useCallback((userId) => {
    setTodosUsuarios((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  useEffect(() => {
    cargarTodosDatos();
  }, [cargarTodosDatos]);

  return {
    usuariosPendientes,
    todosUsuarios,
    solicitudesCambio,
    loading,
    refreshing,
    cargarTodosDatos,
    cargarDatosTab,
    onRefresh,
    removeUsuarioPendiente,
    removeSolicitudCambio,
    updateUsuario,
    removeUsuario,
  };
}
