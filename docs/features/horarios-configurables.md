# Horarios Configurables

## Descripción

Sistema de configuración de horarios que permite a los administradores definir:
- Horarios de apertura y cierre personalizados
- Pausas/descansos durante el día (ej: hora de comida)
- Días específicos donde aplican las pausas

Los bloques horarios que caen dentro de una pausa no se muestran en el calendario de reservas.

## Casos de Uso

### 1. Hora de Comida
**Problema:** Las pistas no deben ser reservables de 14:00 a 16:30 para la hora de comida.

**Solución:**
1. Admin accede a Panel de Administración → Configuración
2. Habilita "Pausa"
3. Define:
   - Inicio: 14:00
   - Fin: 16:30
   - Motivo: "Hora de comida"
4. Guarda

**Resultado:** Los bloques de 14:00-14:30, 14:30-15:00, ..., 16:00-16:30 no aparecen en el calendario.

### 2. Pausa Solo Entre Semana
**Problema:** La hora de comida solo aplica de lunes a viernes, no fines de semana.

**Solución:**
1. Configura la pausa (14:00 - 16:30)
2. Selecciona días: Lun, Mar, Mié, Jue, Vie
3. Guarda

**Resultado:** Los sábados y domingos mostrarán todos los bloques, incluyendo 14:00-16:30.

### 3. Horario de Verano
**Problema:** En verano las pistas abren hasta las 23:00 en lugar de 22:00.

**Solución:**
1. Admin accede a Configuración
2. Cambia "Hora de Cierre" de 22:00 a 23:00
3. Guarda

**Resultado:** Aparecen nuevos bloques: 22:00-22:30, 22:30-23:00.

## Arquitectura

### Base de Datos

**Tabla:** `configuracion_horarios`
```sql
- hora_apertura: TIME (ej: '08:00')
- hora_cierre: TIME (ej: '22:00')
- duracion_bloque: INTEGER (minutos, ej: 30)
- pausa_inicio: TIME (nullable)
- pausa_fin: TIME (nullable)
- motivo_pausa: TEXT
- pausa_dias_semana: INTEGER[] (0=Domingo, 6=Sábado)
```

**Funciones RPC:**
- `get_schedule_config()`: Lee configuración
- `update_schedule_config(...)`: Actualiza (solo admins)

### Servicios

**scheduleConfigService.js**
- `getConfig()`: Obtiene configuración actual
- `updateConfig(userId, config)`: Actualiza configuración (valida permisos)
- `isSlotInBreakTime(start, end, config, date)`: Verifica si un bloque cae en pausa
- `filterBreakTimeSlots(slots, config, date)`: Filtra bloques en pausa

**reservationsService.supabase.js**
- `getAvailability()`: Actualizado para obtener config y filtrar bloques

### Componentes

**ScheduleConfigSection.js**
- Formulario de configuración para admins
- Inputs para apertura/cierre
- Toggle para habilitar pausa
- Selector de días de la semana
- Validaciones y feedback

### Utilidades

**dateHelpers.js**
- `generateAvailableSlots(config, date)`: Actualizado para aceptar config opcional
- `shouldSkipSlot(start, end, config, date)`: Helper para filtrar bloques en pausa

## Flujo de Datos

```
1. Usuario accede a HomeScreen
   ↓
2. HomeScreen usa useSchedules()
   ↓
3. useSchedules llama a reservationsService.getAvailability()
   ↓
4. getAvailability obtiene en paralelo:
   - Reservas existentes
   - Bloqueos admin
   - Configuración de horarios (scheduleConfigService.getConfig())
   ↓
5. getAvailability llama a generateAvailableSlots(config, fecha)
   ↓
6. generateAvailableSlots:
   - Genera bloques desde apertura hasta cierre
   - Por cada bloque, llama a shouldSkipSlot()
   - Filtra bloques que caen en pausa
   ↓
7. Retorna solo bloques reservables
   ↓
8. HomeScreen muestra bloques filtrados
```

## Validaciones

### En el Cliente (ScheduleConfigSection)
- Hora apertura < Hora cierre
- Inicio pausa < Fin pausa
- Duración bloque entre 15 y 120 minutos

### En el Servidor (RPC update_schedule_config)
- Usuario es admin
- Hora apertura < Hora cierre
- Inicio pausa < Fin pausa
- Duración bloque entre 15 y 120 minutos

## Migraciones

**Archivo:** `migrations/add_schedule_config.sql`

**Pasos:**
1. Crear tabla `configuracion_horarios`
2. Crear índice único (singleton pattern)
3. Insertar fila con configuración por defecto
4. Crear función `get_schedule_config()`
5. Crear función `update_schedule_config(...)`
6. Configurar Row Level Security

**Ejecutar en:** Supabase Dashboard → SQL Editor

## Comportamiento

### Bloques Reservables
Un bloque es reservable si:
- ✅ Está dentro del horario de apertura/cierre
- ✅ NO está en la pausa configurada
- ✅ NO está bloqueado por admin (tabla bloqueos_horarios)
- ✅ NO está reservado por otro usuario

### Lógica de Pausa
Un bloque cae en pausa si:
```javascript
(bloqueInicio >= pausaInicio && bloqueInicio < pausaFin) ||
(bloqueFin > pausaInicio && bloqueFin <= pausaFin) ||
(bloqueInicio <= pausaInicio && bloqueFin >= pausaFin)
```

Y además:
- Si `pausaDiasSemana` es NULL → Aplica todos los días
- Si `pausaDiasSemana` es array → Aplica solo esos días (0=Dom, 6=Sáb)

### Días de la Semana
JavaScript `Date.getDay()`:
```
0 = Domingo
1 = Lunes
2 = Martes
3 = Miércoles
4 = Jueves
5 = Viernes
6 = Sábado
```

## Ejemplos de Configuración

### Configuración Estándar
```javascript
{
  horaApertura: '08:00',
  horaCierre: '22:00',
  duracionBloque: 30,
  pausaInicio: '14:00',
  pausaFin: '16:30',
  motivoPausa: 'Hora de comida',
  pausaDiasSemana: null  // Todos los días
}
```

### Solo Entre Semana
```javascript
{
  horaApertura: '08:00',
  horaCierre: '22:00',
  duracionBloque: 30,
  pausaInicio: '14:00',
  pausaFin: '16:30',
  motivoPausa: 'Hora de comida',
  pausaDiasSemana: [1, 2, 3, 4, 5]  // Lun-Vie
}
```

### Sin Pausa
```javascript
{
  horaApertura: '08:00',
  horaCierre: '22:00',
  duracionBloque: 30,
  pausaInicio: null,
  pausaFin: null,
  motivoPausa: null,
  pausaDiasSemana: null
}
```

## Impacto en Reservas Existentes

- ✅ Las reservas existentes NO se modifican
- ✅ Los usuarios pueden mantener reservas en horarios que luego se configuran como pausa
- ⚠️ Las nuevas reservas NO podrán usar bloques en pausa
- ℹ️ Si se reduce el horario de cierre, las reservas futuras en esos horarios seguirán vigentes

## Testing

### Casos de Prueba
1. ✅ Admin puede ver pestaña "Configuración"
2. ✅ Usuario no-admin NO ve pestaña "Configuración"
3. ✅ Guardar configuración sin pausa
4. ✅ Guardar configuración con pausa
5. ✅ Pausa aplicada todos los días
6. ✅ Pausa aplicada solo días específicos
7. ✅ Bloques en pausa no aparecen en calendario
8. ✅ Bloques fuera de pausa sí aparecen
9. ✅ Validación: apertura < cierre
10. ✅ Validación: inicio pausa < fin pausa

## Notas Técnicas

### Performance
- Config se obtiene en paralelo con reservas/bloqueos (no impacta latencia)
- Filtrado de bloques ocurre en memoria (O(n) donde n = bloques)
- Sin queries adicionales por bloque

### Singleton Pattern
- Solo existe 1 fila en `configuracion_horarios`
- Índice único garantiza esto: `idx_configuracion_horarios_singleton`
- Si se necesitan múltiples configs (verano/invierno), agregar campo `activa`

### Compatibilidad
- Backwards compatible: si no hay config, usa valores por defecto
- Si falla obtener config, usa SCHEDULE_CONFIG de constants/config.js
