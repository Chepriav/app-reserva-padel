-- Migración: Push Tokens para notificaciones móviles (Expo)
-- Ejecutar en el SQL Editor de Supabase

-- Tabla para almacenar tokens de Expo Push (Android/iOS)
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'android' o 'ios'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Índice para búsqueda rápida por usuario
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id
ON public.push_tokens(user_id);

-- Deshabilitar RLS para simplificar (o habilitar con políticas si prefieres)
ALTER TABLE public.push_tokens DISABLE ROW LEVEL SECURITY;

-- Comentarios
COMMENT ON TABLE public.push_tokens IS 'Tokens de Expo Push para notificaciones en dispositivos móviles';
COMMENT ON COLUMN public.push_tokens.token IS 'Expo Push Token del dispositivo';
COMMENT ON COLUMN public.push_tokens.platform IS 'Plataforma del dispositivo (android/ios)';
