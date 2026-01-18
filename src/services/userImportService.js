import { Platform } from 'react-native';
import { supabase } from './supabaseConfig';

/**
 * User Import Service
 *
 * Handles bulk user import via CSV for administrators.
 * Uses Supabase Edge Function (create-user) which:
 * 1. Creates user in auth.users with email_confirm: true (skips confirmation email)
 * 2. Creates profile in public.users table
 * 3. Sends only ONE email: password reset link
 *
 * Flow:
 * Admin uploads CSV → importUsersFromData() → Edge Function create-user →
 * User receives reset password email → Sets password → Can login
 */

const BATCH_SIZE = 5;
const BATCH_DELAY = 2000;
const USER_DELAY = 1000;

/**
 * Gets the redirect URL for password reset emails
 */
function getPasswordResetRedirect() {
  const envRedirect = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL;
  if (envRedirect) return envRedirect;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/reset-password`;
  }

  return 'https://rio-tamesis-app.vercel.app/reset-password';
}

/**
 * Imports a single user via Edge Function
 * The Edge Function handles: auth creation, profile creation, and reset email
 */
async function importSingleUser(user) {
  const redirectTo = getPasswordResetRedirect();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, error: 'No hay sesión activa' };
  }

  const response = await supabase.functions.invoke('create-user', {
    body: {
      email: user.email,
      nombre: user.nombre,
      vivienda: user.vivienda,
      redirectTo,
    },
  });

  if (response.error) {
    console.error('[CSV Import] Edge Function error:', response.error);
    return { success: false, error: response.error.message || 'Error en Edge Function' };
  }

  if (response.data?.error) {
    return { success: false, error: response.data.error };
  }

  return { success: true, userId: response.data?.userId };
}

/**
 * Imports multiple users from CSV data with progress feedback
 * @param {Array} userData - Array of {nombre, email, vivienda}
 * @param {Function} onProgress - Callback (current, total, currentUser)
 * @param {Function} onUserResult - Callback (user, success, error)
 * @param {AbortSignal} signal - For cancellation
 */
export async function importUsersFromData(userData, onProgress, onUserResult, signal = null) {
  const results = [];

  for (let i = 0; i < userData.length; i++) {
    if (signal?.aborted) break;

    const user = userData[i];
    onProgress?.(i + 1, userData.length, user);

    try {
      const result = await importSingleUser(user);
      results.push({ user, ...result });
      onUserResult?.(user, result.success, result.error);
    } catch (error) {
      const errorMsg = error.message || 'Error desconocido';
      results.push({ user, success: false, error: errorMsg });
      onUserResult?.(user, false, errorMsg);
    }

    if (i < userData.length - 1) {
      const delay = (i + 1) % BATCH_SIZE === 0 ? BATCH_DELAY : USER_DELAY;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { success: true, results, cancelled: signal?.aborted || false };
}

export const userImportService = {
  importUsersFromData,
};
