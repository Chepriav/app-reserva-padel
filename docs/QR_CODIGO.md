# 📱 Código QR de la Aplicación

## Acceso al QR

El código QR permanente de la aplicación está disponible en:

### 🌐 Online (Producción)
```
https://rio-tamesis-app.vercel.app/app-qr.png
```

### 📁 Repositorio
```
public/app-qr.png
```

## 📥 Descargar el QR

Puedes descargar el código QR directamente desde:
- **Web**: https://rio-tamesis-app.vercel.app/app-qr.png (click derecho → Guardar imagen)
- **Repositorio**: `public/app-qr.png`

## 🎨 Características del QR

| Propiedad | Valor |
|-----------|-------|
| **URL destino** | https://rio-tamesis-app.vercel.app |
| **Tamaño** | 512x512 píxeles |
| **Formato** | PNG |
| **Color principal** | #2e7d32 (Verde pádel) |
| **Color fondo** | #FFFFFF (Blanco) |
| **Nivel corrección** | Alto (H - soporta hasta 30% de daño) |
| **Margen** | 2 módulos |

## 📋 Usos Recomendados

### 1. Impresión Física

Lugares ideales para colocar el QR impreso:

- ✅ **Pistas de pádel** - En la entrada o valla
- ✅ **Tablón de anuncios** - Junto a información de la comunidad
- ✅ **Vestuarios** - Para acceso rápido
- ✅ **Recepción/Portería** - Para visitantes
- ✅ **Zona común** - Junto a las normas de uso

**Tamaños de impresión recomendados**:
- Cartel A4: 8x8 cm a 10x10 cm
- Póster A3: 12x12 cm a 15x15 cm
- Banner: 20x20 cm o más
- Tarjeta/Flyer: Mínimo 4x4 cm

### 2. Comunicaciones Digitales

- 📧 **Email** a residentes
- 💬 **WhatsApp/Telegram** en grupos de vecinos
- 📄 **PDF** de bienvenida nuevos residentes
- 🌐 **Redes sociales** (si la comunidad tiene)

### 3. Material Promocional

- Folletos informativos
- Manuales de usuario
- Guías de bienvenida
- Newsletters

## 🖨️ Cómo Imprimir

### Opción 1: Impresión directa del PNG

1. Descarga `app-qr.png`
2. Abre con programa de fotos/visualizador
3. Imprime manteniendo relación de aspecto
4. Tamaño mínimo: 4x4 cm

### Opción 2: Usar plantilla de cartel

1. Abre `docs/CARTEL_QR.md`
2. Conviértelo a PDF usando:
   - Markdown to PDF (extensión VS Code)
   - Pandoc: `pandoc CARTEL_QR.md -o cartel.pdf`
   - Editor online de Markdown
3. Imprime el PDF resultante en A4

### Opción 3: Diseño personalizado

1. Usa Canva/Photoshop/Illustrator
2. Importa `app-qr.png`
3. Añade tu diseño personalizado
4. Mantén el QR a mínimo 4x4 cm

## 🔄 Regenerar el QR

Si necesitas regenerar el código QR (cambio de URL, color, etc.):

```bash
# Desde la raíz del proyecto
npm run generate:qr
```

O manualmente:
```bash
node scripts/generate-qr.js
```

### Personalizar el QR

Edita `scripts/generate-qr.js` para cambiar:

```javascript
const APP_URL = 'https://tu-nueva-url.com';  // URL destino

// Opciones de color
color: {
  dark: '#2e7d32',   // Color del QR (verde pádel)
  light: '#FFFFFF'   // Color de fondo (blanco)
}
```

Luego ejecuta `npm run generate:qr`.

## ✅ Verificar el QR

Para asegurarte que el QR funciona:

1. **Con móvil**:
   - Abre la cámara nativa
   - Apunta al código QR
   - Debe aparecer notificación con el enlace
   - Al tocar, abre: https://rio-tamesis-app.vercel.app

2. **Con lector online**:
   - Visita: https://webqr.com
   - Sube `app-qr.png`
   - Verifica que decode: https://rio-tamesis-app.vercel.app

## 📐 Especificaciones Técnicas

### Resolución
- **Original**: 512x512 px
- **DPI recomendado para impresión**: 300 DPI
- **Tamaño real a 300 DPI**: 4.3 x 4.3 cm

### Compatibilidad
- ✅ iOS (iPhone/iPad) - Cámara nativa
- ✅ Android - Cámara nativa o Google Lens
- ✅ Windows/Mac - Apps de lector QR
- ✅ Cualquier lector QR estándar

### Nivel de Corrección de Errores
**Alto (H)**: Permite hasta 30% de daño en el código y seguirá funcionando.

Esto significa que:
- Puede tener suciedad, arañazos
- Parte del código puede estar oculto
- Sigue siendo legible con buena iluminación

## 🎯 Ejemplos de Uso

### Cartel Básico (Texto)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎾 RESERVA DE PÁDEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Escanea el código QR para
acceder a la app de reservas

    [PEGAR QR AQUÍ]

https://rio-tamesis-app.vercel.app

Reserva en segundos desde tu móvil
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Email a Residentes
```
Hola vecinos,

Ya está disponible nuestra nueva app de
reservas de pádel.

Escanea este QR para acceder:
[INSERTAR QR]

O visita: https://rio-tamesis-app.vercel.app

Saludos,
Administración
```

## 📞 Soporte

Si tienes problemas con el código QR:

1. Verifica que la URL está activa
2. Comprueba que el QR no esté dañado/borroso
3. Prueba con diferente iluminación
4. Usa un lector QR alternativo
5. Contacta al administrador técnico

---

**Generado**: Enero 2026
**Script**: `scripts/generate-qr.js`
**Comando**: `npm run generate:qr`
