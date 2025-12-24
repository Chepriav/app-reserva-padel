import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService.supabase';
import { reservasService } from '../services/reservasService.supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificacionesPendientes, setNotificacionesPendientes] = useState([]);

  useEffect(() => {
    let isMounted = true;

    // Verificar sesión existente al cargar
    const checkSession = async () => {
      try {
        const result = await authService.getCurrentUser();
        if (isMounted) {
          if (result.success && result.data) {
            setUser(result.data);
            setIsAuthenticated(true);
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cargar notificaciones cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user) {
      cargarNotificaciones();
    } else {
      setNotificacionesPendientes([]);
    }
  }, [isAuthenticated, user]);

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
      const response = await authService.logout();
      if (response.success) {
        setUser(null);
        setIsAuthenticated(false);
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Error al cerrar sesión' };
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

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    updateProfile,
    resetPassword,
    notificacionesPendientes,
    marcarNotificacionesLeidas,
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
