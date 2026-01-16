# Importación de Usuarios desde CSV

Sistema que permite a los administradores importar múltiples usuarios desde un archivo CSV. Los usuarios se crean automáticamente aprobados con contraseña temporal aleatoria y reciben un email para establecer su contraseña.

## Características

- **Formato CSV simple**: `nombre,codigo,email`
- **Validación pre-importación**: Valida todos los usuarios antes de comenzar la importación
- **Contraseñas seguras**: Generación criptográfica de contraseñas temporales
- **Email automático**: Envío de email de reset de contraseña tras la creación
- **Estado aprobado**: Usuarios creados directamente en estado `aprobado`
- **Feedback de progreso**: Barra de progreso y contadores en tiempo real
- **Manejo de errores**: Detección y reporte de errores sin bloquear importaciones exitosas
- **Exportación de errores**: Descarga de log de errores en formato CSV

## Arquitectura

### Servicios

#### csvImportService.js
Servicio para parsing y validación de archivos CSV.

**Funciones principales:**
```javascript
// Parsear y validar archivo CSV
parseCSV(file) → { success, data?, errors? }

// Validar fila individual
validateCSVRow(row, lineNumber) → { valid, errors, sanitized }

// Parsear código de vivienda (soporta "1-3-B", "1/3/B", "1 3 B")
parseApartmentCode(codigo) → { escalera, piso, puerta } | null

// Generar CSV de ejemplo
generateExampleCSV() → string

// Exportar log de errores
exportErrorLog(errors) → string
```

#### authService.supabase.js (extensiones)
Funciones para importación de usuarios.

**Nuevas funciones:**
```javascript
// Generar contraseña aleatoria segura
generateRandomPassword() → string

// Importar usuarios con feedback de progreso
importUsersFromData(userData, onProgress, onUserResult, signal)
  → { success, results, cancelled }
```

### Componentes

#### ImportUsersButton
Botón para abrir el modal de importación.

**Props:**
- `onPress: () => void` - Callback para abrir modal
- `disabled?: boolean` - Deshabilitar botón

#### ImportUsersModal
Modal principal con 3 fases: selección, validación, importación.

**Props:**
- `visible: boolean` - Visibilidad del modal
- `onClose: () => void` - Callback al cerrar
- `onComplete: (results) => void` - Callback al completar
- `onImport: (userData, onProgress, onUserResult) => Promise` - Función de importación

**Fases:**
1. **Select**: Selector de archivo con ejemplo de formato
2. **Validate**: Resumen de validación (usuarios válidos y errores)
3. **Importing**: Barra de progreso con contadores en vivo

#### ImportResultsModal
Modal de resumen final post-importación.

**Props:**
- `visible: boolean` - Visibilidad del modal
- `results: {success: Array, errors: Array}` - Resultados de importación
- `onClose: () => void` - Callback al cerrar

**Muestra:**
- Total de usuarios creados vs errores
- Lista detallada de errores con emails
- Botón para exportar log de errores
- Mensaje informativo sobre emails de contraseña

### Hooks

#### useUserImport
Hook personalizado para gestionar estado y lógica de importación.

**Returns:**
```javascript
{
  importing: boolean,
  progress: { current: number, total: number },
  results: { success: Array, errors: Array },
  cancelled: boolean,
  startImport: (userData, onProgress, onUserResult) => Promise,
  cancelImport: () => void,
  clearResults: () => void,
}
```

## Formato CSV

### Estructura Requerida
```csv
nombre,codigo,email
Juan Pérez,1-3-B,juan.perez@example.com
María González,2-4-C,maria.gonzalez@example.com
```

### Formatos Soportados

**Delimitadores:**
- Coma (`,`) - Estándar
- Punto y coma (`;`) - Alternativo

**Códigos de vivienda:**
- `1-3-B` (guiones)
- `1/3/B` (barras)
- `1 3 B` (espacios)

Todos se normalizan a formato `1-3-B`.

**Caracteres especiales:**
- UTF-8 completo (tildes, ñ, etc.)
- Campos con comillas: `"Pérez, Juan","1-3-B","juan@example.com"`

### Validaciones

**Campo `nombre`:**
- Obligatorio
- 2-100 caracteres
- No puede estar vacío

**Campo `codigo`:**
- Obligatorio
- Debe parsear a:
  - Escalera: 1-6
  - Piso: 1-6
  - Puerta: A-M

**Campo `email`:**
- Obligatorio
- Formato RFC 5322
- Máximo 255 caracteres
- Único en el sistema

## Flujo de Usuario

1. Admin va a **Panel Admin → Usuarios**
2. Presiona botón **"Importar Usuarios"**
3. **Selecciona archivo CSV** desde su computadora
4. Sistema **valida el CSV** y muestra:
   - ✓ X usuarios válidos
   - ✗ Y errores (con detalles expandibles)
5. Admin presiona **"Importar X usuarios"**
6. **Barra de progreso** muestra: `60% (28/47)` + nombre del usuario actual
7. Al terminar, **modal de resultados** muestra:
   - ✓ Usuarios creados
   - ✗ Errores (con emails y razones)
   - Mensaje: "Los usuarios recibirán un email para establecer su contraseña"
8. Admin puede **exportar log de errores** (CSV) o **cerrar**
9. Lista de usuarios se **recarga automáticamente**

## Manejo de Errores

### Niveles de Error

**1. Errores de Archivo** (fallar rápido):
- Formato inválido (no es CSV)
- Archivo vacío
- Columnas requeridas faltantes
- Archivo demasiado grande (>10MB)

**2. Errores de Fila** (acumular, continuar):
- Campos vacíos
- Email inválido
- Código de vivienda inválido
- Validaciones de formato

**3. Errores de Creación** (por usuario, reportar):
- Email duplicado (ya existe en el sistema)
- Errores de red/conectividad
- Violaciones de constraints de base de datos

### Estrategia

- **Pre-validación**: Validar todas las filas antes de importar
- **Confirmación**: Mostrar resumen y permitir continuar solo con filas válidas
- **Procesamiento por lotes**: 10 usuarios con delay de 500ms (evitar rate limits)
- **No rollback**: Usuarios creados exitosamente permanecen (no hay rollback)
- **Exportación de errores**: CSV descargable con detalles de todos los errores

## Casos Especiales

### Emails Duplicados
- **Detección**: Al intentar crear en Supabase
- **Comportamiento**: Error reportado, continúa con otros usuarios
- **Mensaje**: "Email ya registrado"

### Teléfono Placeholder
- **Valor**: `"000000000"` para todos los usuarios importados
- **Justificación**: Campo requerido en DB pero no incluido en CSV
- **Solución**: Usuarios pueden actualizar en su perfil después

### Contraseñas Temporales
- **Generación**: `crypto.getRandomValues()` (12 caracteres alfanuméricos)
- **Seguridad**: Nunca almacenadas ni mostradas
- **Email**: Enviado inmediatamente después de creación

### Fallo de Email
- **Comportamiento**: Non-blocking (no bloquea creación de usuario)
- **Registro**: Warning en console
- **Solución**: Admin puede reenviar email manualmente después

### Cancelación
- **Mecanismo**: AbortController con señal
- **Comportamiento**: Detiene procesamiento de nuevos usuarios
- **Completitud**: Completa creación del usuario actual (no deja estado parcial)
- **Resultados**: Muestra usuarios procesados hasta ese momento

## Seguridad

- **Control de acceso**: Solo visible para usuarios con `esAdmin === true`
- **Validación estricta**: Sanitización de todos los campos del CSV
- **Contraseñas seguras**: Generación criptográfica, nunca logueadas
- **Rate limiting**: Batches de 10 usuarios con delay de 500ms
- **Límite de archivo**: 10MB máximo
- **Auto-aprobación**: Solo usuarios importados por admins se aprueban automáticamente

## Testing

### Archivos de Prueba

Disponibles en `test-cases/`:

1. **valid-users.csv**: 10 usuarios válidos
2. **duplicate-emails.csv**: Casos con emails duplicados
3. **invalid-apartments.csv**: Códigos de vivienda inválidos
4. **mixed-errors.csv**: Varios tipos de error mezclados

### Casos de Prueba

1. ✓ Importar usuarios válidos
2. ✓ Verificar emails de reset recibidos
3. ✓ Verificar usuarios pueden hacer login tras reset
4. ✓ Verificar `estado_aprobacion = 'aprobado'`
5. ✗ Probar email duplicado (error correcto)
6. ✗ Probar código de vivienda inválido (error correcto)
7. ✗ Probar campos vacíos (error correcto)
8. ✓ Probar CSV con 100+ usuarios (performance)
9. ✓ Probar cancelación durante importación
10. ✓ Probar mismo archivo 2 veces (todos duplicados)

### Verificación End-to-End

**Preparar CSV de prueba:**
```csv
nombre,codigo,email
Test User 1,1-1-A,test1@example.com
Test User 2,1-1-B,test2@example.com
Test User 3,1-1-C,test3@example.com
```

**Pasos:**
1. Login como admin
2. Ir a Panel Admin → Usuarios
3. Presionar "Importar Usuarios"
4. Seleccionar CSV de prueba
5. Verificar validación correcta
6. Confirmar importación
7. Observar progreso
8. Verificar resultados

**Verificar en Supabase:**
- Authentication → Users (verificar 3 nuevos usuarios)
- Tabla `users` (verificar `estado_aprobacion = 'aprobado'`)
- Logs (verificar eventos `password_recovery`)

**Probar login:**
- Seguir link de reset desde email
- Establecer nueva contraseña
- Hacer login y verificar acceso

## Archivos Modificados

### Nuevos Archivos
- `src/services/csvImportService.js` - Servicio de parsing CSV
- `src/services/userImportService.js` - Servicio de creación de usuarios por lotes
- `src/components/admin/ImportUsersButton.js` - Botón de importación
- `src/components/admin/ImportUsersModal.js` - Modal principal
- `src/components/admin/ImportResultsModal.js` - Modal de resultados
- `src/hooks/useUserImport.js` - Hook de gestión de estado
- `test-cases/*.csv` - Archivos de prueba
- `supabase/migrations/20260116_allow_admin_insert_users.sql` - Política RLS para admins

### Archivos Modificados
- `package.json` - Agregada dependencia `papaparse`
- `src/components/admin/AdminContent.js` - Agregado header con botón
- `src/screens/AdminScreen.js` - Integrados modales y handlers
- `src/components/admin/index.js` - Exportados nuevos componentes
- `.env.example` - Añadida variable `EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL`

## Dependencias

```json
{
  "papaparse": "^5.4.1"
}
```

**Justificación**: Librería robusta, pequeña (16KB), sin dependencias, ampliamente utilizada para parsing de CSV.

## Performance

- **Parsing**: O(n) donde n = número de filas
- **Validación**: O(n) con validaciones por fila
- **Importación**: O(n) con delays de 500ms cada 10 usuarios
- **Memoria**: Procesa archivo completo en memoria (límite 10MB)

**Escalabilidad**: Adecuado para urbanizaciones típicas (<1000 usuarios). Para volúmenes mayores, considerar procesamiento server-side.

## Limitaciones

1. **Solo Web**: File input solo funciona en web (no nativo por ahora)
2. **Tamaño de archivo**: Límite de 10MB
3. **Procesamiento síncrono**: Bloquea UI durante importación (usar con precaución para >100 usuarios)
4. **No rollback**: Usuarios creados permanecen si hay errores posteriores
5. **Email no garantizado**: Fallo de email no bloquea creación

## Mejoras Futuras

- [ ] Soporte para React Native (selección de archivo nativa)
- [ ] Procesamiento en background para archivos grandes
- [ ] Preview de usuarios antes de importar
- [ ] Opción de dry-run (simular sin crear)
- [ ] Soporte para actualización de usuarios existentes
- [ ] Importación de campos adicionales (teléfono, etc.)
- [ ] Validación contra usuarios ya existentes antes de importar
- [ ] Historial de importaciones
