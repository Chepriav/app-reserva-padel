import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { notificationService } from '../../../services/notificationService';

export function useProfileNotifications(user, showAlert) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [enablingNotifications, setEnablingNotifications] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!user) return;
    setEnablingNotifications(true);

    try {
      const result = await notificationService.registerForPushNotifications(user.id);
      if (result.success) {
        setNotificationsEnabled(true);
        showAlert('Notificaciones Activadas', 'Recibirás notificaciones sobre tus reservas y cambios importantes.');
      } else {
        showAlert('Error', result.error || 'No se pudieron activar las notificaciones');
      }
    } catch (error) {
      showAlert('Error', 'Error al activar notificaciones');
    }

    setEnablingNotifications(false);
  };

  return { notificationsEnabled, enablingNotifications, handleEnableNotifications };
}
