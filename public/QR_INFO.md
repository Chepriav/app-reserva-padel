# Código QR de la Aplicación

Este directorio contiene el código QR permanente para acceder a la aplicación de reservas de pádel.

## 📱 Archivo QR

**Archivo**: `app-qr.png`
**URL destino**: https://rio-tamesis-app.vercel.app
**Tamaño**: 512x512 píxeles
**Color**: #2e7d32 (verde pádel)
**Nivel de corrección**: Alto (H - hasta 30% de daño)

## 🎯 Usos del QR

### 1. **Impresión física**
Imprime el QR y colócalo en:
- Entrada de las pistas de pádel
- Tablón de anuncios de la urbanización
- Vestuarios
- Recepción/portería

### 2. **Difusión digital**
- Envío por email a residentes
- WhatsApp/Telegram grupos de la urbanización
- Redes sociales (si aplica)
- Documentos PDF de bienvenida

### 3. **Carteles informativos**
Usa el QR en carteles con texto como:
```
📱 RESERVA TU PISTA DE PÁDEL

Escanea el código QR para acceder
a la aplicación de reservas

[QR CODE AQUÍ]

https://rio-tamesis-app.vercel.app
```

## 🔄 Regenerar el QR

Si necesitas regenerar el código QR (por ejemplo, si cambia la URL):

```bash
npm run generate:qr
```

Este comando:
1. Lee la URL configurada
2. Genera el QR con los colores corporativos
3. Guarda el archivo en `public/app-qr.png`
4. El archivo se desplegará automáticamente con la app

## 📋 Especificaciones técnicas

- **Formato**: PNG
- **Resolución**: 512x512px (alta calidad para impresión)
- **Margen**: 2 módulos (recomendado para escaneo)
- **Tipo**: URL directa (no requiere app especial)
- **Compatible**: Cualquier lector QR estándar

## ✅ Verificación

Para verificar que el QR funciona correctamente:
1. Abre la cámara de tu móvil
2. Apunta al código QR
3. Debería aparecer una notificación con el enlace
4. Al tocar, se abre https://rio-tamesis-app.vercel.app

## 📐 Tamaños de impresión recomendados

| Uso | Tamaño mínimo | Tamaño recomendado |
|-----|---------------|-------------------|
| Cartel A4 | 5x5 cm | 8x8 cm |
| Póster A3 | 8x8 cm | 12x12 cm |
| Banner grande | 15x15 cm | 20x20 cm |
| Tarjeta/flyer | 3x3 cm | 4x4 cm |

**Importante**: Nunca imprimir más pequeño de 3x3 cm para garantizar el escaneo correcto.

## 🎨 Personalización

El QR usa el color verde (#2e7d32) del branding de la app. Si necesitas cambiar el color:

1. Edita `scripts/generate-qr.js`
2. Modifica el campo `color.dark`
3. Ejecuta `npm run generate:qr`

## 📍 Ubicación del archivo

- **Desarrollo**: `/public/app-qr.png`
- **Producción**: `https://rio-tamesis-app.vercel.app/app-qr.png`

El archivo se sirve automáticamente desde la raíz de la app en producción.
