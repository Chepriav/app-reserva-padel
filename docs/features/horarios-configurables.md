# Horarios Configurables

Sistema de configuración de horarios que permite a los administradores definir:
- Horarios de apertura y cierre personalizados (unificados o diferenciados por día)
- Pausas/descansos durante el día (ej: hora de comida)

Los bloques horarios que caen dentro de una pausa no se muestran en el calendario de reservas.

## Arquitectura

### Base de Datos

**Tabla:** `schedule_config` (singleton)
- `hora_apertura`, `hora_cierre`: TIME - Horario unificado
- `usar_horarios_diferenciados`: BOOLEAN - Habilita horarios diferenciados
- `semana_hora_apertura`, `semana_hora_cierre`: TIME - Lunes a Viernes
- `finde_hora_apertura`, `finde_hora_cierre`: TIME - Sábado y Domingo
- `duracion_bloque`: INTEGER - Duración de bloques en minutos
- **Pausas de Semana (Lunes-Viernes):**
  - `pausa_inicio`, `pausa_fin`: TIME - Horario de pausa
  - `motivo_pausa`: TEXT
  - `pausa_dias_semana`: INTEGER[] - Días donde aplica (0=Domingo, 6=Sábado)
- **Pausas de Fin de Semana (Sábado-Domingo):**
  - `finde_pausa_inicio`, `finde_pausa_fin`: TIME - Horario de pausa fin de semana
  - `finde_motivo_pausa`: TEXT
  - `finde_pausa_dias_semana`: INTEGER[] - Días donde aplica

**Funciones RPC:**
- `get_schedule_config()`: Lee configuración
- `update_schedule_config(...)`: Actualiza (solo admins)

### Servicios

**scheduleConfigService.js**
- `getConfig()`: Obtiene configuración actual
- `updateConfig(userId, config)`: Actualiza configuración con validaciones
- `isSlotInBreakTime(start, end, config, date)`: Verifica si bloque cae en pausa
- `filterBreakTimeSlots(slots, config, date)`: Filtra bloques en pausa

### Utilidades

**dateHelpers.js**
- `generateAvailableSlots(config, date)`: Genera bloques según configuración
  - Si `usar_horarios_diferenciados = true`: aplica horarios por día de semana
  - Si `usar_horarios_diferenciados = false`: usa horario unificado
  - Filtra bloques que caen en pausa (usando `shouldSkipSlot`)
- `shouldSkipSlot(start, end, config, date)`: Determina si un bloque cae en pausa
  - Detecta día de la semana (0=Domingo, 6=Sábado)
  - Aplica pausa de semana o fin de semana según corresponda
  - Si no hay pausa configurada para ese tipo de día, retorna false

### Componentes

**ScheduleConfigSection.js**
- Toggle: "Usar horarios diferentes para semana y fin de semana"
- Formulario condicional: muestra inputs de semana/finde o unificado
- Toggle: "Habilitar pausa" (para pausas de lunes a viernes)
- Toggle: "Habilitar pausa de fin de semana" (solo visible si horarios diferenciados activos)
- Validaciones cliente + servidor

**BreakTimesConfig.js** (componente reutilizable)
- Maneja la configuración de pausas de semana y fin de semana
- Props: `config`, `setConfig`, `breakEnabled`, `setBreakEnabled`, `weekendBreakEnabled`, `setWeekendBreakEnabled`, `showWeekend`

## Horarios Diferenciados (Weekday/Weekend)

### Lógica de Aplicación

`generateAvailableSlots(config, date)`:
1. Obtiene día de semana: `Date.getDay()` (0=Domingo, 6=Sábado)
2. Si `usar_horarios_diferenciados = true`:
   - Domingo o Sábado (0, 6) → usa `finde_hora_apertura/cierre`
   - Lunes-Viernes (1-5) → usa `semana_hora_apertura/cierre`
3. Si `false`: usa `hora_apertura/cierre` para todos los días

### Validaciones

**Cliente:**
- Si modo diferenciado: validar que ambos pares (semana + finde) estén completos
- Apertura < Cierre en cada par

**Servidor (RPC):**
- Admin check obligatorio
- Si `usar_horarios_diferenciados = true`:
  - Validar campos NO NULL
  - Validar apertura < cierre en ambos pares

### Backwards Compatibility

- Columnas nuevas son nullable
- Default: `usar_horarios_diferenciados = false`
- Si false, sistema funciona como antes (horario unificado)

## Lógica de Pausas Diferenciadas

### Selección de Pausa

Cuando `usar_horarios_diferenciados = true`:

1. **Determinar día de la semana:**
   ```javascript
   const dayOfWeek = date.getDay(); // 0=Domingo, 6=Sábado
   const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
   ```

2. **Seleccionar configuración de pausa:**
   - Si es **fin de semana** (sábado/domingo):
     - Usar `finde_pausa_inicio`, `finde_pausa_fin`, `finde_pausa_dias_semana`
     - Si no hay pausa configurada → **No aplicar pausa**
   - Si es **entre semana** (lunes-viernes):
     - Usar `pausa_inicio`, `pausa_fin`, `pausa_dias_semana`

3. **Si `usar_horarios_diferenciados = false`:**
   - Usar `pausa_inicio`, `pausa_fin`, `pausa_dias_semana` para **todos** los días

### Detección de Overlap

Un bloque cae en pausa si:
```javascript
(bloqueInicio >= pausaInicio && bloqueInicio < pausaFin) ||
(bloqueFin > pausaInicio && bloqueFin <= pausaFin) ||
(bloqueInicio <= pausaInicio && bloqueFin >= pausaFin)
```

Y además:
- Si `pausaDiasSemana` es NULL → Aplica todos los días (del tipo correspondiente)
- Si `pausaDiasSemana` es array → Aplica solo esos días

### Ejemplo de Uso

**Configuración:**
- Horarios diferenciados: ✓
- Pausa semana: 14:00-17:00 (lunes a viernes)
- Pausa fin de semana: 14:00-17:30 (sábado y domingo)

**Comportamiento:**
- Lunes 15:00-15:30 → Bloqueado (cae en pausa 14:00-17:00)
- Sábado 15:00-15:30 → Bloqueado (cae en pausa 14:00-17:30)
- Sábado 17:00-17:30 → Bloqueado (overlap con pausa que termina a 17:30)
- Sábado 17:30-18:00 → Disponible (pausa terminó)

## Notas Técnicas

### Singleton Pattern
- Solo existe 1 fila en `schedule_config`
- Índice único: `idx_schedule_config_singleton`
- UPDATE requiere WHERE clause: `WHERE TRUE` (Supabase security policy)

### Performance
- Config se obtiene en paralelo con reservas/bloqueos
- Filtrado de bloques en memoria (O(n))

### Compatibilidad
- Backwards compatible: si no hay config, usa valores por defecto de `constants/config.js`
- Fallback a horario unificado si campos específicos son NULL

## Migraciones

**Orden de ejecución:**
1. `add_schedule_config.sql` - Tabla inicial y funciones base
2. `add_weekday_weekend_schedules.sql` - Agrega horarios diferenciados
3. `fix_update_where_clause.sql` - Fix WHERE clause en UPDATE
4. `20260114180000_add_weekend_break_times.sql` - Agrega pausas de fin de semana
5. `20260114181500_fix_schedule_config_function.sql` - Fix nombre tabla usuarios → users

**Ejecutar en:** Supabase Dashboard → SQL Editor

### Migración de Pausas de Fin de Semana (20260114180000)

Agrega soporte para configurar pausas diferentes para fin de semana:

**Nuevas columnas:**
- `finde_pausa_inicio`: TIME
- `finde_pausa_fin`: TIME
- `finde_motivo_pausa`: TEXT
- `finde_pausa_dias_semana`: INTEGER[]

**Actualiza funciones:**
- `get_schedule_config()`: Retorna campos de pausas de fin de semana
- `update_schedule_config(...)`: Acepta y valida pausas de fin de semana

**Políticas RLS:**
- Mantiene las políticas existentes (lectura pública, escritura admin)
