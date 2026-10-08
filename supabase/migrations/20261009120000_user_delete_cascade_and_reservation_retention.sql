-- =====================================================
-- 1. Deleting a user also deletes their reservations and related data
-- 2. Reservations older than 2 months are purged automatically (daily)
-- =====================================================
-- reservas / partidas / partidas_jugadores reference users WITHOUT
-- ON DELETE CASCADE, and RLS only lets each user delete their own rows, so
-- deleting a user with reservations from the admin panel failed. A BEFORE
-- DELETE trigger (SECURITY DEFINER) now removes everything that belongs to
-- the user first. Blockouts are kept (creator set to NULL).
--
-- Part 2 schedules public.purge_old_reservations() with pg_cron. If pg_cron
-- is not available the rest still applies and a NOTICE explains how to
-- enable it (Dashboard → Integrations → Cron) and re-run the last block.
-- Date: 2026-10-09
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1. User deletion cascade
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_user_related_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Matches tied to the user's reservations or created by the user
  DELETE FROM public.partidas_jugadores
  WHERE partida_id IN (
    SELECT id FROM public.partidas
    WHERE creador_id = OLD.id
       OR reserva_id IN (SELECT id FROM public.reservas WHERE usuario_id = OLD.id)
  );

  DELETE FROM public.partidas
  WHERE creador_id = OLD.id
     OR reserva_id IN (SELECT id FROM public.reservas WHERE usuario_id = OLD.id);

  -- The user's participations in other people's matches
  DELETE FROM public.partidas_jugadores WHERE usuario_id = OLD.id;

  -- Reservations and their bookkeeping
  DELETE FROM public.conversion_queue
  WHERE reserva_id IN (SELECT id FROM public.reservas WHERE usuario_id = OLD.id);
  DELETE FROM public.notificaciones_desplazamiento WHERE usuario_id = OLD.id;
  DELETE FROM public.reservas WHERE usuario_id = OLD.id;

  -- Admin content and notifications
  UPDATE public.bloqueos_horarios SET creado_por = NULL WHERE creado_por = OLD.id;
  DELETE FROM public.anuncios_destinatarios
  WHERE anuncio_id IN (SELECT id FROM public.anuncios_admin WHERE creador_id = OLD.id);
  DELETE FROM public.anuncios_admin WHERE creador_id = OLD.id;
  DELETE FROM public.anuncios_destinatarios WHERE usuario_id = OLD.id;
  DELETE FROM public.notificaciones_usuario WHERE usuario_id = OLD.id;
  DELETE FROM public.push_tokens WHERE user_id = OLD.id;
  DELETE FROM public.web_push_subscriptions WHERE user_id = OLD.id;

  RETURN OLD;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_user_related_data() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS delete_user_related_data ON public.users;
CREATE TRIGGER delete_user_related_data
  BEFORE DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_user_related_data();

-- -----------------------------------------------------
-- 2. Retention: purge reservations older than 2 months
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_old_reservations()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff DATE := ((NOW() AT TIME ZONE 'Europe/Madrid')::DATE - INTERVAL '2 months')::DATE;
  v_matches INTEGER;
  v_reservations INTEGER;
BEGIN
  DELETE FROM public.partidas_jugadores
  WHERE partida_id IN (
    SELECT id FROM public.partidas
    WHERE fecha < v_cutoff
       OR reserva_id IN (SELECT id FROM public.reservas WHERE fecha < v_cutoff)
  );

  DELETE FROM public.partidas
  WHERE fecha < v_cutoff
     OR reserva_id IN (SELECT id FROM public.reservas WHERE fecha < v_cutoff);
  GET DIAGNOSTICS v_matches = ROW_COUNT;

  DELETE FROM public.conversion_queue
  WHERE reserva_id IN (SELECT id FROM public.reservas WHERE fecha < v_cutoff);
  DELETE FROM public.notificaciones_desplazamiento WHERE fecha_reserva < v_cutoff;

  DELETE FROM public.reservas WHERE fecha < v_cutoff;
  GET DIAGNOSTICS v_reservations = ROW_COUNT;

  RETURN json_build_object(
    'cutoff', v_cutoff,
    'reservations_deleted', v_reservations,
    'matches_deleted', v_matches
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_old_reservations() FROM PUBLIC, anon, authenticated;

COMMIT;

-- -----------------------------------------------------
-- Daily schedule (03:30 UTC) with pg_cron
-- -----------------------------------------------------
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule(
    'purge-old-reservations',
    '30 3 * * *',
    'SELECT public.purge_old_reservations()'
  );
  RAISE NOTICE 'purge-old-reservations scheduled daily at 03:30 UTC';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available (%). Enable it in Dashboard → Integrations → Cron and re-run this block.', SQLERRM;
END;
$$;
