import type { Result } from '@shared/types/Result';
import { fail } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import { MatchNotFoundError, MatchPermissionError } from '@domain/errors/DomainErrors';

export class DeleteMatch {
  constructor(private readonly matchRepository: MatchRepository) {}

  async execute(matchId: string, creatorId: string): Promise<Result<void>> {
    const matchResult = await this.matchRepository.findById(matchId);
    if (!matchResult.success) return matchResult;

    const match = matchResult.value;
    if (!match) return fail(new MatchNotFoundError());
    if (match.creatorId !== creatorId) {
      return fail(new MatchPermissionError('Only the match creator can delete the match'));
    }

    return this.matchRepository.delete(matchId);
  }
}
