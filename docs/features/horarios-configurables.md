# Horarios Configurables

Sistema de configuración de horarios que permite a los administradores definir:
- Horarios de apertura y cierre personalizados (unificados o diferenciados por día)
- Pausas/descansos durante el día (ej: hora de comida)

Los bloques horarios que caen dentro de una pausa no se muestran en el calendario de reservas.

## Arquitectura

### Base de Datos

**Tabla:** `configuracion_horarios` (singleton)
- `hora_apertura`, `hora_cierre`: TIME - Horario unificado
- `usar_horarios_diferenciados`: BOOLEAN - Habilita horarios diferenciados
- `semana_hora_apertura`, `semana_hora_cierre`: TIME - Lunes a Viernes
- `finde_hora_apertura`, `finde_hora_cierre`: TIME - Sábado y Domingo
- `duracion_bloque`: INTEGER - Duración de bloques en minutos
- `pausa_inicio`, `pausa_fin`: TIME - Horario de pausa
- `motivo_pausa`: TEXT
- `pausa_dias_semana`: INTEGER[] - Días donde aplica la pausa (0=Domingo, 6=Sábado)

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
  - Filtra bloques que caen en pausa

### Componentes

**ScheduleConfigSection.js**
- Toggle: "Usar horarios diferentes para semana y fin de semana"
- Formulario condicional: muestra inputs de semana/finde o unificado
- Toggle: "Habilitar pausa"
- Validaciones cliente + servidor

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

## Lógica de Pausa

Un bloque cae en pausa si:
```javascript
(bloqueInicio >= pausaInicio && bloqueInicio < pausaFin) ||
(bloqueFin > pausaInicio && bloqueFin <= pausaFin) ||
(bloqueInicio <= pausaInicio && bloqueFin >= pausaFin)
```

Y además:
- Si `pausaDiasSemana` es NULL → Aplica todos los días
- Si `pausaDiasSemana` es array → Aplica solo esos días

## Notas Técnicas

### Singleton Pattern
- Solo existe 1 fila en `configuracion_horarios`
- Índice único: `idx_configuracion_horarios_singleton`
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

**Ejecutar en:** Supabase Dashboard → SQL Editor
