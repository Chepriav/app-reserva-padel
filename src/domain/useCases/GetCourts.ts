import type { Result } from '@shared/types/Result';
import type { CourtRepository } from '@domain/ports/repositories/CourtRepository';
import type { Court } from '@domain/entities/Court';

export class GetCourts {
  constructor(private readonly courtRepository: CourtRepository) {}

  execute(): Promise<Result<Court[]>> {
    return this.courtRepository.findAll();
  }
}
