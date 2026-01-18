# Importación de Usuarios por CSV

## Descripción

Permite a los administradores importar usuarios masivamente desde un archivo CSV. Los usuarios importados reciben un único email con enlace para establecer su contraseña.

## Flujo Completo

```
Admin sube CSV → userImportService → Edge Function (create-user) →
  1. Crea usuario en auth.users (email_confirm: true)
  2. Crea perfil en public.users (estado: aprobado)
  3. Envía email de reset password
→ Usuario recibe email → Click en enlace → ResetPasswordScreen → Establece contraseña → Login
```

## Arquitectura

### Frontend

**Componente**: `src/components/admin/UserImportModal.js`
- Selector de archivo CSV
- Validación de formato (nombre, email, vivienda)
- Barra de progreso
- Resultados por usuario

**Servicio**: `src/services/userImportService.js`
- `importUsersFromData()` - Procesa array de usuarios
- Rate limiting: 1 segundo entre usuarios, 2 segundos cada 5 usuarios
- Soporte para cancelación vía AbortSignal

### Backend (Edge Function)

**Función**: `supabase/functions/create-user/index.ts`

Usa Admin API de Supabase para:
1. **Crear usuario en auth** con `email_confirm: true` (evita email de confirmación)
2. **Crear perfil** en tabla `users` con estado aprobado
3. **Enviar email** de reset password con `redirectTo` personalizado

```typescript
// Creación sin email de confirmación
const { data } = await supabaseAdmin.auth.admin.createUser({
  email,
  password: tempPassword,
  email_confirm: true,  // Marca email como verificado
  user_metadata: { nombre, vivienda },
});

// Solo envía este email
await supabaseAdmin.auth.admin.generateLink({
  type: 'recovery',
  email,
  options: { redirectTo }
});
```

### Flujo de Reset Password

**Archivos involucrados**:
- `App.js` - Detecta URL con `?code=` y procesa el token
- `src/services/authService.supabase.js` - `handlePasswordRecoveryUrl()` intercambia código por sesión
- `src/screens/ResetPasswordScreen.js` - UI para establecer nueva contraseña
- `src/navigation/AppNavigator.js` - Prioriza flujo de recovery sobre auth normal

**Manejo de condición de carrera**:
```
URL con ?code= → App.js detecta → exchangeCodeForSession() (async)
                                ↓
ResetPasswordScreen monta → getSession() puede fallar si exchange no terminó
                                ↓
Solución: Escuchar onAuthStateChange con timeout de 5s
```

## Formato CSV

```csv
nombre,email,vivienda
Juan García,juan@email.com,A-101
María López,maria@email.com,B-202
```

## Configuración

### Variables de Entorno

```bash
# Opcional: Override de URL de redirect
EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL=https://mi-app.com/reset-password
```

### Edge Function

Desplegada con `--no-verify-jwt` para permitir llamadas desde el cliente.
La verificación de admin se hace dentro de la función consultando la tabla `users`.

```bash
supabase functions deploy create-user --no-verify-jwt
```

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Email ya registrado" | Usuario existe en auth.users | Verificar si ya tiene cuenta |
| "Vivienda duplicada" | Constraint unique en vivienda | Una vivienda = un usuario |
| "No hay sesión activa" | Admin no autenticado | Reloguear |
| "Edge Function error" | Función no desplegada | `supabase functions deploy create-user` |
| "Enlace no válido" | Token expirado o ya usado | Solicitar nuevo email |

## Seguridad

- Solo admins pueden importar usuarios (verificación en Edge Function)
- Contraseñas temporales generadas criptográficamente
- Tokens de reset expiran según config de Supabase
- Email debe ser único en auth y en tabla users
