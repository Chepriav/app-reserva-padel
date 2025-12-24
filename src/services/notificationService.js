import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabaseConfig';
import { webPushService } from './webPushService';

// Configurar comportamiento de notificaciones cuando la app está en primer plano (solo móvil)
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
   * Solicita permisos de notificación y registra el push token
   * Funciona tanto en móvil (Expo) como en web (Web Push)
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<{success: boolean, token?: string, error?: string}>}
   */
  async registerForPushNotifications(userId) {
    // En web, usar Web Push
    if (Platform.OS === 'web') {
      return await webPushService.subscribe(userId);
    }

    // En móvil, solo funciona en dispositivos físicos
    if (!Device.isDevice) {
      return { success: false, error: 'Push notifications requieren dispositivo físico' };
    }

    try {
      // Verificar permisos existentes
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Si no hay permisos, solicitarlos
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return { success: false, error: 'Permisos de notificación denegados' };
      }

      // Obtener el Expo Push Token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      const token = tokenData.data;

      // Configuración específica para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2e7d32',
        });
      }

      // Guardar token en Supabase
      await this.savePushToken(userId, token);

      return { success: true, token };
    } catch (error) {
      console.error('Error registrando push notifications:', error);
      return { success: false, error: 'Error al registrar notificaciones' };
    }
  },

  /**
   * Guarda el push token en Supabase (para móvil)
   */
  async savePushToken(userId, token) {
    try {
      // Upsert: actualizar si existe, crear si no
      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: userId,
            token: token,
            platform: Platform.OS,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,token' }
        );

      if (error) {
        console.error('Error guardando push token:', error);
        return { success: false, error: 'Error al guardar token' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error guardando push token:', error);
      return { success: false, error: 'Error al guardar token' };
    }
  },

  /**
   * Elimina el push token al cerrar sesión
   */
  async removePushToken(userId) {
    // En web, usar Web Push
    if (Platform.OS === 'web') {
      return await webPushService.unsubscribe(userId);
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      const token = tokenData.data;

      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token);

      if (error) {
        console.error('Error eliminando push token:', error);
      }

      return { success: true };
    } catch (error) {
      console.error('Error eliminando push token:', error);
      return { success: false };
    }
  },

  /**
   * Programa una notificación local de recordatorio
   * @param {Object} reserva - Datos de la reserva
   * @param {number} minutosAntes - Minutos antes de la reserva para notificar
   * @returns {Promise<string|null>} ID de la notificación programada
   */
  async scheduleReservationReminder(reserva, minutosAntes = 60) {
    // En web, programar con setTimeout (solo funciona mientras la página está abierta)
    if (Platform.OS === 'web') {
      const fechaReserva = new Date(`${reserva.fecha}T${reserva.horaInicio}`);
      const fechaNotificacion = new Date(fechaReserva.getTime() - minutosAntes * 60 * 1000);
      const delayMs = fechaNotificacion.getTime() - Date.now();

      if (delayMs <= 0) return null;

      return webPushService.scheduleNotification(
        'Recordatorio de Reserva',
        `Tu reserva en ${reserva.pistaNombre} es en ${minutosAntes} minutos (${reserva.horaInicio})`,
        delayMs,
        { type: 'reservation_reminder', reservaId: reserva.id }
      );
    }

    try {
      // Calcular fecha/hora de la notificación
      const fechaReserva = new Date(`${reserva.fecha}T${reserva.horaInicio}`);
      const fechaNotificacion = new Date(fechaReserva.getTime() - minutosAntes * 60 * 1000);

      // Solo programar si la fecha es futura
      if (fechaNotificacion <= new Date()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recordatorio de Reserva',
          body: `Tu reserva en ${reserva.pistaNombre} es en ${minutosAntes} minutos (${reserva.horaInicio})`,
          data: {
            type: 'reservation_reminder',
            reservaId: reserva.id,
          },
          sound: true,
        },
        trigger: {
          date: fechaNotificacion,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error programando recordatorio:', error);
      return null;
    }
  },

  /**
   * Cancela una notificación programada
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
   * Cancela todas las notificaciones programadas
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
   * Envía push notification a un usuario
   * Usa la Edge Function de Supabase para Web Push
   * Usa Expo API para móvil
   * @param {string} userId - ID del usuario destinatario
   * @param {string} title - Título de la notificación
   * @param {string} body - Cuerpo de la notificación
   * @param {Object} data - Datos adicionales
   */
  async sendPushToUser(userId, title, body, data = {}) {
    // Intentar enviar por Web Push (Edge Function)
    const webPushResult = await this.sendWebPush(userId, title, body, data);

    // Intentar enviar por Expo Push (móvil)
    const expoPushResult = await this.sendExpoPush(userId, title, body, data);

    return {
      success: webPushResult.success || expoPushResult.success,
      webPush: webPushResult,
      expoPush: expoPushResult,
    };
  },

  /**
   * Envía Web Push via Edge Function de Supabase
   */
  async sendWebPush(userId, title, body, data = {}) {
    try {
      const { data: result, error } = await supabase.functions.invoke(
        'send-push-notification',
        {
          body: { userId, title, body, data },
        }
      );

      if (error) {
        console.error('Error enviando Web Push:', error);
        return { success: false, error: error.message };
      }

      return { success: true, ...result };
    } catch (error) {
      console.error('Error enviando Web Push:', error);
      return { success: false, error: 'Error al enviar notificación web' };
    }
  },

  /**
   * Envía Expo Push notification (para dispositivos móviles)
   */
  async sendExpoPush(userId, title, body, data = {}) {
    try {
      // Obtener tokens de Expo del usuario
      const { data: tokens, error } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId);

      if (error || !tokens || tokens.length === 0) {
        return { success: false, error: 'Sin tokens móviles' };
      }

      const messages = tokens.map((t) => ({
        to: t.token,
        sound: 'default',
        title,
        body,
        data,
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      return { success: true, ...result };
    } catch (error) {
      console.error('Error enviando Expo push:', error);
      return { success: false, error: 'Error al enviar notificación móvil' };
    }
  },

  /**
   * Notifica a un usuario sobre cambio de vivienda aprobado/rechazado
   */
  async notifyViviendaChange(userId, aprobado, viviendaNueva) {
    const title = aprobado
      ? 'Cambio de vivienda aprobado'
      : 'Cambio de vivienda rechazado';

    const body = aprobado
      ? `Tu solicitud de cambio a ${viviendaNueva} ha sido aprobada.`
      : 'Tu solicitud de cambio de vivienda ha sido rechazada.';

    return await this.sendPushToUser(userId, title, body, {
      type: 'vivienda_change',
      aprobado,
    });
  },

  /**
   * Notifica a un usuario sobre desplazamiento de reserva
   */
  async notifyReservationDisplacement(userId, reservaInfo) {
    const title = 'Reserva desplazada';
    const body = `Tu reserva del ${reservaInfo.fecha} a las ${reservaInfo.horaInicio} en ${reservaInfo.pistaNombre} ha sido desplazada.`;

    return await this.sendPushToUser(userId, title, body, {
      type: 'reservation_displacement',
      ...reservaInfo,
    });
  },

  /**
   * Añade listeners para notificaciones (solo móvil)
   * @param {Function} onNotificationReceived - Callback cuando se recibe notificación
   * @param {Function} onNotificationResponse - Callback cuando usuario toca notificación
   * @returns {Function} Función para limpiar listeners
   */
  addNotificationListeners(onNotificationReceived, onNotificationResponse) {
    if (Platform.OS === 'web') {
      // En web los listeners están en el Service Worker
      return () => {};
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      onNotificationReceived
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      onNotificationResponse
    );

    // Retornar función de limpieza
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },
};
