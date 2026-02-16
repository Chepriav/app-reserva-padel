import { supabase } from '@infrastructure/supabase/client';
import { ok, fail } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { CourtRepository } from '@domain/ports/repositories/CourtRepository';
import type { Court } from '@domain/entities/Court';
import { InfrastructureError } from '@domain/errors/DomainErrors';
import { toDomain } from '../mappers/courtMapper';

export class SupabaseCourtRepository implements CourtRepository {
  async findAll(): Promise<Result<Court[]>> {
    try {
      const { data, error } = await supabase
        .from('pistas')
        .select('*');

      if (error) {
        return fail(new InfrastructureError('Error fetching courts', error));
      }

      return ok((data ?? []).map(toDomain));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error fetching courts', err));
    }
  }

  async findById(id: string): Promise<Result<Court | null>> {
    try {
      const { data, error } = await supabase
        .from('pistas')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return fail(new InfrastructureError('Error fetching court', error));
      }

      return ok(data ? toDomain(data) : null);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error fetching court', err));
    }
  }
}
