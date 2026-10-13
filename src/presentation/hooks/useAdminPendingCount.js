import { useState, useEffect, useCallback } from 'react';
import { authService } from '../../services/authService.supabase';

// Singleton so AdminScreen can refresh the tab badge after approving/rejecting
let globalUpdate = null;

/**
 * Pending sign-ups + apartment change requests (Admin tab badge).
 * Only polls for admins.
 */
export function useAdminPendingCount(isAdmin) {
  const [count, setCount] = useState(0);

  const update = useCallback(async () => {
    if (!isAdmin) return;
    const [pending, changes] = await Promise.all([
      authService.getUsersPending(),
      authService.getRequestsChangeApartment(),
    ]);
    const total =
      (pending.success ? pending.data.length : 0) + (changes.success ? changes.data.length : 0);
    setCount(total);
  }, [isAdmin]);

  useEffect(() => {
    globalUpdate = update;
    return () => { globalUpdate = null; };
  }, [update]);

  useEffect(() => {
    if (!isAdmin) {
      setCount(0);
      return undefined;
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [isAdmin, update]);

  return count;
}

/** Refresh the Admin tab badge from anywhere (e.g. after approving a user). */
export function refreshAdminBadge() {
  globalUpdate?.();
}
