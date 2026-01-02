import { useState, useCallback } from 'react';

/**
 * Hook to manage custom alerts
 * Centralizes the logic for showing alerts and confirmations
 */
export function useAlert() {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback((title, message) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: [{ text: 'OK', onPress: () => {} }],
    });
  }, []);

  const showConfirmation = useCallback((config) => {
    // Supports both object format and (title, message, onConfirm) format
    if (typeof config === 'string') {
      // Legacy format: (title, message, onConfirm)
      const [title, message, onConfirm] = [config, arguments[1], arguments[2]];
      setAlertConfig({
        visible: true,
        title,
        message,
        buttons: [
          { text: 'Cancelar', style: 'cancel', onPress: () => {} },
          { text: 'Confirmar', onPress: onConfirm },
        ],
      });
    } else {
      // New format: { title, message, onConfirm, destructive, confirmText }
      const { title, message, onConfirm, destructive, confirmText } = config;
      setAlertConfig({
        visible: true,
        title,
        message,
        buttons: [
          { text: 'Cancelar', style: 'cancel', onPress: () => {} },
          {
            text: confirmText || 'Confirmar',
            style: destructive ? 'destructive' : 'default',
            onPress: onConfirm,
          },
        ],
      });
    }
  }, []);

  const showCustomAlert = useCallback((config) => {
    setAlertConfig({
      visible: true,
      ...config,
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    alertConfig,
    // New English names
    showAlert,
    showConfirmation,
    showCustomAlert,
    closeAlert,
    // Legacy Spanish names for backwards compatibility
    mostrarAlerta: showAlert,
    mostrarConfirmacion: showConfirmation,
    mostrarAlertaPersonalizada: showCustomAlert,
    cerrarAlerta: closeAlert,
  };
}
