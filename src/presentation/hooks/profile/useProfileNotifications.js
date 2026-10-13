import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { notificationService } from '../../../services/notificationService';
import { webPushService } from '../../../services/webPushService';

export function useProfileNotifications(user, showAlert) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [enablingNotifications, setEnablingNotifications] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // "Enabled" = permission granted AND this browser has a push subscription
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    let mounted = true;
    webPushService.isSubscribed().then((subscribed) => {
      if (mounted) setNotificationsEnabled(subscribed);
    });
    return () => { mounted = false; };
  }, []);

  const handleEnableNotifications = async () => {
    if (!user) return;
    setEnablingNotifications(true);

    try {
      const result = await notificationService.registerForPushNotifications(user.id);
      if (result.success) {
        setNotificationsEnabled(true);
        showAlert(
          'Notificaciones activadas',
          'Recibirás avisos de tus reservas y partidas. Pulsa "Probar" para comprobar que te llegan.',
        );
      } else {
        showAlert('Notificaciones no activadas', result.error || 'No se pudieron activar las notificaciones');
      }
    } catch {
      showAlert('Error', 'Error al activar notificaciones');
    }

    setEnablingNotifications(false);
  };

  const handleSendTest = async () => {
    if (!user || sendingTest) return;
    setSendingTest(true);
    const result = await webPushService.sendTest(user.id);
    setSendingTest(false);
    if (result.success) {
      showAlert('Prueba enviada', result.message);
    } else {
      showAlert('No se pudo enviar', result.error);
    }
  };

  return {
    notificationsEnabled,
    enablingNotifications,
    sendingTest,
    handleEnableNotifications,
    handleSendTest,
  };
}
