import type { Result } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';

/**
 * Returns the list of reservationIds that already have an associated match.
 * Used by the UI to disable the "create match" button for those reservations.
 */
export class GetReservationsWithMatch {
  constructor(private readonly matchRepository: MatchRepository) {}

  async execute(userId: string): Promise<Result<string[]>> {
    return this.matchRepository.findReservationIdsByCreator(userId);
  }
}
