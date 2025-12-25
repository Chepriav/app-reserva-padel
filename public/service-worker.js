// Service Worker para PWA con soporte de Push Notifications
const CACHE_NAME = 'reserva-padel-v20';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-180.png',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  // Activar inmediatamente sin esperar
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.log('[SW] Cache failed:', err);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    Promise.all([
      // Tomar control de todos los clientes inmediatamente
      self.clients.claim(),
      // Limpiar caches antiguos
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
    ])
  );
});

// Interceptar peticiones de red - Estrategia Network-First para HTML/JS
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // No interceptar peticiones a APIs externas (Supabase, etc.)
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('supabase.in') ||
      event.request.method !== 'GET') {
    return;
  }

  // Para HTML y JS: Network-first (siempre intentar red primero)
  if (event.request.mode === 'navigate' ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Guardar en cache para offline
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, usar cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Para assets estáticos (imágenes, etc.): Cache-first
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((fetchResponse) => {
          // Guardar en cache
          if (fetchResponse.ok) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return fetchResponse;
        });
      })
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
    icon: '/icon-192.png',
    badge: '/icon-192.png',
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
    requireInteraction: true, // Mantener visible hasta que el usuario interactúe
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

  // Si el usuario elige cerrar, no hacer nada más
  if (event.action === 'dismiss') {
    return;
  }

  // Preparar mensaje de navegación para la app React
  const navigationMessage = {
    type: 'NOTIFICATION_CLICK',
    payload: {
      notificationType: data.type,
      data: data
    }
  };

  console.log('[SW] Preparando navegación:', navigationMessage);

  // Abrir o enfocar la ventana de la app y enviar mensaje de navegación
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('[SW] Clientes encontrados:', clientList.length);

        // Si ya hay una ventana abierta, enfocarla y enviar mensaje
        for (const client of clientList) {
          console.log('[SW] Cliente encontrado:', client.url);
          if ('focus' in client) {
            return client.focus().then((focusedClient) => {
              // Enviar mensaje después de enfocar
              focusedClient.postMessage(navigationMessage);
              console.log('[SW] Mensaje enviado a cliente enfocado');
              return focusedClient;
            });
          }
        }

        // Si no hay ventana abierta, abrir una nueva con parámetro de navegación
        console.log('[SW] No hay ventana, abriendo nueva...');
        const targetScreen = data.type === 'vivienda_change' ? 'perfil' : 'reservas';
        return clients.openWindow('/?notification=' + data.type);
      })
      .catch((err) => {
        console.error('[SW] Error en notificationclick:', err);
      })
  );
});

// Notificación cerrada sin clic
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificación cerrada:', event);
});

// Escuchar mensaje para activar el nuevo SW inmediatamente
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] Activando nueva versión...');
    self.skipWaiting();
  }
});
