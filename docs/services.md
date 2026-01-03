# Documentación de Servicios

## authService.supabase.js

### Autenticación
- `login(email, password)` - Inicia sesión
- `register(userData)` - Registra usuario (estado: pendiente)
- `logout()` - Cierra sesión
- `getCurrentUser()` - Obtiene usuario actual
- `resetPassword(email)` - Envía email de recuperación

### Perfil
- `updateProfile(userId, updates)` - Actualiza perfil
- `uploadProfilePhoto(userId, file)` - Sube foto de perfil

### Gestión Admin
- `getUsuariosPendientes()` - Lista usuarios pendientes
- `aprobarUsuario(userId)` - Aprueba usuario
- `rechazarUsuario(userId)` - Rechaza usuario
- `getAllUsers()` - Lista todos los usuarios
- `toggleAdmin(userId, esAdmin)` - Cambia rol admin

### Cambio de Vivienda
- `solicitarCambioVivienda(userId, nuevaVivienda)` - Solicita cambio
- `cancelarSolicitudVivienda(userId)` - Cancela solicitud
- `getSolicitudesCambioVivienda()` - Lista solicitudes (admin)
- `aprobarCambioVivienda(userId)` - Aprueba cambio
- `rechazarCambioVivienda(userId)` - Rechaza cambio

---

## reservationsService.supabase.js

> Archivo: `matchesService.js` | Export: `reservasService` / `reservationsService`

### Pistas
- `obtenerPistas()` - Lista de pistas

### Disponibilidad
- `obtenerDisponibilidad(pistaId, fecha)` - Horarios con disponibilidad, prioridad y bloqueos

### Reservas
- `crearReserva(reservaData)` - Crea reserva (usa RPC para prioridad)
- `cancelarReserva(reservaId, usuarioId)` - Cancela reserva
- `obtenerReservasUsuario(userId)` - Reservas del usuario
- `desplazarReservaYCrear(reservaADesplazar, nuevaData)` - Desplazamiento atómico

### Bloqueos (admin)
- `obtenerBloqueos(pistaId, fecha)` - Lista bloqueos
- `crearBloqueo(pistaId, fecha, horaInicio, horaFin, motivo, creadoPor)` - Crea bloqueo
- `eliminarBloqueo(bloqueoId)` - Elimina bloqueo

---

## matchesService.js

> Archivo: `matchesService.js` | Export: `partidasService` / `matchesService`

### Consultas
- `getActiveMatches()` / `obtenerPartidasActivas()` - Partidas buscando jugadores
- `getMyMatches(userId)` / `obtenerMisPartidas()` - Partidas creadas por usuario
- `getEnrolledMatches(userId)` / `obtenerPartidasApuntado()` - Partidas donde está inscrito

### Gestión
- `createMatch(data)` / `crearPartida()` - Crea partida/clase
- `editMatch(id, creadorId, updates)` / `editarPartida()` - Edita partida
- `cancelMatch(id, creadorId)` / `cancelarPartida()` - Cancela partida
- `closeClass(id, creadorId)` / `cerrarClase()` - Cierra inscripciones (solo clases)

### Jugadores
- `requestToJoin(id, usuario)` / `solicitarUnirse()` - Solicita unirse
- `acceptRequest(usuarioId, partidaId, creadorId)` / `aceptarSolicitud()` - Acepta solicitud
- `rejectRequest(usuarioId, partidaId)` / `rechazarSolicitud()` - Rechaza solicitud
- `leaveMatch(id, userId)` / `desapuntarsePartida()` - Se desapunta
- `cancelRequest(id, userId)` / `cancelarSolicitud()` - Cancela solicitud propia
- `addPlayerToMatch(id, creadorId, data)` / `anadirJugadorAPartida()` - Añade jugador
- `removePlayer(jugadorId, id, creadorId)` / `eliminarJugador()` - Elimina jugador

---

## bulletinService.js

> Archivo: `bulletinService.js` | Export: `tablonService` / `bulletinService`

### Notificaciones (usuario)
- `getNotifications(userId)` / `obtenerNotificaciones()` - Lista notificaciones
- `countUnreadNotifications(userId)` / `contarNotificacionesNoLeidas()` - Cuenta no leídas
- `markNotificationAsRead(id)` / `marcarNotificacionLeida()` - Marca como leída
- `markAllAsRead(userId)` / `marcarTodasLeidas()` - Marca todas
- `deleteNotification(id)` / `eliminarNotificacion()` - Elimina
- `createNotification(userId, tipo, titulo, mensaje, datos)` / `crearNotificacion()` - Crea

### Anuncios (usuario)
- `getAnnouncementsForUser(userId)` / `obtenerAnunciosParaUsuario()` - Lista anuncios
- `countUnreadAnnouncements(userId)` / `contarAnunciosNoLeidos()` - Cuenta no leídos
- `markAnnouncementAsRead(id, userId)` / `marcarAnuncioLeido()` - Marca como leído

### Anuncios (admin)
- `getAllAnnouncements()` / `obtenerTodosAnuncios()` - Lista todos
- `createAnnouncement(...)` / `crearAnuncio()` - Crea anuncio
- `deleteAnnouncement(id)` / `eliminarAnuncio()` - Elimina
- `getApprovedUsers()` / `obtenerUsuariosAprobados()` - Para selector destinatarios

---

## notificationService.js

### Push Nativo (Expo)
- `registerForPushNotifications(userId)` - Registra token
- `removePushToken(userId)` - Elimina token

### Envío
- `sendPushNotification(tokens, title, body, data)` - Envía push
- `notifyViviendaChange(userId, aprobado, viviendaNueva)` - Notifica cambio vivienda
- `notifyReservationDisplacement(userId, reservaInfo)` - Notifica desplazamiento
- `notifyPartidaSolicitud/Aceptada/Completa/Cancelada(...)` - Notificaciones de partidas

---

## webPushService.js

- `isSupported()` - Verifica soporte Web Push
- `subscribe(userId)` - Suscribe y guarda
- `unsubscribe(userId)` - Cancela suscripción

---

## Context API

### useAuth() - AuthContext
```javascript
const {
  user,                      // Usuario actual
  isAuthenticated,           // Boolean
  login, logout, register, updateProfile, resetPassword,
} = useAuth();
```

### useReservations() - ReservationsContext
```javascript
const {
  reservations,              // Reservas del usuario
  courts,                    // Pistas disponibles
  loading,
  createReservation,
  cancelReservation,
  getAvailability,
  reloadReservations,
} = useReservations();
```

---

## Hooks Principales

| Hook | Archivo | Uso |
|------|---------|-----|
| `useSchedules` | useSchedules.js | Carga horarios día/semana |
| `useBlockouts` | useBloqueos.js | Bloqueos admin |
| `useSlotSelection` | useSlotSelection.js | Selección de horarios |
| `useMatches` | usePartidas.js | Lista de partidas |
| `useMatchesActions` | usePartidas.js | Acciones de partidas |
| `useNotifications` | useTablon.js | Notificaciones usuario |
| `useAnnouncements` | useTablon.js | Anuncios usuario |
| `useBulletinCounter` | useTablon.js | Contador del badge |
