import { useState, useCallback } from 'react';

/**
 * Hook para gestionar alertas personalizadas
 * Centraliza la lógica de mostrar alertas y confirmaciones
 */
export function useAlert() {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const mostrarAlerta = useCallback((title, message) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: [{ text: 'OK', onPress: () => {} }],
    });
  }, []);

  const mostrarConfirmacion = useCallback((config) => {
    // Soporta tanto el formato objeto como el formato (title, message, onConfirm)
    if (typeof config === 'string') {
      // Formato antiguo: (title, message, onConfirm)
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
      // Formato nuevo: { title, message, onConfirm, destructive, confirmText }
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

  const mostrarAlertaPersonalizada = useCallback((config) => {
    setAlertConfig({
      visible: true,
      ...config,
    });
  }, []);

  const cerrarAlerta = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    alertConfig,
    mostrarAlerta,
    mostrarConfirmacion,
    mostrarAlertaPersonalizada,
    cerrarAlerta,
  };
}
