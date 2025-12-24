-- Migración: Web Push Notifications para PWA
-- Ejecutar en el SQL Editor de Supabase

-- Tabla para almacenar suscripciones de Web Push
CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Índice para búsqueda rápida por usuario
CREATE INDEX IF NOT EXISTS idx_web_push_subscriptions_user_id
ON public.web_push_subscriptions(user_id);

-- Habilitar RLS
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: usuarios pueden ver y gestionar sus propias suscripciones
CREATE POLICY "Users can manage their own subscriptions"
ON public.web_push_subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: service role puede gestionar todas las suscripciones (para Edge Functions)
CREATE POLICY "Service role can manage all subscriptions"
ON public.web_push_subscriptions
FOR ALL
USING (auth.role() = 'service_role');

-- Comentarios
COMMENT ON TABLE public.web_push_subscriptions IS 'Suscripciones de Web Push para notificaciones en PWA';
COMMENT ON COLUMN public.web_push_subscriptions.endpoint IS 'URL del endpoint de push del navegador';
COMMENT ON COLUMN public.web_push_subscriptions.p256dh IS 'Clave pública del cliente para cifrado';
COMMENT ON COLUMN public.web_push_subscriptions.auth IS 'Token de autenticación del cliente';
