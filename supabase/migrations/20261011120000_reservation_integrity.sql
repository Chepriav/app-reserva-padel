-- =====================================================
-- Reservation integrity enforced in the database
-- =====================================================
-- 1. No two confirmed reservations may overlap on the same court.
--    The app checks availability and then inserts, so two residents booking
--    the same slot at the same moment could both succeed.
-- 2. Business rules that were only checked in the app (and could be
--    bypassed by calling the API directly), for non-admin app requests:
--      - at most 1 active (future) reservation per apartment
--      - duration between 30 and 90 minutes
--      - not in the past, at most 7 days ahead (Europe/Madrid time)
--    Admins, the SQL editor and service_role are not affected.
--
-- If step 1 finds existing overlapping reservations it stops and changes
-- nothing; list them with the query at the end of this file.
-- Date: 2026-10-11
-- =====================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- -----------------------------------------------------
-- 1. No overlapping confirmed reservations per court
-- -----------------------------------------------------
DO $$
DECLARE
  v_overlaps INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_overlaps
  FROM public.reservas a
  JOIN public.reservas b
    ON a.id < b.id
   AND a.pista_id = b.pista_id
   AND a.fecha = b.fecha
   AND a.estado = 'confirmada'
   AND b.estado = 'confirmada'
   AND a.hora_inicio < b.hora_fin
   AND b.hora_inicio < a.hora_fin;

  IF v_overlaps > 0 THEN
    RAISE EXCEPTION 'Hay % pares de reservas confirmadas solapadas. Revísalas con la consulta del final del archivo antes de aplicar esta migración.', v_overlaps;
  END IF;
END;
$$;

ALTER TABLE public.reservas DROP CONSTRAINT IF EXISTS reservas_no_overlap;
ALTER TABLE public.reservas
  ADD CONSTRAINT reservas_no_overlap
  EXCLUDE USING gist (
    pista_id WITH =,
    tsrange(fecha + hora_inicio, fecha + hora_fin) WITH &&
  )
  WHERE (estado = 'confirmada');

-- -----------------------------------------------------
-- 2. Business rules for residents' reservations
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_reservation_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMP := (NOW() AT TIME ZONE 'Europe/Madrid');
  v_minutes INTEGER;
  v_active INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.estado IS DISTINCT FROM 'confirmada' THEN
    RETURN NEW;
  END IF;

  -- Updates that don't (re)activate or move the reservation (priority
  -- conversion, players...) are not re-validated
  IF TG_OP = 'UPDATE'
     AND OLD.estado = 'confirmada'
     AND NEW.fecha = OLD.fecha
     AND NEW.hora_inicio = OLD.hora_inicio
     AND NEW.hora_fin = OLD.hora_fin
     AND NEW.vivienda = OLD.vivienda THEN
    RETURN NEW;
  END IF;

  v_minutes := EXTRACT(EPOCH FROM (NEW.hora_fin - NEW.hora_inicio)) / 60;
  IF v_minutes < 30 OR v_minutes > 90 THEN
    RAISE EXCEPTION 'La reserva debe durar entre 30 minutos y 1 hora y media'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.fecha + NEW.hora_inicio <= v_now THEN
    RAISE EXCEPTION 'No se puede reservar un horario pasado'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.fecha > v_now::DATE + 7 THEN
    RAISE EXCEPTION 'Solo se puede reservar con 7 días de antelación como máximo'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT COUNT(*) INTO v_active
  FROM public.reservas
  WHERE vivienda = NEW.vivienda
    AND estado = 'confirmada'
    AND fecha + hora_inicio > v_now
    AND id IS DISTINCT FROM NEW.id;

  IF v_active >= 1 THEN
    RAISE EXCEPTION 'Tu vivienda ya tiene una reserva activa'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_reservation_rules() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_reservation_rules ON public.reservas;
CREATE TRIGGER enforce_reservation_rules
  BEFORE INSERT OR UPDATE ON public.reservas
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_reservation_rules();

COMMIT;

-- -----------------------------------------------------
-- If step 1 failed: list overlapping confirmed reservations
-- -----------------------------------------------------
-- SELECT a.fecha, a.pista_nombre,
--        a.vivienda AS vivienda_a, a.hora_inicio AS inicio_a, a.hora_fin AS fin_a,
--        b.vivienda AS vivienda_b, b.hora_inicio AS inicio_b, b.hora_fin AS fin_b
-- FROM public.reservas a
-- JOIN public.reservas b
--   ON a.id < b.id AND a.pista_id = b.pista_id AND a.fecha = b.fecha
--  AND a.estado = 'confirmada' AND b.estado = 'confirmada'
--  AND a.hora_inicio < b.hora_fin AND b.hora_inicio < a.hora_fin
-- ORDER BY a.fecha;
