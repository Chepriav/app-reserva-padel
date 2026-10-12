-- =====================================================
-- Notifications can only be sent to people you share activity with
-- =====================================================
-- Before: any resident could insert a row in notificaciones_usuario for any
-- other user (policy WITH CHECK true) and call send-push-notification with
-- any text for any user → fake messages in someone else's Tablón / phone.
--
-- Also, the app inserted with RETURNING, which RLS rejects when the row
-- belongs to another user (only your own rows are visible), so Tablón
-- notifications between residents were never actually saved.
--
-- Now:
--   - Notifications are created with the RPC create_user_notification(),
--     which only allows: yourself, admins, or users who share a match/class
--     with you (creator or player). Known types only, bounded text.
--   - Direct INSERT on notificaciones_usuario is no longer allowed.
--   - can_notify(sender, target) is used by the send-push-notification Edge
--     Function (service_role) to apply the same rule to push.
--   - anuncios_destinatarios: residents can only insert their own row
--     (marking an announcement as read); admins can insert any.
--
-- Note: reservation displacement notifications (only possible with the
-- 2-reservations mode, currently disabled) are not covered by the rule; the
-- displacement modal (notificaciones_desplazamiento) is unaffected.
-- Date: 2026-10-12
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1. Relationship check
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_notify(p_sender UUID, p_target UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_sender IS NOT NULL AND p_target IS NOT NULL AND (
      p_sender = p_target
      OR EXISTS (SELECT 1 FROM public.users WHERE id = p_sender AND es_admin = true)
      OR EXISTS (
        SELECT 1
        FROM public.partidas p
        WHERE (
            p.creador_id = p_sender
            OR EXISTS (SELECT 1 FROM public.partidas_jugadores j
                       WHERE j.partida_id = p.id AND j.usuario_id = p_sender)
          )
          AND (
            p.creador_id = p_target
            OR EXISTS (SELECT 1 FROM public.partidas_jugadores j
                       WHERE j.partida_id = p.id AND j.usuario_id = p_target)
          )
      )
    );
$$;

REVOKE EXECUTE ON FUNCTION public.can_notify(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_notify(UUID, UUID) TO service_role;

-- -----------------------------------------------------
-- 2. RPC to create a notification
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_user_notification(
  p_usuario_id UUID,
  p_tipo TEXT,
  p_titulo TEXT,
  p_mensaje TEXT,
  p_datos JSONB DEFAULT '{}'::JSONB
)
RETURNS public.notificaciones_usuario
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.notificaciones_usuario;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND estado_aprobacion = 'aprobado'
  ) THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT public.can_notify(auth.uid(), p_usuario_id) THEN
    RAISE EXCEPTION 'No puedes enviar notificaciones a este usuario'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_tipo NOT IN (
    'desplazamiento', 'bloqueo_cancelacion',
    'partida_solicitud', 'clase_solicitud',
    'partida_aceptada', 'clase_aceptada',
    'partida_completa',
    'partida_cancelada', 'clase_cancelada',
    'partida_cancelada_reserva', 'clase_cancelada_reserva'
  ) THEN
    RAISE EXCEPTION 'Tipo de notificación no válido' USING ERRCODE = 'check_violation';
  END IF;

  IF p_titulo IS NULL OR char_length(p_titulo) = 0 OR char_length(p_titulo) > 120
     OR p_mensaje IS NULL OR char_length(p_mensaje) > 500
     OR pg_column_size(COALESCE(p_datos, '{}'::JSONB)) > 2000 THEN
    RAISE EXCEPTION 'Notificación no válida' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.notificaciones_usuario (usuario_id, tipo, titulo, mensaje, datos)
  VALUES (p_usuario_id, p_tipo, p_titulo, p_mensaje, COALESCE(p_datos, '{}'::JSONB))
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_user_notification(UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_user_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- -----------------------------------------------------
-- 3. No more direct inserts
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Sistema puede insertar notificaciones" ON public.notificaciones_usuario;

-- -----------------------------------------------------
-- 4. Announcement recipients: own row or admin
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Sistema puede insertar destinatarios" ON public.anuncios_destinatarios;
DROP POLICY IF EXISTS "Usuarios o admins insertan destinatarios" ON public.anuncios_destinatarios;
CREATE POLICY "Usuarios o admins insertan destinatarios"
  ON public.anuncios_destinatarios
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id OR public.is_admin());

COMMIT;

-- -----------------------------------------------------
-- Check (should list no INSERT policy on notificaciones_usuario)
-- -----------------------------------------------------
-- SELECT tablename, policyname, cmd, with_check
-- FROM pg_policies
-- WHERE tablename IN ('notificaciones_usuario', 'anuncios_destinatarios')
-- ORDER BY tablename, cmd;
