import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// En web, usar localStorage (default de Supabase); en móvil, usar AsyncStorage
const storage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(storage && { storage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Refrescar token 60 segundos antes de que expire (por defecto es 10s)
    // Esto da más margen para conexiones lentas
    flowType: 'pkce',
  },
});

/**
 * Intenta refrescar la sesión manualmente
 * Útil cuando la app vuelve de background
 */
export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.log('[Supabase] Error getting session:', error.message);
      return { success: false, error };
    }

    if (!session) {
      return { success: false, error: 'No session' };
    }

    // Si el token expira en menos de 5 minutos, refrescarlo
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;

    if (timeUntilExpiry < 300) { // 5 minutos
      console.log('[Supabase] Token expira pronto, refrescando...');
      const { data, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.log('[Supabase] Error refreshing session:', refreshError.message);
        return { success: false, error: refreshError };
      }

      return { success: true, session: data.session };
    }

    return { success: true, session };
  } catch (err) {
    console.log('[Supabase] Exception refreshing session:', err);
    return { success: false, error: err };
  }
};
