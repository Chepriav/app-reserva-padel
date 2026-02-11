import type { ScheduleConfig } from '@domain/entities/ScheduleConfig';
import type { ScheduleConfigRepository } from '@domain/ports/repositories/ScheduleConfigRepository';
import { ValidationError } from '@domain/errors/DomainErrors';
import type { Result } from '@shared/types/Result';
import { fail } from '@shared/types/Result';

export class UpdateScheduleConfig {
  constructor(private readonly repository: ScheduleConfigRepository) {}

  async execute(userId: string, config: ScheduleConfig): Promise<Result<ScheduleConfig>> {
    const validationError = this.validate(config);
    if (validationError) {
      return fail(validationError);
    }
    return this.repository.updateConfig(userId, config);
  }

  private validate(config: ScheduleConfig): ValidationError | null {
    if (config.openingTime >= config.closingTime) {
      return new ValidationError('Opening time must be before closing time');
    }

    // If break is partially configured, both start and end are required
    if ((config.breakStart && !config.breakEnd) || (!config.breakStart && config.breakEnd)) {
      return new ValidationError('Both break start and end are required');
    }

    if (config.useDifferentiatedSchedules) {
      if (!config.weekdayOpeningTime || !config.weekdayClosingTime) {
        return new ValidationError('Weekday hours are required when using differentiated schedules');
      }
      if (!config.weekendOpeningTime || !config.weekendClosingTime) {
        return new ValidationError('Weekend hours are required when using differentiated schedules');
      }
    }

    return null;
  }
}
