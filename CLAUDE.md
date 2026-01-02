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
│   ├── service-worker.js           # Service Worker para offline y Web Push
│   ├── icon-180.png                # Icono para iOS (apple-touch-icon)
│   ├── icon-192.png                # Icono PWA 192x192
│   └── icon-512.png                # Icono PWA 512x512
├── scripts/
│   └── inject-pwa-meta.js          # Inyecta meta tags iOS en el HTML
└── src/
    ├── screens/                    # Pantallas de la aplicación
    │   ├── LoginScreen.js          # Inicio de sesión + recuperar contraseña
    │   ├── RegistroScreen.js       # Registro de nuevos usuarios
    │   ├── HomeScreen.js           # Pantalla principal - crear reservas
    │   ├── ReservasScreen.js       # Mis reservas (próximas/pasadas)
    │   ├── PartidasScreen.js       # Buscar jugadores para partidas
    │   ├── TablonScreen.js         # Tablón de anuncios y notificaciones
    │   ├── PerfilScreen.js         # Perfil de usuario - editar datos/foto
    │   └── AdminScreen.js          # Panel admin - solicitudes, usuarios, mensajes
    ├── components/
    │   ├── CustomAlert.js          # Alertas personalizadas cross-platform
    │   ├── partidas/               # Componentes de partidas/clases
    │   ├── tablon/                 # Componentes del tablón de anuncios
    │   │   ├── NotificacionCard.js # Tarjeta de notificación
    │   │   ├── AnuncioCard.js      # Tarjeta de anuncio
    │   │   ├── AnuncioModal.js     # Modal detalle de anuncio
    │   │   └── EmptyState.js       # Estado vacío
    │   └── admin/                  # Componentes del panel admin
    │       ├── CrearAnuncioModal.js    # Modal crear anuncio
    │       ├── SelectorDestinatarios.js # Selector de usuarios
    │       └── AnuncioAdminCard.js     # Tarjeta anuncio admin
    ├── hooks/
    │   ├── index.js                # Exports centralizados
    │   ├── usePartidas.js          # Hooks de partidas/clases
    │   ├── useTablon.js            # Hooks del tablón
    │   └── useUsuarios.js          # Hook de usuarios urbanización
    ├── navigation/
    │   ├── AppNavigator.js         # Navegación principal (auth + tabs)
    │   └── TabNavigator.js         # Tabs: Inicio, Reservas, Partidas, Tablón, Admin, Perfil
    ├── context/
    │   ├── AuthContext.js          # Estado de autenticación global
    │   └── ReservasContext.js      # Estado de reservas global
    ├── services/
    │   ├── supabaseConfig.js       # Configuración cliente Supabase
    │   ├── authService.supabase.js # Servicio de autenticación
    │   ├── reservasService.supabase.js  # Servicio de reservas + RPCs
    │   ├── partidasService.js      # Servicio de partidas/clases
    │   ├── tablonService.js        # Servicio del tablón de anuncios
    │   ├── storageService.supabase.js   # Servicio de almacenamiento de imágenes
    │   ├── notificationService.js  # Push notifications nativas (Expo)
    │   ├── webPushService.js       # Web Push para PWA (iOS/Android/Desktop)
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
- **Conversión en tiempo real (Frontend)**: Cuando una vivienda solo tiene 1 reserva futura, se muestra como Garantizada automáticamente sin esperar al cron job

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
| Anticipación mínima para cancelar | 1.5 horas |
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
EXPO_PUBLIC_VAPID_PUBLIC_KEY=BNRg...          # Para Web Push (PWA)
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

## Arquitectura y Buenas Prácticas (OBLIGATORIO)

### Principios Fundamentales

**SIEMPRE aplicar estos principios en todo el código:**

1. **Separación de Responsabilidades (SRP)**
   - Cada componente/hook/servicio tiene UNA SOLA responsabilidad
   - Si un archivo supera ~200-300 líneas, probablemente necesita refactorización

2. **Componentes Pequeños y Reutilizables**
   - Extraer sub-componentes cuando la lógica es independiente
   - Cada componente debe ser fácil de entender de un vistazo

3. **Custom Hooks para Lógica de Estado**
   - Extraer lógica de estado compleja a hooks personalizados en `src/hooks/`
   - Los hooks encapsulan: estado, efectos, y funciones relacionadas

4. **DRY (Don't Repeat Yourself)**
   - Reutilizar componentes en lugar de duplicar código
   - Crear utilidades para lógica repetida

5. **Composición sobre Herencia**
   - Construir componentes grandes a partir de componentes pequeños
   - Usar props para configuración y callbacks para comunicación

### Estructura de Carpetas

```
src/
├── components/
│   ├── [feature]/           # Componentes agrupados por feature
│   │   ├── index.js         # Exports centralizados
│   │   ├── MainComponent.js
│   │   └── SubComponent.js
│   └── common/              # Componentes compartidos
├── hooks/
│   ├── index.js             # Exports centralizados
│   ├── use[Feature].js      # Hooks por feature
│   └── useCommon.js         # Hooks compartidos
├── services/
│   └── [entity]Service.js   # Servicios por entidad
├── screens/
│   └── [Name]Screen.js      # Pantallas (orquestadores)
└── utils/
    └── [helper].js          # Funciones puras de utilidad
```

### Ejemplo: Refactorización de PartidasScreen

**ANTES (malo):** Un archivo de 1400+ líneas con todo mezclado

**DESPUÉS (bueno):**
```
src/
├── components/partidas/
│   ├── index.js                 # export { PartidaCard, ... }
│   ├── PartidaCard.js           # Tarjeta individual (~250 líneas)
│   ├── ParticipantesList.js     # Lista de participantes (~100 líneas)
│   ├── SolicitudesPendientes.js # Solicitudes del creador (~100 líneas)
│   ├── CrearPartidaModal.js     # Modal de creación (~300 líneas)
│   ├── JugadoresEditor.js       # Editor de jugadores (~120 líneas)
│   └── AddJugadorModal.js       # Modal añadir jugador (~300 líneas)
├── hooks/
│   ├── usePartidas.js           # Hooks: usePartidas, usePartidasActions, useCrearPartidaModal
│   └── useUsuarios.js           # Hook: useUsuariosUrbanizacion
└── screens/
    └── PartidasScreen.js        # Orquestador (~400 líneas)
```

### Patrones de Hooks

```javascript
// Hook para datos y estado
export function usePartidas(userId, tabActivo) {
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarPartidas = useCallback(async () => { ... }, [userId, tabActivo]);

  useEffect(() => { cargarPartidas(); }, [cargarPartidas]);

  return { partidas, loading, cargarPartidas };
}

// Hook para acciones
export function usePartidasActions(userId, onSuccess) {
  const crearPartida = async (data) => { ... };
  const cancelarPartida = async (id) => { ... };

  return { crearPartida, cancelarPartida };
}

// Hook para modal
export function useCrearPartidaModal() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState({ ... });

  const abrir = () => { ... };
  const cerrar = () => { ... };

  return { visible, state, setState, abrir, cerrar };
}
```

### Patrones de Componentes

```javascript
// Componente principal (orquestador)
export default function FeatureScreen() {
  const { data, loading } = useFeatureData();
  const actions = useFeatureActions();
  const modal = useFeatureModal();

  return (
    <View>
      <FeatureList data={data} onAction={actions.doSomething} />
      <FeatureModal {...modal} />
    </View>
  );
}

// Sub-componente reutilizable
function FeatureCard({ item, onPress }) {
  return (
    <TouchableOpacity onPress={() => onPress(item)}>
      <CardHeader {...item} />
      <CardContent {...item} />
      <CardActions {...item} />
    </TouchableOpacity>
  );
}
```

### Checklist de Refactorización

Antes de crear o modificar código, verificar:

- [ ] ¿El archivo tiene menos de 300 líneas?
- [ ] ¿Cada función/componente tiene una sola responsabilidad?
- [ ] ¿La lógica de estado está en hooks separados?
- [ ] ¿Los componentes son reutilizables?
- [ ] ¿Hay código duplicado que se pueda extraer?
- [ ] ¿Los nombres son descriptivos y consistentes?
- [ ] ¿Existe un index.js para exports centralizados?

### Anti-patrones a Evitar

1. **Archivos gigantes** - Dividir si supera 300 líneas
2. **Lógica en el render** - Extraer a funciones o hooks
3. **Props drilling excesivo** - Usar Context o composición
4. **Código duplicado** - Extraer a componentes/hooks/utils
5. **Componentes que hacen demasiado** - Dividir en sub-componentes
6. **Estado mezclado** - Separar en hooks por responsabilidad

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

## Persistencia de Sesión

### Descripción
El sistema mantiene la sesión del usuario activa incluso después de períodos de inactividad mediante:
- **Auto-refresh de tokens**: Supabase refresca automáticamente el JWT antes de expirar
- **Listener de cambios de auth**: Detecta cambios de sesión (login, logout, token refresh)
- **Recuperación al volver de background**: Verifica y refresca sesión cuando la app vuelve a primer plano

### Implementación en AuthContext.js

```javascript
// Listener de cambios de autenticación
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      setUser(null);
      setIsAuthenticated(false);
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      const result = await authService.getCurrentUser();
      if (result.success && result.data) {
        setUser(result.data);
        setIsAuthenticated(true);
      }
    }
  }
);

// Listener de AppState para detectar background/foreground
AppState.addEventListener('change', async (nextAppState) => {
  if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
    const result = await refreshSession();
    if (!result.success) {
      // Sesión expirada
    }
  }
});
```

### Helper refreshSession (supabaseConfig.js)

```javascript
export const refreshSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false };

  // Refrescar si expira en menos de 5 minutos
  const timeUntilExpiry = session.expires_at - Math.floor(Date.now() / 1000);
  if (timeUntilExpiry < 300) {
    const { data } = await supabase.auth.refreshSession();
    return { success: true, session: data.session };
  }
  return { success: true, session };
};
```

### Configuración de Supabase

```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
```

## Sistema de Web Push (PWA)

### Descripción
Web Push permite enviar notificaciones a usuarios de la PWA incluso cuando la app está cerrada. Funciona en:
- **iOS Safari** (16.4+): PWA debe estar instalada en pantalla de inicio
- **Android Chrome**: PWA instalada o navegador
- **Desktop Chrome/Edge/Firefox**: Navegador

### Arquitectura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Supabase       │     │   Push Service  │
│   (PWA)         │────▶│   Edge Function  │────▶│   (FCM/APNs)    │
│                 │     │   send-push-     │     │                 │
│   webPushService│     │   notification   │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│ Service Worker  │     │ web_push_        │
│ (push handler)  │     │ subscriptions    │
└─────────────────┘     └──────────────────┘
```

### Tabla: `web_push_subscriptions`
```sql
CREATE TABLE public.web_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,             -- URL del push service
  p256dh TEXT NOT NULL,               -- Clave pública del cliente
  auth TEXT NOT NULL,                 -- Token de autenticación
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

### webPushService.js

**Funciones principales:**
- `isSupported()` - Verifica si el navegador soporta Web Push
- `requestPermission()` - Solicita permiso de notificaciones
- `subscribe(userId)` - Suscribe al usuario y guarda en Supabase
- `unsubscribe(userId)` - Cancela suscripción al cerrar sesión
- `saveSubscription(userId, subscription)` - Guarda en base de datos
- `showLocalNotification(title, body, data)` - Notificación local inmediata

### Edge Function: send-push-notification

Ubicación: `supabase/functions/send-push-notification/index.ts`

**Secretos requeridos en Supabase:**
```
VAPID_PUBLIC_KEY    - Clave pública VAPID (misma que en .env)
VAPID_PRIVATE_KEY   - Clave privada VAPID
VAPID_EMAIL         - Email de contacto (mailto:...)
```

**Uso desde curl:**
```bash
curl -X POST "https://xxx.supabase.co/functions/v1/send-push-notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon_key>" \
  -d '{"userId":"<uuid>","title":"Titulo","body":"Mensaje"}'
```

### Service Worker (public/service-worker.js)

Maneja eventos push y muestra notificaciones:
```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png'
    })
  );
});
```

### Generar VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Guarda:
- `publicKey` → `.env` como `EXPO_PUBLIC_VAPID_PUBLIC_KEY`
- `publicKey` → Supabase Secrets como `VAPID_PUBLIC_KEY`
- `privateKey` → Supabase Secrets como `VAPID_PRIVATE_KEY`

### Flujo de Activación

1. Usuario abre PWA y va a Perfil
2. Activa switch de notificaciones
3. `webPushService.subscribe(userId)` se ejecuta:
   - Solicita permiso al navegador
   - Obtiene suscripción del PushManager
   - Guarda en `web_push_subscriptions`
4. Al enviar notificación:
   - Edge Function consulta suscripciones del usuario
   - Envía a cada endpoint usando web-push
   - Elimina suscripciones expiradas (404/410)

### Requisitos para iOS

- iOS 16.4 o superior
- PWA **debe estar instalada** en pantalla de inicio
- Meta tags requeridos en HTML:
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
  ```
- Iconos **deben ser PNG** (iOS no acepta SVG)

## Sistema de Partidas (Buscar Jugadores)

### Descripción
Sistema para que los usuarios puedan crear solicitudes de partida y buscar otros jugadores de la urbanización o invitar externos. Permite gestionar equipos de 4 jugadores para partidas de pádel.

### Tablas en PostgreSQL

#### Tabla: `partidas`
```sql
CREATE TABLE public.partidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id UUID NOT NULL REFERENCES public.users(id),
  creador_nombre TEXT NOT NULL,
  creador_vivienda TEXT NOT NULL,
  reserva_id UUID REFERENCES public.reservas(id),  -- Opcional: vincular a reserva existente
  fecha DATE,                    -- Fecha de la partida (si tiene reserva)
  hora_inicio TIME,              -- Hora inicio (si tiene reserva)
  hora_fin TIME,                 -- Hora fin (si tiene reserva)
  pista_nombre TEXT,             -- Nombre de la pista (si tiene reserva)
  tipo TEXT DEFAULT 'abierta',   -- 'abierta' (sin reserva) o 'con_reserva'
  mensaje TEXT,                  -- Mensaje/comentario del creador
  nivel_preferido TEXT,          -- Nivel de juego preferido
  estado TEXT DEFAULT 'buscando', -- 'buscando', 'completa', 'cancelada'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla: `partidas_jugadores`
```sql
CREATE TABLE public.partidas_jugadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id UUID NOT NULL REFERENCES public.partidas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.users(id),  -- NULL para jugadores externos
  usuario_nombre TEXT NOT NULL,
  usuario_vivienda TEXT,          -- NULL para jugadores externos
  nivel_juego TEXT,
  es_externo BOOLEAN DEFAULT FALSE,  -- true = jugador externo (no tiene cuenta)
  estado TEXT DEFAULT 'confirmado',  -- 'pendiente', 'confirmado', 'rechazado'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Políticas RLS Requeridas

```sql
-- El creador puede actualizar jugadores de su partida
CREATE POLICY "Creador puede actualizar jugadores de su partida"
ON public.partidas_jugadores
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.partidas
    WHERE partidas.id = partidas_jugadores.partida_id
    AND partidas.creador_id = auth.uid()
  )
);

-- El creador puede eliminar jugadores de su partida
CREATE POLICY "Creador puede eliminar jugadores de su partida"
ON public.partidas_jugadores
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.partidas
    WHERE partidas.id = partidas_jugadores.partida_id
    AND partidas.creador_id = auth.uid()
  )
);
```

### Flujo de Creación de Partida

1. Usuario pulsa "Buscar jugadores" en PartidasScreen
2. Selecciona tipo: "Abierta" (sin reserva) o "Con reserva" (vinculada a reserva existente)
3. Opcionalmente añade jugadores iniciales:
   - **De la urbanización**: Busca usuarios registrados
   - **Externos**: Añade nombre y nivel de jugadores sin cuenta
4. Al publicar:
   - Se crea entrada en `partidas`
   - Se crean entradas en `partidas_jugadores` para jugadores añadidos (estado: 'confirmado')
   - Si hay 4 jugadores, estado = 'completa'; sino, estado = 'buscando'

### Flujo de Solicitud para Unirse

1. Usuario ve partida en "Buscan jugadores" (solo partidas de OTROS usuarios)
2. Pulsa "Solicitar unirse"
3. Se crea entrada en `partidas_jugadores` con estado = 'pendiente'
4. Creador ve solicitud en su partida (sección "Solicitudes pendientes")
5. Creador acepta (estado → 'confirmado') o rechaza (se elimina registro)
6. Si al aceptar hay 4 jugadores, la partida pasa a estado = 'completa'

### Servicios

#### partidasService.js

**Funciones principales:**
- `obtenerPartidasActivas()` - Partidas con estado 'buscando'
- `obtenerMisPartidas(userId)` - Partidas creadas por el usuario (solo futuras)
- `obtenerPartidasApuntado(userId)` - Partidas donde el usuario está inscrito (solo futuras)
- `crearPartida(partidaData)` - Crea partida con jugadores iniciales
- `solicitarUnirse(partidaId, usuario)` - Envía solicitud (estado 'pendiente')
- `aceptarSolicitud(usuarioId, partidaId, creadorId)` - Acepta solicitud
- `rechazarSolicitud(usuarioId, partidaId)` - Rechaza solicitud
- `cancelarPartida(partidaId, creadorId)` - Cancela partida
- `desapuntarsePartida(partidaId, usuarioId)` - Desapuntarse de partida
- `cancelarSolicitud(partidaId, userId)` - Cancelar solicitud propia

### Hooks

#### usePartidas.js

```javascript
// Hook para cargar partidas
const { partidas, loading, refreshing, cargarPartidas, onRefresh } = usePartidas(userId, tabActivo);

// Hook para acciones
const { crearPartida, cancelarPartida, solicitarUnirse, aceptarSolicitud, rechazarSolicitud } = usePartidasActions(userId, onSuccess);

// Hook para modal de crear partida
const { visible, modalState, jugadores, abrir, cerrar, addJugador, removeJugador } = useCrearPartidaModal(userId);

// Hook para modal de añadir jugador
const { visible, modalState, abrir, cerrar, addUrbanizacion, addExterno } = useAddJugadorModal(onAddJugador);
```

### Componentes

```
src/components/partidas/
├── index.js                 # Exports centralizados
├── PartidaCard.js           # Tarjeta de partida con acciones
├── ParticipantesList.js     # Lista de jugadores confirmados
├── SolicitudesPendientes.js # Solicitudes para el creador
├── CrearPartidaModal.js     # Modal de creación
├── JugadoresEditor.js       # Editor de jugadores iniciales
└── AddJugadorModal.js       # Modal para añadir jugador
```

### UI/UX

- **Tab "Buscan jugadores"**: Solo muestra partidas de OTROS usuarios
- **Tab "Mis partidas"**: Partidas creadas + partidas donde está inscrito
- **Badge X/4**: Muestra jugadores confirmados + creador
- **Borde verde**: Partidas completas (4/4 jugadores)
- **Solicitudes pendientes**: Solo visibles para el creador de la partida

### Mapeo de Campos

| JavaScript | PostgreSQL |
|------------|------------|
| `creadorId` | `creador_id` |
| `creadorNombre` | `creador_nombre` |
| `creadorVivienda` | `creador_vivienda` |
| `reservaId` | `reserva_id` |
| `horaInicio` | `hora_inicio` |
| `horaFin` | `hora_fin` |
| `pistaNombre` | `pista_nombre` |
| `nivelPreferido` | `nivel_preferido` |
| `partidaId` | `partida_id` |
| `usuarioId` | `usuario_id` |
| `usuarioNombre` | `usuario_nombre` |
| `usuarioVivienda` | `usuario_vivienda` |
| `nivelJuego` | `nivel_juego` |
| `esExterno` | `es_externo` |

### Edición de Partidas

El creador puede editar su partida existente desde el botón "Editar" en la tarjeta de partida.

**Campos editables:**
- Tipo de partida (abierta o con reserva)
- Reserva vinculada (si es tipo "con reserva")
- Nivel preferido
- Mensaje/comentario
- Añadir/eliminar jugadores

**Funciones en partidasService.js:**
- `editarPartida(partidaId, creadorId, updates)` - Actualiza campos de la partida
- `anadirJugadorAPartida(partidaId, creadorId, jugadorData)` - Añade jugador a partida existente
- `eliminarJugador(jugadorId, partidaId, creadorId)` - Elimina jugador de la partida

**Modal unificado:**
`CrearPartidaModal` se usa tanto para crear como para editar partidas mediante la prop `modoEditar`:
- `modoEditar=false`: Título "Buscar jugadores", crea nueva partida
- `modoEditar=true`: Título "Editar partida", actualiza partida existente

### Notificaciones de Partidas

El sistema envía push notifications en los siguientes eventos:

| Evento | Destinatario | Tipo |
|--------|--------------|------|
| Solicitud de unirse | Creador de la partida | `partida_solicitud` |
| Solicitud aceptada | Jugador que solicitó | `partida_aceptada` |
| Partida completa (4/4) | Todos los jugadores | `partida_completa` |
| Partida cancelada | Todos los jugadores | `partida_cancelada` |

**Funciones en notificationService.js:**
- `notifyPartidaSolicitud(creadorId, solicitanteNombre, partidaInfo)`
- `notifyPartidaAceptada(usuarioId, creadorNombre, partidaInfo)`
- `notifyPartidaCompleta(jugadoresIds, creadorNombre, partidaInfo)`
- `notifyPartidaCancelada(jugadoresIds, creadorNombre, partidaInfo)`

## Sistema de Clases

### Descripción
Extensión del sistema de partidas para organizar clases de pádel. Una clase es esencialmente una partida especial con campos adicionales para gestionar grupos de alumnos.

### Diferencias entre Partida y Clase

| Característica | Partida | Clase |
|---------------|---------|-------|
| Participantes | 4 fijos | 2-8 configurable |
| Nivel | Único preferido | Múltiples seleccionables |
| Precio | No aplica | €/alumno y/o €/grupo (informativo) |
| Cerrar manual | No | Sí (creador puede cerrar antes de completar) |
| Distintivo visual | Sin badge | Badge "CLASE" + fondo azul |

### Columnas adicionales en `partidas`

```sql
ALTER TABLE public.partidas ADD COLUMN es_clase BOOLEAN DEFAULT FALSE;
ALTER TABLE public.partidas ADD COLUMN niveles TEXT[];           -- Array: ['basico', 'intermedio']
ALTER TABLE public.partidas ADD COLUMN min_participantes INTEGER DEFAULT 4;
ALTER TABLE public.partidas ADD COLUMN max_participantes INTEGER DEFAULT 4;
ALTER TABLE public.partidas ADD COLUMN precio_alumno DECIMAL(10,2);
ALTER TABLE public.partidas ADD COLUMN precio_grupo DECIMAL(10,2);
```

### Mapeo de Campos de Clase

| JavaScript | PostgreSQL |
|------------|------------|
| `esClase` | `es_clase` |
| `niveles` | `niveles` |
| `minParticipantes` | `min_participantes` |
| `maxParticipantes` | `max_participantes` |
| `precioAlumno` | `precio_alumno` |
| `precioGrupo` | `precio_grupo` |

### Flujo de Creación de Clase

1. Usuario pulsa "+" en PartidasScreen
2. Selecciona "Clase" en el toggle Partida/Clase
3. Configura:
   - Tipo: Fecha abierta o con reserva
   - Número de alumnos (mín/máx)
   - Niveles (selección múltiple)
   - Precio por alumno y/o por grupo (opcional, informativo)
   - Mensaje descriptivo
   - Alumnos iniciales (opcional)
4. Al publicar se crea la clase en estado 'buscando'

### Cerrar Clase Manualmente

El creador de una clase puede cerrar inscripciones aunque no esté completa:

```javascript
// En partidasService.js
async cerrarClase(partidaId, creadorId) {
  // Verifica que sea el creador y que sea clase
  // Cambia estado a 'completa'
  // Notifica a todos los alumnos confirmados
}
```

### UI/UX de Clases

- **Badge "CLASE"**: En esquina superior derecha de la tarjeta
- **Fondo azul claro**: Para distinguir visualmente de partidas
- **Borde azul**: En lugar de transparente/verde
- **Info adicional**: Muestra niveles, rango de alumnos, precios
- **Botón "Cerrar"**: Solo para creador, cierra inscripciones manualmente
- **Badge contador**: X/{max} en lugar de X/4

### Constantes de Configuración

```javascript
// config.js
export const CLASE_CONFIG = {
  MIN_ALUMNOS: 2,
  MAX_ALUMNOS: 8,
  OPCIONES_MIN: [2, 3, 4],
  OPCIONES_MAX: [4, 5, 6, 7, 8],
};

// colors.js
clase: '#1976d2',               // Azul - distintivo de clases
claseBadge: '#1976d2',          // Azul - badge de clase
claseBackground: '#e3f2fd',     // Azul muy claro - fondo de tarjeta clase
```

### Hooks Actualizados

```javascript
// useCrearPartidaModal incluye campos de clase
const [modalState, setModalState] = useState({
  // ...campos existentes
  esClase: false,
  niveles: [],
  minParticipantes: 2,
  maxParticipantes: 8,
  precioAlumno: '',
  precioGrupo: '',
});

// usePartidasActions incluye cerrarClase
const { cerrarClase } = usePartidasActions(userId, onSuccess);
```

### Notificaciones de Clases

Las notificaciones usan el campo `esClase` para personalizar mensajes:
- "Nueva solicitud para tu clase" vs "Nueva solicitud para tu partida"
- "La clase ya está completa" vs "La partida ya está completa"

## Sistema de Tablón de Anuncios

### Descripción
Sistema de comunicación interna con dos tipos de contenido:
- **Notificaciones**: Eventos automáticos del sistema (desplazamientos, partidas, etc.) - expiran en 7 días
- **Anuncios**: Mensajes de administradores a usuarios - expiran en 1 mes

### Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                       TablonScreen                          │
│  ┌─────────────────────┬───────────────────────────┐        │
│  │   Tab Anuncios      │    Tab Notificaciones     │        │
│  │   (anuncios_admin)  │  (notificaciones_usuario) │        │
│  └─────────────────────┴───────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       AdminScreen                           │
│  ┌──────────────┬──────────────┬──────────────────┐         │
│  │  Solicitudes │   Usuarios   │     Mensajes     │         │
│  │  (unificado) │              │  (crear anuncios)│         │
│  └──────────────┴──────────────┴──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Tablas en PostgreSQL

#### Tabla: `notificaciones_usuario`
```sql
CREATE TABLE public.notificaciones_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,           -- 'desplazamiento', 'partida_solicitud', etc.
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  datos JSONB DEFAULT '{}',     -- Datos adicionales flexibles
  leida BOOLEAN DEFAULT FALSE,
  expira_en TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla: `anuncios_admin`
```sql
CREATE TABLE public.anuncios_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id UUID NOT NULL REFERENCES public.users(id),
  creador_nombre TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT DEFAULT 'info',     -- 'info', 'aviso', 'urgente', 'mantenimiento'
  destinatarios TEXT DEFAULT 'todos',  -- 'todos' o 'seleccionados'
  expira_en TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla: `anuncios_destinatarios`
```sql
CREATE TABLE public.anuncios_destinatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anuncio_id UUID NOT NULL REFERENCES public.anuncios_admin(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leido BOOLEAN DEFAULT FALSE,
  leido_en TIMESTAMPTZ,
  UNIQUE(anuncio_id, usuario_id)
);
```

### Servicios

#### tablonService.js

**Notificaciones de usuario:**
- `obtenerNotificaciones(usuarioId)` - Lista notificaciones no expiradas
- `contarNotificacionesNoLeidas(usuarioId)` - Cuenta para badge
- `marcarNotificacionLeida(notificacionId)` - Marca como leída
- `marcarTodasLeidas(usuarioId)` - Marca todas como leídas
- `eliminarNotificacion(notificacionId)` - Elimina manualmente
- `crearNotificacion(usuarioId, tipo, titulo, mensaje, datos)` - Crea notificación

**Anuncios (usuario):**
- `obtenerAnunciosParaUsuario(usuarioId)` - Lista anuncios del usuario
- `contarAnunciosNoLeidos(usuarioId)` - Cuenta para badge
- `marcarAnuncioLeido(anuncioId, usuarioId)` - Marca como leído

**Anuncios (admin):**
- `obtenerTodosAnuncios()` - Lista todos los anuncios
- `crearAnuncio(creadorId, creadorNombre, titulo, mensaje, tipo, destinatarios, usuariosIds)` - Crea anuncio
- `eliminarAnuncio(anuncioId)` - Elimina anuncio
- `obtenerUsuariosAprobados()` - Para selector de destinatarios

### Hooks

```javascript
// Hook para notificaciones del usuario
const {
  notificaciones, loading, refreshing,
  cargarNotificaciones, onRefresh,
  eliminar, marcarLeida, marcarTodasLeidas, contarNoLeidas,
} = useNotificaciones(userId);

// Hook para anuncios (vista usuario)
const {
  anuncios, loading, refreshing, anuncioSeleccionado,
  cargarAnuncios, onRefresh, verAnuncio, cerrarAnuncio, contarNoLeidos,
} = useAnuncios(userId);

// Hook para gestión de anuncios (admin)
const {
  anuncios, usuarios, loading, creating,
  cargarAnuncios, cargarUsuarios, crearAnuncio, eliminarAnuncio,
} = useAnunciosAdmin(userId, userName, onSuccess);

// Hook para contador del badge del tab
const {
  contadorAnuncios, contadorNotificaciones, contadorTotal, actualizarContadores,
} = useContadorTablon(userId);
```

### Tipos de Anuncio

| Tipo | Color | Uso |
|------|-------|-----|
| `info` | Azul | Información general |
| `aviso` | Naranja | Avisos importantes |
| `urgente` | Rojo | Avisos urgentes |
| `mantenimiento` | Gris | Mantenimiento de pistas |

### Tipos de Notificación

| Tipo | Icono | Evento |
|------|-------|--------|
| `desplazamiento` | swap-horizontal | Reserva desplazada |
| `partida_solicitud` | people | Solicitud unirse partida |
| `partida_aceptada` | checkmark-circle | Solicitud aceptada |
| `partida_completa` | trophy | Partida completa (4/4) |
| `partida_cancelada` | close-circle | Partida cancelada |
| `reserva_recordatorio` | alarm | Recordatorio reserva |

### UI/UX

**TablonScreen:**
- Dos tabs: "Anuncios" y "Notificaciones"
- Badge rojo con contador de no leídos en cada tab
- Pull-to-refresh en ambas listas
- Botón "Marcar leídas" en header para notificaciones

**AnuncioCard:**
- Borde izquierdo coloreado según tipo
- Badge de tipo (info/aviso/urgente/mantenimiento)
- Badge rojo si no está leído
- Tap abre modal con contenido completo

**AnuncioModal:**
- Vista completa del anuncio
- Botón "Entendido" marca como leído y cierra

**AdminScreen (Tab Mensajes):**
- Botón "Nuevo mensaje" prominente
- Lista de anuncios enviados con opción de eliminar
- Modal de creación con:
  - Título y mensaje
  - Selector de tipo (4 opciones)
  - Destinatarios: todos o seleccionados
  - Lista de usuarios con checkboxes (búsqueda incluida)

**TabNavigator:**
- Tab "Tablón" con badge rojo mostrando total de no leídos
- Se actualiza cada 30 segundos

### Mapeo de Campos

| JavaScript | PostgreSQL |
|------------|------------|
| `usuarioId` | `usuario_id` |
| `creadorId` | `creador_id` |
| `creadorNombre` | `creador_nombre` |
| `anuncioId` | `anuncio_id` |
| `expiraEn` | `expira_en` |
| `leidoEn` | `leido_en` |
| `createdAt` | `created_at` |

### Colores del Sistema

```javascript
// colors.js
anuncioInfo: '#1976d2',         // Azul - tipo info
anuncioAviso: '#f57c00',        // Naranja - tipo aviso
anuncioUrgente: '#d32f2f',      // Rojo - tipo urgente
anuncioMantenimiento: '#616161', // Gris - tipo mantenimiento
notificacionLeida: '#f0f0f0',   // Gris claro - notificación leída
badgeRojo: '#e53e3e',           // Rojo para badges de contador
```

### Limpieza Automática

Función SQL para limpiar registros expirados:
```sql
CREATE OR REPLACE FUNCTION limpiar_notificaciones_expiradas()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notificaciones_usuario WHERE expira_en < NOW();
  DELETE FROM public.anuncios_admin WHERE expira_en < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Puede configurarse con pg_cron para ejecutar periódicamente.
