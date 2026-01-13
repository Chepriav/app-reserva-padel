-- Add weekday/weekend schedule support
-- Allows administrators to configure different opening/closing times for weekdays (Mon-Fri) vs weekends (Sat-Sun)

-- Add new columns to configuracion_horarios table
ALTER TABLE public.configuracion_horarios
ADD COLUMN IF NOT EXISTS usar_horarios_diferenciados BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS semana_hora_apertura TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS semana_hora_cierre TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS finde_hora_apertura TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS finde_hora_cierre TIME DEFAULT NULL;

-- Add documentation comments
COMMENT ON COLUMN public.configuracion_horarios.usar_horarios_diferenciados
IS 'Si es true, usa horarios diferenciados (semana vs finde). Si es false, usa hora_apertura/hora_cierre para todos los días';

COMMENT ON COLUMN public.configuracion_horarios.semana_hora_apertura
IS 'Hora de apertura para días laborables (Lunes-Viernes)';

COMMENT ON COLUMN public.configuracion_horarios.semana_hora_cierre
IS 'Hora de cierre para días laborables (Lunes-Viernes)';

COMMENT ON COLUMN public.configuracion_horarios.finde_hora_apertura
IS 'Hora de apertura para fin de semana (Sábado-Domingo)';

COMMENT ON COLUMN public.configuracion_horarios.finde_hora_cierre
IS 'Hora de cierre para fin de semana (Sábado-Domingo)';

-- Drop and recreate get_schedule_config function to include new fields
-- (Cannot use CREATE OR REPLACE when changing return type)
DROP FUNCTION IF EXISTS get_schedule_config();

CREATE FUNCTION get_schedule_config()
RETURNS TABLE (
  hora_apertura TIME,
  hora_cierre TIME,
  duracion_bloque INTEGER,
  pausa_inicio TIME,
  pausa_fin TIME,
  motivo_pausa TEXT,
  pausa_dias_semana INTEGER[],
  usar_horarios_diferenciados BOOLEAN,
  semana_hora_apertura TIME,
  semana_hora_cierre TIME,
  finde_hora_apertura TIME,
  finde_hora_cierre TIME
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.hora_apertura,
    c.hora_cierre,
    c.duracion_bloque,
    c.pausa_inicio,
    c.pausa_fin,
    c.motivo_pausa,
    c.pausa_dias_semana,
    c.usar_horarios_diferenciados,
    c.semana_hora_apertura,
    c.semana_hora_cierre,
    c.finde_hora_apertura,
    c.finde_hora_cierre
  FROM public.configuracion_horarios c
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update update_schedule_config function to handle new fields
CREATE OR REPLACE FUNCTION update_schedule_config(
  p_user_id UUID,
  p_hora_apertura TIME DEFAULT NULL,
  p_hora_cierre TIME DEFAULT NULL,
  p_duracion_bloque INTEGER DEFAULT NULL,
  p_pausa_inicio TIME DEFAULT NULL,
  p_pausa_fin TIME DEFAULT NULL,
  p_motivo_pausa TEXT DEFAULT NULL,
  p_pausa_dias_semana INTEGER[] DEFAULT NULL,
  p_usar_horarios_diferenciados BOOLEAN DEFAULT NULL,
  p_semana_hora_apertura TIME DEFAULT NULL,
  p_semana_hora_cierre TIME DEFAULT NULL,
  p_finde_hora_apertura TIME DEFAULT NULL,
  p_finde_hora_cierre TIME DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_config RECORD;
  v_current_config RECORD;
BEGIN
  -- Verify user is admin
  SELECT es_admin INTO v_is_admin
  FROM public.users
  WHERE id = p_user_id;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No tienes permisos para actualizar la configuración'
    );
  END IF;

  -- Get current configuration
  SELECT * INTO v_current_config FROM public.configuracion_horarios LIMIT 1;

  -- Use current values as defaults if not provided
  IF p_hora_apertura IS NULL THEN p_hora_apertura := v_current_config.hora_apertura; END IF;
  IF p_hora_cierre IS NULL THEN p_hora_cierre := v_current_config.hora_cierre; END IF;
  IF p_duracion_bloque IS NULL THEN p_duracion_bloque := v_current_config.duracion_bloque; END IF;
  IF p_usar_horarios_diferenciados IS NULL THEN
    p_usar_horarios_diferenciados := v_current_config.usar_horarios_diferenciados;
  END IF;

  -- Existing validations
  IF p_hora_apertura >= p_hora_cierre THEN
    RETURN jsonb_build_object('success', false, 'error', 'La hora de apertura debe ser anterior a la hora de cierre');
  END IF;

  IF p_pausa_inicio IS NOT NULL AND p_pausa_fin IS NOT NULL THEN
    IF p_pausa_inicio >= p_pausa_fin THEN
      RETURN jsonb_build_object('success', false, 'error', 'La hora de inicio de pausa debe ser anterior a la hora de fin');
    END IF;
  END IF;

  IF p_duracion_bloque < 15 OR p_duracion_bloque > 120 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La duración del bloque debe estar entre 15 y 120 minutos');
  END IF;

  -- New validations for differentiated schedules
  IF p_usar_horarios_diferenciados THEN
    IF p_semana_hora_apertura IS NULL OR p_semana_hora_cierre IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Debes especificar horarios de semana');
    END IF;
    IF p_finde_hora_apertura IS NULL OR p_finde_hora_cierre IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Debes especificar horarios de fin de semana');
    END IF;
    IF p_semana_hora_apertura >= p_semana_hora_cierre THEN
      RETURN jsonb_build_object('success', false, 'error', 'Horario de semana inválido');
    END IF;
    IF p_finde_hora_apertura >= p_finde_hora_cierre THEN
      RETURN jsonb_build_object('success', false, 'error', 'Horario de fin de semana inválido');
    END IF;
  END IF;

  -- Update configuration
  UPDATE public.configuracion_horarios
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
    actualizado_por = p_user_id,
    actualizado_en = NOW()
  RETURNING * INTO v_config;

  RETURN jsonb_build_object('success', true, 'config', row_to_json(v_config));
END;
$$ LANGUAGE plpgsql;

-- Note: Execute this migration in Supabase SQL Editor
-- The new columns default to NULL and usar_horarios_diferenciados defaults to false,
-- ensuring backwards compatibility with existing functionality
