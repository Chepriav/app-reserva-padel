# Sistema de Tablón de Anuncios

## Descripción

Sistema de comunicación interna con dos tipos de contenido:
- **Notificaciones**: Eventos automáticos del sistema (expiran en 7 días)
- **Anuncios**: Mensajes de administradores (expiran en 1 mes)

## Arquitectura

```
BulletinScreen (TablonScreen)
├── Tab Anuncios (anuncios_admin)
│   ├── Vista usuario: solo lectura
│   └── Vista admin: crear/eliminar anuncios
└── Tab Notificaciones (notificaciones_usuario)
    └── Marcar como leída/eliminar
```

**Nota**: La funcionalidad de creación y gestión de anuncios se movió desde AdminScreen al BulletinScreen para mejor UX.

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

### BulletinScreen (Usuario)
- Dos tabs con badge de no leídos
- Pull-to-refresh en ambos tabs
- Botón "Marcar leídas" para notificaciones
- Ver anuncios en modal completo

### BulletinScreen (Admin)
- Todo lo anterior, más:
- **Botón flotante "Nuevo mensaje"** (solo en tab Anuncios)
- **Botón eliminar** en cada AnnouncementCard (icono basura en esquina)
- **Botón eliminar** en AnnouncementModal (footer)
- CreateAnnouncementModal con:
  - Selector de tipo (4 opciones)
  - Destinatarios: todos o seleccionados
  - Lista de usuarios con búsqueda
- Confirmaciones con CustomAlert (web + mobile)

### AnnouncementCard
- Borde izquierdo coloreado según tipo
- Badge rojo si no está leído
- Tap abre modal con contenido completo
- Icono de eliminar (solo admin, esquina superior derecha)

## Hooks

```javascript
// Notificaciones
useNotifications(userId, onCountChange)
// Returns: { notifications, loading, refreshing, onRefresh, deleteNotification, markAsRead, markAllAsRead, countUnread }

// Anuncios (usuario)
useAnnouncements(userId, onCountChange)
// Returns: { announcements, loading, refreshing, selectedAnnouncement, onRefresh, viewAnnouncement, closeAnnouncement, countUnread, loadAnnouncements }

// Anuncios (admin) - API compatible con useAnnouncements
useAnnouncementsAdmin(userId, onCountChange)
// Returns: todo lo anterior + { users, creating, loadUsers, createAnnouncement, deleteAnnouncement }

// Contador badge
useBulletinCounter(userId)
// Returns: { announcementCount, notificationCount, totalCount, updateCounts }

// Sistema de alertas custom (web + mobile)
useAlert()
// Returns: { alertConfig, showAlert, showConfirmation, showCustomAlert, closeAlert }
```

## Expiración

- Notificaciones: 7 días
- Anuncios: 1 mes
- Limpieza automática vía función SQL + pg_cron

## Implementación Técnica

### Patrón Condicional Hook
BulletinScreen usa hooks diferentes según el rol del usuario:

```javascript
const adminHook = useAnnouncementsAdmin(user?.id, refreshBulletinBadge);
const userHook = useAnnouncements(user?.id, refreshBulletinBadge);
const announcementsHook = isAdmin ? adminHook : userHook;
```

**Importante**: `useAnnouncementsAdmin` debe ser API-compatible con `useAnnouncements` para que este patrón funcione.

### Sistema de Alertas Custom
Se usa `useAlert` y `CustomAlert` en lugar de `Alert.alert()` nativo para:
- Compatibilidad web (Alert.alert no funciona en navegadores)
- Diseño consistente en todas las plataformas
- Soporte para botones destructivos y confirmaciones

### Props Admin en Componentes
Los componentes `AnnouncementCard` y `AnnouncementModal` aceptan props opcionales:
- `isAdmin`: boolean para mostrar/ocultar funciones admin
- `onDelete`: handler para eliminar anuncios (solo si admin)

Esto permite reutilizar componentes sin duplicar código.
