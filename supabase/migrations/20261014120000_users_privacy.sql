-- =====================================================
-- Residents can no longer read other residents' private data
-- =====================================================
-- Before: policy "users_read" let any signed-in user read every row of
-- public.users (email, phone, last access...). The app only showed it in
-- Admin, but anyone could fetch it with the public API key.
--
-- Now:
--   - public.users: each user reads their own row; admins read all.
--   - public.users_public (view): what residents need about each other,
--     only for approved users: id, nombre, vivienda, nivel_juego, foto_perfil.
--     No email, phone, last access or roles.
--
-- The view runs with its owner's rights (bypasses RLS on purpose, it only
-- exposes those columns). Supabase's advisor may flag it as "Security
-- Definer View": that is intended here.
--
-- Apply BEFORE publishing the app version that reads users_public.
-- Date: 2026-10-14
-- =====================================================

BEGIN;

CREATE OR REPLACE VIEW public.users_public AS
  SELECT id, nombre, vivienda, nivel_juego, foto_perfil
  FROM public.users
  WHERE estado_aprobacion = 'aprobado';

REVOKE ALL ON public.users_public FROM PUBLIC, anon;
GRANT SELECT ON public.users_public TO authenticated;

DROP POLICY IF EXISTS "users_read" ON public.users;
DROP POLICY IF EXISTS "Usuarios ven su ficha y admins todas" ON public.users;
CREATE POLICY "Usuarios ven su ficha y admins todas"
  ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

COMMIT;

-- -----------------------------------------------------
-- Check: should list only the new SELECT policy on users
-- -----------------------------------------------------
-- SELECT policyname, cmd, roles, qual FROM pg_policies
-- WHERE tablename = 'users' AND cmd = 'SELECT';
