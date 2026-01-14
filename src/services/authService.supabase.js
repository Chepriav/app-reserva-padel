import { Platform } from 'react-native';
import { supabase } from './supabaseConfig';
import { storageService } from './storageService.supabase';

/**
 * Error messages translated to Spanish (for UI)
 */
const ERROR_MESSAGES = {
  'Invalid login credentials': 'Email o contraseña incorrectos',
  'User already registered': 'Este email ya está registrado',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Unable to validate email address: invalid format': 'Email no válido',
  'Email rate limit exceeded': 'Demasiados intentos. Intenta más tarde',
  default: 'Ha ocurrido un error. Intenta de nuevo',
};

/**
 * Gets the translated error message
 */
const getErrorMessage = (error, defaultMessage) => {
  if (!error) return defaultMessage || ERROR_MESSAGES.default;

  const errorMsg = error.message || error;
  return ERROR_MESSAGES[errorMsg] || defaultMessage || ERROR_MESSAGES.default;
};

/**
 * Checks the user's approval status
 */
const checkApprovalStatus = (estadoAprobacion) => {
  if (estadoAprobacion === true || estadoAprobacion === 'aprobado') {
    return { approved: true };
  }

  if (estadoAprobacion === false || estadoAprobacion === 'rechazado') {
    return {
      approved: false,
      error: 'Tu solicitud de registro fue rechazada. Contacta con el administrador',
    };
  }

  return {
    approved: false,
    error: 'Tu cuenta está pendiente de aprobación por un administrador',
  };
};

/**
 * Converts snake_case to camelCase for user fields
 */
const mapUserToCamelCase = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    nombre: data.nombre,
    email: data.email,
    telefono: data.telefono,
    vivienda: data.vivienda,
    viviendaSolicitada: data.vivienda_solicitada,
    nivelJuego: data.nivel_juego,
    fotoPerfil: data.foto_perfil,
    esAdmin: data.es_admin,
    esManager: data.es_manager,
    estadoAprobacion: data.estado_aprobacion,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Converts camelCase to snake_case for updating user
 */
const mapUserToSnakeCase = (data) => {
  const mapped = {};
  if (data.nombre !== undefined) mapped.nombre = data.nombre;
  if (data.telefono !== undefined) mapped.telefono = data.telefono;
  if (data.vivienda !== undefined) mapped.vivienda = data.vivienda;
  if (data.nivelJuego !== undefined) mapped.nivel_juego = data.nivelJuego;
  if (data.fotoPerfil !== undefined) mapped.foto_perfil = data.fotoPerfil;
  return mapped;
};

const getPasswordResetRedirect = () => {
  const envRedirect = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL;
  if (envRedirect) return envRedirect;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/reset-password`;
  }

  return null;
};

const parseRecoveryParams = (url) => {
  if (!url) return {};

  try {
    const parsedUrl = new URL(url);
    const hash = parsedUrl.hash ? parsedUrl.hash.substring(1) : '';
    const hashParams = new URLSearchParams(hash);
    const searchParams = parsedUrl.searchParams;
    const getParam = (key) => hashParams.get(key) || searchParams.get(key);

    const type = getParam('type');
    const code = getParam('code');
    const accessToken = getParam('access_token');
    const refreshToken = getParam('refresh_token');

    // If there's a code parameter, it's likely a recovery flow (PKCE)
    const isRecovery = type === 'recovery' || (code && !type);

    return {
      type: isRecovery ? 'recovery' : type,
      accessToken,
      refreshToken,
      code,
    };
  } catch (error) {
    console.error('Error parsing recovery params:', error);
    return {};
  }
};

const cleanupUserRelations = async (userId, { removeAdminContent = true } = {}) => {
  const { data: reservasData, error: reservasFetchError } = await supabase
    .from('reservas')
    .select('id')
    .eq('usuario_id', userId);

  if (reservasFetchError) {
    console.error('Error fetching reservations:', reservasFetchError.message);
  }

  const reservaIds = (reservasData || []).map((reserva) => reserva.id).filter(Boolean);

  if (reservaIds.length > 0) {
    const { error: partidasReservaError } = await supabase
      .from('partidas')
      .delete()
      .in('reserva_id', reservaIds);

    if (partidasReservaError) {
      console.error('Error deleting matches for reservations:', partidasReservaError.message);
    }
  }

  const { error: partidasError } = await supabase
    .from('partidas')
    .delete()
    .eq('creador_id', userId);

  if (partidasError) {
    console.error('Error deleting matches:', partidasError.message);
  }

  const { error: jugadoresError } = await supabase
    .from('partidas_jugadores')
    .delete()
    .eq('usuario_id', userId);

  if (jugadoresError) {
    console.error('Error deleting match participations:', jugadoresError.message);
  }

  const { error: reservasError } = await supabase
    .from('reservas')
    .delete()
    .eq('usuario_id', userId);

  if (reservasError) {
    console.error('Error deleting reservations:', reservasError.message);
  }

  const { error: bloqueosError } = await supabase
    .from('bloqueos_horarios')
    .update({ creado_por: null })
    .eq('creado_por', userId);

  if (bloqueosError) {
    console.error('Error clearing blockout creator:', bloqueosError.message);
  }

  if (removeAdminContent) {
    const { error: anunciosAdminError } = await supabase
      .from('anuncios_admin')
      .delete()
      .eq('creador_id', userId);

    if (anunciosAdminError) {
      console.error('Error deleting admin announcements:', anunciosAdminError.message);
    }
  }

  const { error: anunciosError } = await supabase
    .from('anuncios_destinatarios')
    .delete()
    .eq('usuario_id', userId);

  if (anunciosError) {
    console.error('Error deleting bulletin read status:', anunciosError.message);
  }
};

/**
 * Authentication service with Supabase
 */
export const authService = {
  /**
   * Signs in with email and password
   */
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: getErrorMessage(error, 'Error al iniciar sesión') };
      }

      // Get profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        return { success: false, error: 'Usuario no encontrado en la base de datos' };
      }

      // Verify approval
      const approvalCheck = checkApprovalStatus(userData.estado_aprobacion);
      if (!approvalCheck.approved) {
        await supabase.auth.signOut();
        return { success: false, error: approvalCheck.error };
      }

      return {
        success: true,
        data: mapUserToCamelCase(userData),
      };
    } catch (error) {
      return { success: false, error: 'Error al iniciar sesión' };
    }
  },

  /**
   * Signs out the user
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();

      // On web, manually clear localStorage to ensure logout
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      if (error) {
        // Even if there's an error in Supabase, we already cleaned localStorage
        console.error('Error en signOut:', error);
      }
      return { success: true };
    } catch (error) {
      // In case of error, try to clean localStorage anyway
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      return { success: true };
    }
  },

  /**
   * Gets the currently authenticated user
   */
  async getCurrentUser() {
    try {
      // Read session directly from localStorage to avoid blocking
      let session = null;

      if (typeof window !== 'undefined' && window.localStorage) {
        // Find the Supabase key in localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            try {
              const data = JSON.parse(localStorage.getItem(key));
              if (data?.access_token && data?.user) {
                session = data;
                break;
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
      }

      if (!session?.user) {
        return { success: true, data: null };
      }

      // Use direct fetch instead of Supabase client to avoid blocking
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/users?id=eq.${session.user.id}&select=*`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        return { success: true, data: null };
      }

      const users = await response.json();
      const userData = users[0];

      if (!userData) {
        return { success: true, data: null };
      }

      return {
        success: true,
        data: mapUserToCamelCase(userData),
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener usuario' };
    }
  },

  /**
   * Registers a new user (will be pending approval)
   */
  async register(userData) {
    try {
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error) {
        return { success: false, error: getErrorMessage(error, 'Error al registrarse') };
      }

      // Create profile in users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          nombre: userData.nombre,
          email: userData.email,
          telefono: userData.telefono,
          vivienda: userData.vivienda,
          es_admin: false,
          estado_aprobacion: 'pendiente',
        });

      if (insertError) {
        return { success: false, error: 'Error al crear perfil de usuario' };
      }

      // Sign out so user waits for approval
      await supabase.auth.signOut();

      return {
        success: true,
        data: { id: data.user.id },
        message: 'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador',
      };
    } catch (error) {
      return { success: false, error: 'Error al registrarse' };
    }
  },

  /**
   * Gets users pending approval (admin only)
   */
  async getPendingUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('estado_aprobacion', 'pendiente')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: 'Error al obtener usuarios pendientes' };
      }

      return {
        success: true,
        data: data.map(mapUserToCamelCase),
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener usuarios pendientes' };
    }
  },

  /**
   * Gets all approved users (admin only)
   */
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('estado_aprobacion', 'aprobado')
        .order('nombre', { ascending: true });

      if (error) {
        return { success: false, error: 'Error al obtener usuarios' };
      }

      return {
        success: true,
        data: data.map(mapUserToCamelCase),
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener usuarios' };
    }
  },

  /**
   * Toggles the admin role for a user (admin only)
   */
  async toggleAdminRole(userId, esAdmin) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ es_admin: esAdmin })
        .eq('id', userId)
        .select();

      if (error) {
        return { success: false, error: 'Error al cambiar rol de usuario' };
      }

      return { success: true, data: mapUserToCamelCase(data[0]) };
    } catch (error) {
      return { success: false, error: 'Error al cambiar rol de usuario' };
    }
  },

  /**
   * Deletes a user (admin/manager only)
   * Cascades deletion across all related tables
   * NOTE: Does not delete from auth.users - user can't login because users table entry is gone
   */
  async deleteUser(userId) {
    try {
      await cleanupUserRelations(userId, { removeAdminContent: true });

      // Delete from users table
      // Note: The following have CASCADE delete on users.id:
      // - notificaciones_usuario (CASCADE)
      // - push_tokens (CASCADE)
      // - web_push_subscriptions (CASCADE)
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (userError) {
        console.error('Error deleting user:', userError.message);
        return { success: false, error: 'Error al eliminar usuario' };
      }

      // Note: We do NOT delete from auth.users here
      // The user entry in auth.users remains but they can't login because
      // the users table entry (required for the app) is deleted
      // This is safer and doesn't require Service Role Key

      return { success: true };
    } catch (error) {
      console.error('Exception deleting user:', error);
      return { success: false, error: 'Error al eliminar usuario' };
    }
  },

  /**
   * Deletes the current user's account (self-deletion)
   * Deletes related records and users table entry. The on_user_deleted
   * trigger automatically removes from auth.users.
   */
  async deleteOwnAccount(userId) {
    try {
      await cleanupUserRelations(userId, { removeAdminContent: true });

      // Delete from users table
      // The on_user_deleted trigger automatically removes from auth.users
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (userError) {
        console.log('Error eliminando usuario:', userError.message);
        return { success: false, error: `Error al eliminar la cuenta: ${userError.message}` };
      }

      // 3. Sign out
      await supabase.auth.signOut();

      return { success: true };
    } catch (error) {
      console.log('Exception eliminando cuenta:', error);
      return { success: false, error: 'Error al eliminar la cuenta' };
    }
  },

  /**
   * Approves a pending user (admin only)
   */
  async approveUser(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ estado_aprobacion: 'aprobado' })
        .eq('id', userId)
        .select();

      if (error) {
        return { success: false, error: 'Error al aprobar usuario' };
      }

      return { success: true, data: { id: userId } };
    } catch (error) {
      return { success: false, error: 'Error al aprobar usuario' };
    }
  },

  /**
   * Rejects a pending user (admin only)
   */
  async rejectUser(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ estado_aprobacion: 'rechazado' })
        .eq('id', userId)
        .select();

      if (error) {
        return { success: false, error: 'Error al rechazar usuario' };
      }

      return { success: true, data: { id: userId } };
    } catch (error) {
      return { success: false, error: 'Error al rechazar usuario' };
    }
  },

  /**
   * Updates the user's profile
   */
  async updateProfile(userId, updates) {
    try {
      // Filter protected fields
      const { esAdmin, estadoAprobacion, ...safeUpdates } = updates;

      // Upload photo if it's a local URI
      if (storageService.isLocalImageUri(safeUpdates.fotoPerfil)) {
        try {
          safeUpdates.fotoPerfil = await storageService.uploadAvatar(userId, safeUpdates.fotoPerfil);
        } catch (uploadError) {
          return {
            success: false,
            error: uploadError.message || 'Error al subir la foto de perfil',
          };
        }
      }

      // Convert to snake_case and update
      const mappedUpdates = mapUserToSnakeCase(safeUpdates);

      const { error } = await supabase
        .from('users')
        .update(mappedUpdates)
        .eq('id', userId);

      if (error) {
        return { success: false, error: 'Error al actualizar perfil' };
      }

      // Get updated data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      return {
        success: true,
        data: mapUserToCamelCase(userData),
      };
    } catch (error) {
      return { success: false, error: 'Error al actualizar perfil' };
    }
  },

  /**
   * Checks if there's an authenticated user
   */
  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
  },

  /**
   * Sends password recovery email
   */
  async resetPassword(email) {
    try {
      const redirectTo = getPasswordResetRedirect();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        redirectTo ? { redirectTo } : undefined
      );

      if (error) {
        return {
          success: false,
          error: getErrorMessage(error, 'Error al enviar el correo de recuperación'),
        };
      }

      return {
        success: true,
        message: 'Se ha enviado un correo para restablecer tu contraseña',
      };
    } catch (error) {
      return { success: false, error: 'Error al enviar el correo de recuperación' };
    }
  },

  /**
   * Handles password recovery deep links (sets session if possible)
   */
  async handlePasswordRecoveryUrl(url) {
    const { type, accessToken, refreshToken, code } = parseRecoveryParams(url);

    console.log('[authService] handlePasswordRecoveryUrl:', { type, hasCode: !!code, hasTokens: !!(accessToken && refreshToken) });

    if (type !== 'recovery') {
      console.log('[authService] Not a recovery URL, type:', type);
      return { handled: false };
    }

    if (code) {
      console.log('[authService] Exchanging code for session');
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[authService] Error exchanging code:', error.message);
        return { handled: true, error: error.message };
      }
      console.log('[authService] Session established successfully');
      return { handled: true };
    }

    if (accessToken && refreshToken) {
      console.log('[authService] Setting session with tokens');
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error('[authService] Error setting session:', error.message);
        return { handled: true, error: error.message };
      }

      console.log('[authService] Session established successfully');
      return { handled: true };
    }

    console.error('[authService] Missing recovery tokens or code');
    return { handled: true, error: 'Missing recovery tokens' };
  },

  /**
   * Updates the current user's password (requires recovery session)
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        return { success: false, error: getErrorMessage(error, 'Error al actualizar contraseña') };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al actualizar contraseña' };
    }
  },

  /**
   * Requests apartment change (user)
   */
  async requestApartmentChange(userId, nuevaVivienda) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ vivienda_solicitada: nuevaVivienda })
        .eq('id', userId);

      if (error) {
        return { success: false, error: 'Error al solicitar cambio de vivienda' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al solicitar cambio de vivienda' };
    }
  },

  /**
   * Cancels own apartment change request (user)
   */
  async cancelApartmentRequest(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ vivienda_solicitada: null })
        .eq('id', userId);

      if (error) {
        return { success: false, error: 'Error al cancelar solicitud' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al cancelar solicitud' };
    }
  },

  /**
   * Gets users with pending apartment change requests (admin only)
   */
  async getApartmentChangeRequests() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .not('vivienda_solicitada', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) {
        return { success: false, error: 'Error al obtener solicitudes de cambio' };
      }

      return {
        success: true,
        data: data.map(mapUserToCamelCase),
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener solicitudes de cambio' };
    }
  },

  /**
   * Approves apartment change request (admin only)
   */
  async approveApartmentChange(userId) {
    try {
      // First get the requested apartment
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('vivienda_solicitada')
        .eq('id', userId)
        .single();

      if (fetchError || !userData?.vivienda_solicitada) {
        return { success: false, error: 'No hay solicitud pendiente para este usuario' };
      }

      // Update apartment and clear request
      const { error } = await supabase
        .from('users')
        .update({
          vivienda: userData.vivienda_solicitada,
          vivienda_solicitada: null,
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: 'Error al aprobar cambio de vivienda' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al aprobar cambio de vivienda' };
    }
  },

  /**
   * Rejects apartment change request (admin only)
   */
  async rejectApartmentChange(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ vivienda_solicitada: null })
        .eq('id', userId);

      if (error) {
        return { success: false, error: 'Error al rechazar cambio de vivienda' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al rechazar cambio de vivienda' };
    }
  },

  /**
   * Subscribes to authentication changes
   * @returns {Function} Function to cancel the subscription
   */
  onAuthChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) {
          callback(null);
          return;
        }

        try {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData) {
            callback(mapUserToCamelCase(userData));
          } else {
            callback(null);
          }
        } catch {
          callback(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  },

  /**
   * Gets users that belong to the same apartment
   */
  async getUsersBySameApartment(vivienda) {
    try {
      if (!vivienda) {
        return { success: false, error: 'Vivienda no especificada' };
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, nombre, email, foto_perfil, nivel_juego')
        .eq('vivienda', vivienda)
        .eq('estado_aprobacion', 'aprobado')
        .order('nombre', { ascending: true });

      if (error) {
        return { success: false, error: 'Error al obtener usuarios de la vivienda' };
      }

      return {
        success: true,
        data: data.map(u => ({
          id: u.id,
          nombre: u.nombre,
          email: u.email,
          fotoPerfil: u.foto_perfil,
          nivelJuego: u.nivel_juego,
        })),
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener usuarios de la vivienda' };
    }
  },

  // ============================================================================
  // LEGACY ALIASES - For backwards compatibility
  // ============================================================================
  getUsuariosPendientes(...args) { return this.getPendingUsers(...args); },
  getTodosUsuarios(...args) { return this.getAllUsers(...args); },
  aprobarUsuario(...args) { return this.approveUser(...args); },
  rechazarUsuario(...args) { return this.rejectUser(...args); },
  solicitarCambioVivienda(...args) { return this.requestApartmentChange(...args); },
  cancelarSolicitudVivienda(...args) { return this.cancelApartmentRequest(...args); },
  getSolicitudesCambioVivienda(...args) { return this.getApartmentChangeRequests(...args); },
  aprobarCambioVivienda(...args) { return this.approveApartmentChange(...args); },
  rechazarCambioVivienda(...args) { return this.rejectApartmentChange(...args); },
  getUsuariosMismaVivienda(...args) { return this.getUsersBySameApartment(...args); },
};
