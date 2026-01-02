import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabaseConfig';
import { webPushService } from './webPushService';
import { tablonService } from './tablonService';

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
   * Requests notification permissions and registers the push token
   * Works on both mobile (Expo) and web (Web Push)
   * @param {string} userId - Authenticated user ID
   * @returns {Promise<{success: boolean, token?: string, error?: string}>}
   */
  async registerForPushNotifications(userId) {
    // En web, usar Web Push
    if (Platform.OS === 'web') {
      return await webPushService.subscribe(userId);
    }

    // On mobile, only works on physical devices
    if (!Device.isDevice) {
      return { success: false, error: 'Push notifications requieren dispositivo físico' };
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If no permissions, request them
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return { success: false, error: 'Permisos de notificación denegados' };
      }

      // Get the Expo Push Token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      const token = tokenData.data;

      // Android-specific configuration
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2e7d32',
        });
      }

      // Save token in Supabase
      await this.savePushToken(userId, token);

      return { success: true, token };
    } catch (error) {
      console.error('Error registrando push notifications:', error);
      return { success: false, error: 'Error al registrar notificaciones' };
    }
  },

  /**
   * Saves the push token in Supabase (for mobile)
   */
  async savePushToken(userId, token) {
    try {
      // Upsert: update if exists, create if not
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
   * Removes the push token on logout
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
   * Schedules a local reminder notification
   * @param {Object} reserva - Reservation data
   * @param {number} minutosAntes - Minutes before reservation to notify
   * @returns {Promise<string|null>} Scheduled notification ID
   */
  async scheduleReservationReminder(reserva, minutosAntes = 60) {
    // On web, schedule with setTimeout (only works while page is open)
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
      // Calculate notification date/time
      const fechaReserva = new Date(`${reserva.fecha}T${reserva.horaInicio}`);
      const fechaNotificacion = new Date(fechaReserva.getTime() - minutosAntes * 60 * 1000);

      // Only schedule if date is in the future
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
   * Cancels a scheduled notification
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
   * Cancels all scheduled notifications
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
   * Sends push notification to a user
   * Uses Supabase Edge Function for Web Push
   * Uses Expo API for mobile
   * @param {string} userId - Recipient user ID
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data
   */
  async sendPushToUser(userId, title, body, data = {}) {
    // Try to send via Web Push (Edge Function)
    const webPushResult = await this.sendWebPush(userId, title, body, data);

    // Try to send via Expo Push (mobile)
    const expoPushResult = await this.sendExpoPush(userId, title, body, data);

    return {
      success: webPushResult.success || expoPushResult.success,
      webPush: webPushResult,
      expoPush: expoPushResult,
    };
  },

  /**
   * Sends Web Push via Supabase Edge Function
   * Uses direct fetch to avoid JWT authentication issues
   */
  async sendWebPush(userId, title, body, data = {}) {
    try {
      console.log('[Push] Enviando Web Push a usuario:', userId, { title, body });

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[Push] Faltan variables de entorno de Supabase');
        return { success: false, error: 'Configuración incompleta' };
      }

      // Call the Edge Function directly with fetch
      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-push-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({ userId, title, body, data }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Push] Error HTTP:', response.status, errorText);
        return { success: false, error: `Error HTTP ${response.status}` };
      }

      const result = await response.json();
      console.log('[Push] Web Push enviado:', result);
      return { success: true, ...result };
    } catch (error) {
      console.error('[Push] Error enviando Web Push:', error);
      return { success: false, error: 'Error al enviar notificación web' };
    }
  },

  /**
   * Sends Expo Push notification (for mobile devices)
   */
  async sendExpoPush(userId, title, body, data = {}) {
    try {
      // Get user's Expo tokens
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
   * Notifies a user about apartment change approved/rejected
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
   * Notifies a user about reservation displacement
   * @deprecated Use notifyViviendaDisplacement to notify the entire apartment
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
   * Notifies ALL users of an apartment about reservation displacement
   * @param {string} vivienda - Apartment whose users will be notified
   * @param {Object} reservaInfo - Information about the displaced reservation
   */
  async notifyViviendaDisplacement(vivienda, reservaInfo) {
    const title = 'Reserva desplazada';
    const body = `La reserva del ${reservaInfo.fecha} a las ${reservaInfo.horaInicio} en ${reservaInfo.pistaNombre} ha sido desplazada.`;

    // Get apartment users to create bulletin notifications
    try {
      const { data: usuarios } = await supabase
        .from('users')
        .select('id')
        .eq('vivienda', vivienda)
        .eq('estado_aprobacion', 'aprobado');

      if (usuarios?.length) {
        await Promise.all(
          usuarios.map((u) =>
            tablonService.crearNotificacion(u.id, 'desplazamiento', title, body, {
              reservaId: reservaInfo.reservaId,
              fecha: reservaInfo.fecha,
              horaInicio: reservaInfo.horaInicio,
              pistaNombre: reservaInfo.pistaNombre,
            })
          )
        );
      }
    } catch (error) {
      console.error('[Notificaciones] Error creando notificaciones de desplazamiento en tablón:', error);
    }

    return await this.notifyViviendaMembers(vivienda, title, body, {
      type: 'reservation_displacement',
      ...reservaInfo,
    });
  },

  // ============ MATCH NOTIFICATIONS ============

  /**
   * Notifies the creator that someone wants to join their match/class
   */
  async notifyPartidaSolicitud(creadorId, solicitanteNombre, partidaInfo) {
    const esClase = partidaInfo.esClase || false;
    const tipo = esClase ? 'clase' : 'partida';
    const title = esClase ? 'Nueva solicitud de clase' : 'Nueva solicitud de partida';
    const body = `${solicitanteNombre} quiere unirse a tu ${tipo}${partidaInfo.fecha ? ` del ${partidaInfo.fecha}` : ''}.`;
    const notifType = esClase ? 'clase_solicitud' : 'partida_solicitud';

    // Crear notificación en el tablón
    await tablonService.crearNotificacion(creadorId, notifType, title, body, {
      partidaId: partidaInfo.partidaId,
      solicitanteNombre,
    });

    return await this.sendPushToUser(creadorId, title, body, {
      type: notifType,
      partidaId: partidaInfo.partidaId,
    });
  },

  /**
   * Notifies the user that their request was accepted
   */
  async notifyPartidaAceptada(usuarioId, creadorNombre, partidaInfo) {
    const esClase = partidaInfo.esClase || false;
    const title = esClase ? '¡Plaza confirmada!' : 'Solicitud aceptada';
    const body = esClase
      ? `${creadorNombre} te ha confirmado en su clase${partidaInfo.fecha ? ` del ${partidaInfo.fecha}` : ''}.`
      : `${creadorNombre} te ha aceptado en su partida${partidaInfo.fecha ? ` del ${partidaInfo.fecha}` : ''}.`;
    const notifType = esClase ? 'clase_aceptada' : 'partida_aceptada';

    // Crear notificación en el tablón
    await tablonService.crearNotificacion(usuarioId, notifType, title, body, {
      partidaId: partidaInfo.partidaId,
      creadorNombre,
    });

    return await this.sendPushToUser(usuarioId, title, body, {
      type: notifType,
      partidaId: partidaInfo.partidaId,
    });
  },

  /**
   * Notifies all players that the match/class is complete
   */
  async notifyPartidaCompleta(jugadoresIds, creadorNombre, partidaInfo) {
    const esClase = partidaInfo.esClase || false;
    const notifType = esClase ? 'partida_completa' : 'partida_completa';

    let title, body;

    if (esClase) {
      title = '📚 ¡Grupo cerrado!';
      body = partidaInfo.fecha
        ? `La clase de ${creadorNombre} está confirmada para el ${partidaInfo.fecha}. ¡Nos vemos en la pista!`
        : `La clase de ${creadorNombre} ha sido cerrada. ¡El grupo está listo!`;
    } else {
      title = '🎾 ¡Partida completa!';
      body = partidaInfo.fecha
        ? `La partida de ${creadorNombre} para el ${partidaInfo.fecha} ya tiene 4 jugadores. ¡A jugar!`
        : `La partida de ${creadorNombre} ya tiene 4 jugadores. ¡A jugar!`;
    }

    // Crear notificaciones en el tablón para todos los jugadores
    await Promise.all(
      jugadoresIds.map((userId) =>
        tablonService.crearNotificacion(userId, notifType, title, body, {
          partidaId: partidaInfo.partidaId,
          creadorNombre,
        })
      )
    );

    const results = await Promise.all(
      jugadoresIds.map((userId) =>
        this.sendPushToUser(userId, title, body, {
          type: esClase ? 'clase_completa' : 'partida_completa',
          partidaId: partidaInfo.partidaId,
        })
      )
    );

    return { success: results.some((r) => r.success), results };
  },

  /**
   * Notifies players that the match/class was canceled
   */
  async notifyPartidaCancelada(jugadoresIds, creadorNombre, partidaInfo) {
    const esClase = partidaInfo.esClase || false;
    const tipo = esClase ? 'clase' : 'partida';
    const title = esClase ? 'Clase cancelada' : 'Partida cancelada';
    const body = partidaInfo.fecha
      ? `La ${tipo} de ${creadorNombre} del ${partidaInfo.fecha} ha sido cancelada.`
      : `La ${tipo} de ${creadorNombre} ha sido cancelada.`;
    const notifType = esClase ? 'clase_cancelada' : 'partida_cancelada';

    // Crear notificaciones en el tablón para todos los jugadores
    await Promise.all(
      jugadoresIds.map((userId) =>
        tablonService.crearNotificacion(userId, notifType, title, body, {
          partidaId: partidaInfo.partidaId,
          creadorNombre,
        })
      )
    );

    const results = await Promise.all(
      jugadoresIds.map((userId) =>
        this.sendPushToUser(userId, title, body, {
          type: notifType,
          partidaId: partidaInfo.partidaId,
        })
      )
    );

    return { success: results.some((r) => r.success), results };
  },

  /**
   * Notifies players that the match/class was canceled due to the reservation
   * Used when the linked reservation is canceled or displaced
   * @param {string[]} jugadoresIds - User IDs to notify
   * @param {string} creadorNombre - Name of the match creator
   * @param {Object} partidaInfo - { fecha, horaInicio, esClase }
   * @param {string} motivo - 'reserva_cancelada' or 'reserva_desplazada'
   */
  async notifyPartidaCanceladaPorReserva(jugadoresIds, creadorNombre, partidaInfo, motivo) {
    const esClase = partidaInfo.esClase || false;
    const tipo = esClase ? 'clase' : 'partida';
    const emoji = esClase ? '📚' : '🎾';
    const notifType = esClase ? 'clase_cancelada_reserva' : 'partida_cancelada_reserva';

    let title, body;

    if (motivo === 'reserva_desplazada') {
      title = `${emoji} ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} cancelada`;
      body = `La reserva de la ${tipo} de ${creadorNombre} ha sido desplazada por otra vivienda.`;
    } else {
      title = `${emoji} ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} cancelada`;
      body = partidaInfo.fecha
        ? `La reserva de la ${tipo} del ${partidaInfo.fecha} ha sido cancelada.`
        : `La reserva de la ${tipo} de ${creadorNombre} ha sido cancelada.`;
    }

    // Crear notificaciones en el tablón para todos los jugadores
    await Promise.all(
      jugadoresIds.map((userId) =>
        tablonService.crearNotificacion(userId, notifType, title, body, {
          creadorNombre,
          motivo,
        })
      )
    );

    const results = await Promise.all(
      jugadoresIds.map((userId) =>
        this.sendPushToUser(userId, title, body, {
          type: notifType,
          motivo,
        })
      )
    );

    return { success: results.some((r) => r.success), results };
  },

  /**
   * Notifies all users of an apartment
   * @param {string} vivienda - Apartment identifier (e.g., "1-3-B")
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data
   * @param {string} excludeUserId - User ID to exclude (e.g., who performed the action)
   */
  async notifyViviendaMembers(vivienda, title, body, data = {}, excludeUserId = null) {
    try {
      // Get all users of the apartment
      const { data: usuarios, error } = await supabase
        .from('users')
        .select('id')
        .eq('vivienda', vivienda)
        .eq('estado_aprobacion', 'aprobado');

      if (error || !usuarios?.length) {
        console.log('[Notificaciones] No se encontraron usuarios de la vivienda:', vivienda);
        return { success: false, error: 'No se encontraron usuarios' };
      }

      // Filter excluded user if specified
      const usuariosANotificar = excludeUserId
        ? usuarios.filter(u => u.id !== excludeUserId)
        : usuarios;

      if (usuariosANotificar.length === 0) {
        return { success: true, results: [] };
      }

      // Send notification to everyone
      const results = await Promise.all(
        usuariosANotificar.map((usuario) =>
          this.sendPushToUser(usuario.id, title, body, data)
        )
      );

      console.log(`[Notificaciones] Enviadas a ${usuariosANotificar.length} usuarios de vivienda ${vivienda}`);
      return { success: results.some((r) => r.success), results };
    } catch (error) {
      console.error('[Notificaciones] Error notificando a vivienda:', error);
      return { success: false, error: 'Error al notificar' };
    }
  },

  // ============ SCHEDULED MATCH NOTIFICATIONS ============

  /**
   * Schedules reminder notifications for a match:
   * 1. "Match Day" at 9:00 AM on the match day
   * 2. 10 minutes before the match
   * @param {Object} partida - Match data with date and time
   * @param {string} partida.fecha - Date in YYYY-MM-DD format
   * @param {string} partida.horaInicio - Time in HH:MM format
   * @param {string} partida.pistaNombre - Court name (optional)
   * @returns {Promise<{matchDayId: string|null, tenMinId: string|null}>}
   */
  async schedulePartidaReminders(partida) {
    const results = { matchDayId: null, tenMinId: null };

    if (!partida.fecha || !partida.horaInicio) {
      console.log('[Notificaciones] Partida sin fecha/hora, no se programan recordatorios');
      return results;
    }

    const fechaPartida = new Date(`${partida.fecha}T${partida.horaInicio}`);
    const ahora = new Date();

    // 1. "Match Day" notification at 9:00 AM on match day
    const matchDayDate = new Date(`${partida.fecha}T09:00:00`);
    if (matchDayDate > ahora) {
      const horaFormateada = partida.horaInicio.substring(0, 5);

      if (Platform.OS === 'web') {
        const delayMs = matchDayDate.getTime() - ahora.getTime();
        results.matchDayId = webPushService.scheduleNotification(
          '🎾 ¡Hoy es Match Day!',
          `Tienes partida a las ${horaFormateada}${partida.pistaNombre ? ` en ${partida.pistaNombre}` : ''}`,
          delayMs,
          { type: 'partida_match_day', partidaId: partida.id }
        );
      } else {
        try {
          results.matchDayId = await Notifications.scheduleNotificationAsync({
            content: {
              title: '🎾 ¡Hoy es Match Day!',
              body: `Tienes partida a las ${horaFormateada}${partida.pistaNombre ? ` en ${partida.pistaNombre}` : ''}`,
              data: { type: 'partida_match_day', partidaId: partida.id },
              sound: true,
            },
            trigger: { date: matchDayDate },
          });
        } catch (error) {
          console.error('[Notificaciones] Error programando Match Day:', error);
        }
      }
    }

    // 2. Notification 10 minutes before
    const tenMinBefore = new Date(fechaPartida.getTime() - 10 * 60 * 1000);
    if (tenMinBefore > ahora) {
      const horaFormateada = partida.horaInicio.substring(0, 5);

      if (Platform.OS === 'web') {
        const delayMs = tenMinBefore.getTime() - ahora.getTime();
        results.tenMinId = webPushService.scheduleNotification(
          '⏰ ¡Tu partida empieza en 10 minutos!',
          `A las ${horaFormateada}${partida.pistaNombre ? ` en ${partida.pistaNombre}` : ''}`,
          delayMs,
          { type: 'partida_10_min', partidaId: partida.id }
        );
      } else {
        try {
          results.tenMinId = await Notifications.scheduleNotificationAsync({
            content: {
              title: '⏰ ¡Tu partida empieza en 10 minutos!',
              body: `A las ${horaFormateada}${partida.pistaNombre ? ` en ${partida.pistaNombre}` : ''}`,
              data: { type: 'partida_10_min', partidaId: partida.id },
              sound: true,
            },
            trigger: { date: tenMinBefore },
          });
        } catch (error) {
          console.error('[Notificaciones] Error programando 10 min:', error);
        }
      }
    }

    console.log('[Notificaciones] Recordatorios de partida programados:', results);
    return results;
  },

  /**
   * Cancels scheduled reminders for a match
   * @param {Object} reminderIds - Notification IDs {matchDayId, tenMinId}
   */
  async cancelPartidaReminders(reminderIds) {
    if (reminderIds?.matchDayId) {
      await this.cancelScheduledNotification(reminderIds.matchDayId);
    }
    if (reminderIds?.tenMinId) {
      await this.cancelScheduledNotification(reminderIds.tenMinId);
    }
  },

  /**
   * Adds notification listeners (mobile only)
   * @param {Function} onNotificationReceived - Callback when notification is received
   * @param {Function} onNotificationResponse - Callback when user taps notification
   * @returns {Function} Function to cleanup listeners
   */
  addNotificationListeners(onNotificationReceived, onNotificationResponse) {
    if (Platform.OS === 'web') {
      // On web, listeners are in the Service Worker
      return () => {};
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      onNotificationReceived
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      onNotificationResponse
    );

    // Return cleanup function
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },

  // ============ ANNOUNCEMENT NOTIFICATIONS ============

  /**
   * Notifies users about a new admin announcement
   * @param {string} titulo - Announcement title
   * @param {string} mensaje - Announcement message (truncated for notification)
   * @param {string} anuncioId - Announcement ID
   * @param {string[]} usuariosIds - Recipient user IDs (empty = all)
   */
  async notifyNuevoAnuncio(titulo, mensaje, anuncioId, usuariosIds = []) {
    const body = mensaje.length > 100 ? mensaje.substring(0, 97) + '...' : mensaje;

    // If usuariosIds is empty, send to all approved users
    if (!usuariosIds || usuariosIds.length === 0) {
      try {
        const { data: usuarios, error } = await supabase
          .from('users')
          .select('id')
          .eq('estado_aprobacion', 'aprobado');

        if (error || !usuarios?.length) {
          console.log('[Notificaciones] No se encontraron usuarios aprobados');
          return { success: false, error: 'No se encontraron usuarios' };
        }

        usuariosIds = usuarios.map(u => u.id);
      } catch (error) {
        console.error('[Notificaciones] Error obteniendo usuarios:', error);
        return { success: false, error: 'Error al obtener usuarios' };
      }
    }

    // Send to all specified users
    const results = await Promise.all(
      usuariosIds.map((userId) =>
        this.sendPushToUser(userId, `📢 ${titulo}`, body, {
          type: 'nuevo_anuncio',
          anuncioId,
        })
      )
    );

    console.log(`[Notificaciones] Anuncio enviado a ${usuariosIds.length} usuarios`);
    return { success: results.some((r) => r.success), results };
  },
};
