import { supabase } from './supabaseConfig';
import { notificationService } from './notificationService';

/**
 * Maps match from snake_case to camelCase
 */
const mapPartidaToCamelCase = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    creadorId: data.creador_id,
    creadorNombre: data.creador_nombre,
    creadorVivienda: data.creador_vivienda,
    creadorFoto: data.creador_foto || null,
    creadorNivel: data.creador_nivel || null,
    reservaId: data.reserva_id,
    fecha: data.fecha,
    horaInicio: data.hora_inicio,
    horaFin: data.hora_fin,
    pistaNombre: data.pista_nombre,
    tipo: data.tipo,
    mensaje: data.mensaje,
    nivelPreferido: data.nivel_preferido,
    estado: data.estado,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    // Campos de clase
    esClase: data.es_clase || false,
    niveles: data.niveles || [],
    minParticipantes: data.min_participantes || 4,
    maxParticipantes: data.max_participantes || 4,
    precioAlumno: data.precio_alumno,
    precioGrupo: data.precio_grupo,
    // Players if included
    jugadores: data.jugadores || [],
  };
};

/**
 * Maps match player from snake_case to camelCase
 */
const mapJugadorToCamelCase = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    partidaId: data.partida_id,
    usuarioId: data.usuario_id,
    usuarioNombre: data.usuario_nombre,
    usuarioVivienda: data.usuario_vivienda,
    usuarioFoto: data.usuario_foto || data.users?.foto_perfil || null,
    nivelJuego: data.nivel_juego,
    esExterno: data.es_externo || false,
    estado: data.estado || 'confirmado', // 'confirmado', 'pendiente', 'rechazado'
    createdAt: data.created_at,
  };
};

/**
 * Filters matches to show only future ones (not past)
 * @param {Array} partidas - Array of matches in snake_case format
 * @returns {Array} - Matches whose date/time hasn't passed yet
 */
const filterFutureMatches = (partidas) => {
  const ahora = new Date();
  return partidas.filter(p => {
    // If no date, show it (open match)
    if (!p.fecha) return true;
    // If has date but no end time, compare only date
    if (!p.hora_fin) {
      const fechaPartida = new Date(p.fecha + 'T23:59:59');
      return fechaPartida > ahora;
    }
    // If has date and time, compare with end time
    const fechaFinPartida = new Date(p.fecha + 'T' + p.hora_fin);
    return fechaFinPartida > ahora;
  });
};

export const partidasService = {
  /**
   * Gets a user's profile photo by ID
   */
  async getUserPhoto(userId) {
    if (!userId) return null;
    try {
      const { data } = await supabase
        .from('users')
        .select('foto_perfil')
        .eq('id', userId)
        .single();
      return data?.foto_perfil || null;
    } catch {
      return null;
    }
  },

  /**
   * Gets data for multiple users (photo and level)
   */
  async getUsersData(userIds) {
    if (!userIds || userIds.length === 0) return {};
    try {
      const { data } = await supabase
        .from('users')
        .select('id, foto_perfil, nivel_juego')
        .in('id', userIds);

      const datosMap = {};
      (data || []).forEach(u => {
        datosMap[u.id] = {
          foto: u.foto_perfil || null,
          nivel: u.nivel_juego || null,
        };
      });
      return datosMap;
    } catch {
      return {};
    }
  },

  /**
   * Gets all active matches (looking for players)
   */
  async getActiveMatches() {
    try {
      // Get matches with status 'buscando' (looking)
      const { data: partidas, error } = await supabase
        .from('partidas')
        .select('*')
        .eq('estado', 'buscando')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: 'Error al obtener partidas' };
      }

      // Filter past matches
      const partidasFuturas = filterFutureMatches(partidas);

      // Collect all user IDs to get data in a single query
      const creadorIds = partidasFuturas.map(p => p.creador_id).filter(Boolean);

      // Obtener jugadores de cada partida
      const partidasConJugadores = await Promise.all(
        partidasFuturas.map(async (partida) => {
          const { data: jugadores } = await supabase
            .from('partidas_jugadores')
            .select('*')
            .eq('partida_id', partida.id);

          return { partida, jugadores: jugadores || [] };
        })
      );

      // Collect all player IDs
      const jugadorIds = partidasConJugadores
        .flatMap(p => p.jugadores.map(j => j.usuario_id))
        .filter(Boolean);

      // Get all user data in a single query
      const todosLosIds = [...new Set([...creadorIds, ...jugadorIds])];
      const datosMap = await this.getUsersData(todosLosIds);

      // Map matches with user data
      const resultado = partidasConJugadores.map(({ partida, jugadores }) => ({
        ...mapPartidaToCamelCase({
          ...partida,
          creador_foto: datosMap[partida.creador_id]?.foto || null,
          creador_nivel: datosMap[partida.creador_id]?.nivel || null,
        }),
        jugadores: jugadores.map(j => mapJugadorToCamelCase({
          ...j,
          usuario_foto: datosMap[j.usuario_id]?.foto || null,
          // Level already comes from partidas_jugadores.nivel_juego
        })),
      }));

      return { success: true, data: resultado };
    } catch (error) {
      return { success: false, error: 'Error al obtener partidas' };
    }
  },

  /**
   * Gets matches created by a user (future only)
   */
  async getMyMatches(usuarioId) {
    try {
      const { data: partidas, error } = await supabase
        .from('partidas')
        .select('*')
        .eq('creador_id', usuarioId)
        .in('estado', ['buscando', 'completa'])
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: 'Error al obtener tus partidas' };
      }

      // Filter past matches
      const partidasFuturas = filterFutureMatches(partidas);

      // Collect creator IDs (from future matches)
      const creadorIds = partidasFuturas.map(p => p.creador_id).filter(Boolean);

      // Get players for each future match
      const partidasConJugadores = await Promise.all(
        partidasFuturas.map(async (partida) => {
          const { data: jugadores } = await supabase
            .from('partidas_jugadores')
            .select('*')
            .eq('partida_id', partida.id);

          return { partida, jugadores: jugadores || [] };
        })
      );

      // Collect all player IDs
      const jugadorIds = partidasConJugadores
        .flatMap(p => p.jugadores.map(j => j.usuario_id))
        .filter(Boolean);

      // Get all user data in a single query
      const todosLosIds = [...new Set([...creadorIds, ...jugadorIds])];
      const datosMap = await this.getUsersData(todosLosIds);

      // Map matches with user data
      const resultado = partidasConJugadores.map(({ partida, jugadores }) => ({
        ...mapPartidaToCamelCase({
          ...partida,
          creador_foto: datosMap[partida.creador_id]?.foto || null,
          creador_nivel: datosMap[partida.creador_id]?.nivel || null,
        }),
        jugadores: jugadores.map(j => mapJugadorToCamelCase({
          ...j,
          usuario_foto: datosMap[j.usuario_id]?.foto || null,
        })),
      }));

      return { success: true, data: resultado };
    } catch (error) {
      return { success: false, error: 'Error al obtener tus partidas' };
    }
  },

  /**
   * Gets matches where the user is enrolled (future only)
   */
  async getEnrolledMatches(usuarioId) {
    try {
      // First get the IDs of matches where user is enrolled
      const { data: inscripciones, error: inscError } = await supabase
        .from('partidas_jugadores')
        .select('partida_id')
        .eq('usuario_id', usuarioId);

      if (inscError) {
        return { success: false, error: 'Error al obtener inscripciones' };
      }

      if (!inscripciones || inscripciones.length === 0) {
        return { success: true, data: [] };
      }

      const partidaIds = inscripciones.map((i) => i.partida_id);

      // Get the matches
      const { data: partidas, error } = await supabase
        .from('partidas')
        .select('*')
        .in('id', partidaIds)
        .in('estado', ['buscando', 'completa'])
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: 'Error al obtener partidas' };
      }

      // Filter past matches
      const partidasFuturas = filterFutureMatches(partidas);

      // Collect creator IDs (from future matches)
      const creadorIds = partidasFuturas.map(p => p.creador_id).filter(Boolean);

      // Get players for each future match
      const partidasConJugadores = await Promise.all(
        partidasFuturas.map(async (partida) => {
          const { data: jugadores } = await supabase
            .from('partidas_jugadores')
            .select('*')
            .eq('partida_id', partida.id);

          return { partida, jugadores: jugadores || [] };
        })
      );

      // Collect all player IDs
      const jugadorIds = partidasConJugadores
        .flatMap(p => p.jugadores.map(j => j.usuario_id))
        .filter(Boolean);

      // Get all user data in a single query
      const todosLosIds = [...new Set([...creadorIds, ...jugadorIds])];
      const datosMap = await this.getUsersData(todosLosIds);

      // Map matches with user data
      const resultado = partidasConJugadores.map(({ partida, jugadores }) => ({
        ...mapPartidaToCamelCase({
          ...partida,
          creador_foto: datosMap[partida.creador_id]?.foto || null,
          creador_nivel: datosMap[partida.creador_id]?.nivel || null,
        }),
        jugadores: jugadores.map(j => mapJugadorToCamelCase({
          ...j,
          usuario_foto: datosMap[j.usuario_id]?.foto || null,
        })),
      }));

      return { success: true, data: resultado };
    } catch (error) {
      return { success: false, error: 'Error al obtener partidas' };
    }
  },

  /**
   * Creates a new match/request or class
   */
  async createMatch(partidaData) {
    try {
      const {
        creadorId,
        creadorNombre,
        creadorVivienda,
        reservaId,
        fecha,
        horaInicio,
        horaFin,
        pistaNombre,
        tipo,
        mensaje,
        nivelPreferido,
        jugadoresIniciales,
        // Class fields
        esClase,
        niveles,
        minParticipantes,
        maxParticipantes,
        precioAlumno,
        precioGrupo,
      } = partidaData;

      // Calculate max participants (4 for matches, configurable for classes)
      const maxPart = esClase ? (maxParticipantes || 8) : 4;

      // Calculate if match/class will be complete from the start
      const totalJugadores = 1 + (jugadoresIniciales?.length || 0);
      const estadoInicial = totalJugadores >= maxPart ? 'completa' : 'buscando';

      const { data, error } = await supabase
        .from('partidas')
        .insert({
          creador_id: creadorId,
          creador_nombre: creadorNombre,
          creador_vivienda: creadorVivienda,
          reserva_id: reservaId || null,
          fecha: fecha || null,
          hora_inicio: horaInicio || null,
          hora_fin: horaFin || null,
          pista_nombre: pistaNombre || null,
          tipo: tipo || 'abierta',
          mensaje: mensaje || null,
          nivel_preferido: nivelPreferido || null,
          estado: estadoInicial,
          // Class fields
          es_clase: esClase || false,
          niveles: niveles?.length > 0 ? niveles : null,
          min_participantes: esClase ? (minParticipantes || 2) : 4,
          max_participantes: maxPart,
          precio_alumno: precioAlumno || null,
          precio_grupo: precioGrupo || null,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: 'Error al crear la partida' };
      }

      // If there are initial players, add them (internal and external)
      if (jugadoresIniciales && jugadoresIniciales.length > 0) {
        const jugadoresData = jugadoresIniciales.map((j) => ({
          partida_id: data.id,
          usuario_id: j.tipo === 'urbanizacion' ? j.usuario.id : null,
          usuario_nombre: j.nombre,
          usuario_vivienda: j.tipo === 'urbanizacion' ? j.vivienda : null,
          nivel_juego: j.nivel || null,
          es_externo: j.tipo === 'externo',
          estado: 'confirmado',
        }));

        await supabase
          .from('partidas_jugadores')
          .insert(jugadoresData);
      }

      // Schedule Match Day and 10 min before reminders for the creator
      // (and internal initial players)
      if (fecha && horaInicio) {
        notificationService.schedulePartidaReminders({
          id: data.id,
          fecha,
          horaInicio,
          pistaNombre,
        });
      }

      return { success: true, data: mapPartidaToCamelCase(data) };
    } catch (error) {
      return { success: false, error: 'Error al crear la partida' };
    }
  },

  /**
   * Request to join a match (creates pending request)
   */
  async requestToJoin(partidaId, usuario) {
    try {
      // Verify match exists and is looking for players
      const { data: partida, error: partidaError } = await supabase
        .from('partidas')
        .select('*, partidas_jugadores(*)')
        .eq('id', partidaId)
        .single();

      if (partidaError || !partida) {
        return { success: false, error: 'Partida no encontrada' };
      }

      if (partida.estado !== 'buscando') {
        return { success: false, error: 'Esta partida ya no está buscando jugadores' };
      }

      // Verify not already enrolled or has a request
      const yaApuntado = partida.partidas_jugadores?.some(
        (j) => j.usuario_id === usuario.id
      );
      if (yaApuntado) {
        return { success: false, error: 'Ya tienes una solicitud o estás apuntado a esta partida' };
      }

      // Verify not the creator
      if (partida.creador_id === usuario.id) {
        return { success: false, error: 'No puedes unirte a tu propia partida' };
      }

      // Count confirmed players (creator + confirmed)
      const jugadoresConfirmados = partida.partidas_jugadores?.filter(j => j.estado === 'confirmado') || [];
      const maxParticipantes = partida.max_participantes || 4;
      if (1 + jugadoresConfirmados.length >= maxParticipantes) {
        return { success: false, error: partida.es_clase ? 'La clase ya está completa' : 'La partida ya está completa' };
      }

      // Create pending request
      const { error: insertError } = await supabase
        .from('partidas_jugadores')
        .insert({
          partida_id: partidaId,
          usuario_id: usuario.id,
          usuario_nombre: usuario.nombre,
          usuario_vivienda: usuario.vivienda,
          nivel_juego: usuario.nivelJuego || null,
          es_externo: false,
          estado: 'pendiente',
        });

      if (insertError) {
        return { success: false, error: 'Error al solicitar unirse' };
      }

      // Notify the match/class creator
      notificationService.notifyPartidaSolicitud(
        partida.creador_id,
        usuario.nombre,
        { partidaId, fecha: partida.fecha, esClase: partida.es_clase }
      );

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al solicitar unirse' };
    }
  },

  /**
   * Accept a player's request (creator only)
   * Note: jugadorId here is the usuario_id of the player who requested to join
   */
  async acceptRequest(jugadorId, partidaId, creadorId) {
    try {
      // Verify is the creator and get complete data
      const { data: partida, error: partidaError } = await supabase
        .from('partidas')
        .select('creador_id, creador_nombre, fecha, hora_inicio, pista_nombre, es_clase, max_participantes, partidas_jugadores(*)')
        .eq('id', partidaId)
        .single();

      if (partidaError) {
        return { success: false, error: 'Error al obtener partida' };
      }

      if (partida?.creador_id !== creadorId) {
        return { success: false, error: 'Solo el creador puede aceptar solicitudes' };
      }

      // Count current confirmed players
      const confirmados = partida.partidas_jugadores?.filter(j => j.estado === 'confirmado') || [];
      const maxParticipantes = partida.max_participantes || 4;
      if (1 + confirmados.length >= maxParticipantes) {
        return { success: false, error: partida.es_clase ? 'La clase ya está completa' : 'La partida ya está completa' };
      }

      // Accept request - use partida_id + usuario_id to identify the row
      const { error } = await supabase
        .from('partidas_jugadores')
        .update({ estado: 'confirmado' })
        .eq('partida_id', partidaId)
        .eq('usuario_id', jugadorId);

      if (error) {
        return { success: false, error: 'Error al aceptar solicitud' };
      }

      // Notify the player they were accepted
      notificationService.notifyPartidaAceptada(
        jugadorId,
        partida.creador_nombre,
        { partidaId, fecha: partida.fecha, esClase: partida.es_clase }
      );

      // Schedule Match Day and 10 min before reminders for the accepted player
      if (partida.fecha && partida.hora_inicio) {
        notificationService.schedulePartidaReminders({
          id: partidaId,
          fecha: partida.fecha,
          horaInicio: partida.hora_inicio,
          pistaNombre: partida.pista_nombre,
        });
      }

      // If there are now enough players, mark as complete and notify everyone
      const nuevoTotalConfirmados = 1 + confirmados.length + 1;
      if (nuevoTotalConfirmados >= maxParticipantes) {
        await supabase
          .from('partidas')
          .update({ estado: 'completa', updated_at: new Date().toISOString() })
          .eq('id', partidaId);

        // Get IDs of all players (creator + confirmed + the newly accepted)
        const jugadoresIds = [
          creadorId,
          ...confirmados.map(j => j.usuario_id).filter(Boolean),
          jugadorId,
        ];

        // Notify everyone that the match/class is complete
        notificationService.notifyPartidaCompleta(
          jugadoresIds,
          partida.creador_nombre,
          { partidaId, fecha: partida.fecha, esClase: partida.es_clase }
        );
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al aceptar solicitud' };
    }
  },

  /**
   * Reject a player's request (creator only)
   * Note: jugadorId here is the usuario_id of the player
   */
  async rejectRequest(jugadorId, partidaId) {
    try {
      const { error } = await supabase
        .from('partidas_jugadores')
        .delete()
        .eq('partida_id', partidaId)
        .eq('usuario_id', jugadorId);

      if (error) {
        return { success: false, error: 'Error al rechazar solicitud' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al rechazar solicitud' };
    }
  },

  /**
   * Leave a match
   */
  async leaveMatch(partidaId, usuarioId) {
    try {
      // Remove the player
      const { error: deleteError } = await supabase
        .from('partidas_jugadores')
        .delete()
        .eq('partida_id', partidaId)
        .eq('usuario_id', usuarioId);

      if (deleteError) {
        console.error('[Partidas] Error eliminando jugador:', deleteError);
        return { success: false, error: 'Error al desapuntarse' };
      }

      console.log('[Partidas] Jugador eliminado exitosamente');

      // Call the RPC function to update the match status
      // This function uses SECURITY DEFINER to bypass RLS
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('actualizar_estado_partida_tras_salida', { p_partida_id: partidaId });

      if (rpcError) {
        console.error('[Partidas] Error llamando RPC:', rpcError);
        // Still return success because the player was already removed
        // Next time someone queries the match, the status can be recalculated
      } else {
        console.log('[Partidas] RPC ejecutado correctamente, resultado:', rpcResult);
      }

      return { success: true };
    } catch (error) {
      console.error('[Partidas] Error en desapuntarsePartida:', error);
      return { success: false, error: 'Error al desapuntarse' };
    }
  },

  /**
   * Cancel a match (creator only)
   */
  async cancelMatch(partidaId, creadorId) {
    try {
      // Get match data and players before canceling
      const { data: partida, error: fetchError } = await supabase
        .from('partidas')
        .select('creador_id, creador_nombre, fecha, es_clase, partidas_jugadores(*)')
        .eq('id', partidaId)
        .single();

      if (fetchError || !partida) {
        return { success: false, error: 'Partida no encontrada' };
      }

      if (partida.creador_id !== creadorId) {
        return { success: false, error: 'Solo el creador puede cancelar la partida' };
      }

      const { error } = await supabase
        .from('partidas')
        .update({ estado: 'cancelada', updated_at: new Date().toISOString() })
        .eq('id', partidaId)
        .eq('creador_id', creadorId);

      if (error) {
        return { success: false, error: 'Error al cancelar la partida' };
      }

      // Notify all players (except external ones who don't have usuario_id)
      const jugadoresIds = (partida.partidas_jugadores || [])
        .filter(j => j.usuario_id)
        .map(j => j.usuario_id);

      if (jugadoresIds.length > 0) {
        notificationService.notifyPartidaCancelada(
          jugadoresIds,
          partida.creador_nombre,
          { partidaId, fecha: partida.fecha, esClase: partida.es_clase }
        );
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al cancelar la partida' };
    }
  },

  /**
   * Delete a match (creator only)
   */
  async deleteMatch(partidaId, creadorId) {
    try {
      const { error } = await supabase
        .from('partidas')
        .delete()
        .eq('id', partidaId)
        .eq('creador_id', creadorId);

      if (error) {
        return { success: false, error: 'Error al eliminar la partida' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al eliminar la partida' };
    }
  },

  /**
   * Gets IDs of reservations that already have an associated match
   */
  async getReservationsWithMatch(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('partidas')
        .select('reserva_id')
        .eq('creador_id', usuarioId)
        .not('reserva_id', 'is', null)
        .in('estado', ['buscando', 'completa']);

      if (error) {
        return { success: false, error: 'Error al obtener reservas' };
      }

      return {
        success: true,
        data: data.map(p => p.reserva_id).filter(Boolean),
      };
    } catch (error) {
      return { success: false, error: 'Error al obtener reservas' };
    }
  },

  /**
   * Cancel own request
   */
  async cancelRequest(partidaId, usuarioId) {
    try {
      const { error } = await supabase
        .from('partidas_jugadores')
        .delete()
        .eq('partida_id', partidaId)
        .eq('usuario_id', usuarioId)
        .eq('estado', 'pendiente');

      if (error) {
        return { success: false, error: 'Error al cancelar solicitud' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al cancelar solicitud' };
    }
  },

  /**
   * Edit a match (creator only)
   */
  async editMatch(partidaId, creadorId, updates) {
    try {
      // Verify is the creator
      const { data: partida, error: fetchError } = await supabase
        .from('partidas')
        .select('creador_id')
        .eq('id', partidaId)
        .single();

      if (fetchError || !partida) {
        return { success: false, error: 'Partida no encontrada' };
      }

      if (partida.creador_id !== creadorId) {
        return { success: false, error: 'Solo el creador puede editar la partida' };
      }

      // Prepare data to update
      const updateData = {
        updated_at: new Date().toISOString(),
      };

      if (updates.mensaje !== undefined) updateData.mensaje = updates.mensaje;
      if (updates.nivelPreferido !== undefined) updateData.nivel_preferido = updates.nivelPreferido;
      if (updates.reservaId !== undefined) {
        updateData.reserva_id = updates.reservaId;
        updateData.tipo = updates.reservaId ? 'con_reserva' : 'abierta';
      }
      if (updates.fecha !== undefined) updateData.fecha = updates.fecha;
      if (updates.horaInicio !== undefined) updateData.hora_inicio = updates.horaInicio;
      if (updates.horaFin !== undefined) updateData.hora_fin = updates.horaFin;
      if (updates.pistaNombre !== undefined) updateData.pista_nombre = updates.pistaNombre;

      // Class fields
      if (updates.niveles !== undefined) updateData.niveles = updates.niveles;
      if (updates.minParticipantes !== undefined) updateData.min_participantes = updates.minParticipantes;
      if (updates.maxParticipantes !== undefined) updateData.max_participantes = updates.maxParticipantes;
      if (updates.precioAlumno !== undefined) updateData.precio_alumno = updates.precioAlumno;
      if (updates.precioGrupo !== undefined) updateData.precio_grupo = updates.precioGrupo;

      const { error } = await supabase
        .from('partidas')
        .update(updateData)
        .eq('id', partidaId);

      if (error) {
        return { success: false, error: 'Error al actualizar la partida' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al editar la partida' };
    }
  },

  /**
   * Add a player to an existing match (creator only)
   */
  async addPlayerToMatch(partidaId, creadorId, jugadorData) {
    try {
      // Verify is the creator
      const { data: partida, error: fetchError } = await supabase
        .from('partidas')
        .select('creador_id, estado, fecha, hora_inicio, pista_nombre, es_clase, max_participantes, partidas_jugadores(*)')
        .eq('id', partidaId)
        .single();

      if (fetchError || !partida) {
        return { success: false, error: 'Partida no encontrada' };
      }

      if (partida.creador_id !== creadorId) {
        return { success: false, error: 'Solo el creador puede añadir jugadores' };
      }

      // Count confirmed players
      const jugadoresConfirmados = partida.partidas_jugadores?.filter(j => j.estado === 'confirmado') || [];
      const maxParticipantes = partida.max_participantes || 4;
      if (1 + jugadoresConfirmados.length >= maxParticipantes) {
        return { success: false, error: partida.es_clase ? 'La clase ya está completa' : 'La partida ya está completa' };
      }

      // Verify player is not already in the match
      if (jugadorData.usuarioId) {
        const yaExiste = partida.partidas_jugadores?.some(j => j.usuario_id === jugadorData.usuarioId);
        if (yaExiste) {
          return { success: false, error: 'Este jugador ya está en la partida' };
        }
      }

      // Add player
      const { error: insertError } = await supabase
        .from('partidas_jugadores')
        .insert({
          partida_id: partidaId,
          usuario_id: jugadorData.usuarioId || null,
          usuario_nombre: jugadorData.usuarioNombre,
          usuario_vivienda: jugadorData.usuarioVivienda || null,
          nivel_juego: jugadorData.nivelJuego || null,
          es_externo: jugadorData.esExterno || false,
          estado: 'confirmado',
        });

      if (insertError) {
        console.error('[Partidas] Error añadiendo jugador:', insertError);
        return { success: false, error: 'Error al añadir jugador' };
      }

      // Check if now complete
      const nuevoTotal = 1 + jugadoresConfirmados.length + 1;
      if (nuevoTotal >= maxParticipantes) {
        await supabase
          .from('partidas')
          .update({ estado: 'completa', updated_at: new Date().toISOString() })
          .eq('id', partidaId);
      }

      // Schedule reminders for NON-external players
      if (!jugadorData.esExterno && partida.fecha && partida.hora_inicio) {
        notificationService.schedulePartidaReminders({
          id: partidaId,
          fecha: partida.fecha,
          horaInicio: partida.hora_inicio,
          pistaNombre: partida.pista_nombre,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('[Partidas] Error en anadirJugadorAPartida:', error);
      return { success: false, error: 'Error al añadir jugador' };
    }
  },

  /**
   * Remove a player from a match (creator only can remove others)
   */
  async removePlayer(jugadorId, partidaId, creadorId) {
    try {
      // Verify is the creator
      const { data: partida, error: fetchError } = await supabase
        .from('partidas')
        .select('creador_id')
        .eq('id', partidaId)
        .single();

      if (fetchError || !partida) {
        return { success: false, error: 'Partida no encontrada' };
      }

      if (partida.creador_id !== creadorId) {
        return { success: false, error: 'Solo el creador puede eliminar jugadores' };
      }

      // Delete the player
      const { error } = await supabase
        .from('partidas_jugadores')
        .delete()
        .eq('id', jugadorId)
        .eq('partida_id', partidaId);

      if (error) {
        return { success: false, error: 'Error al eliminar jugador' };
      }

      // Update status using RPC (recalculates based on remaining players)
      await supabase.rpc('actualizar_estado_partida_tras_salida', { p_partida_id: partidaId });

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al eliminar jugador' };
    }
  },

  /**
   * Close class registrations manually (creator only)
   * Allows closing even if not complete
   */
  async closeClass(partidaId, creadorId) {
    try {
      // Verify is the creator y que sea una clase
      const { data: partida, error: fetchError } = await supabase
        .from('partidas')
        .select('creador_id, creador_nombre, es_clase, estado, fecha, partidas_jugadores(*)')
        .eq('id', partidaId)
        .single();

      if (fetchError || !partida) {
        return { success: false, error: 'Clase no encontrada' };
      }

      if (partida.creador_id !== creadorId) {
        return { success: false, error: 'Solo el creador puede cerrar la clase' };
      }

      if (!partida.es_clase) {
        return { success: false, error: 'Esta función es solo para clases' };
      }

      if (partida.estado !== 'buscando') {
        return { success: false, error: 'La clase ya no está abierta' };
      }

      // Close the class (change status to 'completa')
      const { error } = await supabase
        .from('partidas')
        .update({ estado: 'completa', updated_at: new Date().toISOString() })
        .eq('id', partidaId);

      if (error) {
        return { success: false, error: 'Error al cerrar la clase' };
      }

      // Notify all confirmed players
      const jugadoresIds = (partida.partidas_jugadores || [])
        .filter(j => j.usuario_id && j.estado === 'confirmado')
        .map(j => j.usuario_id);

      if (jugadoresIds.length > 0) {
        notificationService.notifyPartidaCompleta(
          [creadorId, ...jugadoresIds],
          partida.creador_nombre,
          { partidaId, fecha: partida.fecha, esClase: true }
        );
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al cerrar la clase' };
    }
  },

  /**
   * Cancels a match linked to a reservation
   * Called when the reservation is canceled or displaced
   * @param {string} reservaId - Reservation ID
   * @param {string} motivo - 'reserva_cancelada' or 'reserva_desplazada'
   */
  async cancelMatchByReservation(reservaId, motivo = 'reserva_cancelada') {
    try {
      console.log('[cancelarPartidaPorReserva] Buscando partida con reserva_id:', reservaId);

      // 1. Find match linked to this reservation
      const { data: partidas, error: findError } = await supabase
        .from('partidas')
        .select('*, partidas_jugadores(*)')
        .eq('reserva_id', reservaId)
        .in('estado', ['buscando', 'completa']);

      console.log('[cancelarPartidaPorReserva] Resultado búsqueda:', { partidas, findError });

      // If no linked match, nothing to do
      if (findError) {
        console.error('[cancelarPartidaPorReserva] Error en búsqueda:', findError);
        return { success: true, hadPartida: false };
      }

      if (!partidas || partidas.length === 0) {
        console.log('[cancelarPartidaPorReserva] No hay partida vinculada a esta reserva');
        return { success: true, hadPartida: false };
      }

      const partida = partidas[0];

      // 2. Change match status to 'cancelada'
      const { error: updateError } = await supabase
        .from('partidas')
        .update({ estado: 'cancelada', updated_at: new Date().toISOString() })
        .eq('id', partida.id);

      if (updateError) {
        console.error('[cancelarPartidaPorReserva] Error actualizando partida:', updateError);
        return { success: false, error: 'Error al cancelar la partida' };
      }

      // 3. Get IDs of all confirmed players + creator
      const jugadoresIds = (partida.partidas_jugadores || [])
        .filter(j => j.estado === 'confirmado' && j.usuario_id)
        .map(j => j.usuario_id);

      // Include creator
      const todosLosIds = [...new Set([partida.creador_id, ...jugadoresIds])];

      // 4. Notify everyone
      if (todosLosIds.length > 0) {
        await notificationService.notifyPartidaCanceladaPorReserva(
          todosLosIds,
          partida.creador_nombre,
          {
            fecha: partida.fecha,
            horaInicio: partida.hora_inicio,
            esClase: partida.es_clase || false,
          },
          motivo
        );
      }

      console.log(`[cancelarPartidaPorReserva] Partida ${partida.id} cancelada por ${motivo}`);
      return { success: true, hadPartida: true, partidaId: partida.id };
    } catch (error) {
      console.error('[cancelarPartidaPorReserva] Error:', error);
      return { success: false, error: 'Error al cancelar la partida vinculada' };
    }
  },

  // ============================================================================
  // LEGACY ALIASES - For backwards compatibility
  // ============================================================================
  obtenerFotoUsuario(...args) { return this.getUserPhoto(...args); },
  obtenerDatosUsuarios(...args) { return this.getUsersData(...args); },
  obtenerPartidasActivas(...args) { return this.getActiveMatches(...args); },
  obtenerMisPartidas(...args) { return this.getMyMatches(...args); },
  obtenerPartidasApuntado(...args) { return this.getEnrolledMatches(...args); },
  crearPartida(...args) { return this.createMatch(...args); },
  solicitarUnirse(...args) { return this.requestToJoin(...args); },
  aceptarSolicitud(...args) { return this.acceptRequest(...args); },
  rechazarSolicitud(...args) { return this.rejectRequest(...args); },
  desapuntarsePartida(...args) { return this.leaveMatch(...args); },
  cancelarPartida(...args) { return this.cancelMatch(...args); },
  eliminarPartida(...args) { return this.deleteMatch(...args); },
  obtenerReservasConPartida(...args) { return this.getReservationsWithMatch(...args); },
  cancelarSolicitud(...args) { return this.cancelRequest(...args); },
  editarPartida(...args) { return this.editMatch(...args); },
  anadirJugadorAPartida(...args) { return this.addPlayerToMatch(...args); },
  eliminarJugador(...args) { return this.removePlayer(...args); },
  cerrarClase(...args) { return this.closeClass(...args); },
  cancelarPartidaPorReserva(...args) { return this.cancelMatchByReservation(...args); },
};
