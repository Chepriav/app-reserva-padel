import type { Result } from '@shared/types/Result';
import { ok } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { Match } from '@domain/entities/Match';

const isFuture = (match: Match): boolean => {
  if (!match.date || !match.endTime) return true;
  return new Date(`${match.date}T${match.endTime}`) > new Date();
};

export class GetMyMatches {
  constructor(private readonly matchRepository: MatchRepository) {}

  async execute(creatorId: string): Promise<Result<Match[]>> {
    const result = await this.matchRepository.findByCreator(creatorId);
    if (!result.success) return result;
    return ok(result.value.filter(isFuture));
  }
}
