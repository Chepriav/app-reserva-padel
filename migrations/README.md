# Migraciones de Base de Datos

## Instrucciones para ejecutar migraciones

### add_schedule_config.sql

Esta migración añade la funcionalidad de configuración de horarios, permitiendo a los administradores:
- Definir horarios de apertura y cierre personalizados
- Configurar pausas/descansos (ej: hora de comida de 14:00 a 16:30)
- Especificar días de la semana donde aplica la pausa

**Cómo ejecutar:**

1. Accede a tu proyecto en Supabase Dashboard
2. Ve a SQL Editor
3. Copia y pega el contenido del archivo `add_schedule_config.sql`
4. Ejecuta la query

**Qué crea:**
- Tabla `configuracion_horarios` con una fila inicial con valores por defecto
- Función `get_schedule_config()` para obtener la configuración
- Función `update_schedule_config()` para actualizar (solo admins)
- Row Level Security policies

**Configuración inicial:**
- Apertura: 08:00
- Cierre: 22:00
- Duración de bloque: 30 minutos
- Pausa: No configurada (NULL)

**Uso en la app:**
1. Como administrador, ve al Panel de Administración
2. Selecciona la pestaña "Configuración"
3. Configura los horarios según tus necesidades
4. Si deseas configurar una pausa (ej: hora de comida):
   - Marca "Habilitar pausa"
   - Define inicio y fin (ej: 14:00 - 16:30)
   - Opcionalmente selecciona días específicos
5. Guarda los cambios

Los bloques dentro de la pausa no se mostrarán en el calendario de reservas.
