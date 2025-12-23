# App Reserva Padel - Urbanizacion

Aplicacion movil (React Native/Expo) y PWA para gestionar reservas de pistas de padel en una urbanizacion.

## Stack

- **Frontend**: React Native + Expo (iOS, Android, Web/PWA)
- **Backend**: Firebase (Authentication + Firestore)
- **Imagenes**: Cloudinary
- **Hosting**: Vercel

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm start       # Servidor de desarrollo
npm run web     # Ejecutar en navegador
npm run ios     # iOS Simulator (requiere Xcode)
npm run android # Android Emulator
npm test        # Tests unitarios
```

## Variables de Entorno

Crear archivo `.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxx
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=xxx
```

## Despliegue

```bash
npx expo export:web
npx vercel --prod
```

## Documentacion

Ver [CLAUDE.md](./CLAUDE.md) para documentacion tecnica completa.
