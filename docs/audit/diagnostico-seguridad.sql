-- =====================================================
-- Diagnóstico de seguridad (SOLO LECTURA)
-- Ejecutar en Supabase → SQL Editor. No modifica nada.
-- Pegar los resultados para revisar lo que el repositorio no contiene
-- (las políticas base y las funciones RPC de reservas viven solo en la BD).
-- =====================================================

-- 1. Tablas públicas y si tienen RLS activado (todas deberían ser true)
SELECT c.relname AS tabla, c.relrowsecurity AS rls_activado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY rls_activado, tabla;

-- 2. Todas las políticas RLS
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- 3. Funciones SECURITY DEFINER: revisar que usan auth.uid() y no un id recibido por parámetro
SELECT p.proname AS funcion,
       pg_get_function_identity_arguments(p.oid) AS argumentos,
       p.proconfig AS config_search_path,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_puede_ejecutar,
       position('auth.uid()' IN p.prosrc) > 0 AS usa_auth_uid
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef
ORDER BY p.proname;

-- 4. Código fuente de las RPC de reservas/partidas (no están en el repo)
SELECT p.proname, pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'criar_reserva_con_prioridad',
    'desplazar_reserva_y_crear_nueva',
    'recalculate_vivienda_conversions',
    'actualizar_estado_partida_tras_salida',
    'update_schedule_config'
  );

-- 5. Triggers sobre users (¿hay alguno que impida auto-asignarse es_admin?)
SELECT event_object_table AS tabla, trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY tabla;

-- 6. Usuarios de prueba que aparecen en la pantalla de login
SELECT id, email, es_admin, es_demo, estado_aprobacion
FROM public.users
WHERE email IN ('juan@ejemplo.com', 'maria@ejemplo.com');

-- 7. Administradores actuales (comprobar que son los esperados)
SELECT id, nombre, email, created_at FROM public.users WHERE es_admin = true;
