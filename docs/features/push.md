# Sistema de Notificaciones Push

## Arquitectura

### Push Nativo (Expo)
Para apps móviles instaladas vía Expo.

```
App → Expo Push Token → push_tokens → Expo API → APNs/FCM → Dispositivo
```

### Web Push (PWA)
Para usuarios de la PWA en navegador/instalada.

```
PWA → PushSubscription → web_push_subscriptions → Edge Function → FCM/APNs → Navegador
```

## Compatibilidad Web Push

- **iOS Safari** (16.4+): PWA debe estar instalada en pantalla de inicio
- **Android Chrome**: PWA instalada o navegador
- **Desktop**: Chrome/Edge/Firefox

## Configuración VAPID

Generar claves:
```bash
npx web-push generate-vapid-keys
```

Configurar:
- `.env`: `EXPO_PUBLIC_VAPID_PUBLIC_KEY=<publicKey>`
- Supabase Secrets:
  - `VAPID_PUBLIC_KEY=<publicKey>`
  - `VAPID_PRIVATE_KEY=<privateKey>`
  - `VAPID_EMAIL=mailto:tu@email.com`

## Requisitos iOS PWA

1. iOS 16.4 o superior
2. PWA instalada en pantalla de inicio
3. Meta tags en HTML:
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
```
4. Iconos PNG (iOS no acepta SVG)

## Edge Function

Ubicación: `supabase/functions/send-push-notification/index.ts`

Uso:
```bash
curl -X POST "https://xxx.supabase.co/functions/v1/send-push-notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon_key>" \
  -d '{"userId":"<uuid>","title":"Titulo","body":"Mensaje"}'
```

## Service Worker

`public/service-worker.js` maneja eventos push:
```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png'
    })
  );
});
```

## Eventos que Generan Push

| Evento | Destinatario |
|--------|--------------|
| Cambio vivienda aprobado/rechazado | Usuario |
| Reserva desplazada | Vivienda desplazada |
| Reserva cancelada por bloqueo admin | Vivienda afectada |
| Solicitud unirse partida | Creador |
| Solicitud aceptada | Solicitante |
| Partida completa | Todos los jugadores |
| Partida cancelada | Todos los jugadores |

## Hooks

```javascript
// notificationService.js
registerForPushNotifications(userId)
removePushToken(userId)
sendPushNotification(tokens, title, body, data)

// webPushService.js
isSupported()
subscribe(userId)
unsubscribe(userId)
```
