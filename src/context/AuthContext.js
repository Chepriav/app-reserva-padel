import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import { authService } from '../services/authService.supabase';
import { reservasService } from '../services/reservationsService.supabase';
import { notificationService } from '../services/notificationService';
import { navigateFromNotification } from '../navigation/AppNavigator';
import { supabase, refreshSession } from '../services/supabaseConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificacionesPendientes, setNotificacionesPendientes] = useState([]);
  // Notification message to show on destination screen
  const [notificationMessage, setNotificationMessage] = useState(null);
  const appState = useRef(AppState.currentState);

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

  // Load notifications and register push token when user authenticates
  useEffect(() => {
    let notificationCleanup = null;

    if (isAuthenticated && user) {
      cargarNotificaciones();

      // Register for push notifications
      notificationService.registerForPushNotifications(user.id);

      // Configure notification listeners (mobile)
      notificationCleanup = notificationService.addNotificationListeners(
        (notification) => {
          // Notification received in foreground
          console.log('Notificación recibida:', notification);
        },
        (response) => {
          // User tapped the notification (mobile)
          const data = response.notification.request.content.data;
          console.log('Notificación tocada:', data);
          handleNotificationNavigation(data.type, data);
        }
      );
    } else {
      setNotificacionesPendientes([]);
    }

    return () => {
      if (notificationCleanup) {
        notificationCleanup();
      }
    };
  }, [isAuthenticated, user]);

  // Listener for Service Worker messages (Web Push)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleServiceWorkerMessage = (event) => {
      console.log('[AuthContext] Mensaje del Service Worker:', event.data);

      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const { notificationType, data } = event.data.payload;
        handleNotificationNavigation(notificationType, data || {});
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  /**
   * Navigates to the corresponding screen based on notification type
   * and sets a message to show to the user
   */
  const handleNotificationNavigation = (notificationType, notificationData = {}) => {
    console.log('[AuthContext] Navegando por notificación:', notificationType, notificationData);

    // Create contextual message based on type
    let message = null;

    switch (notificationType) {
      case 'vivienda_change':
        if (notificationData.aprobado) {
          message = {
            type: 'success',
            title: 'Cambio de vivienda aprobado',
            text: 'Tu solicitud de cambio de vivienda ha sido aprobada.',
          };
        } else {
          message = {
            type: 'error',
            title: 'Cambio de vivienda rechazado',
            text: 'Tu solicitud de cambio de vivienda ha sido rechazada.',
          };
        }
        setNotificationMessage(message);
        navigateFromNotification('Perfil');
        break;

      case 'reservation_reminder':
        message = {
          type: 'info',
          title: 'Recordatorio',
          text: 'Tienes una reserva próximamente.',
        };
        setNotificationMessage(message);
        navigateFromNotification('Mis Reservas');
        break;

      case 'reservation_displacement':
        message = {
          type: 'warning',
          title: 'Reserva desplazada',
          text: 'Una de tus reservas ha sido desplazada por otra vivienda.',
        };
        setNotificationMessage(message);
        navigateFromNotification('Mis Reservas');
        break;

      case 'reservation_converted':
        message = {
          type: 'success',
          title: 'Reserva confirmada',
          text: 'Tu reserva provisional ha pasado a ser garantizada.',
        };
        setNotificationMessage(message);
        navigateFromNotification('Mis Reservas');
        break;

      // Match notifications
      case 'partida_solicitud':
        message = {
          type: 'info',
          title: 'Nueva solicitud',
          text: 'Alguien quiere unirse a tu partida.',
        };
        setNotificationMessage(message);
        navigateFromNotification('Partidas');
        break;

      case 'partida_aceptada':
        message = {
          type: 'success',
          title: 'Solicitud aceptada',
          text: 'Te han aceptado en una partida.',
        };
        setNotificationMessage(message);
        navigateFromNotification('Partidas');
        break;

      case 'partida_completa':
        message = {
          type: 'success',
          title: 'Partida completa',
          text: 'Tu partida ya tiene 4 jugadores.',
        };
        setNotificationMessage(message);
        navigateFromNotification('Partidas');
        break;

      case 'partida_cancelada':
        message = {
          type: 'warning',
          title: 'Partida cancelada',
          text: 'Una partida en la que estabas apuntado ha sido cancelada.',
        };
        setNotificationMessage(message);
        navigateFromNotification('Partidas');
        break;

      default:
        console.log('[AuthContext] Tipo de notificación no reconocido:', notificationType);
    }
  };

  /**
   * Clears the notification message (call after showing it)
   */
  const clearNotificationMessage = () => {
    setNotificationMessage(null);
  };

  const cargarNotificaciones = async () => {
    if (!user) return;

    try {
      const result = await reservasService.obtenerNotificacionesPendientes(user.id);
      if (result.success) {
        setNotificacionesPendientes(result.data);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const marcarNotificacionesLeidas = async () => {
    if (!user) return;

    try {
      await reservasService.marcarNotificacionesLeidas(user.id);
      setNotificacionesPendientes([]);
    } catch (error) {
      console.error('Error marcando notificaciones:', error);
    }
  };

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
    clearNotificationMessage,
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
