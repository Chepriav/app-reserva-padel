-- =====================================================
-- Create Schedule Config Table and Functions
-- =====================================================
-- Creates the schedule configuration infrastructure
-- with support for weekday/weekend differentiation
-- and break times
-- Date: 2026-01-14
-- =====================================================

-- Create schedule_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.schedule_config (
  id SERIAL PRIMARY KEY,
  hora_apertura TIME NOT NULL DEFAULT '08:00',
  hora_cierre TIME NOT NULL DEFAULT '22:00',
  duracion_bloque INTEGER NOT NULL DEFAULT 30,
  pausa_inicio TIME,
  pausa_fin TIME,
  motivo_pausa TEXT DEFAULT 'Hora de comida',
  pausa_dias_semana INTEGER[],
  usar_horarios_diferenciados BOOLEAN DEFAULT FALSE,
  semana_hora_apertura TIME DEFAULT '08:00',
  semana_hora_cierre TIME DEFAULT '22:00',
  finde_hora_apertura TIME DEFAULT '09:00',
  finde_hora_cierre TIME DEFAULT '23:00',
  finde_pausa_inicio TIME,
  finde_pausa_fin TIME,
  finde_motivo_pausa TEXT DEFAULT 'Hora de comida',
  finde_pausa_dias_semana INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index to ensure singleton
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_config_singleton ON public.schedule_config ((TRUE));

-- Enable RLS
ALTER TABLE public.schedule_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read schedule config
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'schedule_config'
    AND policyname = 'Anyone can read schedule config'
  ) THEN
    CREATE POLICY "Anyone can read schedule config"
    ON public.schedule_config FOR SELECT
    USING (true);
  END IF;
END $$;

-- Only admins can update (will be enforced by RPC function)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'schedule_config'
    AND policyname = 'Admins can update schedule config'
  ) THEN
    CREATE POLICY "Admins can update schedule config"
    ON public.schedule_config FOR UPDATE
    USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'schedule_config'
    AND policyname = 'Admins can insert schedule config'
  ) THEN
    CREATE POLICY "Admins can insert schedule config"
    ON public.schedule_config FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Insert default config if table is empty
INSERT INTO public.schedule_config (
  hora_apertura,
  hora_cierre,
  duracion_bloque,
  usar_horarios_diferenciados,
  semana_hora_apertura,
  semana_hora_cierre,
  finde_hora_apertura,
  finde_hora_cierre
)
SELECT '08:00', '22:00', 30, FALSE, '08:00', '22:00', '09:00', '23:00'
WHERE NOT EXISTS (SELECT 1 FROM public.schedule_config);

-- Add comments
COMMENT ON TABLE public.schedule_config IS 'Singleton table for schedule configuration';
COMMENT ON COLUMN public.schedule_config.finde_pausa_inicio IS 'Weekend break start time (Saturday and Sunday)';
COMMENT ON COLUMN public.schedule_config.finde_pausa_fin IS 'Weekend break end time (Saturday and Sunday)';
COMMENT ON COLUMN public.schedule_config.finde_motivo_pausa IS 'Weekend break reason/description';
COMMENT ON COLUMN public.schedule_config.finde_pausa_dias_semana IS 'Days of week when weekend break applies (0=Sunday, 6=Saturday). NULL means all weekend days.';

-- Drop existing functions to allow signature changes
DROP FUNCTION IF EXISTS public.get_schedule_config();
DROP FUNCTION IF EXISTS public.update_schedule_config(UUID, TIME, TIME, INTEGER, TIME, TIME, TEXT, INTEGER[], BOOLEAN, TIME, TIME, TIME, TIME);
DROP FUNCTION IF EXISTS public.update_schedule_config CASCADE;

-- Create or replace get_schedule_config function
CREATE OR REPLACE FUNCTION public.get_schedule_config()
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
  finde_hora_cierre TIME,
  finde_pausa_inicio TIME,
  finde_pausa_fin TIME,
  finde_motivo_pausa TEXT,
  finde_pausa_dias_semana INTEGER[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.hora_apertura,
    sc.hora_cierre,
    sc.duracion_bloque,
    sc.pausa_inicio,
    sc.pausa_fin,
    sc.motivo_pausa,
    sc.pausa_dias_semana,
    sc.usar_horarios_diferenciados,
    sc.semana_hora_apertura,
    sc.semana_hora_cierre,
    sc.finde_hora_apertura,
    sc.finde_hora_cierre,
    sc.finde_pausa_inicio,
    sc.finde_pausa_fin,
    sc.finde_motivo_pausa,
    sc.finde_pausa_dias_semana
  FROM public.schedule_config sc
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_schedule_config IS 'Returns the current schedule configuration';

-- Create or replace update_schedule_config function
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
  -- Check if user is admin
  SELECT es_admin INTO v_is_admin
  FROM public.users
  WHERE id = p_user_id;

  IF NOT v_is_admin THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_schedule_config IS 'Updates schedule configuration (admin only). Creates table row if it does not exist.';
