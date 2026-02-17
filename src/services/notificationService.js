import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { webPushService } from './webPushService';
import { savePushToken, removePushToken, pushDelivery } from '@di/container';

// Configure notification behavior when app is in foreground (mobile only)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const notificationService = {
  /**
   * Requests notification permissions and registers the push token.
   * Works on both mobile (Expo) and web (Web Push).
   */
  async registerForPushNotifications(userId) {
    if (Platform.OS === 'web') {
      return await webPushService.subscribe(userId);
    }

    if (!Device.isDevice) {
      return { success: false, error: 'Push notifications requieren dispositivo físico' };
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return { success: false, error: 'Permisos de notificación denegados' };
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      const token = tokenData.data;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2e7d32',
        });
      }

      await savePushToken.execute(userId, token, Platform.OS);
      return { success: true, token };
    } catch (error) {
      console.error('Error registrando push notifications:', error);
      return { success: false, error: 'Error al registrar notificaciones' };
    }
  },

  /**
   * Removes the push token on logout.
   */
  async removePushToken(userId) {
    if (Platform.OS === 'web') {
      return await webPushService.unsubscribe(userId);
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      const token = tokenData.data;
      await removePushToken.execute(userId, token);
      return { success: true };
    } catch (error) {
      console.error('Error eliminando push token:', error);
      return { success: false };
    }
  },

  /**
   * Schedules a local reminder notification for a reservation.
   * @param {Object} reserva - { fecha, horaInicio, pistaNombre, id }
   * @param {number} minutosAntes - Minutes before reservation to notify
   */
  async scheduleReservationReminder(reserva, minutosAntes = 60) {
    if (Platform.OS === 'web') {
      const fechaReserva = new Date(`${reserva.fecha}T${reserva.horaInicio}`);
      const fechaNotificacion = new Date(fechaReserva.getTime() - minutosAntes * 60 * 1000);
      const delayMs = fechaNotificacion.getTime() - Date.now();
      if (delayMs <= 0) return null;

      return webPushService.scheduleNotification(
        'Recordatorio de Reserva',
        `Tu reserva en ${reserva.pistaNombre} es en ${minutosAntes} minutos (${reserva.horaInicio})`,
        delayMs,
        { type: 'reservation_reminder', reservaId: reserva.id },
      );
    }

    try {
      const fechaReserva = new Date(`${reserva.fecha}T${reserva.horaInicio}`);
      const fechaNotificacion = new Date(fechaReserva.getTime() - minutosAntes * 60 * 1000);
      if (fechaNotificacion <= new Date()) return null;

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recordatorio de Reserva',
          body: `Tu reserva en ${reserva.pistaNombre} es en ${minutosAntes} minutos (${reserva.horaInicio})`,
          data: { type: 'reservation_reminder', reservaId: reserva.id },
          sound: true,
        },
        trigger: { date: fechaNotificacion },
      });
    } catch (error) {
      console.error('Error programando recordatorio:', error);
      return null;
    }
  },

  /**
   * Cancels a scheduled notification.
   */
  async cancelScheduledNotification(notificationId) {
    if (!notificationId) return;
    if (Platform.OS === 'web') {
      webPushService.cancelScheduledNotification(notificationId);
      return;
    }
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error cancelando notificación:', error);
    }
  },

  /**
   * Cancels all scheduled notifications.
   */
  async cancelAllScheduledNotifications() {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error cancelando notificaciones:', error);
    }
  },

  /**
   * Sends push notification to a user via both Web Push and Expo Push.
   */
  async sendPushToUser(userId, title, body, data = {}) {
    await pushDelivery.sendToUser(userId, title, body, data);
    return { success: true };
  },

  /**
   * Notifies a user about apartment change approved/rejected.
   */
  async notifyViviendaChange(userId, aprobado, viviendaNueva) {
    const title = aprobado ? 'Cambio de vivienda aprobado' : 'Cambio de vivienda rechazado';
    const body = aprobado
      ? `Tu solicitud de cambio a ${viviendaNueva} ha sido aprobada.`
      : 'Tu solicitud de cambio de vivienda ha sido rechazada.';

    await pushDelivery.sendToUser(userId, title, body, { type: 'vivienda_change', aprobado });
    return { success: true };
  },

  /**
   * Notifies users about a new admin announcement.
   * If usuariosIds is empty, sends to all approved users.
   */
  async notifyNuevoAnuncio(titulo, mensaje, anuncioId, usuariosIds = []) {
    const body = mensaje.length > 100 ? mensaje.substring(0, 97) + '...' : mensaje;
    let targetIds = usuariosIds;

    if (!targetIds || targetIds.length === 0) {
      try {
        const { getAllApprovedUsers } = await import('@di/container');
        const result = await getAllApprovedUsers.execute();
        if (result.success) {
          targetIds = result.value.map((u) => u.id);
        }
      } catch (error) {
        console.error('[Notificaciones] Error obteniendo usuarios:', error);
        return { success: false, error: 'Error al obtener usuarios' };
      }
    }

    if (targetIds.length === 0) return { success: false, error: 'No hay usuarios' };

    await Promise.allSettled(
      targetIds.map((userId) =>
        pushDelivery.sendToUser(userId, `📢 ${titulo}`, body, {
          type: 'nuevo_anuncio',
          anuncioId,
        }),
      ),
    );

    return { success: true };
  },

  /**
   * Adds notification listeners (mobile only).
   * @returns {Function} Cleanup function to remove listeners
   */
  addNotificationListeners(onNotificationReceived, onNotificationResponse) {
    if (Platform.OS === 'web') return () => {};

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      onNotificationReceived,
    );
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      onNotificationResponse,
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },

  // ============ LEGACY ALIAS ============

  /** @deprecated Use savePushToken use case directly */
  async savePushToken(userId, token) {
    return await savePushToken.execute(userId, token, Platform.OS);
  },
};
