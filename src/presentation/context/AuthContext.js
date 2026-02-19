import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { authService } from '../../services/authService.supabase';
import { notificationService } from '../../services/notificationService';
import { supabase, refreshSession } from '../../services/supabaseConfig';
import { useAuthNotifications } from './useAuthNotifications';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Notification message to show on destination screen
  const [notificationMessage, setNotificationMessage] = useState(null);
  const appState = useRef(AppState.currentState);

  const { notificacionesPendientes, marcarNotificacionesLeidas } = useAuthNotifications({
    isAuthenticated, user, setNotificationMessage,
  });

  // Check existing session and listen for auth state changes
  useEffect(() => {
    let isMounted = true;

    // Check existing session on load
    const checkSession = async () => {
      try {
        // Try to get the session first
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.log('[Auth] Error getting session:', error.message);
        }

        if (session) {
          // Valid session, get user data
          const result = await authService.getCurrentUser();
          if (isMounted && result.success && result.data) {
            setUser(result.data);
            setIsAuthenticated(true);
          }
        }

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.log('[Auth] Session check error:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event);

        if (!isMounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setIsAuthenticated(false);
        } else if (event === 'PASSWORD_RECOVERY') {
          // Password recovery session - don't set authenticated state
          // User should only access ResetPasswordScreen
          console.log('[Auth] Password recovery session detected');
          // Don't change authentication state
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Get updated user data
          const result = await authService.getCurrentUser();
          if (result.success && result.data) {
            setUser(result.data);
            setIsAuthenticated(true);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Refresh session when app returns to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[Auth] App volvió a primer plano, verificando sesión...');

        try {
          // Use refreshSession which handles auto-refresh if close to expiry
          const result = await refreshSession();

          if (!result.success || !result.session) {
            console.log('[Auth] Sesión expirada o inválida');
            // Session expired, onAuthStateChange will handle cleaning the state
            return;
          }

          // If there's a session but user is not in state, recover it
          if (result.session && !isAuthenticated) {
            console.log('[Auth] Recuperando datos del usuario...');
            const userResult = await authService.getCurrentUser();
            if (userResult.success && userResult.data) {
              setUser(userResult.data);
              setIsAuthenticated(true);
            }
          }
        } catch (err) {
          console.log('[Auth] Error refreshing session:', err);
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated]);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        setUser(response.data);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const logout = async () => {
    try {
      // First update state so UI changes immediately
      const currentUser = user;
      setUser(null);
      setIsAuthenticated(false);

      // Then do cleanup operations in background
      // Remove push token (don't block if it fails)
      if (currentUser) {
        notificationService.removePushToken(currentUser.id).catch(() => {});
      }

      // Sign out from Supabase
      authService.logout().catch(() => {});

      return { success: true };
    } catch (error) {
      // Ensure session is always closed in UI
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        // Don't set user because Supabase signs out after registration
        // User must be approved first
        return { success: true, message: response.message };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Error al registrarse' };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await authService.updateProfile(user.id, updates);
      if (response.success) {
        setUser(response.data);
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Error al actualizar perfil' };
    }
  };

  const resetPassword = async (email) => {
    try {
      const response = await authService.resetPassword(email);
      return response;
    } catch (error) {
      return { success: false, error: 'Error al enviar correo de recuperación' };
    }
  };

  /**
   * Reload user data from server
   * Useful after receiving change notifications
   */
  const refreshUser = async () => {
    try {
      console.log('[AuthContext] Refrescando usuario...');
      const result = await authService.getCurrentUser();
      console.log('[AuthContext] Resultado refreshUser:', result);
      if (result.success && result.data) {
        console.log('[AuthContext] Nueva vivienda:', result.data.vivienda);
        setUser(result.data);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Error refrescando usuario:', error);
      return { success: false };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    updateProfile,
    resetPassword,
    refreshUser,
    notificacionesPendientes,
    marcarNotificacionesLeidas,
    notificationMessage,
    clearNotificationMessage: () => setNotificationMessage(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
