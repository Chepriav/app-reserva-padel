# Configuración Necesaria para Importación CSV

## Problema Detectado

La funcionalidad de importación CSV está fallando porque **el registro público (Email Signups) está deshabilitado** en tu proyecto de Supabase.

```
Error: Registro deshabilitado en Supabase.
Habilita "Enable email signups" en Auth Settings.
```

## Solución: Habilitar Email Signups en Supabase

### Paso 1: Ir a Supabase Dashboard

1. Abre tu navegador y ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto de pádel

### Paso 2: Configurar Authentication

1. En el menú lateral, ve a **Authentication** → **Providers**
2. Busca la sección **"Email"**
3. Haz clic en el provider **Email**

### Paso 3: Habilitar Email Signups

Encontrarás estas opciones:

```
☑ Enable email provider
☑ Confirm email         [Opcional - puedes dejarlo deshabilitado para esta feature]
☑ Secure email change   [Opcional]
```

**IMPORTANTE**: Asegúrate de que **"Enable email provider"** esté activado (checked).

### Paso 4: Configurar Email Templates (Opcional pero Recomendado)

1. Ve a **Authentication** → **Email Templates**
2. Configura el template **"Reset Password"** con tu branding
3. Este es el email que recibirán los usuarios importados

### Paso 5: Guardar y Verificar

1. Haz clic en **"Save"** en la parte inferior
2. Espera unos segundos para que los cambios se apliquen
3. Recarga tu aplicación y prueba de nuevo la importación

## Verificación

Después de habilitar email signups, deberías poder:

1. Importar usuarios desde CSV sin errores 400
2. Los usuarios se crean en `auth.users` y `public.users`
3. Cada usuario recibe un email de "Reset Password"
4. Los usuarios pueden establecer su contraseña usando el link del email

## Alternativa: Admin API (Requiere Service Role Key)

Si prefieres NO habilitar email signups públicos, puedes usar el Admin API de Supabase, pero esto requiere:

1. **Service Role Key** (clave secreta - NO debe exponerse en frontend)
2. **Backend/Edge Function** para manejar la importación de forma segura
3. Más complejo de implementar

Para proyectos pequeños/medianos, **habilitar email signups es la solución más simple y segura**.

## Seguridad

### ¿Es seguro habilitar email signups?

**Sí**, porque:

1. Los usuarios creados manualmente por admin quedan **auto-aprobados**
2. Los usuarios que se registren normalmente quedan en estado **"pendiente"** esperando aprobación
3. Solo pueden hacer login los usuarios con `estado_aprobacion = 'aprobado'`
4. El flujo de importación CSV solo está disponible para **administradores**

### Protección Adicional

Si quieres proteger contra registros no deseados:

1. Ve a **Authentication** → **URL Configuration**
2. Configura **Site URL** para tu dominio específico
3. Configura **Redirect URLs** solo para tus dominios autorizados

## Configuración de URLs para Email de Reset

Para que los enlaces de "resetear contraseña" funcionen correctamente:

### En Supabase Dashboard:

1. Ve a **Authentication** → **URL Configuration**
2. **Site URL**: `https://tu-app.vercel.app`
3. **Redirect URLs**: Añadir `https://tu-app.vercel.app/reset-password`

### En tu aplicación:

Añade a tu archivo `.env`:

```env
EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL=https://tu-app.vercel.app/reset-password
```

**Importante**: Si no configuras esto, los enlaces de reset apuntarán a `localhost` cuando importes usuarios desde desarrollo, lo cual no funcionará cuando el usuario abra el email.

## Testing Post-Configuración

Una vez habilitado, prueba con:

```bash
# 1. Ve al panel admin
# 2. Tab "Usuarios"
# 3. Click "Importar Usuarios"
# 4. Selecciona: test-cases/valid-users.csv
# 5. Verifica que se importen correctamente
```

## Contacto con Soporte

Si sigues teniendo problemas después de habilitar email signups:

1. Verifica en **Authentication** → **Users** que no haya límites de rate
2. Revisa los **Logs** en Supabase Dashboard
3. Contacta al soporte de Supabase si es un problema de configuración del proyecto

## Resumen de Cambios en el Código

El código ya está actualizado para:
- ✅ Detectar cuando email signups está deshabilitado
- ✅ Mostrar mensaje de error claro y accionable
- ✅ Verificar emails duplicados antes de intentar crear
- ✅ Manejar errores de forma granular
- ✅ Crear usuarios con estado "aprobado" automáticamente
- ✅ Enviar email de reset de contraseña

**No necesitas cambiar código, solo habilitar la configuración en Supabase.**
