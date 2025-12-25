import { supabase } from './supabaseConfig';

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
    nivelJuego: data.nivel_juego,
    esExterno: data.es_externo || false,
    estado: data.estado || 'confirmado', // 'confirmado', 'pendiente', 'rechazado'
    createdAt: data.created_at,
  };
};

export const partidasService = {
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

      // Obtener jugadores de cada partida
      const partidasConJugadores = await Promise.all(
        partidas.map(async (partida) => {
          const { data: jugadores } = await supabase
            .from('partidas_jugadores')
            .select('*')
            .eq('partida_id', partida.id);

          return {
            ...mapPartidaToCamelCase(partida),
            jugadores: (jugadores || []).map(mapJugadorToCamelCase),
          };
        })
      );

      return { success: true, data: partidasConJugadores };
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

      // Obtener jugadores de cada partida
      const partidasConJugadores = await Promise.all(
        partidas.map(async (partida) => {
          const { data: jugadores } = await supabase
            .from('partidas_jugadores')
            .select('*')
            .eq('partida_id', partida.id);

          return {
            ...mapPartidaToCamelCase(partida),
            jugadores: (jugadores || []).map(mapJugadorToCamelCase),
          };
        })
      );

      return { success: true, data: partidasConJugadores };
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

      // Obtener jugadores de cada partida
      const partidasConJugadores = await Promise.all(
        partidas.map(async (partida) => {
          const { data: jugadores } = await supabase
            .from('partidas_jugadores')
            .select('*')
            .eq('partida_id', partida.id);

          return {
            ...mapPartidaToCamelCase(partida),
            jugadores: (jugadores || []).map(mapJugadorToCamelCase),
          };
        })
      );

      return { success: true, data: partidasConJugadores };
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
      // Verificar que sea el creador
      const { data: partida, error: partidaError } = await supabase
        .from('partidas')
        .select('creador_id, partidas_jugadores(*)')
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

      // Si ahora hay 4 jugadores, marcar como completa
      if (1 + confirmados.length + 1 >= 4) {
        await supabase
          .from('partidas')
          .update({ estado: 'completa', updated_at: new Date().toISOString() })
          .eq('id', partidaId);
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
      const { error } = await supabase
        .from('partidas_jugadores')
        .delete()
        .eq('partida_id', partidaId)
        .eq('usuario_id', usuarioId);

      if (error) {
        return { success: false, error: 'Error al desapuntarse' };
      }

      // Si la partida estaba completa, volver a buscando
      await supabase
        .from('partidas')
        .update({ estado: 'buscando', updated_at: new Date().toISOString() })
        .eq('id', partidaId)
        .eq('estado', 'completa');

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al desapuntarse' };
    }
  },

  /**
   * Cancelar una partida (solo el creador)
   */
  async cancelarPartida(partidaId, creadorId) {
    try {
      const { error } = await supabase
        .from('partidas')
        .update({ estado: 'cancelada', updated_at: new Date().toISOString() })
        .eq('id', partidaId)
        .eq('creador_id', creadorId);

      if (error) {
        return { success: false, error: 'Error al cancelar la partida' };
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
};
