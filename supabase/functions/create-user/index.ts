// Edge Function para crear usuarios desde importación CSV
// Usa Admin API para crear usuarios con email ya confirmado
// Envía email de reset password para que configuren su contraseña

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    console.log('[create-user] Function invoked');
    console.log('[create-user] Headers:', Object.fromEntries(req.headers.entries()));

    // Verificar autorización (debe ser un admin)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('[create-user] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[create-user] Auth header present, verifying user...');

    // Cliente con token del usuario para verificar permisos
    // Usamos ANON_KEY del entorno en lugar del header apikey
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar que el usuario es admin
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar es_admin en tabla users
    const { data: userData, error: userError } = await supabaseUser
      .from('users')
      .select('es_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.es_admin) {
      return new Response(
        JSON.stringify({ error: 'Only admins can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener datos del usuario a crear
    const { email, nombre, vivienda, redirectTo } = await req.json();

    if (!email || !nombre || !vivienda) {
      return new Response(
        JSON.stringify({ error: 'email, nombre, and vivienda are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cliente admin para crear usuario
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar si email ya existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'El email ya está registrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generar contraseña temporal segura
    const tempPassword = generateRandomPassword();

    // Crear usuario con Admin API (email ya confirmado, no envía email)
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Usuario ya confirmado, no envía email de confirmación
      user_metadata: {
        nombre,
        vivienda,
      },
    });

    if (createError) {
      console.error('Error creating auth user:', createError);
      let errorMsg = createError.message || 'Error al crear usuario';
      if (createError.message?.includes('already registered')) {
        errorMsg = 'Email ya registrado en el sistema de autenticación';
      }
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData?.user) {
      return new Response(
        JSON.stringify({ error: 'No se pudo crear el usuario' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear perfil en tabla users
    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      nombre,
      email,
      telefono: '000000000',
      vivienda,
      es_admin: false,
      estado_aprobacion: 'aprobado',
    });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Intentar eliminar usuario de auth si falla el perfil
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      let errorMsg = 'Error al crear perfil de usuario';
      if (profileError.code === '23505') {
        if (profileError.message?.includes('vivienda')) {
          errorMsg = 'Ya existe un usuario con esta vivienda';
        } else if (profileError.message?.includes('email')) {
          errorMsg = 'Email duplicado en tabla users';
        }
      }
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar email de reset password para que configure su contraseña
    console.log('[create-user] Sending reset email with redirectTo:', redirectTo);
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || 'https://rio-tamesis-app.vercel.app/reset-password',
    });

    if (resetError) {
      console.warn('Failed to send reset email:', resetError);
      // No fallamos la operación, el usuario fue creado correctamente
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: authData.user.id,
        email,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}
