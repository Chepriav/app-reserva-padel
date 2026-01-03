import { supabase } from './supabaseConfig';

/**
 * Maps notification from snake_case to camelCase
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
 * Maps announcement from snake_case to camelCase
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
  // ============ USER NOTIFICATIONS ============

  /**
   * Gets user notifications (non-expired)
   */
  async getNotifications(usuarioId) {
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
   * Counts unread notifications
   */
  async countUnreadNotifications(usuarioId) {
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
   * Marks a notification as read
   */
  async markNotificationAsRead(notificacionId) {
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
   * Marks all notifications as read
   */
  async markAllAsRead(usuarioId) {
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
   * Deletes a notification
   */
  async deleteNotification(notificacionId) {
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
   * Creates a user notification
   */
  async createNotification(usuarioId, tipo, titulo, mensaje, datos = {}) {
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

  // ============ ADMIN ANNOUNCEMENTS - READ (users) ============

  /**
   * Gets announcements for a specific user
   * - If announcement is for "todos" (all), includes it
   * - If announcement is "seleccionados" (selected), only if user is a recipient
   */
  async getAnnouncementsForUser(usuarioId) {
    try {
      // 1. Get non-expired announcements for "todos" (all)
      const { data: anunciosTodos, error: errorTodos } = await supabase
        .from('anuncios_admin')
        .select('*')
        .eq('destinatarios', 'todos')
        .gt('expira_en', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (errorTodos && errorTodos.code !== '42P01') {
        console.error('[tablonService] Error obteniendo anuncios todos:', errorTodos);
      }

      // 2. Get announcements specific to this user
      const { data: destinatarios, error: errorDest } = await supabase
        .from('anuncios_destinatarios')
        .select('anuncio_id, leido')
        .eq('usuario_id', usuarioId);

      if (errorDest && errorDest.code !== '42P01') {
        console.error('[tablonService] Error obteniendo destinatarios:', errorDest);
      }

      // 3. If there are recipients, get those announcements
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

      // 4. Combine and map
      const todosAnuncios = [...(anunciosTodos || []), ...anunciosSeleccionados];

      // Remove duplicates by ID
      const anunciosUnicos = Array.from(
        new Map(todosAnuncios.map(a => [a.id, a])).values()
      );

      // Sort by date
      anunciosUnicos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Map with read status
      const resultado = anunciosUnicos.map(anuncio => {
        // For "todos" announcements, we need to check if there's a read record
        let leido = false;
        if (anuncio.destinatarios === 'seleccionados') {
          leido = destinatariosMap.get(anuncio.id) || false;
        } else {
          // For "todos", check in the recipients table
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
   * Counts unread announcements for a user
   */
  async countUnreadAnnouncements(usuarioId) {
    try {
      const result = await this.getAnnouncementsForUser(usuarioId);
      if (!result.success) return { success: true, count: 0 };

      const noLeidos = result.data.filter(a => !a.leido).length;
      return { success: true, count: noLeidos };
    } catch (error) {
      return { success: true, count: 0 };
    }
  },

  /**
   * Marks an announcement as read for a user
   */
  async markAnnouncementAsRead(anuncioId, usuarioId) {
    try {
      // Use upsert to create or update the record
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

  // ============ ADMIN ANNOUNCEMENTS - MANAGEMENT (admins) ============

  /**
   * Gets all announcements (for admin)
   */
  async getAllAnnouncements() {
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
   * Creates an announcement (admin only)
   * @param {string} creadorId - Admin ID
   * @param {string} creadorNombre - Admin name
   * @param {string} titulo - Announcement title
   * @param {string} mensaje - Announcement content
   * @param {string} tipo - Type: 'info', 'aviso', 'urgente', 'mantenimiento'
   * @param {string} destinatarios - 'todos' (all) or 'seleccionados' (selected)
   * @param {string[]} usuariosIds - User IDs if 'seleccionados'
   */
  async createAnnouncement(creadorId, creadorNombre, titulo, mensaje, tipo = 'info', destinatarios = 'todos', usuariosIds = []) {
    try {
      // 1. Create the announcement
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

      // 2. If for selected users, create recipient records
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
   * Deletes an announcement (admin only)
   */
  async deleteAnnouncement(anuncioId) {
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
   * Gets list of approved users (for recipient selector)
   */
  async getApprovedUsers() {
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

  // ============================================================================
  // LEGACY ALIASES - For backwards compatibility
  // ============================================================================
  obtenerNotificaciones(...args) { return this.getNotifications(...args); },
  contarNotificacionesNoLeidas(...args) { return this.countUnreadNotifications(...args); },
  marcarNotificacionLeida(...args) { return this.markNotificationAsRead(...args); },
  marcarTodasLeidas(...args) { return this.markAllAsRead(...args); },
  eliminarNotificacion(...args) { return this.deleteNotification(...args); },
  crearNotificacion(...args) { return this.createNotification(...args); },
  obtenerAnunciosParaUsuario(...args) { return this.getAnnouncementsForUser(...args); },
  contarAnunciosNoLeidos(...args) { return this.countUnreadAnnouncements(...args); },
  marcarAnuncioLeido(...args) { return this.markAnnouncementAsRead(...args); },
  obtenerTodosAnuncios(...args) { return this.getAllAnnouncements(...args); },
  crearAnuncio(...args) { return this.createAnnouncement(...args); },
  eliminarAnuncio(...args) { return this.deleteAnnouncement(...args); },
  obtenerUsuariosAprobados(...args) { return this.getApprovedUsers(...args); },
};

// Re-export with English name
export { tablonService as bulletinService };
