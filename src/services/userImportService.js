import { Platform } from 'react-native';
import { supabase } from './supabaseConfig';

/**
 * Service for bulk user import functionality
 * Handles user creation with progress tracking and error handling
 */

const BATCH_SIZE = 5;
const BATCH_DELAY = 2000; // 2 seconds between batches
const USER_DELAY = 1000; // 1 second between users

/**
 * Get the redirect URL for password reset emails
 * Prefers environment variable, falls back to current origin
 */
function getPasswordResetRedirect() {
  const envRedirect = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL;
  if (envRedirect) return envRedirect;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/reset-password`;
  }

  return null;
}

/**
 * Generate a cryptographically secure random password
 * @returns {string} 12-character alphanumeric password
 */
function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * Check if email already exists in users table
 */
async function checkEmailExists(email) {
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('email', email)
    .limit(1);

  if (error) {
    return { exists: false, error: 'Error al verificar email' };
  }

  return { exists: data && data.length > 0, error: null };
}

/**
 * Create user in Supabase Auth
 */
async function createAuthUser(user, tempPassword) {
  const redirectTo = getPasswordResetRedirect();
  const options = {
    data: {
      nombre: user.nombre,
      vivienda: user.vivienda,
    },
  };

  if (redirectTo) {
    options.emailRedirectTo = redirectTo;
  }

  const { data, error } = await supabase.auth.signUp({
    email: user.email,
    password: tempPassword,
    options,
  });

  if (error) {
    console.error('[CSV Import] SignUp error:', {
      email: user.email,
      message: error.message,
      status: error.status,
      code: error.code,
    });

    let errorMsg = error.message || 'Error al crear usuario';

    if (error.message?.includes('already registered')) {
      errorMsg = 'Email ya registrado en el sistema de autenticación';
    } else if (error.message?.includes('rate limit')) {
      errorMsg = 'Límite de solicitudes excedido. Espera unos minutos.';
    } else if (error.message?.includes('invalid') && error.message?.includes('email')) {
      errorMsg = 'Formato de email inválido';
    } else if (error.message?.includes('Password')) {
      errorMsg = 'Error con la contraseña: ' + error.message;
    }

    return { user: null, error: errorMsg };
  }

  return { user: data?.user, error: null };
}

/**
 * Insert user profile into users table
 */
async function createUserProfile(authUser, userData) {
  const { error } = await supabase.from('users').insert({
    id: authUser.id,
    nombre: userData.nombre,
    email: userData.email,
    telefono: '000000000', // Placeholder
    vivienda: userData.vivienda,
    es_admin: false,
    estado_aprobacion: 'aprobado',
  });

  if (error) {
    console.error('[CSV Import] Insert error:', {
      email: userData.email,
      vivienda: userData.vivienda,
      message: error.message,
      code: error.code,
      details: error.details,
    });

    let errorMsg = 'Error al crear perfil de usuario';

    if (error.code === '23505') {
      if (error.message?.includes('vivienda')) {
        errorMsg = 'Ya existe un usuario con esta vivienda';
      } else if (error.message?.includes('email')) {
        errorMsg = 'Email duplicado en tabla users';
      } else {
        errorMsg = 'Dato duplicado: ' + (error.details || error.message);
      }
    } else if (error.code === '42501') {
      errorMsg = 'Sin permisos para crear usuario (RLS)';
    }

    return { success: false, error: errorMsg };
  }

  return { success: true, error: null };
}

/**
 * Send password reset email to user
 */
async function sendPasswordResetEmail(email) {
  try {
    const redirectTo = getPasswordResetRedirect();
    await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
  } catch (error) {
    console.warn('Failed to send reset email:', error);
  }
}

/**
 * Import a single user
 */
async function importSingleUser(user) {
  // Check for existing email
  const { exists, error: checkError } = await checkEmailExists(user.email);
  if (checkError) {
    return { success: false, error: checkError };
  }
  if (exists) {
    return { success: false, error: 'El email ya está registrado' };
  }

  // Create auth user
  const tempPassword = generateRandomPassword();
  const { user: authUser, error: authError } = await createAuthUser(user, tempPassword);
  if (authError) {
    return { success: false, error: authError };
  }
  if (!authUser) {
    return { success: false, error: 'No se pudo crear el usuario en auth' };
  }

  // Create profile
  const { success, error: profileError } = await createUserProfile(authUser, user);
  if (!success) {
    return { success: false, error: profileError };
  }

  // Send reset email
  await sendPasswordResetEmail(user.email);

  return { success: true, userId: authUser.id };
}

/**
 * Import multiple users from CSV data with progress feedback
 * @param {Array} userData - Array of {nombre, email, vivienda} objects
 * @param {Function} onProgress - Callback (current, total, currentUser) => void
 * @param {Function} onUserResult - Callback (user, success, error) => void
 * @param {Object} signal - AbortSignal for cancellation
 * @returns {Promise<{success: boolean, results: Array, cancelled: boolean}>}
 */
export async function importUsersFromData(userData, onProgress, onUserResult, signal = null) {
  const results = [];

  for (let i = 0; i < userData.length; i++) {
    if (signal?.aborted) {
      break;
    }

    const user = userData[i];

    if (onProgress) {
      onProgress(i + 1, userData.length, user);
    }

    try {
      const result = await importSingleUser(user);

      results.push({
        user,
        success: result.success,
        error: result.error,
        userId: result.userId,
      });

      if (onUserResult) {
        onUserResult(user, result.success, result.error);
      }
    } catch (error) {
      results.push({
        user,
        success: false,
        error: error.message || 'Error desconocido',
      });

      if (onUserResult) {
        onUserResult(user, false, error.message);
      }
    }

    // Rate limiting delay
    if (i < userData.length - 1) {
      const delay = (i + 1) % BATCH_SIZE === 0 ? BATCH_DELAY : USER_DELAY;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: true,
    results,
    cancelled: signal?.aborted || false,
  };
}

export const userImportService = {
  importUsersFromData,
  generateRandomPassword,
};
