import { supabase } from './supabaseConfig';

/**
 * Mapeo de notificación snake_case a camelCase
 */
const mapNotificacionToCamelCase = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    usuarioId: data.usuario_id,
    tipo: data.tipo,
    titulo: data.titulo,
    mensaje: data.mensaje,
    datos: data.datos || {},
    leida: data.leida,
    expiraEn: data.expira_en,
    createdAt: data.created_at,
  };
};

/**
 * Mapeo de anuncio snake_case a camelCase
 */
const mapAnuncioToCamelCase = (data, leido = false) => {
  if (!data) return null;
  return {
    id: data.id,
    creadorId: data.creador_id,
    creadorNombre: data.creador_nombre,
    titulo: data.titulo,
    mensaje: data.mensaje,
    tipo: data.tipo,
    destinatarios: data.destinatarios,
    expiraEn: data.expira_en,
    createdAt: data.created_at,
    leido,
  };
};

export const tablonService = {
  // ============ NOTIFICACIONES DE USUARIO ============

  /**
   * Obtiene las notificaciones del usuario (no expiradas)
   */
  async obtenerNotificaciones(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('notificaciones_usuario')
        .select('*')
        .eq('usuario_id', usuarioId)
        .gt('expira_en', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          return { success: true, data: [] };
        }
        console.error('[tablonService] Error obteniendo notificaciones:', error);
        return { success: false, error: 'Error al obtener notificaciones' };
      }

      return {
        success: true,
        data: (data || []).map(mapNotificacionToCamelCase),
      };
    } catch (error) {
      console.error('[tablonService] Error:', error);
      return { success: true, data: [] };
    }
  },

  /**
   * Cuenta notificaciones no leídas
   */
  async contarNotificacionesNoLeidas(usuarioId) {
    try {
      const { count, error } = await supabase
        .from('notificaciones_usuario')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId)
        .eq('leida', false)
        .gt('expira_en', new Date().toISOString());

      if (error) return { success: true, count: 0 };
      return { success: true, count: count || 0 };
    } catch (error) {
      return { success: true, count: 0 };
    }
  },

  /**
   * Marca una notificación como leída
   */
  async marcarNotificacionLeida(notificacionId) {
    try {
      const { error } = await supabase
        .from('notificaciones_usuario')
        .update({ leida: true })
        .eq('id', notificacionId);

      if (error) {
        console.error('[tablonService] Error marcando notificación:', error);
        return { success: false, error: 'Error al marcar notificación' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al marcar notificación' };
    }
  },

  /**
   * Marca todas las notificaciones como leídas
   */
  async marcarTodasLeidas(usuarioId) {
    try {
      const { error } = await supabase
        .from('notificaciones_usuario')
        .update({ leida: true })
        .eq('usuario_id', usuarioId)
        .eq('leida', false);

      if (error) return { success: false, error: 'Error al marcar notificaciones' };
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al marcar notificaciones' };
    }
  },

  /**
   * Elimina una notificación
   */
  async eliminarNotificacion(notificacionId) {
    try {
      const { error } = await supabase
        .from('notificaciones_usuario')
        .delete()
        .eq('id', notificacionId);

      if (error) {
        console.error('[tablonService] Error eliminando notificación:', error);
        return { success: false, error: 'Error al eliminar notificación' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al eliminar notificación' };
    }
  },

  /**
   * Crea una notificación de usuario
   */
  async crearNotificacion(usuarioId, tipo, titulo, mensaje, datos = {}) {
    try {
      const { data, error } = await supabase
        .from('notificaciones_usuario')
        .insert({
          usuario_id: usuarioId,
          tipo,
          titulo,
          mensaje,
          datos,
        })
        .select()
        .single();

      if (error) {
        console.error('[tablonService] Error creando notificación:', error);
        return { success: false, error: 'Error al crear notificación' };
      }
      return { success: true, data: mapNotificacionToCamelCase(data) };
    } catch (error) {
      return { success: false, error: 'Error al crear notificación' };
    }
  },

  // ============ ANUNCIOS DE ADMIN - LECTURA (usuarios) ============

  /**
   * Obtiene anuncios para un usuario específico
   * - Si el anuncio es para "todos", lo incluye
   * - Si el anuncio es "seleccionados", solo si está en destinatarios
   */
  async obtenerAnunciosParaUsuario(usuarioId) {
    try {
      // 1. Obtener anuncios para "todos" no expirados
      const { data: anunciosTodos, error: errorTodos } = await supabase
        .from('anuncios_admin')
        .select('*')
        .eq('destinatarios', 'todos')
        .gt('expira_en', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (errorTodos && errorTodos.code !== '42P01') {
        console.error('[tablonService] Error obteniendo anuncios todos:', errorTodos);
      }

      // 2. Obtener anuncios específicos para este usuario
      const { data: destinatarios, error: errorDest } = await supabase
        .from('anuncios_destinatarios')
        .select('anuncio_id, leido')
        .eq('usuario_id', usuarioId);

      if (errorDest && errorDest.code !== '42P01') {
        console.error('[tablonService] Error obteniendo destinatarios:', errorDest);
      }

      // 3. Si hay destinatarios, obtener esos anuncios
      let anunciosSeleccionados = [];
      const destinatariosMap = new Map();

      if (destinatarios && destinatarios.length > 0) {
        destinatarios.forEach(d => destinatariosMap.set(d.anuncio_id, d.leido));

        const anuncioIds = destinatarios.map(d => d.anuncio_id);
        const { data: anunciosSel } = await supabase
          .from('anuncios_admin')
          .select('*')
          .in('id', anuncioIds)
          .gt('expira_en', new Date().toISOString())
          .order('created_at', { ascending: false });

        anunciosSeleccionados = anunciosSel || [];
      }

      // 4. Combinar y mapear
      const todosAnuncios = [...(anunciosTodos || []), ...anunciosSeleccionados];

      // Eliminar duplicados por ID
      const anunciosUnicos = Array.from(
        new Map(todosAnuncios.map(a => [a.id, a])).values()
      );

      // Ordenar por fecha
      anunciosUnicos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Mapear con estado de lectura
      const resultado = anunciosUnicos.map(anuncio => {
        // Para anuncios "todos", necesitamos verificar si hay registro de lectura
        let leido = false;
        if (anuncio.destinatarios === 'seleccionados') {
          leido = destinatariosMap.get(anuncio.id) || false;
        } else {
          // Para "todos", verificar en la tabla de destinatarios
          leido = destinatariosMap.has(anuncio.id) ? destinatariosMap.get(anuncio.id) : false;
        }
        return mapAnuncioToCamelCase(anuncio, leido);
      });

      return { success: true, data: resultado };
    } catch (error) {
      console.error('[tablonService] Error:', error);
      return { success: true, data: [] };
    }
  },

  /**
   * Cuenta anuncios no leídos para un usuario
   */
  async contarAnunciosNoLeidos(usuarioId) {
    try {
      const result = await this.obtenerAnunciosParaUsuario(usuarioId);
      if (!result.success) return { success: true, count: 0 };

      const noLeidos = result.data.filter(a => !a.leido).length;
      return { success: true, count: noLeidos };
    } catch (error) {
      return { success: true, count: 0 };
    }
  },

  /**
   * Marca un anuncio como leído para un usuario
   */
  async marcarAnuncioLeido(anuncioId, usuarioId) {
    try {
      // Usar upsert para crear o actualizar el registro
      const { error } = await supabase
        .from('anuncios_destinatarios')
        .upsert(
          {
            anuncio_id: anuncioId,
            usuario_id: usuarioId,
            leido: true,
            leido_en: new Date().toISOString(),
          },
          { onConflict: 'anuncio_id,usuario_id' }
        );

      if (error) {
        console.error('[tablonService] Error marcando anuncio:', error);
        return { success: false, error: 'Error al marcar anuncio' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al marcar anuncio' };
    }
  },

  // ============ ANUNCIOS DE ADMIN - GESTIÓN (admins) ============

  /**
   * Obtiene todos los anuncios (para admin)
   */
  async obtenerTodosAnuncios() {
    try {
      const { data, error } = await supabase
        .from('anuncios_admin')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return { success: true, data: [] };
        console.error('[tablonService] Error obteniendo anuncios:', error);
        return { success: false, error: 'Error al obtener anuncios' };
      }

      return {
        success: true,
        data: (data || []).map(a => mapAnuncioToCamelCase(a, true)),
      };
    } catch (error) {
      return { success: true, data: [] };
    }
  },

  /**
   * Crea un anuncio (solo admins)
   * @param {string} creadorId - ID del admin
   * @param {string} creadorNombre - Nombre del admin
   * @param {string} titulo - Título del anuncio
   * @param {string} mensaje - Contenido del anuncio
   * @param {string} tipo - Tipo: 'info', 'aviso', 'urgente', 'mantenimiento'
   * @param {string} destinatarios - 'todos' o 'seleccionados'
   * @param {string[]} usuariosIds - IDs de usuarios si es 'seleccionados'
   */
  async crearAnuncio(creadorId, creadorNombre, titulo, mensaje, tipo = 'info', destinatarios = 'todos', usuariosIds = []) {
    try {
      // 1. Crear el anuncio
      const { data: anuncio, error: anuncioError } = await supabase
        .from('anuncios_admin')
        .insert({
          creador_id: creadorId,
          creador_nombre: creadorNombre,
          titulo,
          mensaje,
          tipo,
          destinatarios,
        })
        .select()
        .single();

      if (anuncioError) {
        console.error('[tablonService] Error creando anuncio:', anuncioError);
        if (anuncioError.code === '42501') {
          return { success: false, error: 'No tienes permisos para crear anuncios' };
        }
        return { success: false, error: 'Error al crear anuncio' };
      }

      // 2. Si es para usuarios seleccionados, crear registros de destinatarios
      if (destinatarios === 'seleccionados' && usuariosIds.length > 0) {
        const destinatariosData = usuariosIds.map(userId => ({
          anuncio_id: anuncio.id,
          usuario_id: userId,
          leido: false,
        }));

        const { error: destError } = await supabase
          .from('anuncios_destinatarios')
          .insert(destinatariosData);

        if (destError) {
          console.error('[tablonService] Error creando destinatarios:', destError);
        }
      }

      return {
        success: true,
        data: mapAnuncioToCamelCase(anuncio, false),
        usuariosIds: destinatarios === 'todos' ? [] : usuariosIds,
      };
    } catch (error) {
      console.error('[tablonService] Error:', error);
      return { success: false, error: 'Error al crear anuncio' };
    }
  },

  /**
   * Elimina un anuncio (solo admins)
   */
  async eliminarAnuncio(anuncioId) {
    try {
      const { error } = await supabase
        .from('anuncios_admin')
        .delete()
        .eq('id', anuncioId);

      if (error) {
        console.error('[tablonService] Error eliminando anuncio:', error);
        return { success: false, error: 'Error al eliminar anuncio' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al eliminar anuncio' };
    }
  },

  /**
   * Obtiene lista de usuarios aprobados (para selector de destinatarios)
   */
  async obtenerUsuariosAprobados() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nombre, vivienda, email')
        .eq('estado_aprobacion', 'aprobado')
        .order('nombre');

      if (error) {
        console.error('[tablonService] Error obteniendo usuarios:', error);
        return { success: false, error: 'Error al obtener usuarios' };
      }

      return {
        success: true,
        data: (data || []).map(u => ({
          id: u.id,
          nombre: u.nombre,
          vivienda: u.vivienda,
          email: u.email,
        })),
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener usuarios' };
    }
  },
};
