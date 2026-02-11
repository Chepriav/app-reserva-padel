import type { ScheduleConfig } from '@domain/entities/ScheduleConfig';
import type { ScheduleConfigRepository } from '@domain/ports/repositories/ScheduleConfigRepository';
import type { Result } from '@shared/types/Result';

export class GetScheduleConfig {
  constructor(private readonly repository: ScheduleConfigRepository) {}

  execute(): Promise<Result<ScheduleConfig>> {
    return this.repository.getConfig();
  }
}
