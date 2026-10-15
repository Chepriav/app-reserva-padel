import { useState, useEffect, useCallback } from 'react';
import { authService } from '../../services/authService.supabase';
import { refreshAdminBadge } from './useAdminPendingCount';

/**
 * Hook to load and manage admin panel data
 */
// Marks each user with emailVerified (false/true), or leaves it undefined
// when the verification status isn't available (migration not applied)
async function loadUsersWithVerification() {
  const [usersResult, unverifiedResult] = await Promise.all([
    authService.getTodosUsers(),
    authService.getUnverifiedUserIds(),
  ]);
  if (!usersResult.success) return usersResult;
  if (!unverifiedResult.success) return usersResult;
  const unverified = new Set(unverifiedResult.data);
  return {
    ...usersResult,
    data: usersResult.data.map((u) => ({ ...u, emailVerified: !unverified.has(u.id) })),
  };
}

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
      loadUsersWithVerification(),
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
      const result = await loadUsersWithVerification();
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
    refreshAdminBadge();
  }, []);

  const removeChangeRequest = useCallback((userId) => {
    setChangeRequests((prev) => prev.filter((u) => u.id !== userId));
    refreshAdminBadge();
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
