/**
 * Auth Service — FACADE
 *
 * Delegates to domain use cases while maintaining the legacy API.
 * Consumers (AuthContext, screens, hooks) need zero changes.
 */
import {
  loginUser,
  registerUser,
  logoutUser,
  resetPasswordUseCase,
  updatePasswordUseCase,
  getCurrentUser,
  updateProfile,
  deleteOwnAccount,
  getApartmentUsers,
  getPendingUsers,
  getAllApprovedUsers,
  approveUser,
  rejectUser,
  toggleAdminRole,
  deleteUser,
  userAdminRepository,
} from '../di/container';
import {
  toLegacyFormat,
  fromLegacyFormat,
  fromLegacyRegisterData,
  toDomain,
} from '../infrastructure/supabase/mappers/userMapper';
import { supabase } from './supabaseConfig';

/**
 * Error messages translated to Spanish (for UI)
 */
const ERROR_MESSAGES = {
  'Invalid login credentials': 'Email o contraseña incorrectos',
  'User already registered': 'Este email ya está registrado',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Unable to validate email address: invalid format': 'Email no válido',
  'Email rate limit exceeded': 'Demasiados intentos. Intenta más tarde',
  'Registration request was rejected': 'Tu solicitud de registro fue rechazada. Contacta con el administrador',
  'Account is pending admin approval': 'Tu cuenta está pendiente de aprobación por un administrador',
  default: 'Ha ocurrido un error. Intenta de nuevo',
};

const getErrorMessage = (error, defaultMessage) => {
  if (!error) return defaultMessage || ERROR_MESSAGES.default;

  const errorMsg = error.message || error;
  return ERROR_MESSAGES[errorMsg] || defaultMessage || ERROR_MESSAGES.default;
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

const mapListResult = (result, errorMsg) => {
  if (!result.success) {
    return { success: false, error: errorMsg };
  }
  return { success: true, data: result.value.map(toLegacyFormat) };
};

export const authService = {
  async login(email, password) {
    const result = await loginUser.execute(email, password);
    if (!result.success) {
      return { success: false, error: getErrorMessage(result.error) };
    }
    return { success: true, data: toLegacyFormat(result.value) };
  },

  async logout() {
    await logoutUser.execute();
    return { success: true };
  },

  async getCurrentUser() {
    const result = await getCurrentUser.execute();
    if (!result.success) {
      return { success: false, error: 'Error al obtener usuario' };
    }
    return {
      success: true,
      data: result.value ? toLegacyFormat(result.value) : null,
    };
  },

  async register(userData) {
    const domainData = fromLegacyRegisterData(userData);
    const result = await registerUser.execute(domainData);
    if (!result.success) {
      return { success: false, error: getErrorMessage(result.error, 'Error al registrarse') };
    }
    return {
      success: true,
      data: { id: result.value.id },
      message: 'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador',
    };
  },

  async getPendingUsers() {
    const result = await getPendingUsers.execute();
    return mapListResult(result, 'Error al obtener usuarios pendientes');
  },

  async getAllUsers() {
    const result = await getAllApprovedUsers.execute();
    return mapListResult(result, 'Error al obtener usuarios');
  },

  async toggleAdminRole(userId, esAdmin) {
    const result = await toggleAdminRole.execute(userId, esAdmin);
    if (!result.success) {
      return { success: false, error: 'Error al cambiar rol de usuario' };
    }
    return { success: true, data: toLegacyFormat(result.value) };
  },

  async deleteUser(userId) {
    const result = await deleteUser.execute(userId);
    if (!result.success) {
      return { success: false, error: 'Error al eliminar usuario' };
    }
    return { success: true };
  },

  async deleteOwnAccount(userId) {
    const result = await deleteOwnAccount.execute(userId);
    if (!result.success) {
      return { success: false, error: 'Error al eliminar la cuenta' };
    }
    return { success: true };
  },

  async approveUser(userId) {
    const result = await approveUser.execute(userId);
    if (!result.success) {
      return { success: false, error: 'Error al aprobar usuario' };
    }
    return { success: true, data: { id: userId } };
  },

  async rejectUser(userId) {
    const result = await rejectUser.execute(userId);
    if (!result.success) {
      return { success: false, error: 'Error al rechazar usuario' };
    }
    return { success: true, data: { id: userId } };
  },

  async updateProfile(userId, updates) {
    const { esAdmin, estadoAprobacion, ...safeUpdates } = updates;
    const domainUpdates = fromLegacyFormat(safeUpdates);
    const result = await updateProfile.execute(userId, domainUpdates);
    if (!result.success) {
      return { success: false, error: result.error.message || 'Error al actualizar perfil' };
    }
    return { success: true, data: toLegacyFormat(result.value) };
  },

  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
  },

  async resetPassword(email) {
    const result = await resetPasswordUseCase.execute(email);
    if (!result.success) {
      return {
        success: false,
        error: getErrorMessage(result.error, 'Error al enviar el correo de recuperación'),
      };
    }
    return {
      success: true,
      message: 'Se ha enviado un correo para restablecer tu contraseña',
    };
  },

  async handlePasswordRecoveryUrl(url) {
    const { type, accessToken, refreshToken, code } = parseRecoveryParams(url);

    const isRecoveryFlow = type === 'recovery' || !!code;
    if (!isRecoveryFlow) {
      return { handled: false };
    }

    if (code) {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          return { handled: true, error: error.message };
        }
        return { handled: true };
      } catch (err) {
        return { handled: true, error: err.message || 'Error processing recovery code' };
      }
    }

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        return { handled: true, error: error.message };
      }
      return { handled: true };
    }

    return { handled: true, error: 'Missing recovery tokens' };
  },

  async updatePassword(newPassword) {
    const result = await updatePasswordUseCase.execute(newPassword);
    if (!result.success) {
      return {
        success: false,
        error: getErrorMessage(result.error, 'Error al actualizar contraseña'),
      };
    }
    return { success: true };
  },

  async requestApartmentChange(userId, nuevaVivienda) {
    const result = await userAdminRepository.setRequestedApartment(userId, nuevaVivienda);
    if (!result.success) {
      return { success: false, error: 'Error al solicitar cambio de vivienda' };
    }
    return { success: true };
  },

  async cancelApartmentRequest(userId) {
    const result = await userAdminRepository.clearApartmentRequest(userId);
    if (!result.success) {
      return { success: false, error: 'Error al cancelar solicitud' };
    }
    return { success: true };
  },

  async getApartmentChangeRequests() {
    const result = await userAdminRepository.findApartmentChangeRequests();
    return mapListResult(result, 'Error al obtener solicitudes de cambio');
  },

  async approveApartmentChange(userId) {
    const result = await userAdminRepository.approveApartmentChange(userId);
    if (!result.success) {
      return { success: false, error: 'Error al aprobar cambio de vivienda' };
    }
    return { success: true };
  },

  async rejectApartmentChange(userId) {
    const result = await userAdminRepository.clearApartmentRequest(userId);
    if (!result.success) {
      return { success: false, error: 'Error al rechazar cambio de vivienda' };
    }
    return { success: true };
  },

  onAuthChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
            callback(toLegacyFormat(toDomain(userData)));
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

  async getUsersBySameApartment(vivienda) {
    const result = await getApartmentUsers.execute(vivienda);
    if (!result.success) {
      return { success: false, error: 'Error al obtener usuarios de la vivienda' };
    }
    return {
      success: true,
      data: result.value.map((u) => ({
        id: u.id,
        nombre: u.name,
        email: u.email,
        fotoPerfil: u.profilePhoto,
        nivelJuego: u.skillLevel,
      })),
    };
  },

  // Legacy aliases
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
