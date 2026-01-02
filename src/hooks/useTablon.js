import { useState, useEffect, useCallback } from 'react';
import { tablonService } from '../services/tablonService';

/**
 * Hook para gestionar notificaciones del usuario
 */
export function useNotificaciones(userId) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarNotificaciones = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const result = await tablonService.obtenerNotificaciones(userId);
    if (result.success) {
      setNotificaciones(result.data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarNotificaciones();
    setRefreshing(false);
  };

  const eliminar = async (notificacionId) => {
    const result = await tablonService.eliminarNotificacion(notificacionId);
    if (result.success) {
      setNotificaciones(prev => prev.filter(n => n.id !== notificacionId));
    }
    return result;
  };

  const marcarLeida = async (notificacionId) => {
    const result = await tablonService.marcarNotificacionLeida(notificacionId);
    if (result.success) {
      setNotificaciones(prev =>
        prev.map(n => n.id === notificacionId ? { ...n, leida: true } : n)
      );
    }
    return result;
  };

  const marcarTodasLeidas = async () => {
    const result = await tablonService.marcarTodasLeidas(userId);
    if (result.success) {
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    }
    return result;
  };

  const contarNoLeidas = () => {
    return notificaciones.filter(n => !n.leida).length;
  };

  return {
    notificaciones,
    loading,
    refreshing,
    cargarNotificaciones,
    onRefresh,
    eliminar,
    marcarLeida,
    marcarTodasLeidas,
    contarNoLeidas,
  };
}

/**
 * Hook para gestionar anuncios (vista usuario)
 */
export function useAnuncios(userId) {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [anuncioSeleccionado, setAnuncioSeleccionado] = useState(null);

  const cargarAnuncios = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const result = await tablonService.obtenerAnunciosParaUsuario(userId);
    if (result.success) {
      setAnuncios(result.data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    cargarAnuncios();
  }, [cargarAnuncios]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarAnuncios();
    setRefreshing(false);
  };

  const verAnuncio = async (anuncio) => {
    setAnuncioSeleccionado(anuncio);

    // Marcar como leído si no lo está
    if (!anuncio.leido) {
      const result = await tablonService.marcarAnuncioLeido(anuncio.id, userId);
      if (result.success) {
        setAnuncios(prev =>
          prev.map(a => a.id === anuncio.id ? { ...a, leido: true } : a)
        );
        // Actualizar también el anuncio seleccionado
        setAnuncioSeleccionado(prev => prev ? { ...prev, leido: true } : null);
      }
    }
  };

  const cerrarAnuncio = () => {
    setAnuncioSeleccionado(null);
  };

  const contarNoLeidos = () => {
    return anuncios.filter(a => !a.leido).length;
  };

  return {
    anuncios,
    loading,
    refreshing,
    anuncioSeleccionado,
    cargarAnuncios,
    onRefresh,
    verAnuncio,
    cerrarAnuncio,
    contarNoLeidos,
  };
}

/**
 * Hook para acciones de admin (gestión de anuncios)
 */
export function useAnunciosAdmin(userId, userName, onSuccess) {
  const [anuncios, setAnuncios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const cargarAnuncios = useCallback(async () => {
    setLoading(true);
    const result = await tablonService.obtenerTodosAnuncios();
    if (result.success) {
      setAnuncios(result.data);
    }
    setLoading(false);
  }, []);

  const cargarUsuarios = useCallback(async () => {
    const result = await tablonService.obtenerUsuariosAprobados();
    if (result.success) {
      setUsuarios(result.data);
    }
  }, []);

  useEffect(() => {
    cargarAnuncios();
  }, [cargarAnuncios]);

  const crearAnuncio = async (titulo, mensaje, tipo, destinatarios, usuariosIds) => {
    setCreating(true);

    const result = await tablonService.crearAnuncio(
      userId,
      userName,
      titulo,
      mensaje,
      tipo,
      destinatarios,
      usuariosIds
    );

    if (result.success) {
      // Enviar push notification
      const { notificationService } = require('../services/notificationService');

      if (destinatarios === 'todos') {
        await notificationService.notifyNuevoAnuncio(titulo, mensaje, result.data.id);
      } else {
        await notificationService.notifyNuevoAnuncio(titulo, mensaje, result.data.id, usuariosIds);
      }

      await cargarAnuncios();
      onSuccess?.();
    }

    setCreating(false);
    return result;
  };

  const eliminarAnuncio = async (anuncioId) => {
    const result = await tablonService.eliminarAnuncio(anuncioId);
    if (result.success) {
      setAnuncios(prev => prev.filter(a => a.id !== anuncioId));
      onSuccess?.();
    }
    return result;
  };

  return {
    anuncios,
    usuarios,
    loading,
    creating,
    cargarAnuncios,
    cargarUsuarios,
    crearAnuncio,
    eliminarAnuncio,
  };
}

/**
 * Hook para contar notificaciones/anuncios no leídos (para badge del tab)
 */
export function useContadorTablon(userId) {
  const [contadorAnuncios, setContadorAnuncios] = useState(0);
  const [contadorNotificaciones, setContadorNotificaciones] = useState(0);

  const actualizarContadores = useCallback(async () => {
    if (!userId) return;

    const [anunciosResult, notifResult] = await Promise.all([
      tablonService.contarAnunciosNoLeidos(userId),
      tablonService.contarNotificacionesNoLeidas(userId),
    ]);

    if (anunciosResult.success) {
      setContadorAnuncios(anunciosResult.count);
    }
    if (notifResult.success) {
      setContadorNotificaciones(notifResult.count);
    }
  }, [userId]);

  useEffect(() => {
    actualizarContadores();

    // Actualizar cada 30 segundos
    const interval = setInterval(actualizarContadores, 30000);
    return () => clearInterval(interval);
  }, [actualizarContadores]);

  return {
    contadorAnuncios,
    contadorNotificaciones,
    contadorTotal: contadorAnuncios + contadorNotificaciones,
    actualizarContadores,
  };
}
