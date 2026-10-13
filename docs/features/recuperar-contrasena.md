# Recuperar contraseña

El enlace del correo lleva a `/reset-password`. La app admite dos formatos:

| Formato | Funciona en | Cómo se procesa |
|---|---|---|
| `?code=…` (PKCE, el de Supabase por defecto) | Solo en el **mismo navegador** donde se pidió | `exchangeCodeForSession` |
| `?token_hash=…&type=recovery` | **Cualquier dispositivo o navegador** | `verifyOtp({ token_hash, type: 'recovery' })` |

El formato PKCE falla si, por ejemplo, se pide desde la PWA del iPhone y el correo abre el enlace en Safari, porque son almacenamientos distintos.

## Plantilla de Supabase (recomendada)

Authentication → Emails → **Reset Password**: sustituir `{{ .ConfirmationURL }}` por

```
{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery
```

El **Site URL** (Authentication → URL Configuration) debe ser `https://rio-tamesis-app.vercel.app`.
