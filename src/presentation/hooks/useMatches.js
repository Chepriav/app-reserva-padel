import { useState, useEffect, useCallback } from 'react';
import { partidasService } from '../../services/matchesService';

export function useMatches(userId, activeTab) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (activeTab === 'disponibles') {
        const result = await partidasService.obtenerPartidasActivas();
        if (result.success) {
          setMatches(
            result.data
              .filter((p) => p.creadorId !== userId)
              .map((p) => ({ ...p, esCreador: false }))
          );
        }
      } else {
        const [created, joined] = await Promise.all([
          partidasService.obtenerMisPartidas(userId),
          partidasService.obtenerPartidasApuntado(userId),
        ]);
        const all = [];
        if (created.success) created.data.forEach((p) => { p.esCreador = true; all.push(p); });
        if (joined.success) joined.data.forEach((p) => {
          if (!all.find((t) => t.id === p.id)) { p.esCreador = false; all.push(p); }
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
