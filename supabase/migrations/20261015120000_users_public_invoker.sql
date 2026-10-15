-- =====================================================
-- users_public without a SECURITY DEFINER view (Supabase linter: critical)
-- =====================================================
-- Same data as before (approved users: id, nombre, vivienda, nivel_juego,
-- foto_perfil), but:
--   - the public columns come from a SECURITY DEFINER *function* that only
--     returns those columns and only to signed-in users;
--   - the view now runs with the caller's permissions (security_invoker).
-- The app keeps querying users_public; nothing changes for users.
-- Date: 2026-10-15
-- =====================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_users_public()
RETURNS TABLE (id UUID, nombre TEXT, vivienda TEXT, nivel_juego TEXT, foto_perfil TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.nombre::TEXT, u.vivienda::TEXT, u.nivel_juego::TEXT, u.foto_perfil::TEXT
  FROM public.users u
  WHERE u.estado_aprobacion = 'aprobado'
    AND auth.uid() IS NOT NULL;
$$;

REVOKE EXECUTE ON FUNCTION public.get_users_public() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_users_public() TO authenticated;

DROP VIEW IF EXISTS public.users_public;
CREATE VIEW public.users_public
  WITH (security_invoker = true)
  AS SELECT * FROM public.get_users_public();

REVOKE ALL ON public.users_public FROM PUBLIC, anon;
GRANT SELECT ON public.users_public TO authenticated;

COMMIT;
