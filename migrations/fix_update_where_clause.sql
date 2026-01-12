-- Fix: Add WHERE clause to UPDATE statement in update_schedule_config function

CREATE OR REPLACE FUNCTION update_schedule_config(
  p_user_id UUID,
  p_hora_apertura TIME DEFAULT NULL,
  p_hora_cierre TIME DEFAULT NULL,
  p_duracion_bloque INTEGER DEFAULT NULL,
  p_pausa_inicio TIME DEFAULT NULL,
  p_pausa_fin TIME DEFAULT NULL,
  p_motivo_pausa TEXT DEFAULT NULL,
  p_pausa_dias_semana INTEGER[] DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_config RECORD;
  v_current_config RECORD;
BEGIN
  -- Verificar que el usuario es admin
  SELECT es_admin INTO v_is_admin
  FROM public.users
  WHERE id = p_user_id;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No tienes permisos para actualizar la configuración'
    );
  END IF;

  -- Obtener configuración actual
  SELECT * INTO v_current_config FROM public.configuracion_horarios LIMIT 1;

  -- Usar valores actuales como defaults si no se proveen nuevos
  IF p_hora_apertura IS NULL THEN
    p_hora_apertura := v_current_config.hora_apertura;
  END IF;
  IF p_hora_cierre IS NULL THEN
    p_hora_cierre := v_current_config.hora_cierre;
  END IF;
  IF p_duracion_bloque IS NULL THEN
    p_duracion_bloque := v_current_config.duracion_bloque;
  END IF;

  -- Validaciones
  IF p_hora_apertura >= p_hora_cierre THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'La hora de apertura debe ser anterior a la hora de cierre'
    );
  END IF;

  IF p_pausa_inicio IS NOT NULL AND p_pausa_fin IS NOT NULL THEN
    IF p_pausa_inicio >= p_pausa_fin THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'La hora de inicio de pausa debe ser anterior a la hora de fin'
      );
    END IF;
  END IF;

  IF p_duracion_bloque < 15 OR p_duracion_bloque > 120 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'La duración del bloque debe estar entre 15 y 120 minutos'
    );
  END IF;

  -- Actualizar configuración (permite NULL para pausas)
  -- IMPORTANTE: Se agrega WHERE id = v_current_config.id
  UPDATE public.configuracion_horarios
  SET
    hora_apertura = p_hora_apertura,
    hora_cierre = p_hora_cierre,
    duracion_bloque = p_duracion_bloque,
    pausa_inicio = p_pausa_inicio,
    pausa_fin = p_pausa_fin,
    motivo_pausa = p_motivo_pausa,
    pausa_dias_semana = p_pausa_dias_semana,
    actualizado_por = p_user_id,
    actualizado_en = NOW()
  WHERE id = v_current_config.id  -- Esta es la línea que faltaba
  RETURNING * INTO v_config;

  RETURN jsonb_build_object(
    'success', true,
    'config', row_to_json(v_config)
  );
END;
$$ LANGUAGE plpgsql;
