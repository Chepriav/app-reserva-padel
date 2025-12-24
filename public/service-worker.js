// Service Worker para PWA con soporte de Push Notifications
const CACHE_NAME = 'reserva-padel-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('[SW] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // No interceptar peticiones a APIs externas (Supabase, etc.)
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('supabase.in') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// ==========================================
// Web Push Notifications
// ==========================================

// Recibir notificación push del servidor
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event);

  let data = {
    title: 'Reserva Pádel',
    body: 'Tienes una notificación',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: 'default',
    data: {},
  };

  // Parsear datos del push
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || {},
      };
    } catch (e) {
      // Si no es JSON, usar el texto como body
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200],
  };

  console.log('[SW] Mostrando notificación:', data.title, options);

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log('[SW] Notificación mostrada correctamente'))
      .catch((err) => console.error('[SW] Error mostrando notificación:', err))
  );
});

// Acciones según tipo de notificación
function getActionsForType(type) {
  switch (type) {
    case 'reservation_reminder':
      return [
        { action: 'view', title: 'Ver reserva' },
        { action: 'dismiss', title: 'Cerrar' },
      ];
    case 'vivienda_change':
      return [
        { action: 'view', title: 'Ver perfil' },
      ];
    case 'reservation_displacement':
      return [
        { action: 'view', title: 'Ver reservas' },
      ];
    default:
      return [];
  }
}

// Usuario hace clic en la notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada:', event);

  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/';

  // Determinar URL según tipo y acción
  if (event.action === 'dismiss') {
    return; // Solo cerrar
  }

  switch (data.type) {
    case 'reservation_reminder':
    case 'reservation_displacement':
      targetUrl = '/reservas';
      break;
    case 'vivienda_change':
      targetUrl = '/perfil';
      break;
    default:
      targetUrl = '/';
  }

  // Abrir o enfocar la ventana de la app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla y navegar
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Si no hay ventana, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Notificación cerrada sin clic
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificación cerrada:', event);
});
