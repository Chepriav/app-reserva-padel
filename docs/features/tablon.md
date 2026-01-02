# Sistema de Tablón de Anuncios

## Descripción

Sistema de comunicación interna con dos tipos de contenido:
- **Notificaciones**: Eventos automáticos del sistema (expiran en 7 días)
- **Anuncios**: Mensajes de administradores (expiran en 1 mes)

## Arquitectura

```
TablonScreen
├── Tab Anuncios (anuncios_admin)
└── Tab Notificaciones (notificaciones_usuario)

AdminScreen > Tab Mensajes
└── Crear/gestionar anuncios
```

## Tipos de Anuncio

| Tipo | Color | Uso |
|------|-------|-----|
| `info` | Azul | Información general |
| `aviso` | Naranja | Avisos importantes |
| `urgente` | Rojo | Avisos urgentes |
| `mantenimiento` | Gris | Mantenimiento de pistas |

## Tipos de Notificación

| Tipo | Evento |
|------|--------|
| `desplazamiento` | Reserva desplazada |
| `partida_solicitud` | Solicitud unirse partida |
| `partida_aceptada` | Solicitud aceptada |
| `partida_completa` | Partida completa (4/4) |
| `partida_cancelada` | Partida cancelada |
| `reserva_recordatorio` | Recordatorio reserva |

## UI/UX

### TablonScreen
- Dos tabs con badge de no leídos
- Pull-to-refresh
- Botón "Marcar leídas" para notificaciones

### AnuncioCard
- Borde izquierdo coloreado según tipo
- Badge rojo si no está leído
- Tap abre modal con contenido completo

### AdminScreen (Mensajes)
- Botón "Nuevo mensaje"
- Selector de tipo (4 opciones)
- Destinatarios: todos o seleccionados
- Lista de usuarios con búsqueda

## Hooks

```javascript
// Notificaciones
useNotificaciones(userId)

// Anuncios (usuario)
useAnuncios(userId)

// Anuncios (admin)
useAnunciosAdmin(userId, userName, onSuccess)

// Contador badge
useContadorTablon(userId)
```

## Expiración

- Notificaciones: 7 días
- Anuncios: 1 mes
- Limpieza automática vía función SQL + pg_cron
