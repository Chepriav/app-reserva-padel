-- =====================================================
-- SECURITY: update_schedule_config must not trust p_user_id
-- =====================================================
-- The previous version checked admin rights on the caller-supplied
-- p_user_id (SECURITY DEFINER), so anyone holding the public anon key
-- could change the schedule by passing any admin's UUID. Worse, a
-- non-existent UUID made v_is_admin NULL and "IF NOT NULL" skipped the
-- check entirely.
--
-- Fix: check auth.uid() instead, treat NULL as "not admin", pin
-- search_path, and only allow authenticated users to execute.
-- p_user_id is kept (ignored) so existing clients keep working.
-- Date: 2026-10-07
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_schedule_config(
  p_user_id UUID,
  p_hora_apertura TIME,
  p_hora_cierre TIME,
  p_duracion_bloque INTEGER,
  p_pausa_inicio TIME,
  p_pausa_fin TIME,
  p_motivo_pausa TEXT,
  p_pausa_dias_semana INTEGER[],
  p_usar_horarios_diferenciados BOOLEAN,
  p_semana_hora_apertura TIME,
  p_semana_hora_cierre TIME,
  p_finde_hora_apertura TIME,
  p_finde_hora_cierre TIME,
  p_finde_pausa_inicio TIME,
  p_finde_pausa_fin TIME,
  p_finde_motivo_pausa TEXT,
  p_finde_pausa_dias_semana INTEGER[]
)
RETURNS TABLE (
  success BOOLEAN,
  error TEXT,
  config JSONB
) AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_config_exists BOOLEAN;
BEGIN
  -- Check admin rights of the real caller (never trust p_user_id)
  SELECT es_admin INTO v_is_admin
  FROM public.users
  WHERE id = auth.uid();

  IF NOT COALESCE(v_is_admin, FALSE) THEN
    RETURN QUERY SELECT FALSE, 'No tienes permisos para modificar la configuración'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- Check if config exists
  SELECT EXISTS(SELECT 1 FROM public.schedule_config) INTO v_config_exists;

  IF v_config_exists THEN
    -- Update existing config
    UPDATE public.schedule_config
    SET
      hora_apertura = p_hora_apertura,
      hora_cierre = p_hora_cierre,
      duracion_bloque = p_duracion_bloque,
      pausa_inicio = p_pausa_inicio,
      pausa_fin = p_pausa_fin,
      motivo_pausa = p_motivo_pausa,
      pausa_dias_semana = p_pausa_dias_semana,
      usar_horarios_diferenciados = p_usar_horarios_diferenciados,
      semana_hora_apertura = p_semana_hora_apertura,
      semana_hora_cierre = p_semana_hora_cierre,
      finde_hora_apertura = p_finde_hora_apertura,
      finde_hora_cierre = p_finde_hora_cierre,
      finde_pausa_inicio = p_finde_pausa_inicio,
      finde_pausa_fin = p_finde_pausa_fin,
      finde_motivo_pausa = p_finde_motivo_pausa,
      finde_pausa_dias_semana = p_finde_pausa_dias_semana,
      updated_at = NOW()
    WHERE TRUE;
  ELSE
    -- Insert new config
    INSERT INTO public.schedule_config (
      hora_apertura,
      hora_cierre,
      duracion_bloque,
      pausa_inicio,
      pausa_fin,
      motivo_pausa,
      pausa_dias_semana,
      usar_horarios_diferenciados,
      semana_hora_apertura,
      semana_hora_cierre,
      finde_hora_apertura,
      finde_hora_cierre,
      finde_pausa_inicio,
      finde_pausa_fin,
      finde_motivo_pausa,
      finde_pausa_dias_semana
    ) VALUES (
      p_hora_apertura,
      p_hora_cierre,
      p_duracion_bloque,
      p_pausa_inicio,
      p_pausa_fin,
      p_motivo_pausa,
      p_pausa_dias_semana,
      p_usar_horarios_diferenciados,
      p_semana_hora_apertura,
      p_semana_hora_cierre,
      p_finde_hora_apertura,
      p_finde_hora_cierre,
      p_finde_pausa_inicio,
      p_finde_pausa_fin,
      p_finde_motivo_pausa,
      p_finde_pausa_dias_semana
    );
  END IF;

  -- Return success with updated config
  RETURN QUERY
  SELECT
    TRUE,
    NULL::TEXT,
    jsonb_build_object(
      'hora_apertura', hora_apertura,
      'hora_cierre', hora_cierre,
      'duracion_bloque', duracion_bloque,
      'pausa_inicio', pausa_inicio,
      'pausa_fin', pausa_fin,
      'motivo_pausa', motivo_pausa,
      'pausa_dias_semana', pausa_dias_semana,
      'usar_horarios_diferenciados', usar_horarios_diferenciados,
      'semana_hora_apertura', semana_hora_apertura,
      'semana_hora_cierre', semana_hora_cierre,
      'finde_hora_apertura', finde_hora_apertura,
      'finde_hora_cierre', finde_hora_cierre,
      'finde_pausa_inicio', finde_pausa_inicio,
      'finde_pausa_fin', finde_pausa_fin,
      'finde_motivo_pausa', finde_motivo_pausa,
      'finde_pausa_dias_semana', finde_pausa_dias_semana
    )
  FROM public.schedule_config
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.update_schedule_config(
  UUID, TIME, TIME, INTEGER, TIME, TIME, TEXT, INTEGER[], BOOLEAN,
  TIME, TIME, TIME, TIME, TIME, TIME, TEXT, INTEGER[]
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.update_schedule_config(
  UUID, TIME, TIME, INTEGER, TIME, TIME, TEXT, INTEGER[], BOOLEAN,
  TIME, TIME, TIME, TIME, TIME, TIME, TEXT, INTEGER[]
) TO authenticated;

COMMENT ON FUNCTION public.update_schedule_config IS 'Updates schedule configuration (admin only, checked via auth.uid()). p_user_id is ignored.';
