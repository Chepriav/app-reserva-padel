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

## reservasService.supabase.js

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

## partidasService.js

### Consultas
- `obtenerPartidasActivas()` - Partidas buscando jugadores
- `obtenerMisPartidas(userId)` - Partidas creadas por usuario
- `obtenerPartidasApuntado(userId)` - Partidas donde está inscrito

### Gestión
- `crearPartida(partidaData)` - Crea partida/clase
- `editarPartida(partidaId, creadorId, updates)` - Edita partida
- `cancelarPartida(partidaId, creadorId)` - Cancela partida
- `cerrarClase(partidaId, creadorId)` - Cierra inscripciones (solo clases)

### Jugadores
- `solicitarUnirse(partidaId, usuario)` - Solicita unirse
- `aceptarSolicitud(usuarioId, partidaId, creadorId)` - Acepta solicitud
- `rechazarSolicitud(usuarioId, partidaId)` - Rechaza solicitud
- `desapuntarsePartida(partidaId, usuarioId)` - Se desapunta
- `cancelarSolicitud(partidaId, userId)` - Cancela solicitud propia
- `anadirJugadorAPartida(partidaId, creadorId, jugadorData)` - Añade jugador
- `eliminarJugador(jugadorId, partidaId, creadorId)` - Elimina jugador

---

## tablonService.js

### Notificaciones (usuario)
- `obtenerNotificaciones(usuarioId)` - Lista notificaciones
- `contarNotificacionesNoLeidas(usuarioId)` - Cuenta no leídas
- `marcarNotificacionLeida(notificacionId)` - Marca como leída
- `marcarTodasLeidas(usuarioId)` - Marca todas
- `eliminarNotificacion(notificacionId)` - Elimina
- `crearNotificacion(usuarioId, tipo, titulo, mensaje, datos)` - Crea

### Anuncios (usuario)
- `obtenerAnunciosParaUsuario(usuarioId)` - Lista anuncios
- `contarAnunciosNoLeidos(usuarioId)` - Cuenta no leídos
- `marcarAnuncioLeido(anuncioId, usuarioId)` - Marca como leído

### Anuncios (admin)
- `obtenerTodosAnuncios()` - Lista todos
- `crearAnuncio(creadorId, creadorNombre, titulo, mensaje, tipo, destinatarios, usuariosIds)` - Crea
- `eliminarAnuncio(anuncioId)` - Elimina
- `obtenerUsuariosAprobados()` - Para selector destinatarios

---

## notificationService.js

### Push Nativo (Expo)
- `registerForPushNotifications(userId)` - Registra token
- `removePushToken(userId)` - Elimina token
- `savePushToken(userId, token)` - Guarda en BD
- `getUserPushTokens(userId)` - Obtiene tokens

### Envío
- `sendPushNotification(tokens, title, body, data)` - Envía push
- `notifyViviendaChange(userId, aprobado, viviendaNueva)` - Notifica cambio vivienda
- `notifyReservationDisplacement(userId, reservaInfo)` - Notifica desplazamiento

### Partidas
- `notifyPartidaSolicitud(creadorId, solicitanteNombre, partidaInfo)`
- `notifyPartidaAceptada(usuarioId, creadorNombre, partidaInfo)`
- `notifyPartidaCompleta(jugadoresIds, creadorNombre, partidaInfo)`
- `notifyPartidaCancelada(jugadoresIds, creadorNombre, partidaInfo)`

### Listeners
- `addNotificationListeners(onReceived, onResponse)` - Configura handlers

---

## webPushService.js

- `isSupported()` - Verifica soporte Web Push
- `requestPermission()` - Solicita permiso
- `subscribe(userId)` - Suscribe y guarda
- `unsubscribe(userId)` - Cancela suscripción
- `saveSubscription(userId, subscription)` - Guarda en BD
- `showLocalNotification(title, body, data)` - Notificación local

---

## storageService.supabase.js

- `uploadImage(bucket, path, file)` - Sube imagen
- `getPublicUrl(bucket, path)` - Obtiene URL pública
- `deleteImage(bucket, path)` - Elimina imagen

---

## Context API

### AuthContext
```javascript
const {
  user,                      // Usuario actual
  isAuthenticated,           // Boolean
  notificacionesPendientes,  // Notificaciones de desplazamiento
  login, logout, register, updateProfile, resetPassword,
  marcarNotificacionesLeidas,
} = useAuth();
```

### ReservasContext
```javascript
const {
  reservas,                  // Reservas del usuario
  pistas,                    // Pistas disponibles
  loading,
  crearReserva,
  cancelarReserva,
  obtenerDisponibilidad,
  recargarReservas,
} = useReservas();
```
