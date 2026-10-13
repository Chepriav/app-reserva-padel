// Supabase Edge Function: avisa a los administradores cuando hay una nueva
// solicitud de alta (usuario insertado con estado_aprobacion = 'pendiente').
//
// La llama un Database Webhook de Supabase (Database → Webhooks) en cada
// INSERT de public.users, con la cabecera de autorización de service role.
// Quien se registra aún no tiene sesión, por eso el aviso sale del servidor.
//
// Envía Web Push (PWA) y Expo Push (app nativa) a todos los admins aprobados.
// Usa los mismos secretos VAPID que send-push-notification.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.6';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Only the webhook (service role) may call this function
function isServiceRole(req: Request): boolean {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) return true;
  try {
    // The platform already verified the JWT signature (verify_jwt)
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!isServiceRole(req)) return json({ error: 'Forbidden' }, 403);

  try {
    const event = await req.json();
    const record = event?.record;

    // Only new sign-ups waiting for approval (CSV imports arrive approved)
    if (event?.type !== 'INSERT' || event?.table !== 'users' || record?.estado_aprobacion !== 'pendiente') {
      return json({ skipped: true });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: admins, error: adminsError } = await supabase
      .from('users')
      .select('id')
      .eq('es_admin', true)
      .eq('estado_aprobacion', 'aprobado');
    if (adminsError) throw new Error(`Error fetching admins: ${adminsError.message}`);

    const adminIds = (admins ?? []).map((a: { id: string }) => a.id);
    if (adminIds.length === 0) return json({ success: true, sent: 0, reason: 'no admins' });

    const title = 'Nueva solicitud de alta';
    const name = (record.nombre || 'Un vecino').toString().slice(0, 60);
    const apartment = record.vivienda ? ` (vivienda ${record.vivienda})` : '';
    const body = `${name}${apartment} quiere darse de alta. Revísala en Admin → Solicitudes.`;
    const data = { type: 'new_signup', userId: record.id };

    let webSent = 0;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(
        Deno.env.get('VAPID_EMAIL') || 'mailto:admin@reservapadel.com',
        vapidPublicKey,
        vapidPrivateKey,
      );

      const { data: subscriptions } = await supabase
        .from('web_push_subscriptions')
        .select('endpoint, p256dh, auth')
        .in('user_id', adminIds);

      const payload = JSON.stringify({
        title, body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'new-signup', data,
      });

      const results = await Promise.allSettled(
        (subscriptions ?? []).map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
            );
            return true;
          } catch (pushError: any) {
            // Expired subscription: remove it
            if (pushError.statusCode === 404 || pushError.statusCode === 410) {
              await supabase.from('web_push_subscriptions').delete().eq('endpoint', sub.endpoint);
            }
            return false;
          }
        }),
      );
      webSent = results.filter((r) => r.status === 'fulfilled' && r.value).length;
    }

    // Native app (Expo) tokens, if any admin uses it
    let expoSent = 0;
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', adminIds);
    if (tokens && tokens.length > 0) {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(
          tokens.map((t: { token: string }) => ({ to: t.token, sound: 'default', title, body, data })),
        ),
      });
      if (res.ok) expoSent = tokens.length;
    }

    return json({ success: true, admins: adminIds.length, webSent, expoSent });
  } catch (error: any) {
    console.error('notify-new-signup error:', error);
    return json({ error: error.message }, 500);
  }
});
