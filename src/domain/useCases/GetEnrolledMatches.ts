import type { Result } from '@shared/types/Result';
import { ok } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { Match } from '@domain/entities/Match';

const isFuture = (match: Match): boolean => {
  if (!match.date || !match.endTime) return true;
  return new Date(`${match.date}T${match.endTime}`) > new Date();
};

export class GetEnrolledMatches {
  constructor(private readonly matchRepository: MatchRepository) {}

  async execute(userId: string): Promise<Result<Match[]>> {
    const result = await this.matchRepository.findEnrolledByUser(userId);
    if (!result.success) return result;
    return ok(result.value.filter(isFuture));
  }
}
