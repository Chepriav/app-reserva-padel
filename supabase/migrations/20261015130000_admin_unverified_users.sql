-- =====================================================
-- Admin → Usuarios: who hasn't verified their email yet
-- =====================================================
-- Email verification lives in auth.users, which the app can't read. This
-- admin-only function returns the ids of users whose email is not verified
-- (never opened the confirmation / "Configurar contraseña" link).
-- Date: 2026-10-15
-- =====================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_unverified_user_ids()
RETURNS SETOF UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
    SELECT a.id FROM auth.users a WHERE a.email_confirmed_at IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_unverified_user_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_unverified_user_ids() TO authenticated;

COMMIT;
