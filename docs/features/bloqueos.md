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

## Validaciones

1. No se pueden bloquear horas con reserva existente
2. Solo admins pueden crear/eliminar (RLS en Supabase)
3. Bloqueos se consultan en paralelo con reservas
