# 🎾 App Reserva Pádel - Urbanización

Aplicación web (PWA) para gestionar reservas de pistas de pádel en una urbanización. Desarrollada con React Native Expo y optimizada para funcionar en iOS, Android y Web.

## 📱 Características

- ✅ **PWA Instalable**: Funciona como app nativa en cualquier dispositivo
- ✅ **Autenticación**: Login con usuarios mock (listo para Firebase)
- ✅ **Reservas**: Crear y gestionar reservas de pistas
- ✅ **Calendario**: Selector de fecha para ver disponibilidad
- ✅ **Horarios**: Bloques de 90 minutos (08:00 - 22:00)
- ✅ **Validaciones Completas**:
  - Máximo 2 reservas activas por usuario
  - Mínimo 2 horas de anticipación
  - Máximo 7 días de anticipación
  - Cancelación hasta 4 horas antes
- ✅ **Responsive**: Optimizado para móvil, tablet y desktop

## 🚀 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

### 1. Homebrew (gestor de paquetes para macOS)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Node.js y npm
```bash
brew install node
```

Verifica la instalación:
```bash
node --version  # Debe mostrar v18 o superior
npm --version   # Debe mostrar v9 o superior
```

### 3. Aplicación Expo Go en tu dispositivo móvil

- **iOS**: [Descargar de App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Descargar de Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 📦 Instalación

1. **Navega al directorio del proyecto**
   ```bash
   cd /Users/chepriav/Desktop/projects/ReactNative/App_reserva_padel_urbanizacion
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

   Si encuentras errores, intenta:
   ```bash
   npm install --legacy-peer-deps
   ```

## 🏃‍♂️ Ejecutar la Aplicación

### Modo Desarrollo

```bash
# Iniciar el servidor de desarrollo
npm start
```

Esto abrirá Expo Developer Tools en tu navegador. Desde ahí puedes:

1. **En tu dispositivo móvil:**
   - Abre la app **Expo Go**
   - Escanea el código QR que aparece en la terminal o navegador
   - iOS: Usa la cámara nativa
   - Android: Usa el escáner dentro de Expo Go

2. **En iOS Simulator** (solo macOS con Xcode):
   ```bash
   npm run ios
   ```

3. **En Android Emulator** (requiere Android Studio):
   ```bash
   npm run android
   ```

4. **En el navegador web**:
   ```bash
   npm run web
   ```

## 🛠️ Scripts Disponibles

```bash
npm start          # Inicia el servidor de desarrollo
npm run ios        # Ejecuta en iOS Simulator
npm run android    # Ejecuta en Android Emulator
npm run web        # Ejecuta en navegador
npm run lint       # Verifica el código con ESLint
npm run lint:fix   # Corrige problemas automáticamente
npm test           # Ejecuta los tests
```

## 📁 Estructura del Proyecto

```
App_reserva_padel_urbanizacion/
├── App.js                  # Punto de entrada
├── app.json               # Configuración de Expo
├── package.json           # Dependencias
├── src/
│   ├── screens/          # Pantallas de la app
│   ├── components/       # Componentes reutilizables
│   ├── navigation/       # Navegación
│   ├── context/          # Estado global (Context API)
│   ├── services/         # APIs y servicios
│   ├── utils/            # Funciones utilitarias
│   └── constants/        # Constantes (colores, config)
└── assets/               # Imágenes, fuentes, etc.
```

## 🎨 Stack Tecnológico

- **Framework**: React Native con Expo
- **Lenguaje**: JavaScript (ES6+)
- **Navegación**: React Navigation
- **Estado**: Context API + React Hooks
- **UI**: React Native Components
- **Notificaciones**: Expo Notifications
- **Calendario**: React Native Calendars

## 📖 Documentación Completa

Para información detallada sobre:
- Arquitectura del proyecto
- Comandos de desarrollo
- Estructura de datos
- Reglas de negocio
- APIs y servicios

Consulta el archivo [CLAUDE.md](./CLAUDE.md)

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_API_URL=tu_url_api_aqui
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
```

**⚠️ Importante**: Nunca commits el archivo `.env` al repositorio.

## 🐛 Solución de Problemas

### Error: "command not found: expo"
```bash
npm install -g expo-cli
```

### Error al instalar dependencias
```bash
# Limpia la caché y reinstala
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### La app no se carga en Expo Go
```bash
# Limpia la caché de Expo
expo start -c
```

### Problemas con iOS Simulator
- Asegúrate de tener Xcode instalado
- Abre Xcode al menos una vez para aceptar las licencias

### Problemas con Android Emulator
- Asegúrate de tener Android Studio instalado
- Configura las variables de entorno ANDROID_HOME

## 👥 Usuarios de Prueba

La app incluye usuarios mock para testing:

**Usuario Normal (aprobado):**
- Email: `juan@ejemplo.com`
- Contraseña: `123456`

**Administrador:**
- Email: `maria@ejemplo.com`
- Contraseña: `123456`
- Tiene acceso a la pestaña "Admin" para aprobar nuevos usuarios

**Usuario Pendiente:**
- Email: `pedro@ejemplo.com`
- Contraseña: `123456`
- Cuenta pendiente de aprobación (no puede hacer login hasta ser aprobado)

### 📝 Registro de Nuevos Vecinos

Los vecinos pueden registrarse desde la pantalla de login:
1. Click en "¿No tienes cuenta? Regístrate aquí"
2. Completar formulario con datos personales
3. La cuenta queda **pendiente de aprobación**
4. Un administrador debe aprobar la cuenta desde la pestaña "Admin"
5. Una vez aprobado, el vecino puede iniciar sesión

## 🌐 Publicar como PWA Gratuita

### Opción 1: Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Construir para producción
npx expo export:web

# 3. Desplegar
vercel --prod
```

### Opción 2: Netlify

```bash
# 1. Construir
npx expo export:web

# 2. Arrastrar carpeta web-build a netlify.com
# o usar Netlify CLI
npm i -g netlify-cli
netlify deploy --prod --dir=web-build
```

### Opción 3: Firebase Hosting

```bash
# 1. Instalar Firebase CLI
npm i -g firebase-tools

# 2. Login y configurar
firebase login
firebase init hosting

# 3. Construir y desplegar
npx expo export:web
firebase deploy
```

## 📊 Costos de Hosting (GRATIS)

| Servicio | Storage | Ancho de Banda | SSL | Dominio |
|----------|---------|----------------|-----|---------|
| **Vercel** | Ilimitado | 100GB/mes | ✅ | Gratis (.vercel.app) |
| **Netlify** | Ilimitado | 100GB/mes | ✅ | Gratis (.netlify.app) |
| **Firebase** | 10GB | 360MB/día | ✅ | Gratis (.web.app) |

## 📱 Instalar PWA en Dispositivos

### iOS (Safari)
1. Abre la app en Safari
2. Toca el botón "Compartir"
3. Selecciona "Añadir a pantalla de inicio"

### Android (Chrome)
1. Abre la app en Chrome
2. Toca los 3 puntos (menú)
3. Selecciona "Añadir a pantalla de inicio"

### Desktop (Chrome/Edge)
1. Abre la app en el navegador
2. Busca el icono "Instalar" en la barra de direcciones
3. Click en "Instalar"

## 🔄 Migrar a Firebase (Próximo Paso)

Para usar base de datos real en lugar de datos mock:

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Instalar Firebase:
```bash
npm install firebase
```

3. Configurar en `src/services/firebaseConfig.js`
4. Reemplazar servicios mock por llamadas a Firebase

## 📄 Licencia

Este proyecto es privado y está destinado al uso exclusivo de la urbanización.

## 👨‍💻 Desarrollo

Para contribuir o desarrollar nuevas funcionalidades, por favor lee primero [CLAUDE.md](./CLAUDE.md) para entender la arquitectura y convenciones del proyecto.

---

**Desarrollado con ❤️ para tu urbanización**
