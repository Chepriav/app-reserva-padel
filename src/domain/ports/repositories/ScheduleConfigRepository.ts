import type { ScheduleConfig } from '@domain/entities/ScheduleConfig';
import type { Result } from '@shared/types/Result';

/**
 * Port for schedule configuration persistence.
 * Implemented by infrastructure adapters (e.g., Supabase).
 */
export interface ScheduleConfigRepository {
  getConfig(): Promise<Result<ScheduleConfig>>;
  updateConfig(userId: string, config: ScheduleConfig): Promise<Result<ScheduleConfig>>;
}
