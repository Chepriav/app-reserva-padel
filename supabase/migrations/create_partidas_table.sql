-- Tabla para gestionar partidas/solicitudes de jugadores
CREATE TABLE IF NOT EXISTS public.partidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Creador de la partida
  creador_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  creador_nombre TEXT NOT NULL,
  creador_vivienda TEXT NOT NULL,

  -- Vinculación opcional con reserva
  reserva_id UUID REFERENCES public.reservas(id) ON DELETE SET NULL,

  -- Fecha/hora (fija si hay reserva, null si es abierta)
  fecha DATE,
  hora_inicio TIME,
  hora_fin TIME,
  pista_nombre TEXT,

  -- Tipo de partida
  tipo TEXT NOT NULL DEFAULT 'con_reserva', -- 'con_reserva' o 'abierta'

  -- Descripción/mensaje del creador
  mensaje TEXT,

  -- Nivel preferido (opcional)
  nivel_preferido TEXT, -- 'principiante', 'intermedio', 'avanzado', 'profesional', null = cualquiera

  -- Estado
  estado TEXT NOT NULL DEFAULT 'buscando', -- 'buscando', 'completa', 'cancelada'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para los jugadores apuntados a una partida
CREATE TABLE IF NOT EXISTS public.partidas_jugadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id UUID NOT NULL REFERENCES public.partidas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL para externos
  usuario_nombre TEXT NOT NULL,
  usuario_vivienda TEXT, -- NULL para externos
  nivel_juego TEXT,
  es_externo BOOLEAN DEFAULT FALSE,

  -- Estado de solicitud: 'confirmado' (añadido por creador), 'pendiente' (solicita unirse), 'rechazado'
  estado TEXT NOT NULL DEFAULT 'confirmado',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un usuario solo puede apuntarse una vez a cada partida (solo para usuarios internos)
  UNIQUE(partida_id, usuario_id)
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_partidas_estado ON public.partidas(estado);
CREATE INDEX IF NOT EXISTS idx_partidas_fecha ON public.partidas(fecha);
CREATE INDEX IF NOT EXISTS idx_partidas_creador ON public.partidas(creador_id);
CREATE INDEX IF NOT EXISTS idx_partidas_jugadores_partida ON public.partidas_jugadores(partida_id);
CREATE INDEX IF NOT EXISTS idx_partidas_jugadores_usuario ON public.partidas_jugadores(usuario_id);

-- RLS Policies
ALTER TABLE public.partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas_jugadores ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden ver partidas
CREATE POLICY "Usuarios autenticados pueden ver partidas"
ON public.partidas FOR SELECT TO authenticated
USING (true);

-- Usuarios autenticados pueden crear partidas
CREATE POLICY "Usuarios autenticados pueden crear partidas"
ON public.partidas FOR INSERT TO authenticated
WITH CHECK (auth.uid() = creador_id);

-- Creadores pueden actualizar sus partidas
CREATE POLICY "Creadores pueden actualizar sus partidas"
ON public.partidas FOR UPDATE TO authenticated
USING (auth.uid() = creador_id);

-- Creadores pueden eliminar sus partidas
CREATE POLICY "Creadores pueden eliminar sus partidas"
ON public.partidas FOR DELETE TO authenticated
USING (auth.uid() = creador_id);

-- Todos pueden ver jugadores de partidas
CREATE POLICY "Usuarios autenticados pueden ver jugadores"
ON public.partidas_jugadores FOR SELECT TO authenticated
USING (true);

-- Usuarios pueden apuntarse a partidas (solicitar unirse)
CREATE POLICY "Usuarios pueden apuntarse a partidas"
ON public.partidas_jugadores FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = usuario_id
  OR
  -- El creador puede añadir jugadores a sus propias partidas (jugadores iniciales o externos)
  EXISTS (
    SELECT 1 FROM public.partidas
    WHERE id = partida_id AND creador_id = auth.uid()
  )
);

-- Usuarios pueden desapuntarse de partidas
CREATE POLICY "Usuarios pueden desapuntarse"
ON public.partidas_jugadores FOR DELETE TO authenticated
USING (auth.uid() = usuario_id);

-- Creadores pueden actualizar jugadores de sus partidas (aceptar/rechazar)
CREATE POLICY "Creadores pueden gestionar jugadores"
ON public.partidas_jugadores FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.partidas
    WHERE id = partida_id AND creador_id = auth.uid()
  )
);

-- Creadores pueden eliminar jugadores de sus partidas
CREATE POLICY "Creadores pueden eliminar jugadores"
ON public.partidas_jugadores FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.partidas
    WHERE id = partida_id AND creador_id = auth.uid()
  )
);
