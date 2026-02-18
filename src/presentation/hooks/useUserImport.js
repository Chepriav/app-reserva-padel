import { useState, useRef } from 'react';
import { importUsersFromData } from '../services/userImportService';

/**
 * Custom hook for managing user import state and operations
 * Handles CSV import process with progress tracking and cancellation
 */
export function useUserImport() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState({ success: [], errors: [] });
  const [cancelled, setCancelled] = useState(false);

  // AbortController for cancellation
  const abortControllerRef = useRef(null);

  /**
   * Start import process
   * @param {Array} userData - Array of validated user data
   * @param {Function} onProgress - Progress callback (current, total, user)
   * @param {Function} onUserResult - Result callback (user, success, error)
   * @returns {Promise<{success: boolean, results: {success: Array, errors: Array}}>}
   */
  const startImport = async (userData, onProgress, onUserResult) => {
    // Reset state
    setImporting(true);
    setProgress({ current: 0, total: userData.length });
    setResults({ success: [], errors: [] });
    setCancelled(false);

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    try {
      // Call import service
      const result = await importUsersFromData(
        userData,
        onProgress,
        onUserResult,
        abortControllerRef.current.signal
      );

      setImporting(false);

      if (result.cancelled) {
        setCancelled(true);
      }

      return {
        success: true,
        results: result.results,
        cancelled: result.cancelled,
      };
    } catch (error) {
      setImporting(false);
      console.error('Error importing users:', error);

      return {
        success: false,
        error: error.message || 'Error al importar usuarios',
        results: { success: [], errors: [] },
      };
    }
  };

  /**
   * Cancel ongoing import
   * Signals the import process to stop gracefully
   */
  const cancelImport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setCancelled(true);
    }
  };

  /**
   * Clear results
   * Resets all state to initial values
   */
  const clearResults = () => {
    setImporting(false);
    setProgress({ current: 0, total: 0 });
    setResults({ success: [], errors: [] });
    setCancelled(false);
    abortControllerRef.current = null;
  };

  return {
    importing,
    progress,
    results,
    cancelled,
    startImport,
    cancelImport,
    clearResults,
  };
}
