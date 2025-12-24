import { supabase } from './supabaseConfig';
import { storageService } from './storageService.supabase';

/**
 * Mensajes de error traducidos al español
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
 * Obtiene el mensaje de error traducido
 */
const getErrorMessage = (error, defaultMessage) => {
  if (!error) return defaultMessage || ERROR_MESSAGES.default;

  const errorMsg = error.message || error;
  return ERROR_MESSAGES[errorMsg] || defaultMessage || ERROR_MESSAGES.default;
};

/**
 * Verifica el estado de aprobación del usuario
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
 * Convierte snake_case a camelCase para campos de usuario
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
 * Convierte camelCase a snake_case para actualizar usuario
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

/**
 * Servicio de autenticación con Supabase
 */
export const authService = {
  /**
   * Inicia sesión con email y contraseña
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

      // Obtener datos del perfil
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        return { success: false, error: 'Usuario no encontrado en la base de datos' };
      }

      // Verificar aprobación
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
   * Cierra la sesión del usuario
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();

      // En web, limpiar localStorage manualmente para asegurar logout
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
        // Aunque haya error en Supabase, ya limpiamos localStorage
        console.error('Error en signOut:', error);
      }
      return { success: true };
    } catch (error) {
      // En caso de error, intentar limpiar localStorage de todas formas
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
   * Obtiene el usuario actualmente autenticado
   */
  async getCurrentUser() {
    try {
      // Leer sesión directamente de localStorage para evitar bloqueos
      let session = null;

      if (typeof window !== 'undefined' && window.localStorage) {
        // Buscar la key de Supabase en localStorage
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
              // Ignorar errores de parsing
            }
          }
        }
      }

      if (!session?.user) {
        return { success: true, data: null };
      }

      // Usar fetch directo en lugar del cliente Supabase para evitar bloqueos
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
   * Registra un nuevo usuario (quedará pendiente de aprobación)
   */
  async register(userData) {
    try {
      // Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error) {
        return { success: false, error: getErrorMessage(error, 'Error al registrarse') };
      }

      // Crear perfil en tabla users
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

      // Cerrar sesión para que espere aprobación
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
   * Obtiene usuarios pendientes de aprobación (solo admin)
   */
  async getUsuariosPendientes() {
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
   * Obtiene todos los usuarios aprobados (solo admin)
   */
  async getTodosUsuarios() {
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
   * Cambia el rol de admin de un usuario (solo admin)
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
   * Elimina un usuario (solo admin/manager) - solo de la tabla users
   */
  async deleteUser(userId) {
    try {
      // Primero eliminar de la tabla users
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        return { success: false, error: 'Error al eliminar usuario' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al eliminar usuario' };
    }
  },

  /**
   * Elimina la cuenta del usuario actual (auto-eliminación)
   * Elimina reservas y tabla users. El trigger on_user_deleted
   * se encarga de eliminar automáticamente de auth.users.
   */
  async deleteOwnAccount(userId) {
    try {
      // 1. Eliminar reservas del usuario
      const { error: reservasError } = await supabase
        .from('reservas')
        .delete()
        .eq('usuario_id', userId);

      if (reservasError) {
        console.log('Error eliminando reservas:', reservasError.message);
      }

      // 2. Eliminar de la tabla users
      // El trigger on_user_deleted elimina automáticamente de auth.users
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (userError) {
        console.log('Error eliminando usuario:', userError.message);
        return { success: false, error: `Error al eliminar la cuenta: ${userError.message}` };
      }

      // 3. Cerrar sesión
      await supabase.auth.signOut();

      return { success: true };
    } catch (error) {
      console.log('Exception eliminando cuenta:', error);
      return { success: false, error: 'Error al eliminar la cuenta' };
    }
  },

  /**
   * Aprueba un usuario pendiente (solo admin)
   */
  async aprobarUsuario(userId) {
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
   * Rechaza un usuario pendiente (solo admin)
   */
  async rechazarUsuario(userId) {
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
   * Actualiza el perfil del usuario
   */
  async updateProfile(userId, updates) {
    try {
      // Filtrar campos protegidos
      const { esAdmin, estadoAprobacion, ...safeUpdates } = updates;

      // Subir foto si es URI local
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

      // Convertir a snake_case y actualizar
      const mappedUpdates = mapUserToSnakeCase(safeUpdates);

      const { error } = await supabase
        .from('users')
        .update(mappedUpdates)
        .eq('id', userId);

      if (error) {
        return { success: false, error: 'Error al actualizar perfil' };
      }

      // Obtener datos actualizados
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
   * Verifica si hay un usuario autenticado
   */
  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
  },

  /**
   * Envía email para recuperar contraseña
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

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
   * Solicita cambio de vivienda (usuario)
   */
  async solicitarCambioVivienda(userId, nuevaVivienda) {
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
   * Cancela solicitud de cambio de vivienda propia (usuario)
   */
  async cancelarSolicitudVivienda(userId) {
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
   * Obtiene usuarios con solicitudes de cambio de vivienda pendientes (solo admin)
   */
  async getSolicitudesCambioVivienda() {
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
   * Aprueba solicitud de cambio de vivienda (solo admin)
   */
  async aprobarCambioVivienda(userId) {
    try {
      // Primero obtener la vivienda solicitada
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('vivienda_solicitada')
        .eq('id', userId)
        .single();

      if (fetchError || !userData?.vivienda_solicitada) {
        return { success: false, error: 'No hay solicitud pendiente para este usuario' };
      }

      // Actualizar vivienda y limpiar solicitud
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
   * Rechaza solicitud de cambio de vivienda (solo admin)
   */
  async rechazarCambioVivienda(userId) {
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
   * Suscribe a cambios de autenticación
   * @returns {Function} Función para cancelar la suscripción
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
};
