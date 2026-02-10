-- =====================================================
-- Security RLS fixes
-- Date: 2026-02-08 (updated 2026-02-10)
-- =====================================================

-- 1. Fix schedule_config RLS - restrict UPDATE/INSERT to admins only
-- Original policies used USING(true) which allows ANY authenticated user

DROP POLICY IF EXISTS "Admins can update schedule config" ON public.schedule_config;
CREATE POLICY "Admins can update schedule config"
ON public.schedule_config FOR UPDATE
USING (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND es_admin = true));

DROP POLICY IF EXISTS "Admins can insert schedule config" ON public.schedule_config;
CREATE POLICY "Admins can insert schedule config"
ON public.schedule_config FOR INSERT
WITH CHECK (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND es_admin = true));

-- 2-6. Demo user restrictions use AS RESTRICTIVE
-- RESTRICTIVE policies are AND'd with existing permissive policies,
-- effectively blocking demo users without affecting ownership checks

-- 2. Prevent demo users from creating reservations
DROP POLICY IF EXISTS "Demo users cannot create reservations" ON public.reservas;
CREATE POLICY "Demo users cannot create reservations"
ON public.reservas FOR INSERT
AS RESTRICTIVE
WITH CHECK (
  NOT EXISTS(
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND es_demo = true
  )
);

-- 3. Prevent demo users from updating reservations
DROP POLICY IF EXISTS "Demo users cannot update reservations" ON public.reservas;
CREATE POLICY "Demo users cannot update reservations"
ON public.reservas FOR UPDATE
AS RESTRICTIVE
USING (
  NOT EXISTS(
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND es_demo = true
  )
);

-- 4. Prevent demo users from creating matches
DROP POLICY IF EXISTS "Demo users cannot create matches" ON public.partidas;
CREATE POLICY "Demo users cannot create matches"
ON public.partidas FOR INSERT
AS RESTRICTIVE
WITH CHECK (
  NOT EXISTS(
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND es_demo = true
  )
);

-- 5. Prevent demo users from updating matches
DROP POLICY IF EXISTS "Demo users cannot update matches" ON public.partidas;
CREATE POLICY "Demo users cannot update matches"
ON public.partidas FOR UPDATE
AS RESTRICTIVE
USING (
  NOT EXISTS(
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND es_demo = true
  )
);

-- 6. Prevent demo users from modifying their profile
DROP POLICY IF EXISTS "Demo users cannot update profile" ON public.users;
CREATE POLICY "Demo users cannot update profile"
ON public.users FOR UPDATE
AS RESTRICTIVE
USING (
  -- Allow if NOT a demo user, OR if an admin is doing the update
  NOT EXISTS(
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND es_demo = true
  )
  OR EXISTS(
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND es_admin = true
  )
);
