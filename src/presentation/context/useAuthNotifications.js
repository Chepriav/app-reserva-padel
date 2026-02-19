import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { notificationService } from '../../services/notificationService';
import { reservasService } from '../../services/reservationsService.supabase';
import { navigateFromNotification } from '../navigation/AppNavigator';

/**
 * Manages push notification setup, SW messages, and displacement notifications.
 * Extracted from AuthContext to keep it under the 300-line limit.
 */
export function useAuthNotifications({ isAuthenticated, user, setNotificationMessage }) {
  const [notificacionesPendientes, setNotificacionesPendientes] = useState([]);

  const handleNotificationNavigation = (notificationType, notificationData = {}) => {
    let message = null;

    switch (notificationType) {
      case 'vivienda_change':
        message = notificationData.aprobado
          ? { type: 'success', title: 'Cambio de vivienda aprobado', text: 'Tu solicitud de cambio de vivienda ha sido aprobada.' }
          : { type: 'error', title: 'Cambio de vivienda rechazado', text: 'Tu solicitud de cambio de vivienda ha sido rechazada.' };
        setNotificationMessage(message);
        navigateFromNotification('Perfil');
        break;

      case 'reservation_reminder':
        message = { type: 'info', title: 'Recordatorio', text: 'Tienes una reserva próximamente.' };
        setNotificationMessage(message);
        navigateFromNotification('Mis Reservas');
        break;

      case 'reservation_displacement':
        message = { type: 'warning', title: 'Reserva desplazada', text: 'Una de tus reservas ha sido desplazada por otra vivienda.' };
        setNotificationMessage(message);
        navigateFromNotification('Mis Reservas');
        break;

      case 'reservation_converted':
        message = { type: 'success', title: 'Reserva confirmada', text: 'Tu reserva provisional ha pasado a ser garantizada.' };
        setNotificationMessage(message);
        navigateFromNotification('Mis Reservas');
        break;

      case 'partida_solicitud':
        message = { type: 'info', title: 'Nueva solicitud', text: 'Alguien quiere unirse a tu partida.' };
        setNotificationMessage(message);
        navigateFromNotification('Partidas');
        break;

      case 'partida_aceptada':
        message = { type: 'success', title: 'Solicitud aceptada', text: 'Te han aceptado en una partida.' };
        setNotificationMessage(message);
        navigateFromNotification('Partidas');
        break;

      case 'partida_completa':
        message = { type: 'success', title: 'Partida completa', text: 'Tu partida ya tiene 4 jugadores.' };
        setNotificationMessage(message);
        navigateFromNotification('Partidas');
        break;

      case 'partida_cancelada':
        message = { type: 'warning', title: 'Partida cancelada', text: 'Una partida en la que estabas apuntado ha sido cancelada.' };
        setNotificationMessage(message);
        navigateFromNotification('Partidas');
        break;

      default:
        console.log('[AuthContext] Tipo de notificación no reconocido:', notificationType);
    }
  };

  const cargarNotificaciones = async () => {
    if (!user) return;
    try {
      const result = await reservasService.obtenerNotificacionesPendientes(user.id);
      if (result.success) {
        setNotificacionesPendientes(result.data);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const marcarNotificacionesLeidas = async () => {
    if (!user) return;
    try {
      await reservasService.marcarNotificacionesLeidas(user.id);
      setNotificacionesPendientes([]);
    } catch (error) {
      console.error('Error marcando notificaciones:', error);
    }
  };

  // Register push token and load displacement notifications
  useEffect(() => {
    let notificationCleanup = null;

    if (isAuthenticated && user) {
      cargarNotificaciones();

      notificationService.registerForPushNotifications(user.id);

      notificationCleanup = notificationService.addNotificationListeners(
        (notification) => {
          console.log('Notificación recibida:', notification);
        },
        (response) => {
          const data = response.notification.request.content.data;
          console.log('Notificación tocada:', data);
          handleNotificationNavigation(data.type, data);
        }
      );
    } else {
      setNotificacionesPendientes([]);
    }

    return () => {
      if (notificationCleanup) {
        notificationCleanup();
      }
    };
  }, [isAuthenticated, user]);

  // Service Worker message listener (Web Push)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleServiceWorkerMessage = (event) => {
      console.log('[AuthContext] Mensaje del Service Worker:', event.data);
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const { notificationType, data } = event.data.payload;
        handleNotificationNavigation(notificationType, data || {});
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  return { notificacionesPendientes, marcarNotificacionesLeidas };
}
