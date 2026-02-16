import { supabase } from '@infrastructure/supabase/client';
import { ok, fail } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { BlockoutRepository } from '@domain/ports/repositories/BlockoutRepository';
import type { Blockout, CreateBlockoutData } from '@domain/entities/Blockout';
import { InfrastructureError, BlockoutConflictError } from '@domain/errors/DomainErrors';
import { toDomain } from '../mappers/blockoutMapper';

export class SupabaseBlockoutRepository implements BlockoutRepository {
  async findByDateAndCourt(date: string, courtId: string): Promise<Result<Blockout[]>> {
    try {
      const { data, error } = await supabase
        .from('bloqueos_horarios')
        .select('*')
        .eq('pista_id', courtId)
        .eq('fecha', date);

      if (error) {
        // Table may not exist in older DB versions — treat as empty
        if (error.code === '42P01' || error.message?.includes('bloqueos_horarios')) {
          return ok([]);
        }
        return fail(new InfrastructureError('Error fetching blockouts', error));
      }

      return ok((data ?? []).map(toDomain));
    } catch (err) {
      return ok([]); // Non-critical — degrade gracefully
    }
  }

  async create(data: CreateBlockoutData): Promise<Result<Blockout>> {
    try {
      const { data: row, error } = await supabase
        .from('bloqueos_horarios')
        .insert({
          pista_id: data.courtId,
          fecha: data.date,
          hora_inicio: data.startTime,
          hora_fin: data.endTime,
          motivo: data.reason ?? null,
          creado_por: data.createdBy,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return fail(new BlockoutConflictError());
        }
        return fail(new InfrastructureError('Error creating blockout', error));
      }

      return ok(toDomain(row));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error creating blockout', err));
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('bloqueos_horarios')
        .delete()
        .eq('id', id);

      if (error) {
        return fail(new InfrastructureError('Error deleting blockout', error));
      }

      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error deleting blockout', err));
    }
  }
}
