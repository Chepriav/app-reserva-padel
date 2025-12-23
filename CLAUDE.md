# CLAUDE.md

Guía para Claude Code (claude.ai/code) y desarrolladores que trabajan en este repositorio.

## Descripción del Proyecto

Aplicación móvil React Native (Expo) y PWA para gestionar reservas de pistas de pádel en una urbanización. Los residentes pueden reservar turnos, ver disponibilidad y administrar sus reservas. Incluye sistema de autenticación con aprobación de administrador y subida de fotos de perfil.

## Stack Tecnológico

- **Frontend**: React Native + Expo (compatible con iOS, Android y Web/PWA)
- **Backend**: Firebase (Authentication + Firestore)
- **Almacenamiento de Imágenes**: Cloudinary (tier gratuito)
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
    │   ├── firebaseConfig.js       # Configuración Firebase
    │   ├── authService.firebase.js # Servicio de autenticación
    │   ├── reservasService.firebase.js  # Servicio de reservas
    │   ├── mockData.js             # Datos mock para desarrollo
    │   └── registerServiceWorker.js # Registro SW para PWA
    ├── utils/
    │   ├── dateHelpers.js          # Funciones de fecha/hora
    │   └── validators.js           # Validaciones de formularios
    └── constants/
        ├── colors.js               # Paleta de colores
        └── config.js               # Configuración de horarios y límites
```

## Servicios Firebase

### authService.firebase.js

Maneja autenticación y gestión de usuarios.

**Funciones principales:**
- `login(email, password)` - Inicia sesión, verifica aprobación
- `register(userData)` - Registra usuario pendiente de aprobación
- `logout()` - Cierra sesión
- `resetPassword(email)` - Envía email de recuperación
- `updateProfile(userId, updates)` - Actualiza perfil con foto opcional
- `onAuthChange(callback)` - Observer de cambios de auth
- `getUsuariosPendientes()` - Lista usuarios pendientes (admin)
- `aprobarUsuario(userId)` - Aprueba usuario (admin)
- `rechazarUsuario(userId)` - Rechaza y elimina usuario (admin)

**Subida de imágenes a Cloudinary:**
- Soporta URIs de archivo (`file://`) en móvil
- Soporta blob URLs (`blob:`) y data URIs (`data:`) en web
- Convierte automáticamente a base64 para web

### reservasService.firebase.js

Maneja todas las operaciones de reservas.

**Funciones principales:**
- `obtenerHorarios(fecha)` - Horarios disponibles para una fecha
- `obtenerHorariosSemana(fechaInicio)` - Horarios de 7 días
- `crearReserva(reservaData)` - Crea nueva reserva con validaciones
- `cancelarReserva(reservaId)` - Cancela reserva (mínimo 4h antes)
- `obtenerReservasUsuario(userId)` - Reservas del usuario
- `escucharReservasUsuario(userId, callback)` - Listener en tiempo real
- `escucharTodasReservas(callback)` - Todas las reservas (admin)

## Estructura de Datos en Firestore

### Colección: `users`
```javascript
{
  id: string,                    // UID de Firebase Auth
  nombre: string,                // Nombre completo
  email: string,
  telefono: string,              // Formato: 612345678 o +34612345678
  vivienda: string,              // Ej: "Casa 42", "Piso 3-A"
  nivelJuego: string | null,     // "principiante"|"intermedio"|"avanzado"|"profesional"
  fotoUrl: string | null,        // URL de Cloudinary
  esAdmin: boolean,              // true para administradores
  aprobado: boolean,             // true = puede usar la app
  createdAt: Timestamp
}
```

### Colección: `reservas`
```javascript
{
  id: string,
  pistaId: string,               // ID de la pista (actualmente "1")
  pistaNombre: string,           // "Pista de Pádel"
  usuarioId: string,
  usuarioNombre: string,
  fecha: string,                 // YYYY-MM-DD
  horaInicio: string,            // "09:00"
  horaFin: string,               // "10:30"
  duracion: number,              // Minutos: 30, 60 o 90
  estado: string,                // "confirmada"|"cancelada"
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Reglas de Negocio

### Horarios
- **Apertura**: 08:00 - **Cierre**: 22:00
- **Bloques disponibles**: 30 min, 60 min, 90 min
- **Horarios predefinidos**: 08:00-09:30, 09:30-11:00, 11:00-12:30, etc.

### Límites de Reserva
| Concepto | Valor |
|----------|-------|
| Máximo reservas activas por usuario | 2 |
| Anticipación mínima para reservar | 2 horas |
| Anticipación máxima para reservar | 7 días |
| Anticipación mínima para cancelar | 4 horas |

### Flujo de Registro
1. Usuario se registra con datos + contraseña
2. Se crea en Firebase Auth y Firestore con `aprobado: false`
3. Administrador ve solicitud en AdminScreen
4. Administrador aprueba o rechaza
5. Si aprobado: usuario puede hacer login
6. Si rechazado: se elimina de Auth y Firestore

## Context API

### AuthContext
```javascript
const {
  user,           // Usuario actual o null
  loading,        // true mientras carga estado inicial
  isAuthenticated,// true si hay usuario autenticado
  login,          // (email, password) => Promise<{success, error?}>
  logout,         // () => Promise<{success, error?}>
  register,       // (userData) => Promise<{success, message?, error?}>
  updateProfile,  // (updates) => Promise<{success, error?}>
  resetPassword,  // (email) => Promise<{success, error?}>
} = useAuth();
```

### ReservasContext
```javascript
const {
  reservas,           // Array de reservas del usuario
  loading,            // true mientras carga
  crearReserva,       // (data) => Promise<{success, error?}>
  cancelarReserva,    // (id) => Promise<{success, error?}>
  refrescarReservas,  // () => void
} = useReservas();
```

## Validadores (src/utils/validators.js)

```javascript
// Validación de email
validarEmail(email) // => boolean

// Validación de teléfono español (9+ dígitos)
validarTelefono(telefono) // => boolean

// Verificar si usuario puede reservar
puedeReservar(usuario, nuevaReserva, reservasActuales)
// => { valido: boolean, error?: string }

// Verificar si puede cancelar (4h mínimo)
puedeCancelar(reserva) // => { valido: boolean, error?: string }

// Validar formulario de registro
validarRegistro(datos) // => { valido: boolean, errores: {} }

// Validar formulario de perfil
validarPerfil(datos) // => { valido: boolean, errores: {} }
```

## Helpers de Fecha (src/utils/dateHelpers.js)

```javascript
// Convertir "2024-06-15" + "10:00" a Date
stringToDate(fecha, hora) // => Date

// Date a "YYYY-MM-DD"
formatearFecha(date) // => string

// "2024-06-15" a "sábado, 15 de junio de 2024"
formatearFechaLegible(fecha) // => string

// Generar array de horarios del día
generarHorariosDisponibles() // => [{horaInicio, horaFin}, ...]

// Verificar si fecha/hora es futura
esFuturo(fecha, hora) // => boolean

// Horas desde ahora hasta fecha/hora
horasHasta(fecha, hora) // => number

// Fecha de hoy en YYYY-MM-DD
obtenerFechaHoy() // => string

// Fecha está entre hoy y hoy+7 días
esFechaValida(fecha) // => boolean
```

## Paleta de Colores

```javascript
// src/constants/colors.js
{
  primary: '#2e7d32',      // Verde oscuro - tema principal
  secondary: '#4caf50',    // Verde claro - acciones secundarias
  accent: '#ff9800',       // Naranja - destacados
  background: '#f5f5f5',   // Fondo general
  surface: '#ffffff',      // Cards y superficies
  error: '#d32f2f',        // Errores y alertas
  text: '#212121',         // Texto principal
  textSecondary: '#757575', // Texto secundario
  disabled: '#bdbdbd',     // Elementos deshabilitados
  border: '#e0e0e0',       // Bordes
}
```

## Variables de Entorno

Crear archivo `.env` en la raíz (NO commitear):

```
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxx

EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=xxx
```

## Testing

Tests ubicados en `__tests__/`:
- `validators.test.js` - 22 tests para validadores
- `dateHelpers.test.js` - 24 tests para helpers de fecha

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

La configuración está en `vercel.json` con rewrites para SPA.

### Móvil (Expo)
```bash
npx expo build:ios
npx expo build:android
```

## Convenciones de Código

- Componentes funcionales con Hooks
- Nombres de archivos = nombre del componente exportado
- PascalCase para componentes
- camelCase para funciones y variables
- UPPER_SNAKE_CASE para constantes
- Mensajes de error en español
- Sin console.logs en producción
- JSDoc para funciones complejas

## Flujos de Usuario

### Crear Reserva
1. HomeScreen: Seleccionar fecha en calendario
2. Ver horarios disponibles del día
3. Seleccionar duración (30/60/90 min)
4. Seleccionar hora de inicio
5. Confirmar reserva
6. Sistema valida límites y crea reserva

### Cancelar Reserva
1. ReservasScreen: Ver reservas próximas
2. Seleccionar reserva a cancelar
3. Sistema valida que falten >4 horas
4. Confirmar cancelación

### Editar Perfil
1. PerfilScreen: Ver datos actuales
2. Tocar foto para cambiar imagen
3. Seleccionar de galería o cámara
4. Editar nombre/teléfono/vivienda/nivel
5. Guardar cambios

### Aprobar Usuarios (Admin)
1. AdminScreen: Ver solicitudes pendientes
2. Revisar datos del solicitante
3. Aprobar o Rechazar
4. Usuario recibe acceso o es eliminado
