# Sistema de Bloqueos de Horarios

## Descripción

Sistema que permite a administradores bloquear horarios específicos en las pistas. Los horarios bloqueados no pueden ser reservados.

## UI Modo Admin

1. Admin activa switch "Bloquear" en HomeScreen
2. Header cambia a color rojo
3. Tap en bloque libre → Añade a selección
4. Tap en bloque bloqueado → Añade a desbloquear
5. Botón flotante confirma acción
6. Modal para ingresar motivo (opcional)

## UI Usuario Normal

- Bloques bloqueados: fondo gris, borde rojo
- No se pueden seleccionar
- Al tocar → Alert muestra el motivo

## Visualización

- **Fondo**: `colors.disabled` (gris)
- **Borde**: `colors.bloqueado` (rojo) con `borderWidth: 2`
- **Icono**: candado en esquina
- **Opacidad**: 0.7

## Funciones del Servicio

```javascript
// reservasService.supabase.js
obtenerBloqueos(pistaId, fecha)
crearBloqueo(pistaId, fecha, horaInicio, horaFin, motivo, creadoPor)
eliminarBloqueo(bloqueoId)
```

## Hook useBloqueos

```javascript
const {
  modoBloqueo,
  setModoBloqueo,
  bloquesABloquear,
  bloquesADesbloquear,
  toggleBloqueABloquear,
  toggleBloqueADesbloquear,
  crearBloqueos,
  eliminarBloqueos,
  modalBloqueo,
  procesando,
} = useBloqueos({ pistaSeleccionada, userId, mostrarAlerta, onRecargarHorarios });
```

## Cancelación automática de reservas

Cuando un admin bloquea un horario que tiene una reserva activa:

1. La reserva se cancela automáticamente (`estado = 'cancelada'`)
2. Si la reserva tiene una partida vinculada, también se cancela
3. Se notifica a todos los usuarios de la vivienda afectada:
   - Notificación en el tablón (tipo `bloqueo_cancelacion`)
   - Push notification (web + móvil)
   - El mensaje incluye el motivo del bloqueo

### Flujo

```
Admin selecciona bloques (con o sin reserva) → Confirma bloqueo con motivo
→ createBlockout() detecta reservas en conflicto
→ Cancela cada reserva afectada
→ Cancela partidas vinculadas
→ notifyViviendaBlockoutCancellation(vivienda, reservaInfo)
→ Inserta el bloqueo
```

## Validaciones

1. Solo admins pueden crear/eliminar (RLS en Supabase)
2. Bloqueos se consultan en paralelo con reservas
