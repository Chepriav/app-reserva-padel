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
    const [pendingResult, usersResult, changesResult] = await Promise.all([
      authService.getUsersPending(),
      authService.getTodosUsers(),
      authService.getRequestsChangeApartment(),
    ]);
    if (pendingResult.success) {
      setPendingUsers(pendingResult.data);
    }
    if (usersResult.success) {
      setAllUsers(usersResult.data);
    }
    if (changesResult.success) {
      setChangeRequests(changesResult.data);
    }
    setLoading(false);
  }, []);

  const loadTabData = useCallback(async (activeTab, loadAnnouncementsCallback, loadUsersCallback) => {
    if (activeTab === 'requests') {
      const [pendingResult, changesResult] = await Promise.all([
        authService.getUsersPending(),
        authService.getRequestsChangeApartment(),
      ]);
      if (pendingResult.success) {
        setPendingUsers(pendingResult.data);
      }
      if (changesResult.success) {
        setChangeRequests(changesResult.data);
      }
    } else if (activeTab === 'users') {
      const result = await authService.getTodosUsers();
      if (result.success) {
        setAllUsers(result.data);
      }
    } else if (activeTab === 'messages' && loadAnnouncementsCallback && loadUsersCallback) {
      await Promise.all([loadAnnouncementsCallback(), loadUsersCallback()]);
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
