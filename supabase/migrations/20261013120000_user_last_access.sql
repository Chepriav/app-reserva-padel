-- =====================================================
-- Last access per user (shown in Admin → Usuarios)
-- =====================================================
-- users.ultimo_acceso is updated by the app each time a resident opens it
-- (RPC record_user_access, at most once every 15 minutes per user).
-- Existing users start with their last sign-in from auth.users so the
-- column is useful from day one.
-- Date: 2026-10-13
-- =====================================================

BEGIN;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMPTZ;

UPDATE public.users u
SET ultimo_acceso = a.last_sign_in_at
FROM auth.users a
WHERE a.id = u.id
  AND a.last_sign_in_at IS NOT NULL
  AND (u.ultimo_acceso IS NULL OR u.ultimo_acceso < a.last_sign_in_at);

CREATE OR REPLACE FUNCTION public.record_user_access()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.users
  SET ultimo_acceso = NOW()
  WHERE id = auth.uid()
    AND (ultimo_acceso IS NULL OR ultimo_acceso < NOW() - INTERVAL '15 minutes');
$$;

REVOKE EXECUTE ON FUNCTION public.record_user_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_user_access() TO authenticated;

COMMIT;
