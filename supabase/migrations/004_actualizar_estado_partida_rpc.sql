-- Función RPC para actualizar el estado de una partida tras desapuntarse
-- Usa SECURITY DEFINER para bypassear RLS (el usuario ya verificó que puede desapuntarse)

CREATE OR REPLACE FUNCTION public.actualizar_estado_partida_tras_salida(
  p_partida_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estado_actual TEXT;
  v_jugadores_confirmados INTEGER;
  v_nuevo_estado TEXT;
BEGIN
  -- Obtener estado actual
  SELECT estado INTO v_estado_actual
  FROM partidas
  WHERE id = p_partida_id;

  -- Si no existe o está cancelada, no hacer nada
  IF v_estado_actual IS NULL OR v_estado_actual = 'cancelada' THEN
    RETURN FALSE;
  END IF;

  -- Contar jugadores confirmados (sin incluir al que acaba de salir)
  SELECT COUNT(*) INTO v_jugadores_confirmados
  FROM partidas_jugadores
  WHERE partida_id = p_partida_id AND estado = 'confirmado';

  -- Calcular nuevo estado (creador cuenta como 1 + jugadores confirmados)
  IF (1 + v_jugadores_confirmados) >= 4 THEN
    v_nuevo_estado := 'completa';
  ELSE
    v_nuevo_estado := 'buscando';
  END IF;

  -- Actualizar estado
  UPDATE partidas
  SET estado = v_nuevo_estado, updated_at = NOW()
  WHERE id = p_partida_id;

  RETURN TRUE;
END;
$$;

-- Dar permisos a usuarios autenticados para ejecutar la función
GRANT EXECUTE ON FUNCTION public.actualizar_estado_partida_tras_salida(UUID) TO authenticated;
