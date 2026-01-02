import { Platform } from 'react-native';
import { supabase } from './supabaseConfig';

/**
 * Web Push Notifications service for PWA
 * Only works in web browsers that support Push API
 */

// VAPID public key for Web Push (you must generate your own)
// You can generate it at: https://vapidkeys.com/
const VAPID_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Converts VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const webPushService = {
  /**
   * Checks if the browser supports Web Push
   */
  isSupported() {
    return (
      Platform.OS === 'web' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  /**
   * Requests notification permissions
   */
  async requestPermission() {
    if (!this.isSupported()) {
      return { success: false, error: 'Web Push no soportado en este navegador' };
    }

    try {
      const permission = await Notification.requestPermission();
      return {
        success: permission === 'granted',
        permission,
        error: permission !== 'granted' ? 'Permiso denegado' : null,
      };
    } catch (error) {
      console.error('Error solicitando permiso:', error);
      return { success: false, error: 'Error al solicitar permisos' };
    }
  },

  /**
   * Registers the Service Worker and gets the push subscription
   */
  async subscribe(userId) {
    if (!this.isSupported()) {
      return { success: false, error: 'Web Push no soportado' };
    }

    if (!VAPID_PUBLIC_KEY) {
      console.warn('VAPID_PUBLIC_KEY no configurada - Web Push deshabilitado');
      return { success: false, error: 'Web Push no configurado' };
    }

    try {
      // Verificar permiso
      if (Notification.permission !== 'granted') {
        const permResult = await this.requestPermission();
        if (!permResult.success) {
          return permResult;
        }
      }

      // Obtener registro del Service Worker con timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Service Worker timeout')), 10000)
      );

      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        timeoutPromise
      ]);

      // Verificar si ya hay una suscripción
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Crear nueva suscripción
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Guardar suscripción en Supabase
      const subscriptionData = subscription.toJSON();
      await this.saveSubscription(userId, subscriptionData);

      return { success: true, subscription: subscriptionData };
    } catch (error) {
      console.error('Error suscribiendo a Web Push:', error);
      const errorMessage = error.message === 'Service Worker timeout'
        ? 'El Service Worker no respondió. Recarga la app e intenta de nuevo.'
        : 'Error al suscribir a notificaciones';
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Saves the subscription to Supabase
   */
  async saveSubscription(userId, subscription) {
    try {
      const { error } = await supabase
        .from('web_push_subscriptions')
        .upsert(
          {
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys?.p256dh,
            auth: subscription.keys?.auth,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,endpoint' }
        );

      if (error) {
        console.error('Error guardando suscripción:', error);
        return { success: false, error: 'Error al guardar suscripción' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error guardando suscripción:', error);
      return { success: false, error: 'Error al guardar suscripción' };
    }
  },

  /**
   * Removes subscription on logout
   */
  async unsubscribe(userId) {
    if (!this.isSupported()) return { success: true };

    try {
      // Timeout para evitar bloqueo si el Service Worker no responde
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const registrationPromise = navigator.serviceWorker.ready;
      const registration = await Promise.race([registrationPromise, timeoutPromise]);

      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Eliminar de Supabase (no bloquear si falla)
        supabase
          .from('web_push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', subscription.endpoint)
          .then(() => {})
          .catch(() => {});

        // Cancelar suscripción en el navegador
        await subscription.unsubscribe();
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      // Siempre retornar success para no bloquear el logout
      return { success: true };
    }
  },

  /**
   * Shows an immediate local notification (without push server)
   * Useful for notifications that don't need a server
   */
  async showLocalNotification(title, body, data = {}) {
    if (!this.isSupported()) return null;

    if (Notification.permission !== 'granted') {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: data.tag || 'default',
        data,
        vibrate: [200, 100, 200],
        requireInteraction: data.requireInteraction || false,
      });
      return true;
    } catch (error) {
      console.error('Error mostrando notificación:', error);
      return null;
    }
  },

  /**
   * Gets a user's subscriptions
   */
  async getUserSubscriptions(userId) {
    try {
      const { data, error } = await supabase
        .from('web_push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: 'Error obteniendo suscripciones' };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error obteniendo suscripciones' };
    }
  },

  /**
   * Schedules a notification for later using setTimeout
   * Note: Only works while the page is open
   * For scheduled notifications when user is not in the app,
   * a Supabase Edge Function would be needed
   */
  scheduleNotification(title, body, delayMs, data = {}) {
    if (!this.isSupported()) return null;

    const timeoutId = setTimeout(() => {
      this.showLocalNotification(title, body, data);
    }, delayMs);

    return timeoutId;
  },

  /**
   * Cancels a scheduled notification
   */
  cancelScheduledNotification(timeoutId) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  },
};
