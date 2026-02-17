import type { Result } from '@shared/types/Result';
import { ok } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { Match } from '@domain/entities/Match';

const isFuture = (match: Match): boolean => {
  if (!match.date || !match.endTime) return true; // Open matches without date are always active
  const end = new Date(`${match.date}T${match.endTime}`);
  return end > new Date();
};

export class GetActiveMatches {
  constructor(private readonly matchRepository: MatchRepository) {}

  async execute(): Promise<Result<Match[]>> {
    const result = await this.matchRepository.findAll();
    if (!result.success) return result;
    return ok(result.value.filter(isFuture));
  }
}
