-- =====================================================
-- SECURITY: close privilege escalation found in the Oct 2026 audit
-- =====================================================
-- Findings (from pg_policies on the live database):
--  1. users_update (auth.uid() = id) has no column restriction and there is
--     no trigger: any resident could set es_admin = true or self-approve.
--  2. The "Demo users cannot ..." policies were created PERMISSIVE instead
--     of RESTRICTIVE. Permissive policies are OR'ed, so they GRANTED access:
--     any non-demo user could update ANY user row, ANY reservation and ANY
--     match, and anyone (even without logging in) could insert reservations
--     and matches with arbitrary data.
--  3. desplazar_reserva_y_crear_nueva / crear_reserva_con_prioridad are
--     SECURITY DEFINER, executable by anon and never check auth.uid().
--  4. conversion_queue / notificaciones_desplazamiento were open to anon.
--
-- Legit flows that relied on bug 2 get explicit policies so nothing breaks:
--  - admins cancelling reservations/matches when blocking time slots
--  - residents cancelling a reservation made by someone in their apartment
--
-- Runs in a single transaction: either everything applies or nothing does.
-- Date: 2026-10-07
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- Helper: is the current caller an admin? (SECURITY DEFINER avoids RLS
-- recursion when used inside policies/triggers on users)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT es_admin FROM public.users WHERE id = auth.uid()),
    FALSE
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- -----------------------------------------------------
-- 1. Protect privileged columns of users
--    Requests from the app (roles anon/authenticated) by non-admins cannot
--    change es_admin, es_manager, es_demo, estado_aprobacion or vivienda.
--    service_role (Edge Functions) and the SQL editor are not affected.
--    Changes are silently reverted (not rejected) because the profile
--    screen always sends the current vivienda back unchanged.
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_user_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.es_admin := FALSE;
    NEW.es_manager := FALSE;
    NEW.es_demo := FALSE;
    NEW.estado_aprobacion := 'pendiente';
  ELSE
    NEW.es_admin := OLD.es_admin;
    NEW.es_manager := OLD.es_manager;
    NEW.es_demo := OLD.es_demo;
    NEW.estado_aprobacion := OLD.estado_aprobacion;
    NEW.vivienda := OLD.vivienda;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_privileged_columns ON public.users;
CREATE TRIGGER protect_user_privileged_columns
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_privileged_columns();

-- -----------------------------------------------------
-- 2. Recreate demo-user policies as RESTRICTIVE (they only ever take away)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Demo users cannot create reservations" ON public.reservas;
CREATE POLICY "Demo users cannot create reservations"
  ON public.reservas AS RESTRICTIVE FOR INSERT
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND es_demo = TRUE));

DROP POLICY IF EXISTS "Demo users cannot update reservations" ON public.reservas;
CREATE POLICY "Demo users cannot update reservations"
  ON public.reservas AS RESTRICTIVE FOR UPDATE
  USING (NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND es_demo = TRUE));

DROP POLICY IF EXISTS "Demo users cannot create matches" ON public.partidas;
CREATE POLICY "Demo users cannot create matches"
  ON public.partidas AS RESTRICTIVE FOR INSERT
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND es_demo = TRUE));

DROP POLICY IF EXISTS "Demo users cannot update matches" ON public.partidas;
CREATE POLICY "Demo users cannot update matches"
  ON public.partidas AS RESTRICTIVE FOR UPDATE
  USING (NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND es_demo = TRUE));

DROP POLICY IF EXISTS "Demo users cannot update profile" ON public.users;
CREATE POLICY "Demo users cannot update profile"
  ON public.users AS RESTRICTIVE FOR UPDATE
  USING (
    NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.es_demo = TRUE)
    OR public.is_admin()
  );

-- Flows that previously worked only through the permissive demo policies
DROP POLICY IF EXISTS "Admins pueden actualizar reservas" ON public.reservas;
CREATE POLICY "Admins pueden actualizar reservas"
  ON public.reservas FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Miembros de la vivienda pueden actualizar sus reservas" ON public.reservas;
CREATE POLICY "Miembros de la vivienda pueden actualizar sus reservas"
  ON public.reservas FOR UPDATE TO authenticated
  USING (vivienda = (SELECT u.vivienda FROM public.users u WHERE u.id = auth.uid()))
  WITH CHECK (vivienda = (SELECT u.vivienda FROM public.users u WHERE u.id = auth.uid()));

DROP POLICY IF EXISTS "Admins pueden actualizar partidas" ON public.partidas;
CREATE POLICY "Admins pueden actualizar partidas"
  ON public.partidas FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------
-- 3. Reservation RPCs
-- -----------------------------------------------------
-- crear_reserva_con_prioridad: the app calls a misspelled name
-- ('criar_reserva_con_prioridad') and falls back to direct inserts, so this
-- function is unused. It trusts p_usuario_id/p_vivienda: lock it down.
REVOKE EXECUTE ON FUNCTION public.crear_reserva_con_prioridad(
  UUID, UUID, TEXT, TEXT, DATE, TIME, TIME, INTEGER, TEXT[]
) FROM PUBLIC, anon, authenticated;

-- desplazar_reserva_y_crear_nueva: same body as live, plus caller checks
CREATE OR REPLACE FUNCTION public.desplazar_reserva_y_crear_nueva(
  p_reserva_a_desplazar_id uuid,
  p_nueva_pista_id uuid,
  p_nuevo_usuario_id uuid,
  p_nuevo_usuario_nombre text,
  p_nueva_vivienda text,
  p_nueva_fecha date,
  p_nueva_hora_inicio time without time zone,
  p_nueva_hora_fin time without time zone,
  p_nueva_duracion integer,
  p_nuevos_jugadores text[] DEFAULT '{}'::text[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_reserva_desplazada RECORD;
  v_nueva_reserva RECORD;
  v_pista_nombre TEXT;
  v_horas_restantes NUMERIC;
  v_caller RECORD;
BEGIN
  -- 0. The caller can only book for themselves and their own apartment
  SELECT vivienda, es_demo, estado_aprobacion INTO v_caller
  FROM public.users
  WHERE id = auth.uid();

  IF NOT FOUND
     OR p_nuevo_usuario_id IS DISTINCT FROM auth.uid()
     OR p_nueva_vivienda IS DISTINCT FROM v_caller.vivienda
     OR COALESCE(v_caller.es_demo, FALSE)
     OR v_caller.estado_aprobacion IS DISTINCT FROM 'aprobado' THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;

  -- 1. Lock the reservation to displace
  SELECT * INTO v_reserva_desplazada
  FROM public.reservas
  WHERE id = p_reserva_a_desplazar_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Reserva no encontrada');
  END IF;

  -- 2. Verify it's segunda (provisional) and can be displaced
  IF v_reserva_desplazada.prioridad != 'segunda' THEN
    RETURN json_build_object('success', false, 'error', 'Solo se pueden desplazar reservas provisionales');
  END IF;

  -- 3. Check reservation is still confirmed
  IF v_reserva_desplazada.estado != 'confirmada' THEN
    RETURN json_build_object('success', false, 'error', 'La reserva ya fue cancelada');
  END IF;

  -- 4. Check 24h protection rule
  v_horas_restantes := public.hours_until_reservation(v_reserva_desplazada.fecha, v_reserva_desplazada.hora_inicio);

  IF v_horas_restantes < 24 THEN
    RETURN json_build_object('success', false, 'error', 'La reserva está protegida (menos de 24 horas)');
  END IF;

  -- 5. Verify it's not the same vivienda trying to displace itself
  IF v_reserva_desplazada.vivienda = p_nueva_vivienda THEN
    RETURN json_build_object('success', false, 'error', 'No puedes desplazar tu propia reserva');
  END IF;

  -- 6. Get pista name
  SELECT nombre INTO v_pista_nombre FROM public.pistas WHERE id = p_nueva_pista_id;

  -- 7. Cancel the existing reservation
  UPDATE public.reservas
  SET estado = 'cancelada', updated_at = NOW()
  WHERE id = p_reserva_a_desplazar_id;

  -- 8. Create notification for displaced user
  INSERT INTO public.notificaciones_desplazamiento (
    usuario_id, vivienda, fecha_reserva, hora_inicio, hora_fin,
    pista_nombre, desplazado_por_vivienda
  ) VALUES (
    v_reserva_desplazada.usuario_id,
    v_reserva_desplazada.vivienda,
    v_reserva_desplazada.fecha,
    v_reserva_desplazada.hora_inicio,
    v_reserva_desplazada.hora_fin,
    v_reserva_desplazada.pista_nombre,
    p_nueva_vivienda
  );

  -- 9. Create the new reservation as 'primera' (guaranteed)
  INSERT INTO public.reservas (
    pista_id, pista_nombre, usuario_id, usuario_nombre,
    vivienda, fecha, hora_inicio, hora_fin, duracion,
    estado, prioridad, jugadores
  ) VALUES (
    p_nueva_pista_id, v_pista_nombre, p_nuevo_usuario_id, p_nuevo_usuario_nombre,
    p_nueva_vivienda, p_nueva_fecha, p_nueva_hora_inicio, p_nueva_hora_fin, p_nueva_duracion,
    'confirmada', 'primera', p_nuevos_jugadores
  ) RETURNING * INTO v_nueva_reserva;

  -- 10. Cancel any pending conversions for the displaced reservation
  UPDATE public.conversion_queue
  SET status = 'cancelled', processed_at = NOW()
  WHERE reserva_id = p_reserva_a_desplazar_id AND status = 'pending';

  RETURN json_build_object(
    'success', true,
    'nueva_reserva_id', v_nueva_reserva.id,
    'reserva_desplazada_id', p_reserva_a_desplazar_id
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.desplazar_reserva_y_crear_nueva(
  UUID, UUID, UUID, TEXT, TEXT, DATE, TIME, TIME, INTEGER, TEXT[]
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.desplazar_reserva_y_crear_nueva(
  UUID, UUID, UUID, TEXT, TEXT, DATE, TIME, TIME, INTEGER, TEXT[]
) TO authenticated;

-- Other SECURITY DEFINER helpers: no reason for logged-out visitors to run them
REVOKE EXECUTE ON FUNCTION public.recalculate_vivienda_conversions(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.actualizar_estado_partida_tras_salida(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.process_pending_conversions() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.limpiar_notificaciones_expiradas() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recalculate_vivienda_conversions(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_estado_partida_tras_salida(UUID) TO authenticated;

-- -----------------------------------------------------
-- 4. Internal tables: logged-in users only (were open to anon)
-- -----------------------------------------------------
ALTER POLICY "System can manage conversion queue" ON public.conversion_queue TO authenticated;
ALTER POLICY "System can manage displacement notifications" ON public.notificaciones_desplazamiento TO authenticated;

COMMIT;
