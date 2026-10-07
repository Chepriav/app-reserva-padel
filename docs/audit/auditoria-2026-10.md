# Auditoría de la app — octubre 2026

Revisión completa del código (cliente, Edge Functions, migraciones SQL, configuración de Vercel/PWA) y de la interfaz, con la app web arrancada en local contra datos simulados.

**Límite importante:** las políticas RLS base y las RPC de reservas (`criar_reserva_con_prioridad`, `desplazar_reserva_y_crear_nueva`, …) **no están en el repositorio**, solo en la base de datos. Lo que dependa de ellas está marcado como *"a verificar"*. Para cerrarlo, ejecuta `docs/audit/diagnostico-seguridad.sql` en Supabase → SQL Editor (solo lectura) y revisa los resultados.

## Estado general

| Comprobación | Resultado |
|---|---|
| Tests (`npm test`) | ✅ 35 suites, 330 tests pasan |
| Build web (`expo export -p web`) | ✅ compila |
| Secretos en el repo / historial git | ✅ no hay claves (solo la anon key, que es pública por diseño) |
| Cabeceras HTTP (Vercel) | ✅ CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy |
| `npm run lint` | ⚠️ no funciona: falta `.eslintrc` |
| `tsc --noEmit` | ⚠️ 23 errores, todos en adaptadores *Legacy* que ya no se usan |
| `npm audit` | ⚠️ 79 avisos, casi todos en tooling de Expo/Metro (no llegan al navegador) |

---

## 1. Seguridad

### 🔴 CRÍTICO — Cualquiera puede cambiar los horarios de la pista
`update_schedule_config` (SECURITY DEFINER) comprobaba si es admin el **`p_user_id` que manda el cliente**, no el usuario real. Además, si ese id no existe, `v_is_admin` es `NULL` y `IF NOT NULL` **se salta la comprobación**. Con la anon key (pública, va en el bundle web) cualquiera podía cambiar apertura, cierre y pausas sin iniciar sesión.

**Corregido** en `supabase/migrations/20261007120000_secure_update_schedule_config.sql`: usa `auth.uid()`, trata `NULL` como "no admin", fija `search_path` y quita el permiso a `anon`. Mantiene el parámetro `p_user_id` (ignorado), así que la app actual sigue funcionando.
➡️ **Pendiente: aplicarla** (`supabase db push` o pegarla en el SQL Editor).

### 🟠 ALTO — La Edge Function de push era un relé abierto
`send-push-notification` aceptaba la anon key como única credencial. Cualquiera podía mandar notificaciones con texto arbitrario a cualquier vecino conociendo su UUID (por ejemplo, phishing: "Tu reserva fue cancelada, entra aquí…"). La respuesta también devolvía los endpoints de push.

**Corregido:** la función exige ahora el JWT de un usuario **autenticado y aprobado**, y el cliente (`CombinedPushDelivery`) envía el token de sesión.
➡️ **Orden de despliegue:** 1) despliega la web (Vercel); 2) espera unos días a que los móviles con la PWA instalada se actualicen; 3) `supabase functions deploy send-push-notification`. Si se hace al revés, las PWA antiguas dejarán de enviar push hasta que se actualicen.

*Mejora futura:* restringir además a quién puede notificar cada usuario (hoy cualquier vecino aprobado puede mandar push a cualquier otro). Lo ideal es que las notificaciones las disparen triggers de la BD y no el cliente.

### 🟠 ALTO (a verificar) — RPC de reservas que reciben el id de usuario del cliente
`criar_reserva_con_prioridad(p_usuario_id, p_vivienda, …)` y `desplazar_reserva_y_crear_nueva(p_nuevo_usuario_id, …)` reciben del cliente **quién** reserva y **para qué vivienda**. Si son SECURITY DEFINER y no comparan con `auth.uid()`, un usuario podría reservar o desplazar en nombre de otra vivienda. Tampoco hay en el repo una comprobación en servidor del máximo de 3 bloques ni de los 7 días (la app lo valida, pero solo en el cliente).
➡️ Revisar con la consulta 4 del diagnóstico.

### 🟠 ALTO (a verificar) — ¿Puede un usuario hacerse admin?
El registro inserta la fila en `users` desde el cliente con `es_admin: false, estado_aprobacion: 'pendiente'`, y el perfil se actualiza con `update()` directo. Si la política de INSERT/UPDATE de `users` no restringe columnas (o no hay un trigger que lo impida), un usuario podría mandar `es_admin: true` o `estado_aprobacion: 'aprobado'` desde la consola del navegador, o cambiarse `vivienda` sin pasar por la aprobación del admin.
➡️ Revisar consultas 2 y 5. Si no hay protección, la solución típica es un trigger `BEFORE INSERT OR UPDATE` que impida tocar `es_admin`, `es_manager`, `es_demo`, `estado_aprobacion` y `vivienda` salvo a un admin. Te la preparo cuando confirmes el estado actual.

### 🟡 MEDIO — Credenciales de prueba visibles en el login de producción
La pantalla de login muestra siempre `juan@ejemplo.com / 123456` y `maria@ejemplo.com / 123456`. Si esas cuentas existen y **no** son `es_demo = true`, cualquiera entra como vecino aprobado. Si son demo a propósito, está bien, pero conviene que la caja lo diga ("Cuenta demo de solo lectura").
➡️ Consulta 6 del diagnóstico. No lo he tocado porque puede ser intencionado.

### 🟢 BAJO
- Funciones SECURITY DEFINER (`get_schedule_config`, etc.) sin `SET search_path` (aviso habitual del linter de Supabase).
- `create-user` acepta `redirectTo` del cuerpo sin validarlo (solo la puede llamar un admin; conviene limitarlo a una lista blanca).
- `scripts/setAdminUser.js` lleva un UUID de usuario fijo y usa la anon key (si funciona, es que la RLS de `users` permite a un admin cambiar `es_admin`, lo cual es correcto). Es un script temporal: se puede borrar.
- La CSP permite `'unsafe-eval'` (lo necesita el bundle de Expo web; no es fácil quitarlo).
- `axios` está en las dependencias pero no se usa en ninguna parte y tiene avisos de seguridad → se puede quitar.

---

## 2. Bugs funcionales encontrados (corregidos)

| Bug | Efecto para el usuario | Estado |
|---|---|---|
| El perfil leía `user.phone` pero el formato legacy solo traía `telefono` | El teléfono salía **vacío** en "Mi perfil" y en las tarjetas de solicitud del admin; al editar el perfil había que reescribirlo o daba "Teléfono no válido" | ✅ corregido |
| El nivel de juego llegaba en inglés (`intermediate`) a una UI que espera español | "Nivel de juego" vacío en el perfil; "intermediate" en la lista de vecinos de la vivienda y en partidas; al unirse a una partida el nivel se perdía (doble conversión → `null`) | ✅ corregido |

Se han añadido tests para ambos.

## 3. Calidad del código y rendimiento

- **Código muerto:** `LegacyMatchNotifierAdapter`, `LegacyDisplacementNotifierAdapter` y `LegacyMatchCancellationAdapter` ya no se usan (el contenedor DI usa las versiones nuevas) y son la fuente de los 23 errores de TypeScript. Se pueden borrar.
- **N+1 consultas en la parrilla:** por cada hueco reservado del día se hace una consulta extra `reservas?vivienda=eq.X` para calcular la prioridad. Con la pista llena son ~20 consultas cada vez que cambias de día. Se puede resolver con una sola consulta `vivienda=in.(...)`.
- **Lint roto:** añadir `.eslintrc.js` con `extends: 'expo'` (la dependencia `eslint-config-expo` ya está).
- **Dependencias:** Expo 51 / RN 0.74 son de 2024. Actualizar a un SDK más reciente quita la mayoría de avisos de `npm audit`, pero **es un cambio grande** que conviene hacer aparte y con pruebas en móvil.
- **Docs desactualizadas:** `CLAUDE.md` describe los colores como verdes, pero la app usa azul marino y dorado.

---

## 4. Propuestas de diseño e interfaz

Todas son cambios de presentación (estilos y componentes), sin tocar la lógica de reservas. Ordenadas por impacto/riesgo.

### Prioridad alta (mucho impacto, poco riesgo)

1. **Mostrar la pausa en la parrilla.** Cuando hay pausa configurada, la parrilla salta (p. ej. de 13:30 a 16:00) sin explicación. Añadir una fila separadora "🍽 14:00–16:00 · Hora de comida" evita la duda "¿por qué no puedo reservar a las 14:00?".
2. **Tira de días en lugar de flechas.** Como solo se reserva 7 días vista, una fila de 7 "pastillas" (`Hoy`, `Jue 8`, `Vie 9`…) permite saltar a cualquier día con un toque en vez de pulsar la flecha varias veces. La fecha larga ("miércoles, 7 de octubre de 2026") ocupa dos líneas y se puede acortar.
3. **"Cancelar reserva" menos agresivo.** El botón rojo macizo a todo el ancho en cada tarjeta es la acción más llamativa de la pantalla "Mis Reservas" y es destructiva. Mejor un botón con borde rojo o un texto "Cancelar", manteniendo el diálogo de confirmación.
4. **Iconos vectoriales en la barra inferior.** Los iconos actuales son emojis (🏠📅🎾📢⚙️👤), que cambian de aspecto según el móvil (el calendario muestra "July 17") y no se tiñen con el color activo. `@expo/vector-icons` ya está instalado (se usa en Admin): sustituirlos por Ionicons da un aspecto uniforme y profesional.
5. **Unificar el color de marca.** El `theme_color` de la PWA (barra de estado en Android), el icono y la guía `guia.html` son **verdes** (#2e7d32), mientras la app es **azul marino**. Elegir uno y aplicarlo en `manifest.json`, `app.json` y `web-pwa-config.js`.

### Prioridad media

6. **Accesibilidad:** no hay ningún `accessibilityLabel` ni `accessibilityRole` en la app. Los huecos horarios se leen como "18:00" sin indicar si están libres o reservados. Añadir etiquetas ("18:00, reservado por 1-2-B") ayuda a quien usa lector de pantalla y mejora los tests.
7. **Contraste:** el texto blanco sobre dorado (reservas provisionales, badge "Administrador") y el gris sobre gris de los huecos pasados no llegan al mínimo WCAG de 4.5:1 (blanco sobre #d69e2e da 2.4:1; gris sobre gris en huecos pasados, 1.8:1). Para texto blanco, el dorado tendría que bajar a ~#975a16 (5.5:1); alternativa: texto oscuro sobre el dorado actual. La matrícula de la vivienda en el hueco usa 9 px: subir a 10–11 px.
8. **Leyenda más clara:** "Libre" es el color más oscuro y llamativo, y "Reservado" el más claro, lo cual es contraintuitivo para algunos usuarios. Alternativa: hueco libre blanco con borde azul, reservado en gris. (Es un cambio visible para todos: conviene preguntarlo a los vecinos antes.)
9. **Pestañas coherentes:** "Mis Reservas", "Partidas" y "Admin" usan pestañas subrayadas; "Tablón" usa pastillas. Unificar el estilo.
10. **Pull-to-refresh** en todas las listas (solo 3 pantallas lo tienen) y **estados vacíos** con una acción ("No tienes reservas próximas → Reservar").
11. **Placeholder del login:** `tu@email.com` se ve casi negro y parece un valor ya escrito. Usar `placeholderTextColor` gris. El icono del ojo de la contraseña se sale ligeramente del borde del campo.

### Prioridad baja / ideas

12. **"Añadir al calendario"** en cada reserva (`expo-calendar` ya está en las dependencias).
13. **Modo oscuro** siguiendo el ajuste del sistema (requiere pasar los colores a un tema; trabajo medio).
14. **Feedback háptico** al seleccionar huecos en móvil (`expo-haptics`).

### Cómo hacerlo sin romper nada

- Un cambio por PR, empezando por 1, 2, 3 y 4, que son autocontenidos (un componente cada uno).
- Probar cada PR en una *preview* de Vercel antes de pasar a producción.
- Las propuestas 7 y 8 cambian colores que los vecinos ya conocen: anunciarlo en el Tablón.
