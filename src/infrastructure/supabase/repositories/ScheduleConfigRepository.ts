import type { ScheduleConfig } from '@domain/entities/ScheduleConfig';
import type { ScheduleConfigRepository } from '@domain/ports/repositories/ScheduleConfigRepository';
import { InfrastructureError, ScheduleConfigUpdateError } from '@domain/errors/DomainErrors';
import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import { supabase } from '../client';
import { toDomain, toRpcParams } from '../mappers/scheduleConfigMapper';

export class SupabaseScheduleConfigRepository implements ScheduleConfigRepository {
  async getConfig(): Promise<Result<ScheduleConfig>> {
    try {
      const { data, error } = await supabase.rpc('get_schedule_config');

      if (error) {
        return fail(new InfrastructureError('Error fetching schedule config', error));
      }

      // RPC returns array, get first element
      const row = data?.[0] ?? null;
      return ok(toDomain(row));
    } catch (err) {
      return fail(new InfrastructureError('Error fetching schedule config', err));
    }
  }

  async updateConfig(userId: string, config: ScheduleConfig): Promise<Result<ScheduleConfig>> {
    try {
      const params = toRpcParams(userId, config);
      const { data, error } = await supabase.rpc('update_schedule_config', params);

      if (error) {
        return fail(new ScheduleConfigUpdateError(error.message || 'Error updating config', error));
      }

      if (!data) {
        return fail(new ScheduleConfigUpdateError('No response from server'));
      }

      // RPC returns { success, error?, config? }
      if (data.success === false) {
        return fail(new ScheduleConfigUpdateError(data.error || 'Error updating config'));
      }

      // Return the config we sent (server confirmed success)
      return ok(config);
    } catch (err) {
      return fail(
        new ScheduleConfigUpdateError(
          err instanceof Error ? err.message : 'Error updating config',
          err,
        ),
      );
    }
  }
}
