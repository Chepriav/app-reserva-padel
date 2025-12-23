# Configuración de Cloudinary para Fotos de Perfil (100% GRATUITO)

## ¿Por qué Cloudinary?

✅ **Plan gratuito generoso**: 25 GB de almacenamiento, 25 GB de ancho de banda/mes
✅ **Sin tarjeta de crédito**: No requiere datos de pago
✅ **Optimización automática**: Compresión y transformación de imágenes
✅ **CDN global**: Entrega rápida en todo el mundo
✅ **Sin configuración de seguridad complicada**: API REST simple

## Paso 1: Crear Cuenta en Cloudinary

1. Ve a [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. Completa el formulario de registro:
   - Email
   - Contraseña
   - Cloud Name (será tu identificador único, ej: `reserva-padel-123`)
3. Haz clic en **"Create Account"**
4. Verifica tu email
5. **¡No se requiere tarjeta de crédito!**

## Paso 2: Obtener Credenciales

Una vez dentro del Dashboard de Cloudinary:

1. Ve a **Dashboard** (menú superior)
2. Encontrarás tus credenciales en la sección **"Account Details"**:
   - **Cloud Name**: `tu_cloud_name` (ej: `reserva-padel-123`)
   - API Key (no lo necesitas)
   - API Secret (no lo necesitas)

## Paso 3: Crear Upload Preset

Los Upload Presets permiten subir sin autenticación (perfecto para apps):

1. En el Dashboard, ve a **Settings** (⚙️ arriba a la derecha)
2. Haz clic en la pestaña **Upload**
3. Scroll hasta **Upload presets**
4. Haz clic en **"Add upload preset"**
5. Configura el preset:
   - **Preset name**: `reserva_padel_profiles`
   - **Signing mode**: Selecciona **"Unsigned"** ⚠️ (muy importante)
   - **Folder**: `reserva_padel/profiles`
   - **Unique filename**: ✅ Activado
   - **Overwrite**: ✅ Activado (para reemplazar fotos antiguas)
   - **Format**: Auto (detecta automáticamente)
   - **Image transformations**: Opcional (puedes dejar vacío)
6. Haz clic en **"Save"**

## Paso 4: Configurar Variables de Entorno

Edita tu archivo `.env`:

```env
# Cloudinary Configuration
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=reserva_padel_profiles
```

**Ejemplo real:**
```env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=reserva-padel-123
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=reserva_padel_profiles
```

## Paso 5: Verificar que Funciona

1. Reinicia el servidor de desarrollo: `npm start`
2. Abre la app y ve a Perfil
3. Presiona "Editar Perfil"
4. Selecciona una foto
5. Presiona "Guardar Cambios"
6. Ve al Dashboard de Cloudinary > **Media Library**
7. Deberías ver tu foto en `reserva_padel/profiles/user_{userId}.jpg`

## Estructura de Almacenamiento en Cloudinary

Las fotos se guardarán en:
```
reserva_padel/
  profiles/
    user_abc123xyz.jpg
    user_def456uvw.jpg
```

## Ventajas de Esta Implementación

✅ **Gratis para siempre**: Plan gratuito sin límite de tiempo
✅ **Sin configuración de servidor**: Todo via API REST
✅ **URLs seguras HTTPS**: `https://res.cloudinary.com/...`
✅ **Reemplazo automático**: Las fotos nuevas sobrescriben las antiguas (ahorra espacio)
✅ **Optimización automática**: Cloudinary comprime las imágenes
✅ **Transformaciones on-the-fly**: Puedes redimensionar imágenes en la URL
✅ **Backup automático**: Cloudinary mantiene respaldos

## Ejemplo de URL de Foto

Después de subir, la URL será algo como:
```
https://res.cloudinary.com/reserva-padel-123/image/upload/v1234567890/reserva_padel/profiles/user_abc123xyz.jpg
```

## Transformaciones Opcionales

Si quieres optimizar las imágenes automáticamente, puedes modificar la URL:

**Original:**
```
https://res.cloudinary.com/reserva-padel-123/image/upload/v.../user_abc.jpg
```

**Con transformaciones (redimensionar, formato auto, calidad 80):**
```
https://res.cloudinary.com/reserva-padel-123/image/upload/w_200,h_200,c_fill,q_80,f_auto/v.../user_abc.jpg
```

Esto se puede configurar en el Upload Preset (paso 3) o directamente en la URL.

## Límites del Plan Gratuito

| Característica | Límite Mensual |
|----------------|----------------|
| Almacenamiento | 25 GB |
| Ancho de banda | 25 GB |
| Transformaciones | 25,000 |
| Archivos | Ilimitados |

**Para esta app de reservas de pádel, el plan gratuito es MÁS que suficiente:**
- 25 GB = ~50,000 fotos de perfil (500KB cada una)
- 25 GB de ancho de banda = ~400,000 vistas de fotos/mes

## Troubleshooting

### Error: "Cloudinary no está configurado"
➡️ Verifica que las variables `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` y `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` estén en tu archivo `.env`

### Error: "Upload preset not found"
➡️ Asegúrate de que el Upload Preset esté configurado como **"Unsigned"** en Settings > Upload

### Error: "Invalid signature"
➡️ El Upload Preset debe estar en modo **"Unsigned"**, no "Signed"

### La foto no se sube
➡️ Verifica:
1. Que el Cloud Name sea correcto (sin espacios)
2. Que el Upload Preset exista y sea "Unsigned"
3. Que tengas conexión a internet
4. Los logs en consola con `console.log`

### ¿Cómo ver mis fotos subidas?
➡️ Ve a Cloudinary Dashboard > **Media Library** > busca la carpeta `reserva_padel/profiles`

## Monitoreo de Uso

Para ver cuánto estás usando:
1. Ve al Dashboard de Cloudinary
2. En la parte superior verás:
   - **Storage**: GB usados de 25 GB
   - **Bandwidth**: GB transferidos este mes de 25 GB
   - **Transformations**: Número de transformaciones de 25,000

## Comparación: Firebase Storage vs Cloudinary

| Característica | Firebase Storage | Cloudinary |
|----------------|------------------|------------|
| **Precio** | $0.026/GB después de 5GB | 25 GB gratis siempre |
| **Tarjeta requerida** | Sí (después de límite) | No |
| **Configuración** | Reglas complejas | Upload Preset simple |
| **Optimización** | Manual | Automática |
| **CDN** | Sí | Sí (más rápido) |
| **Transformaciones** | No | Sí (on-the-fly) |

## Próximos Pasos

Una vez configurado Cloudinary:
1. ✅ Las fotos de perfil funcionarán perfectamente
2. ✅ Gratis para siempre (plan Free)
3. ✅ Sin límites prácticos para tu app
4. ✅ URLs HTTPS seguras
5. ✅ Backup automático en la nube

¡Disfruta de tu almacenamiento gratuito! 🎉
