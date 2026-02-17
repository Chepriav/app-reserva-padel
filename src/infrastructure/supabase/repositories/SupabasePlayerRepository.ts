import { supabase } from '@infrastructure/supabase/client';
import { ok, fail } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { PlayerRepository } from '@domain/ports/repositories/PlayerRepository';
import type { Player, AddPlayerData, PlayerStatus } from '@domain/entities/Match';
import { InfrastructureError } from '@domain/errors/DomainErrors';
import { playerToDomain, playerStatusToDb } from '../mappers/matchMapper';
import { skillLevelToDb } from '../mappers/userMapper';

export class SupabasePlayerRepository implements PlayerRepository {
  async findByMatch(matchId: string): Promise<Result<Player[]>> {
    try {
      const { data, error } = await supabase
        .from('partidas_jugadores')
        .select('*')
        .eq('partida_id', matchId);

      if (error) return fail(new InfrastructureError('Error fetching players', error));
      return ok((data ?? []).map((r) => playerToDomain(r as Record<string, unknown>)));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error fetching players', err));
    }
  }

  async findByMatchAndUser(matchId: string, userId: string): Promise<Result<Player | null>> {
    try {
      const { data, error } = await supabase
        .from('partidas_jugadores')
        .select('*')
        .eq('partida_id', matchId)
        .eq('usuario_id', userId)
        .maybeSingle();

      if (error) return fail(new InfrastructureError('Error fetching player', error));
      return ok(data ? playerToDomain(data as Record<string, unknown>) : null);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }

  async add(matchId: string, data: AddPlayerData, status: PlayerStatus): Promise<Result<Player>> {
    try {
      const { data: row, error } = await supabase
        .from('partidas_jugadores')
        .insert({
          partida_id: matchId,
          usuario_id: data.userId ?? null,
          usuario_nombre: data.userName,
          usuario_vivienda: data.userApartment ?? null,
          nivel_juego: data.skillLevel ? skillLevelToDb(data.skillLevel) : null,
          es_externo: data.isExternal ?? false,
          estado: playerStatusToDb(status),
        })
        .select()
        .single();

      if (error) return fail(new InfrastructureError('Error adding player', error));
      return ok(playerToDomain(row as Record<string, unknown>));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error adding player', err));
    }
  }

  async updateStatus(playerId: string, status: PlayerStatus): Promise<Result<Player>> {
    try {
      const { data, error } = await supabase
        .from('partidas_jugadores')
        .update({ estado: playerStatusToDb(status) })
        .eq('id', playerId)
        .select()
        .single();

      if (error) return fail(new InfrastructureError('Error updating player status', error));
      return ok(playerToDomain(data as Record<string, unknown>));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }

  async remove(playerId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('partidas_jugadores')
        .delete()
        .eq('id', playerId);

      if (error) return fail(new InfrastructureError('Error removing player', error));
      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error removing player', err));
    }
  }

  async recalculateMatchStatus(matchId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase.rpc('actualizar_estado_partida_tras_salida', {
        p_partida_id: matchId,
      });

      if (error) {
        // RPC not available — do manual recalculation
        const { data: match } = await supabase
          .from('partidas')
          .select('max_participantes, estado')
          .eq('id', matchId)
          .maybeSingle();

        if (!match || match.estado === 'cancelada') return ok(undefined);

        const { data: players } = await supabase
          .from('partidas_jugadores')
          .select('id')
          .eq('partida_id', matchId)
          .eq('estado', 'confirmado');

        const confirmedCount = (players ?? []).length;
        const newStatus = confirmedCount >= match.max_participantes ? 'completa' : 'buscando';

        await supabase.from('partidas').update({ estado: newStatus }).eq('id', matchId);
      }

      return ok(undefined);
    } catch (err) {
      return ok(undefined); // Non-critical
    }
  }
}
