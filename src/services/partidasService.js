import { supabase } from './supabaseConfig';
import { notificationService } from './notificationService';

/**
 * Mapea partida de snake_case a camelCase
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
    // Jugadores si vienen incluidos
    jugadores: data.jugadores || [],
  };
};

/**
 * Mapea jugador de partida de snake_case a camelCase
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

export const partidasService = {
  /**
   * Obtiene foto de perfil de un usuario por ID
   */
  async obtenerFotoUsuario(userId) {
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
   * Obtiene datos de múltiples usuarios (foto y nivel)
   */
  async obtenerDatosUsuarios(userIds) {
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
   * Obtiene todas las partidas activas (buscando jugadores)
   */
  async obtenerPartidasActivas() {
    try {
      // Obtener partidas con estado 'buscando'
      const { data: partidas, error } = await supabase
        .from('partidas')
        .select('*')
        .eq('estado', 'buscando')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: 'Error al obtener partidas' };
      }

      // Recolectar todos los IDs de usuarios para obtener datos en un solo query
      const creadorIds = partidas.map(p => p.creador_id).filter(Boolean);

      // Obtener jugadores de cada partida
      const partidasConJugadores = await Promise.all(
        partidas.map(async (partida) => {
          const { data: jugadores } = await supabase
            .from('partidas_jugadores')
            .select('*')
            .eq('partida_id', partida.id);

          return { partida, jugadores: jugadores || [] };
        })
      );

      // Recolectar IDs de todos los jugadores
      const jugadorIds = partidasConJugadores
        .flatMap(p => p.jugadores.map(j => j.usuario_id))
        .filter(Boolean);

      // Obtener todos los datos de usuarios en un solo query
      const todosLosIds = [...new Set([...creadorIds, ...jugadorIds])];
      const datosMap = await this.obtenerDatosUsuarios(todosLosIds);

      // Mapear partidas con datos de usuarios
      const resultado = partidasConJugadores.map(({ partida, jugadores }) => ({
        ...mapPartidaToCamelCase({
          ...partida,
          creador_foto: datosMap[partida.creador_id]?.foto || null,
          creador_nivel: datosMap[partida.creador_id]?.nivel || null,
        }),
        jugadores: jugadores.map(j => mapJugadorToCamelCase({
          ...j,
          usuario_foto: datosMap[j.usuario_id]?.foto || null,
          // El nivel ya viene en partidas_jugadores.nivel_juego
        })),
      }));

      return { success: true, data: resultado };
    } catch (error) {
      return { success: false, error: 'Error al obtener partidas' };
    }
  },

  /**
   * Obtiene las partidas creadas por un usuario
   */
  async obtenerMisPartidas(usuarioId) {
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

      // Recolectar IDs de creadores
      const creadorIds = partidas.map(p => p.creador_id).filter(Boolean);

      // Obtener jugadores de cada partida
      const partidasConJugadores = await Promise.all(
        partidas.map(async (partida) => {
          const { data: jugadores } = await supabase
            .from('partidas_jugadores')
            .select('*')
            .eq('partida_id', partida.id);

          return { partida, jugadores: jugadores || [] };
        })
      );

      // Recolectar IDs de todos los jugadores
      const jugadorIds = partidasConJugadores
        .flatMap(p => p.jugadores.map(j => j.usuario_id))
        .filter(Boolean);

      // Obtener todos los datos de usuarios en un solo query
      const todosLosIds = [...new Set([...creadorIds, ...jugadorIds])];
      const datosMap = await this.obtenerDatosUsuarios(todosLosIds);

      // Mapear partidas con datos de usuarios
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
   * Obtiene las partidas donde el usuario está apuntado
   */
  async obtenerPartidasApuntado(usuarioId) {
    try {
      // Primero obtener los IDs de partidas donde está apuntado
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

      // Obtener las partidas
      const { data: partidas, error } = await supabase
        .from('partidas')
        .select('*')
        .in('id', partidaIds)
        .in('estado', ['buscando', 'completa'])
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: 'Error al obtener partidas' };
      }

      // Recolectar IDs de creadores
      const creadorIds = partidas.map(p => p.creador_id).filter(Boolean);

      // Obtener jugadores de cada partida
      const partidasConJugadores = await Promise.all(
        partidas.map(async (partida) => {
          const { data: jugadores } = await supabase
            .from('partidas_jugadores')
            .select('*')
            .eq('partida_id', partida.id);

          return { partida, jugadores: jugadores || [] };
        })
      );

      // Recolectar IDs de todos los jugadores
      const jugadorIds = partidasConJugadores
        .flatMap(p => p.jugadores.map(j => j.usuario_id))
        .filter(Boolean);

      // Obtener todos los datos de usuarios en un solo query
      const todosLosIds = [...new Set([...creadorIds, ...jugadorIds])];
      const datosMap = await this.obtenerDatosUsuarios(todosLosIds);

      // Mapear partidas con datos de usuarios
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
   * Crea una nueva partida/solicitud
   */
  async crearPartida(partidaData) {
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
      } = partidaData;

      // Calcular si la partida estará completa desde el inicio
      const totalJugadores = 1 + (jugadoresIniciales?.length || 0);
      const estadoInicial = totalJugadores >= 4 ? 'completa' : 'buscando';

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
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: 'Error al crear la partida' };
      }

      // Si hay jugadores iniciales, añadirlos (internos y externos)
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

      return { success: true, data: mapPartidaToCamelCase(data) };
    } catch (error) {
      return { success: false, error: 'Error al crear la partida' };
    }
  },

  /**
   * Solicitar unirse a una partida (crea solicitud pendiente)
   */
  async solicitarUnirse(partidaId, usuario) {
    try {
      // Verificar que la partida existe y está buscando
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

      // Verificar que no esté ya apuntado o tenga solicitud
      const yaApuntado = partida.partidas_jugadores?.some(
        (j) => j.usuario_id === usuario.id
      );
      if (yaApuntado) {
        return { success: false, error: 'Ya tienes una solicitud o estás apuntado a esta partida' };
      }

      // Verificar que no sea el creador
      if (partida.creador_id === usuario.id) {
        return { success: false, error: 'No puedes unirte a tu propia partida' };
      }

      // Contar jugadores confirmados (creador + confirmados)
      const jugadoresConfirmados = partida.partidas_jugadores?.filter(j => j.estado === 'confirmado') || [];
      if (1 + jugadoresConfirmados.length >= 4) {
        return { success: false, error: 'La partida ya está completa' };
      }

      // Crear solicitud pendiente
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

      // Notificar al creador de la partida
      notificationService.notifyPartidaSolicitud(
        partida.creador_id,
        usuario.nombre,
        { partidaId, fecha: partida.fecha }
      );

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al solicitar unirse' };
    }
  },

  /**
   * Aceptar solicitud de un jugador (solo creador)
   * Nota: jugadorId aquí es el usuario_id del jugador que solicitó unirse
   */
  async aceptarSolicitud(jugadorId, partidaId, creadorId) {
    try {
      // Verificar que sea el creador y obtener datos completos
      const { data: partida, error: partidaError } = await supabase
        .from('partidas')
        .select('creador_id, creador_nombre, fecha, partidas_jugadores(*)')
        .eq('id', partidaId)
        .single();

      if (partidaError) {
        return { success: false, error: 'Error al obtener partida' };
      }

      if (partida?.creador_id !== creadorId) {
        return { success: false, error: 'Solo el creador puede aceptar solicitudes' };
      }

      // Contar confirmados actuales
      const confirmados = partida.partidas_jugadores?.filter(j => j.estado === 'confirmado') || [];
      if (1 + confirmados.length >= 4) {
        return { success: false, error: 'La partida ya está completa' };
      }

      // Aceptar solicitud - usar partida_id + usuario_id para identificar la fila
      const { error } = await supabase
        .from('partidas_jugadores')
        .update({ estado: 'confirmado' })
        .eq('partida_id', partidaId)
        .eq('usuario_id', jugadorId);

      if (error) {
        return { success: false, error: 'Error al aceptar solicitud' };
      }

      // Notificar al jugador que fue aceptado
      notificationService.notifyPartidaAceptada(
        jugadorId,
        partida.creador_nombre,
        { partidaId, fecha: partida.fecha }
      );

      // Si ahora hay 4 jugadores, marcar como completa y notificar a todos
      const nuevoTotalConfirmados = 1 + confirmados.length + 1;
      if (nuevoTotalConfirmados >= 4) {
        await supabase
          .from('partidas')
          .update({ estado: 'completa', updated_at: new Date().toISOString() })
          .eq('id', partidaId);

        // Obtener IDs de todos los jugadores (creador + confirmados + el recién aceptado)
        const jugadoresIds = [
          creadorId,
          ...confirmados.map(j => j.usuario_id).filter(Boolean),
          jugadorId,
        ];

        // Notificar a todos que la partida está completa
        notificationService.notifyPartidaCompleta(
          jugadoresIds,
          partida.creador_nombre,
          { partidaId, fecha: partida.fecha }
        );
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al aceptar solicitud' };
    }
  },

  /**
   * Rechazar solicitud de un jugador (solo creador)
   * Nota: jugadorId aquí es el usuario_id del jugador
   */
  async rechazarSolicitud(jugadorId, partidaId) {
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
   * Desapuntarse de una partida
   */
  async desapuntarsePartida(partidaId, usuarioId) {
    try {
      // Eliminar al jugador
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

      // Llamar a la función RPC para actualizar el estado de la partida
      // Esta función usa SECURITY DEFINER para bypassear RLS
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('actualizar_estado_partida_tras_salida', { p_partida_id: partidaId });

      if (rpcError) {
        console.error('[Partidas] Error llamando RPC:', rpcError);
        // Aún así devolvemos success porque el jugador ya fue eliminado
        // La próxima vez que alguien consulte la partida, el estado se puede recalcular
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
   * Cancelar una partida (solo el creador)
   */
  async cancelarPartida(partidaId, creadorId) {
    try {
      // Obtener datos de la partida y jugadores antes de cancelar
      const { data: partida, error: fetchError } = await supabase
        .from('partidas')
        .select('creador_id, creador_nombre, fecha, partidas_jugadores(*)')
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

      // Notificar a todos los jugadores (excepto externos que no tienen usuario_id)
      const jugadoresIds = (partida.partidas_jugadores || [])
        .filter(j => j.usuario_id)
        .map(j => j.usuario_id);

      if (jugadoresIds.length > 0) {
        notificationService.notifyPartidaCancelada(
          jugadoresIds,
          partida.creador_nombre,
          { partidaId, fecha: partida.fecha }
        );
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al cancelar la partida' };
    }
  },

  /**
   * Eliminar una partida (solo el creador)
   */
  async eliminarPartida(partidaId, creadorId) {
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
   * Obtiene IDs de reservas que ya tienen partida asociada
   */
  async obtenerReservasConPartida(usuarioId) {
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
   * Cancelar solicitud propia
   */
  async cancelarSolicitud(partidaId, usuarioId) {
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
   * Editar partida (solo el creador)
   */
  async editarPartida(partidaId, creadorId, updates) {
    try {
      // Verificar que sea el creador
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

      // Preparar datos para actualizar
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
   * Añadir jugador a una partida existente (solo el creador puede añadir)
   */
  async anadirJugadorAPartida(partidaId, creadorId, jugadorData) {
    try {
      // Verificar que sea el creador
      const { data: partida, error: fetchError } = await supabase
        .from('partidas')
        .select('creador_id, estado, partidas_jugadores(*)')
        .eq('id', partidaId)
        .single();

      if (fetchError || !partida) {
        return { success: false, error: 'Partida no encontrada' };
      }

      if (partida.creador_id !== creadorId) {
        return { success: false, error: 'Solo el creador puede añadir jugadores' };
      }

      // Contar jugadores confirmados
      const jugadoresConfirmados = partida.partidas_jugadores?.filter(j => j.estado === 'confirmado') || [];
      if (1 + jugadoresConfirmados.length >= 4) {
        return { success: false, error: 'La partida ya está completa' };
      }

      // Verificar que el jugador no esté ya en la partida
      if (jugadorData.usuarioId) {
        const yaExiste = partida.partidas_jugadores?.some(j => j.usuario_id === jugadorData.usuarioId);
        if (yaExiste) {
          return { success: false, error: 'Este jugador ya está en la partida' };
        }
      }

      // Añadir jugador
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

      // Verificar si ahora está completa (4 jugadores)
      const nuevoTotal = 1 + jugadoresConfirmados.length + 1;
      if (nuevoTotal >= 4) {
        await supabase
          .from('partidas')
          .update({ estado: 'completa', updated_at: new Date().toISOString() })
          .eq('id', partidaId);
      }

      return { success: true };
    } catch (error) {
      console.error('[Partidas] Error en anadirJugadorAPartida:', error);
      return { success: false, error: 'Error al añadir jugador' };
    }
  },

  /**
   * Eliminar jugador de una partida (solo el creador puede eliminar a otros)
   */
  async eliminarJugador(jugadorId, partidaId, creadorId) {
    try {
      // Verificar que sea el creador
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

      // Eliminar el jugador
      const { error } = await supabase
        .from('partidas_jugadores')
        .delete()
        .eq('id', jugadorId)
        .eq('partida_id', partidaId);

      if (error) {
        return { success: false, error: 'Error al eliminar jugador' };
      }

      // Actualizar estado usando RPC (recalcula basándose en jugadores restantes)
      await supabase.rpc('actualizar_estado_partida_tras_salida', { p_partida_id: partidaId });

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al eliminar jugador' };
    }
  },
};
