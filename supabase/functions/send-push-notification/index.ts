// Supabase Edge Function para enviar Web Push Notifications
// Esto permite enviar notificaciones incluso cuando el usuario no tiene la app abierta
//
// NOTA: Esta función no verifica JWT porque usa SERVICE_ROLE_KEY internamente
// y solo acepta requests con el apikey header válido (anon key)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Web Push con soporte para Deno
import webpush from 'npm:web-push@3.6.6';

const ALLOWED_ORIGINS = [
  'https://rio-tamesis-app.vercel.app',
  'http://localhost:8081',
  'http://localhost:19006',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication is handled by Supabase gateway (apikey header validated before reaching this function)

    // Configurar VAPID keys desde variables de entorno
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'mailto:admin@reservapadel.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

    // Obtener datos de la petición
    const { userId, title, body, data = {} } = await req.json();

    if (!userId || !title) {
      return new Response(
        JSON.stringify({ error: 'userId and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener suscripciones del usuario
    const { data: subscriptions, error } = await supabase
      .from('web_push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error fetching subscriptions: ${error.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar payload (usar PNG para compatibilidad con iOS)
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data,
    });

    // Enviar a todas las suscripciones del usuario
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          return { endpoint: sub.endpoint, success: true };
        } catch (pushError: any) {
          // Si la suscripción expiró o es inválida, eliminarla
          if (pushError.statusCode === 404 || pushError.statusCode === 410) {
            await supabase
              .from('web_push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
          }
          return { endpoint: sub.endpoint, success: false, error: pushError.message };
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        total: subscriptions.length,
        results: results.map((r) => (r.status === 'fulfilled' ? r.value : { success: false })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
