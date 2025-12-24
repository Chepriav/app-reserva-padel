# CLAUDE.md

Guía para Claude Code (claude.ai/code) y desarrolladores que trabajan en este repositorio.

## Descripción del Proyecto

Aplicación móvil React Native (Expo) y PWA para gestionar reservas de pistas de pádel en una urbanización. Los residentes pueden reservar turnos, ver disponibilidad y administrar sus reservas. Incluye sistema de autenticación con aprobación de administrador, sistema de prioridades (Garantizada/Provisional) por vivienda, y subida de fotos de perfil.

## Stack Tecnológico

- **Frontend**: React Native + Expo (compatible con iOS, Android y Web/PWA)
- **Backend**: Supabase (Authentication + PostgreSQL + Edge Functions)
- **Almacenamiento de Imágenes**: Supabase Storage
- **Hosting Web**: Vercel
- **Testing**: Jest

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Ejecutar en plataformas específicas
npm run ios      # Requiere macOS + Xcode
npm run android  # Requiere Android Studio
npm run web      # Navegador web (PWA)

# Testing
npm test                    # Ejecutar todos los tests
npm test -- --watch         # Modo watch
npm test -- NombreArchivo   # Test específico

# Linting
npm run lint       # Verificar código
npm run lint:fix   # Corregir automáticamente
```

## Estructura del Proyecto

```
App_reserva_padel_urbanizacion/
├── App.js                          # Punto de entrada - AuthProvider + ReservasProvider
├── app.json                        # Configuración Expo
├── package.json
├── vercel.json                     # Configuración despliegue Vercel
├── __tests__/                      # Tests unitarios
│   ├── validators.test.js          # Tests de validadores
│   └── dateHelpers.test.js         # Tests de helpers de fecha
├── public/                         # Assets PWA
│   ├── manifest.json               # Manifest de la PWA
│   └── service-worker.js           # Service Worker para offline
└── src/
    ├── screens/                    # Pantallas de la aplicación
    │   ├── LoginScreen.js          # Inicio de sesión + recuperar contraseña
    │   ├── RegistroScreen.js       # Registro de nuevos usuarios
    │   ├── HomeScreen.js           # Pantalla principal - crear reservas
    │   ├── ReservasScreen.js       # Mis reservas (próximas/pasadas)
    │   ├── PerfilScreen.js         # Perfil de usuario - editar datos/foto
    │   └── AdminScreen.js          # Panel admin - aprobar/rechazar usuarios
    ├── components/
    │   └── CustomAlert.js          # Alertas personalizadas cross-platform
    ├── navigation/
    │   ├── AppNavigator.js         # Navegación principal (auth + tabs)
    │   └── TabNavigator.js         # Tabs: Home, Reservas, Perfil, Admin
    ├── context/
    │   ├── AuthContext.js          # Estado de autenticación global
    │   └── ReservasContext.js      # Estado de reservas global
    ├── services/
    │   ├── supabaseConfig.js       # Configuración cliente Supabase
    │   ├── authService.supabase.js # Servicio de autenticación
    │   ├── reservasService.supabase.js  # Servicio de reservas + RPCs
    │   ├── storageService.supabase.js   # Servicio de almacenamiento de imágenes
    │   ├── notificationService.js  # Push notifications + recordatorios locales
    │   └── registerServiceWorker.js # Registro SW para PWA
    ├── utils/
    │   ├── dateHelpers.js          # Funciones de fecha/hora
    │   └── validators.js           # Validaciones de formularios
    └── constants/
        ├── colors.js               # Paleta de colores
        └── config.js               # Configuración de horarios y límites
```

## Sistema de Prioridades (Garantizada/Provisional)

### Concepto
El sistema limita reservas **por vivienda** (no por usuario):
- **Primera reserva** → Garantizada (G) - No puede ser desplazada
- **Segunda reserva** → Provisional (P) - Puede ser desplazada por otra vivienda

### Reglas de Conversión Automática P → G

| Escenario | Regla | Tiempo de Conversión |
|-----------|-------|---------------------|
| Continuidad | G termina exactamente cuando P empieza | Cuando G termine |
| Mismo día | G termina, P existe mismo día (<3h gap) | 90 min después de que G termine |
| Gap > 3h | G y P mismo día pero >3h separación | 24h después de que G termine |
| Diferente día | G termina, P existe en otro día | 24h después de que G termine |
| Sin G - mismo día | Solo existe P para hoy | 90 min desde creación |
| Sin G - diferente día | Solo existe P para otro día | 24h desde creación |

### Desplazamiento
Una vivienda puede desplazar la reserva P de otra vivienda si:
- La reserva es Provisional (P)
- Faltan más de 24 horas para la reserva
- La vivienda que desplaza tiene su primera reserva disponible

### Implementación Técnica
- **RPC `crear_reserva_con_prioridad`**: Calcula prioridad y tiempo de conversión automáticamente
- **RPC `desplazar_reserva_y_crear_nueva`**: Desplazamiento atómico con notificación
- **RPC `process_pending_conversions`**: Procesa conversiones pendientes (llamado por cron)
- **Cron Job (pg_cron)**: Ejecuta cada 15 minutos para procesar conversiones

### Columnas adicionales en `reservas`
```sql
prioridad TEXT DEFAULT 'primera',  -- 'primera' (G) o 'segunda' (P)
conversion_timestamp TIMESTAMPTZ,   -- Cuándo convertir P a G
conversion_rule TEXT,               -- Regla aplicada
converted_at TIMESTAMPTZ            -- Cuándo se convirtió
```

## Estructura de Datos en PostgreSQL

### Tabla: `users`
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT NOT NULL,
  vivienda TEXT NOT NULL,           -- Formato "1-3-B" (escalera-piso-puerta)
  vivienda_solicitada TEXT,         -- Cambio de vivienda pendiente de aprobación
  nivel_juego TEXT,                 -- 'principiante'|'intermedio'|'avanzado'|'profesional'
  foto_perfil TEXT,                 -- URL de Supabase Storage
  es_admin BOOLEAN DEFAULT FALSE,
  es_manager BOOLEAN DEFAULT FALSE, -- Manager no puede ser eliminado ni quitar admin
  estado_aprobacion TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `pistas`
```sql
CREATE TABLE public.pistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  techada BOOLEAN DEFAULT FALSE,
  con_luz BOOLEAN DEFAULT TRUE,
  capacidad_jugadores INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `reservas`
```sql
CREATE TABLE public.reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pista_id UUID NOT NULL REFERENCES public.pistas(id),
  pista_nombre TEXT NOT NULL,
  usuario_id UUID NOT NULL REFERENCES public.users(id),
  usuario_nombre TEXT NOT NULL,
  vivienda TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion INTEGER NOT NULL,
  estado TEXT DEFAULT 'confirmada',
  prioridad TEXT DEFAULT 'primera',    -- 'primera' (G) o 'segunda' (P)
  conversion_timestamp TIMESTAMPTZ,
  conversion_rule TEXT,
  converted_at TIMESTAMPTZ,
  jugadores TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `notificaciones_desplazamiento`
```sql
CREATE TABLE public.notificaciones_desplazamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.users(id),
  vivienda TEXT NOT NULL,
  fecha_reserva DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  pista_nombre TEXT NOT NULL,
  desplazado_por_vivienda TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `push_tokens`
```sql
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,              -- Expo Push Token
  platform TEXT NOT NULL,           -- 'ios' o 'android'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);
```

## Reglas de Negocio

### Horarios
- **Apertura**: 08:00 - **Cierre**: 22:00
- **Bloques**: 30 minutos cada uno
- **Máximo por reserva**: 3 bloques (1.5 horas)

### Límites de Reserva (por vivienda)
| Concepto | Valor |
|----------|-------|
| Máximo reservas activas | 2 |
| Anticipación mínima para reservar | Sin límite |
| Anticipación máxima para reservar | 7 días |
| Anticipación mínima para cancelar | 4 horas |
| Protección contra desplazamiento | 24 horas |

### Flujo de Registro
1. Usuario se registra con datos + contraseña
2. Se crea en Supabase Auth y tabla `users` con `estado_aprobacion: 'pendiente'`
3. Administrador ve solicitud en AdminScreen
4. Administrador aprueba o rechaza
5. Si aprobado: usuario puede hacer login
6. Si rechazado: estado cambia a 'rechazado'

## Servicios

### reservasService.supabase.js

**Funciones principales:**
- `obtenerPistas()` - Lista de pistas
- `obtenerDisponibilidad(pistaId, fecha)` - Horarios con info de prioridad
- `crearReserva(reservaData)` - Usa RPC para prioridad automática
- `cancelarReserva(reservaId, usuarioId)` - Cancela reserva
- `obtenerReservasUsuario(userId)` - Reservas del usuario
- `desplazarReservaYCrear(reservaADesplazar, nuevaData)` - Desplazamiento atómico

### authService.supabase.js

**Funciones principales:**
- `login(email, password)` - Inicia sesión
- `register(userData)` - Registra usuario pendiente
- `logout()` - Cierra sesión
- `updateProfile(userId, updates)` - Actualiza perfil
- `getUsuariosPendientes()` - Lista pendientes (admin)
- `aprobarUsuario(userId)` / `rechazarUsuario(userId)` - Gestión admin
- `solicitarCambioVivienda(userId, nuevaVivienda)` - Usuario solicita cambio
- `cancelarSolicitudVivienda(userId)` - Usuario cancela su solicitud
- `getSolicitudesCambioVivienda()` - Lista solicitudes pendientes (admin)
- `aprobarCambioVivienda(userId)` - Admin aprueba cambio
- `rechazarCambioVivienda(userId)` - Admin rechaza cambio

### notificationService.js

**Push Notifications (Expo):**
- `registerForPushNotifications(userId)` - Solicita permisos y guarda token
- `removePushToken(userId)` - Elimina token al cerrar sesión
- `savePushToken(userId, token)` - Guarda token en Supabase
- `getUserPushTokens(userId)` - Obtiene tokens de un usuario

**Notificaciones Locales:**
- `scheduleReservationReminder(reserva, minutosAntes)` - Programa recordatorio
- `cancelScheduledNotification(notificationId)` - Cancela recordatorio
- `cancelAllScheduledNotifications()` - Cancela todos

**Envío de Push:**
- `sendPushNotification(tokens, title, body, data)` - Envía via Expo API
- `notifyViviendaChange(userId, aprobado, viviendaNueva)` - Notifica cambio vivienda
- `notifyReservationDisplacement(userId, reservaInfo)` - Notifica desplazamiento

**Listeners:**
- `addNotificationListeners(onReceived, onResponse)` - Configura handlers

## Context API

### AuthContext
```javascript
const {
  user,                      // Usuario actual
  isAuthenticated,           // Boolean
  notificacionesPendientes,  // Array de notificaciones de desplazamiento
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

## Paleta de Colores

```javascript
{
  primary: '#2e7d32',           // Verde oscuro
  secondary: '#4caf50',         // Verde claro
  accent: '#ff9800',            // Naranja (selección)
  reservaGarantizada: '#2e7d32', // Verde (G)
  reservaProvisional: '#FFC107', // Amarillo/Dorado (P)
  reservaDesplazable: '#e0e0e0', // Gris (otra vivienda)
  error: '#d32f2f',
  disabled: '#bdbdbd',
}
```

## Configuración de Viviendas

Formato estructurado: `escalera-piso-puerta` (ej: "1-3-B")

```javascript
VIVIENDA_CONFIG = {
  escaleras: [1, 2, 3, 4, 5, 6],
  pisos: [1, 2, 3, 4, 5, 6],
  puertas: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
}
```

## Variables de Entorno

Crear archivo `.env` en la raíz (NO commitear):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_PROJECT_ID=tu-project-id-de-expo  # Para push notifications
```

## Testing

```bash
npm test                    # Ejecutar todos
npm test -- --coverage      # Con cobertura
```

## Despliegue

### Web (Vercel)
```bash
npx expo export:web
npx vercel --prod
```

### Móvil (Expo)
```bash
npx expo build:ios
npx expo build:android
```

## Convenciones de Código

- Componentes funcionales con Hooks
- PascalCase para componentes
- camelCase para funciones y variables
- snake_case para columnas de PostgreSQL
- Mensajes de error en español

## Mapeo de Campos (camelCase ↔ snake_case)

| JavaScript | PostgreSQL |
|------------|------------|
| `vivienda` | `vivienda` |
| `prioridad` | `prioridad` |
| `conversionTimestamp` | `conversion_timestamp` |
| `conversionRule` | `conversion_rule` |
| `convertedAt` | `converted_at` |
| `horaInicio` | `hora_inicio` |
| `horaFin` | `hora_fin` |
| `viviendaSolicitada` | `vivienda_solicitada` |
| `esManager` | `es_manager` |

## Sistema de Solicitud de Cambio de Vivienda

### Flujo
1. Usuario va a PerfilScreen y pulsa "Solicitar cambio de vivienda"
2. Selecciona nueva vivienda con ViviendaSelector
3. Se guarda en `vivienda_solicitada` y queda pendiente
4. Admin ve solicitud en AdminScreen > pestaña "Cambios"
5. Admin aprueba (vivienda se actualiza) o rechaza (se limpia solicitud)
6. Usuario recibe push notification con el resultado

### UI en PerfilScreen
- Vivienda bloqueada con candado para usuarios no-admin
- Si hay solicitud pendiente: muestra badge + botón "Cancelar"
- Si no hay solicitud: muestra botón "Solicitar cambio"

### UI en AdminScreen
- Nueva pestaña "Cambios" con contador
- Muestra: nombre, email, vivienda actual → vivienda solicitada
- Botones: Aprobar / Rechazar

## Sistema de Notificaciones

### Tipos de Notificaciones

| Evento | Tipo | Cuándo se envía |
|--------|------|-----------------|
| Recordatorio reserva | Local | 1 hora antes de la reserva |
| Cambio vivienda aprobado | Push | Al aprobar en AdminScreen |
| Cambio vivienda rechazado | Push | Al rechazar en AdminScreen |
| Reserva desplazada | Push | Cuando otra vivienda desplaza |

### Configuración
- Solo funciona en dispositivos físicos (iOS/Android)
- En web se ignoran silenciosamente
- Tokens se guardan en tabla `push_tokens`
- Se eliminan al cerrar sesión

### Permisos Requeridos
- Android: Configurado automáticamente en app.json
- iOS: Se solicita al primer login
