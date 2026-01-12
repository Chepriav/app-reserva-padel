# Esquemas de Base de Datos (PostgreSQL/Supabase)

## Tabla: users
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT NOT NULL,
  vivienda TEXT NOT NULL,           -- Formato "1-3-B" (escalera-piso-puerta)
  vivienda_solicitada TEXT,         -- Cambio de vivienda pendiente
  nivel_juego TEXT,                 -- 'principiante'|'intermedio'|'avanzado'|'profesional'
  foto_perfil TEXT,                 -- URL de Supabase Storage
  es_admin BOOLEAN DEFAULT FALSE,
  es_manager BOOLEAN DEFAULT FALSE,
  estado_aprobacion TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Tabla: pistas
```sql
CREATE TABLE public.pistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  techada BOOLEAN DEFAULT FALSE,
  con_luz BOOLEAN DEFAULT TRUE,
  capacidad_jugadores INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Tabla: reservas
```sql
CREATE TABLE public.reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pista_id UUID NOT NULL REFERENCES public.pistas(id),
  pista_nombre TEXT NOT NULL,
  usuario_id UUID NOT NULL REFERENCES public.users(id),
  usuario_nombre TEXT NOT NULL,
  vivienda TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion INTEGER NOT NULL,
  estado TEXT DEFAULT 'confirmada',
  prioridad TEXT DEFAULT 'primera',    -- 'primera' (G) o 'segunda' (P)
  conversion_timestamp TIMESTAMPTZ,
  conversion_rule TEXT,
  converted_at TIMESTAMPTZ,
  jugadores TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Tabla: bloqueos_horarios
```sql
CREATE TABLE public.bloqueos_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pista_id UUID NOT NULL REFERENCES public.pistas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  motivo TEXT,
  creado_por UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pista_id, fecha, hora_inicio)
);
```

## Tabla: partidas
```sql
CREATE TABLE public.partidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id UUID NOT NULL REFERENCES public.users(id),
  creador_nombre TEXT NOT NULL,
  creador_vivienda TEXT NOT NULL,
  reserva_id UUID REFERENCES public.reservas(id),
  fecha DATE,
  hora_inicio TIME,
  hora_fin TIME,
  pista_nombre TEXT,
  tipo TEXT DEFAULT 'abierta',
  mensaje TEXT,
  nivel_preferido TEXT,
  estado TEXT DEFAULT 'buscando',
  es_clase BOOLEAN DEFAULT FALSE,
  niveles TEXT[],
  min_participantes INTEGER DEFAULT 4,
  max_participantes INTEGER DEFAULT 4,
  precio_alumno DECIMAL(10,2),
  precio_grupo DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Tabla: partidas_jugadores
```sql
CREATE TABLE public.partidas_jugadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id UUID NOT NULL REFERENCES public.partidas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.users(id),
  usuario_nombre TEXT NOT NULL,
  usuario_vivienda TEXT,
  nivel_juego TEXT,
  es_externo BOOLEAN DEFAULT FALSE,
  estado TEXT DEFAULT 'confirmado',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Tabla: notificaciones_usuario
```sql
CREATE TABLE public.notificaciones_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  datos JSONB DEFAULT '{}',
  leida BOOLEAN DEFAULT FALSE,
  expira_en TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Tabla: anuncios_admin
```sql
CREATE TABLE public.anuncios_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id UUID NOT NULL REFERENCES public.users(id),
  creador_nombre TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT DEFAULT 'info',
  destinatarios TEXT DEFAULT 'todos',
  expira_en TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Tabla: anuncios_destinatarios
```sql
CREATE TABLE public.anuncios_destinatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anuncio_id UUID NOT NULL REFERENCES public.anuncios_admin(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leido BOOLEAN DEFAULT FALSE,
  leido_en TIMESTAMPTZ,
  UNIQUE(anuncio_id, usuario_id)
);
```

## Tabla: push_tokens
```sql
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);
```

## Tabla: web_push_subscriptions
```sql
CREATE TABLE public.web_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

## Tabla: configuracion_horarios
```sql
CREATE TABLE public.configuracion_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hora_apertura TIME NOT NULL DEFAULT '08:00',
  hora_cierre TIME NOT NULL DEFAULT '22:00',
  duracion_bloque INTEGER NOT NULL DEFAULT 30,
  pausa_inicio TIME,                    -- Inicio de pausa (ej: hora de comida)
  pausa_fin TIME,                       -- Fin de pausa
  motivo_pausa TEXT DEFAULT 'Hora de comida',
  pausa_dias_semana INTEGER[],         -- Días donde aplica (0=Dom, 6=Sáb), NULL=todos
  actualizado_por UUID REFERENCES public.users(id),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Funciones RPC:**
- `get_schedule_config()`: Obtiene la configuración actual de horarios
- `update_schedule_config(...)`: Actualiza la configuración (solo admins)

## Mapeo de Campos (JavaScript ↔ PostgreSQL)

| JavaScript | PostgreSQL |
|------------|------------|
| `horaInicio` | `hora_inicio` |
| `horaFin` | `hora_fin` |
| `creadorId` | `creador_id` |
| `usuarioId` | `usuario_id` |
| `pistaId` | `pista_id` |
| `partidaId` | `partida_id` |
| `anuncioId` | `anuncio_id` |
| `esAdmin` | `es_admin` |
| `esManager` | `es_manager` |
| `esClase` | `es_clase` |
| `esExterno` | `es_externo` |
| `createdAt` | `created_at` |
| `expiraEn` | `expira_en` |
