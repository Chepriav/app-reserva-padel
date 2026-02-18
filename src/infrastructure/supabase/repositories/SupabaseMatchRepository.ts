import { supabase } from '@infrastructure/supabase/client';
import { ok, fail } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { Match, CreateMatchData, UpdateMatchData } from '@domain/entities/Match';
import { InfrastructureError, MatchNotFoundError } from '@domain/errors/DomainErrors';
import { matchToDomain, playerToDomain, toDbInsert, matchTypeToDb } from '../mappers/matchMapper';

export class SupabaseMatchRepository implements MatchRepository {
  private async _fetchWithPlayers(matchId: string): Promise<Match | null> {
    const [matchResult, playersResult] = await Promise.all([
      supabase.from('partidas').select('*').eq('id', matchId).maybeSingle(),
      supabase.from('partidas_jugadores').select('*').eq('partida_id', matchId),
    ]);

    if (!matchResult.data) return null;
    const players = (playersResult.data ?? []).map(playerToDomain);
    return matchToDomain(matchResult.data as Record<string, unknown>, players);
  }

  private async _fetchManyWithPlayers(matchRows: Record<string, unknown>[]): Promise<Match[]> {
    if (matchRows.length === 0) return [];

    const ids = matchRows.map((r) => r.id as string);
    const { data: playerRows } = await supabase
      .from('partidas_jugadores')
      .select('*')
      .in('partida_id', ids);

    const playersByMatch = new Map<string, ReturnType<typeof playerToDomain>[]>();
    for (const row of playerRows ?? []) {
      const player = playerToDomain(row as Record<string, unknown>);
      if (!playersByMatch.has(player.matchId)) playersByMatch.set(player.matchId, []);
      playersByMatch.get(player.matchId)!.push(player);
    }

    return matchRows.map((row) =>
      matchToDomain(row, playersByMatch.get(row.id as string) ?? []),
    );
  }

  async findAll(): Promise<Result<Match[]>> {
    try {
      const { data, error } = await supabase
        .from('partidas')
        .select('*')
        .neq('estado', 'cancelada')
        .order('created_at', { ascending: false });

      if (error) return fail(new InfrastructureError('Error fetching matches', error));
      return ok(await this._fetchManyWithPlayers((data ?? []) as Record<string, unknown>[]));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error fetching matches', err));
    }
  }

  async findByCreator(creatorId: string): Promise<Result<Match[]>> {
    try {
      const { data, error } = await supabase
        .from('partidas')
        .select('*')
        .eq('creador_id', creatorId)
        .neq('estado', 'cancelada')
        .order('created_at', { ascending: false });

      if (error) return fail(new InfrastructureError('Error fetching creator matches', error));
      return ok(await this._fetchManyWithPlayers((data ?? []) as Record<string, unknown>[]));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }

  async findEnrolledByUser(userId: string): Promise<Result<Match[]>> {
    try {
      // Get match IDs where user is a confirmed/pending player (not creator)
      const { data: enrollments, error: eErr } = await supabase
        .from('partidas_jugadores')
        .select('partida_id')
        .eq('usuario_id', userId)
        .in('estado', ['confirmado', 'pendiente']);

      if (eErr) return fail(new InfrastructureError('Error fetching enrollments', eErr));

      const matchIds = (enrollments ?? []).map((e: Record<string, unknown>) => e.partida_id as string);
      if (matchIds.length === 0) return ok([]);

      const { data, error } = await supabase
        .from('partidas')
        .select('*')
        .in('id', matchIds)
        .neq('estado', 'cancelada');

      if (error) return fail(new InfrastructureError('Error fetching enrolled matches', error));
      return ok(await this._fetchManyWithPlayers((data ?? []) as Record<string, unknown>[]));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }

  async findByReservationId(reservationId: string): Promise<Result<Match | null>> {
    try {
      const { data, error } = await supabase
        .from('partidas')
        .select('*')
        .eq('reserva_id', reservationId)
        .neq('estado', 'cancelada')
        .maybeSingle();

      if (error) return fail(new InfrastructureError('Error fetching match by reservation', error));
      if (!data) return ok(null);

      const match = await this._fetchWithPlayers(data.id as string);
      return ok(match);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }

  async findById(id: string): Promise<Result<Match | null>> {
    try {
      const match = await this._fetchWithPlayers(id);
      return ok(match);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error fetching match', err));
    }
  }

  async create(data: CreateMatchData): Promise<Result<Match>> {
    try {
      const insertRow = toDbInsert(data);

      const { data: row, error } = await supabase
        .from('partidas')
        .insert(insertRow)
        .select()
        .single();

      if (error) return fail(new InfrastructureError('Error creating match', error));

      // Add initial players if any
      const matchId = (row as Record<string, unknown>).id as string;
      if (data.initialPlayers && data.initialPlayers.length > 0) {
        const playerInserts = data.initialPlayers.map((p) => ({
          partida_id: matchId,
          usuario_id: p.userId ?? null,
          usuario_nombre: p.userName,
          usuario_vivienda: p.userApartment ?? null,
          nivel_juego: p.skillLevel ?? null,
          es_externo: p.isExternal ?? false,
          estado: 'confirmado',
        }));
        await supabase.from('partidas_jugadores').insert(playerInserts);
      }

      const match = await this._fetchWithPlayers(matchId);
      return ok(match!);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error creating match', err));
    }
  }

  async update(id: string, data: UpdateMatchData): Promise<Result<Match>> {
    try {
      const updateRow: Record<string, unknown> = {};
      if (data.message !== undefined) updateRow.mensaje = data.message;
      if (data.preferredLevel !== undefined) updateRow.nivel_preferido = data.preferredLevel;
      if (data.reservationId !== undefined) updateRow.reserva_id = data.reservationId;
      if (data.date !== undefined) updateRow.fecha = data.date;
      if (data.startTime !== undefined) updateRow.hora_inicio = data.startTime;
      if (data.endTime !== undefined) updateRow.hora_fin = data.endTime;
      if (data.courtName !== undefined) updateRow.pista_nombre = data.courtName;
      if (data.type !== undefined) updateRow.tipo = matchTypeToDb(data.type);
      if (data.levels !== undefined) updateRow.niveles = data.levels;
      if (data.minParticipants !== undefined) updateRow.min_participantes = data.minParticipants;
      if (data.maxParticipants !== undefined) updateRow.max_participantes = data.maxParticipants;
      if (data.studentPrice !== undefined) updateRow.precio_alumno = data.studentPrice;
      if (data.groupPrice !== undefined) updateRow.precio_grupo = data.groupPrice;

      const { error } = await supabase.from('partidas').update(updateRow).eq('id', id);
      if (error) return fail(new InfrastructureError('Error updating match', error));

      const match = await this._fetchWithPlayers(id);
      if (!match) return fail(new MatchNotFoundError());
      return ok(match);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error updating match', err));
    }
  }

  async cancel(id: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('partidas')
        .update({ estado: 'cancelada' })
        .eq('id', id);

      if (error) return fail(new InfrastructureError('Error cancelling match', error));
      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error cancelling match', err));
    }
  }

  async close(id: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('partidas')
        .update({ estado: 'completa' })
        .eq('id', id);

      if (error) return fail(new InfrastructureError('Error closing match', error));
      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error closing match', err));
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      // Delete players first (FK constraint)
      await supabase.from('partidas_jugadores').delete().eq('partida_id', id);
      const { error } = await supabase.from('partidas').delete().eq('id', id);
      if (error) return fail(new InfrastructureError('Error deleting match', error));
      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error deleting match', err));
    }
  }

  async findReservationIdsByCreator(creatorId: string): Promise<Result<string[]>> {
    try {
      const { data, error } = await supabase
        .from('partidas')
        .select('reserva_id')
        .eq('creador_id', creatorId)
        .neq('estado', 'cancelada')
        .not('reserva_id', 'is', null);

      if (error) return fail(new InfrastructureError('Error fetching reservation ids', error));
      return ok((data ?? []).map((r: Record<string, unknown>) => r.reserva_id as string));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }

  async cancelByReservationId(
    reservationId: string,
  ): Promise<Result<{ matchId: string; match: Match } | null>> {
    try {
      const matchResult = await this.findByReservationId(reservationId);
      if (!matchResult.success) return matchResult;
      if (!matchResult.value) return ok(null);

      const match = matchResult.value;
      const cancelResult = await this.cancel(match.id);
      if (!cancelResult.success) return cancelResult;

      // Return cancelled match with updated status
      return ok({ matchId: match.id, match: { ...match, status: 'cancelled' as const } });
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error cancelling match by reservation', err));
    }
  }
}
