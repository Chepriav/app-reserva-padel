import { useState, useEffect, useCallback } from 'react';
import { reservationsService } from '../../services/reservationsService.supabase';

/**
 * Hook for admin reservations log.
 * Loads all reservations and provides client-side filters.
 *
 * @param {boolean} enabled - Only fetches when true (lazy load when user opens Registros)
 */
export function useReservationsLog(enabled = false) {
  const [allReservations, setAllReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterApartment, setFilterApartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reservationsService.getAllReservations();
      if (result.success) {
        setAllReservations(result.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      load();
    }
  }, [enabled, load]);

  const reservations = allReservations
    .filter((r) => {
      if (filterApartment.trim()) {
        return r.apartment?.toLowerCase().includes(filterApartment.trim().toLowerCase());
      }
      return true;
    })
    .filter((r) => {
      if (filterStatus === 'all') return true;
      return r.status === filterStatus;
    });

  return {
    reservations,
    loading,
    filterApartment,
    filterStatus,
    setFilterApartment,
    setFilterStatus,
    reload: load,
    total: allReservations.length,
  };
}
