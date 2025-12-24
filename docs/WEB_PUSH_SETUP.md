# Configuración de Web Push Notifications para PWA

Esta guía explica cómo configurar las notificaciones push para que funcionen en la PWA, incluso cuando el navegador está cerrado.

## Resumen

- **Móvil (iOS/Android)**: Usa Expo Push Notifications
- **Web/PWA**: Usa Web Push API + Supabase Edge Functions

## Paso 1: Generar claves VAPID

Las claves VAPID son necesarias para Web Push. Genera un par de claves en:

👉 https://vapidkeys.com/

O con Node.js:
```bash
npx web-push generate-vapid-keys
```

Obtendrás algo como:
```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
Private Key: XoYjUfFp7qJF2N3oYN_7GVhHl3zT8Xg5R3kVH2F8Y5c
```

## Paso 2: Configurar variables de entorno

### En tu archivo `.env` local:
```env
EXPO_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa...
```

### En Supabase (Edge Functions):
Ve a **Settings > Edge Functions > Secrets** y añade:
```
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa...
VAPID_PRIVATE_KEY=XoYjUfFp7qJF2N3oYN_7GVhHl3zT8Xg5R3kVH2F8Y5c
VAPID_EMAIL=mailto:tu-email@ejemplo.com
```

## Paso 3: Ejecutar migración SQL

En el SQL Editor de Supabase, ejecuta el contenido de:
```
supabase/migrations/002_web_push.sql
```

Esto crea la tabla `web_push_subscriptions`.

## Paso 4: Desplegar Edge Function

### Opción A: Desde el dashboard de Supabase
1. Ve a **Edge Functions** en el dashboard
2. Crea una nueva función llamada `send-push-notification`
3. Pega el contenido de `supabase/functions/send-push-notification/index.ts`

### Opción B: Con Supabase CLI
```bash
# Instalar CLI si no lo tienes
npm install -g supabase

# Login
supabase login

# Vincular proyecto
supabase link --project-ref TU_PROJECT_ID

# Desplegar función
supabase functions deploy send-push-notification
```

## Paso 5: Desplegar a Vercel

```bash
npx expo export:web
npx vercel --prod
```

## Cómo funciona

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario abre PWA y acepta notificaciones                │
│    → webPushService.subscribe(userId)                       │
│    → Se guarda suscripción en web_push_subscriptions        │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ 2. Admin aprueba cambio de vivienda                         │
│    → notificationService.notifyViviendaChange()             │
│    → Llama a Edge Function: send-push-notification          │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ 3. Edge Function envía push al navegador                    │
│    → Busca suscripciones del usuario                        │
│    → Usa web-push para enviar a cada endpoint               │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ 4. Service Worker recibe push (incluso con app cerrada)     │
│    → self.addEventListener('push', ...)                     │
│    → Muestra notificación al usuario                        │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ 5. Usuario toca notificación                                │
│    → Service Worker abre/enfoca la app                      │
│    → Navega a la pantalla correspondiente                   │
└─────────────────────────────────────────────────────────────┘
```

## Eventos que envían notificaciones

| Evento | Destinatario | Mensaje |
|--------|--------------|---------|
| Cambio vivienda aprobado | Usuario | "Tu solicitud de cambio a X ha sido aprobada" |
| Cambio vivienda rechazado | Usuario | "Tu solicitud de cambio de vivienda ha sido rechazada" |
| Reserva desplazada | Usuario afectado | "Tu reserva del X a las Y ha sido desplazada" |
| Recordatorio reserva | Usuario | "Tu reserva en X es en 60 minutos" (solo con app abierta) |

## Limitaciones

1. **Recordatorios programados**: Solo funcionan mientras la página está abierta. Para recordatorios con app cerrada, necesitarías un cron job en Supabase.

2. **iOS Safari**: Web Push está disponible desde iOS 16.4+, pero requiere que el usuario "Añada a Inicio".

3. **Permisos**: El usuario debe aceptar los permisos de notificación en el navegador.

## Probar notificaciones

1. Abre la PWA en producción (https://tu-app.vercel.app)
2. Inicia sesión
3. Acepta los permisos de notificación
4. Desde otro navegador/dispositivo como admin:
   - Aprueba una solicitud de cambio de vivienda
5. El usuario debería recibir la notificación

## Depuración

### En el navegador (DevTools)
```javascript
// Ver suscripción actual
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(console.log);
});

// Ver permisos
console.log(Notification.permission);
```

### En Supabase
```sql
-- Ver suscripciones
SELECT * FROM web_push_subscriptions;

-- Ver logs de Edge Function
-- Dashboard > Edge Functions > send-push-notification > Logs
```

## Troubleshooting

### "Push notifications no soportadas"
- Verifica que estés en HTTPS (localhost también funciona)
- El navegador debe soportar Push API

### "Permiso denegado"
- El usuario rechazó los permisos
- Debe ir a configuración del navegador para habilitarlos

### Notificación no llega
1. Verifica que la suscripción existe en la BD
2. Revisa los logs de la Edge Function
3. Verifica que las claves VAPID sean correctas
