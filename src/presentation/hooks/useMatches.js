import { useState, useEffect, useCallback } from 'react';
import { matchesService } from '../../services/matchesService';

export function useMatches(userId, activeTab) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (activeTab === 'disponibles') {
        const result = await matchesService.getMatchesActivas();
        if (result.success) {
          setMatches(
            result.data
              .filter((p) => p.creatorId !== userId)
              .map((p) => ({ ...p, isCreator: false }))
          );
        }
      } else {
        const [created, joined] = await Promise.all([
          matchesService.getMisMatches(userId),
          matchesService.getMatchesApuntado(userId),
        ]);
        const all = [];
        if (created.success) created.data.forEach((p) => { p.isCreator = true; all.push(p); });
        if (joined.success) joined.data.forEach((p) => {
          if (!all.find((t) => t.id === p.id)) { p.isCreator = false; all.push(p); }
        });
        setMatches(all);
      }
    } catch {
      // Silent error, user will see empty list
    }
    setLoading(false);
  }, [userId, activeTab]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  return { matches, loading, refreshing, loadMatches, onRefresh };
}
