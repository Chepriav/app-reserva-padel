-- Tabla de configuración de horarios
-- Permite a los administradores definir horarios de apertura, cierre y pausas (ej. hora de comida)

CREATE TABLE IF NOT EXISTS public.configuracion_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hora_apertura TIME NOT NULL DEFAULT '08:00',
  hora_cierre TIME NOT NULL DEFAULT '22:00',
  duracion_bloque INTEGER NOT NULL DEFAULT 30, -- minutos
  -- Pausa para comida/descanso (opcional)
  pausa_inicio TIME,
  pausa_fin TIME,
  motivo_pausa TEXT DEFAULT 'Hora de comida',
  -- Días de la semana en que aplica la pausa (0=Domingo, 6=Sábado)
  -- NULL significa todos los días
  pausa_dias_semana INTEGER[],
  -- Auditoría
  actualizado_por UUID REFERENCES public.users(id),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solo debería existir una fila de configuración
-- Si necesitas múltiples configuraciones (por ej. verano/invierno),
-- considera agregar un campo 'activa' BOOLEAN
CREATE UNIQUE INDEX idx_configuracion_horarios_singleton ON public.configuracion_horarios ((true));

-- Insertar configuración por defecto (sin pausa)
INSERT INTO public.configuracion_horarios (
  hora_apertura,
  hora_cierre,
  duracion_bloque,
  pausa_inicio,
  pausa_fin,
  motivo_pausa
) VALUES (
  '08:00',
  '22:00',
  30,
  NULL, -- Sin pausa inicialmente
  NULL,
  'Hora de comida'
) ON CONFLICT DO NOTHING;

-- Función para obtener la configuración actual
CREATE OR REPLACE FUNCTION get_schedule_config()
RETURNS TABLE (
  hora_apertura TIME,
  hora_cierre TIME,
  duracion_bloque INTEGER,
  pausa_inicio TIME,
  pausa_fin TIME,
  motivo_pausa TEXT,
  pausa_dias_semana INTEGER[]
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
    c.pausa_dias_semana
  FROM public.configuracion_horarios c
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para actualizar la configuración (solo admins)
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

  -- Validaciones
  IF p_hora_apertura IS NOT NULL AND p_hora_cierre IS NOT NULL THEN
    IF p_hora_apertura >= p_hora_cierre THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'La hora de apertura debe ser anterior a la hora de cierre'
      );
    END IF;
  END IF;

  IF p_pausa_inicio IS NOT NULL AND p_pausa_fin IS NOT NULL THEN
    IF p_pausa_inicio >= p_pausa_fin THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'La hora de inicio de pausa debe ser anterior a la hora de fin'
      );
    END IF;
  END IF;

  IF p_duracion_bloque IS NOT NULL AND (p_duracion_bloque < 15 OR p_duracion_bloque > 120) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'La duración del bloque debe estar entre 15 y 120 minutos'
    );
  END IF;

  -- Actualizar configuración
  UPDATE public.configuracion_horarios
  SET
    hora_apertura = COALESCE(p_hora_apertura, hora_apertura),
    hora_cierre = COALESCE(p_hora_cierre, hora_cierre),
    duracion_bloque = COALESCE(p_duracion_bloque, duracion_bloque),
    pausa_inicio = COALESCE(p_pausa_inicio, pausa_inicio),
    pausa_fin = COALESCE(p_pausa_fin, pausa_fin),
    motivo_pausa = COALESCE(p_motivo_pausa, motivo_pausa),
    pausa_dias_semana = COALESCE(p_pausa_dias_semana, pausa_dias_semana),
    actualizado_por = p_user_id,
    actualizado_en = NOW()
  RETURNING * INTO v_config;

  RETURN jsonb_build_object(
    'success', true,
    'config', row_to_json(v_config)
  );
END;
$$ LANGUAGE plpgsql;

-- Permisos
ALTER TABLE public.configuracion_horarios ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden leer la configuración
CREATE POLICY "Todos pueden leer configuración horarios"
  ON public.configuracion_horarios
  FOR SELECT
  TO authenticated
  USING (true);

-- Solo admins pueden actualizar (se verifica en la función)
CREATE POLICY "Solo admins pueden actualizar configuración horarios"
  ON public.configuracion_horarios
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND es_admin = true
    )
  );

COMMENT ON TABLE public.configuracion_horarios IS 'Configuración global de horarios de reserva y pausas (ej. hora de comida)';
COMMENT ON COLUMN public.configuracion_horarios.pausa_dias_semana IS 'Array de días de la semana donde aplica la pausa (0=Domingo, 6=Sábado). NULL = todos los días';
