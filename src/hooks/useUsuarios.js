import { useState } from 'react';
import { authService } from '../services/authService.supabase';

/**
 * Hook to load community users
 * Fetches all approved users from the community, excluding the current user
 */
export function useCommunityUsers(currentUserId) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (loaded) return;

    setLoading(true);
    const result = await authService.getTodosUsuarios();
    if (result.success) {
      // Filter out the current user
      setUsers(result.data.filter(u => u.id !== currentUserId));
    }
    setLoading(false);
    setLoaded(true);
  };

  return {
    users,
    loading,
    load,
  };
}
