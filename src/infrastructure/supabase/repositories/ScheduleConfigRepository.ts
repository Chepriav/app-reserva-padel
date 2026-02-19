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

      // RPC usually returns array; handle object fallback defensively
      const row = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);

      // If RPC response is missing new fields, fall back to direct table read.
      const hasDifferentiatedFields =
        row &&
        typeof row === 'object' &&
        'usar_horarios_diferenciados' in row &&
        'semana_hora_apertura' in row &&
        'semana_hora_cierre' in row &&
        'finde_hora_apertura' in row &&
        'finde_hora_cierre' in row &&
        'finde_pausa_inicio' in row &&
        'finde_pausa_fin' in row &&
        'finde_pausa_dias_semana' in row;

      if (row && typeof row === 'object' && !hasDifferentiatedFields) {
        const { data: directRow, error: directError } = await supabase
          .from('schedule_config')
          .select(
            [
              'hora_apertura',
              'hora_cierre',
              'duracion_bloque',
              'pausa_inicio',
              'pausa_fin',
              'motivo_pausa',
              'pausa_dias_semana',
              'usar_horarios_diferenciados',
              'semana_hora_apertura',
              'semana_hora_cierre',
              'finde_hora_apertura',
              'finde_hora_cierre',
              'finde_pausa_inicio',
              'finde_pausa_fin',
              'finde_motivo_pausa',
              'finde_pausa_dias_semana',
            ].join(','),
          )
          .limit(1)
          .maybeSingle();

        if (!directError && directRow) {
          return ok(toDomain(directRow as any));
        }
      }

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
