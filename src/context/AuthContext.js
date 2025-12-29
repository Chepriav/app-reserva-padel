import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import { authService } from '../services/authService.supabase';
import { reservasService } from '../services/reservasService.supabase';
import { notificationService } from '../services/notificationService';
import { navigateFromNotification } from '../navigation/AppNavigator';
import { supabase, refreshSession } from '../services/supabaseConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificacionesPendientes, setNotificacionesPendientes] = useState([]);
  // Mensaje de notificación para mostrar en pantalla destino
  const [notificationMessage, setNotificationMessage] = useState(null);
  const appState = useRef(AppState.currentState);

  // Verificar sesión existente y escuchar cambios de autenticación
  useEffect(() => {
    let isMounted = true;

    // Verificar sesión existente al cargar
    const checkSession = async () => {
      try {
        // Intentar refrescar la sesión primero
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.log('[Auth] Error getting session:', error.message);
        }

        if (session) {
          // Sesión válida, obtener datos del usuario
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

    // Escuchar cambios de autenticación (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event);

        if (!isMounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setIsAuthenticated(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Obtener datos actualizados del usuario
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

  // Refrescar sesión cuando la app vuelve a primer plano
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[Auth] App volvió a primer plano, verificando sesión...');

        try {
          // Usar refreshSession que maneja el refresh automático si está próximo a expirar
          const result = await refreshSession();

          if (!result.success || !result.session) {
            console.log('[Auth] Sesión expirada o inválida');
            // La sesión expiró, el onAuthStateChange se encargará de limpiar el estado
            return;
          }

          // Si hay sesión pero el usuario no está en el estado, recuperarlo
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

  // Cargar notificaciones y registrar push token cuando el usuario se autentica
  useEffect(() => {
    let notificationCleanup = null;

    if (isAuthenticated && user) {
      cargarNotificaciones();

      // Registrar para push notifications
      notificationService.registerForPushNotifications(user.id);

      // Configurar listeners de notificaciones (móvil)
      notificationCleanup = notificationService.addNotificationListeners(
        (notification) => {
          // Notificación recibida en primer plano
          console.log('Notificación recibida:', notification);
        },
        (response) => {
          // Usuario tocó la notificación (móvil)
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

  // Listener para mensajes del Service Worker (Web Push)
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
   * Navega a la pantalla correspondiente según el tipo de notificación
   * y establece un mensaje para mostrar al usuario
   */
  const handleNotificationNavigation = (notificationType, notificationData = {}) => {
    console.log('[AuthContext] Navegando por notificación:', notificationType, notificationData);

    // Crear mensaje contextual según el tipo
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

      // Notificaciones de partidas
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
   * Limpia el mensaje de notificación (llamar después de mostrarlo)
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
      // Primero actualizar el estado para que la UI cambie inmediatamente
      const currentUser = user;
      setUser(null);
      setIsAuthenticated(false);

      // Luego hacer las operaciones de limpieza en segundo plano
      // Eliminar push token (no bloquear si falla)
      if (currentUser) {
        notificationService.removePushToken(currentUser.id).catch(() => {});
      }

      // Cerrar sesión en Supabase
      authService.logout().catch(() => {});

      return { success: true };
    } catch (error) {
      // Asegurar que siempre se cierra sesión en la UI
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        // No establecer usuario porque Firebase cierra sesión después del registro
        // El usuario debe ser aprobado primero
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
   * Recargar datos del usuario desde el servidor
   * Útil después de recibir notificaciones de cambios
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
