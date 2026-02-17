import type { Result } from '@shared/types/Result';
import { fail } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { Match, UpdateMatchData } from '@domain/entities/Match';
import { MatchNotFoundError, MatchPermissionError } from '@domain/errors/DomainErrors';

export class EditMatch {
  constructor(private readonly matchRepository: MatchRepository) {}

  async execute(matchId: string, creatorId: string, updates: UpdateMatchData): Promise<Result<Match>> {
    const matchResult = await this.matchRepository.findById(matchId);
    if (!matchResult.success) return matchResult;

    const match = matchResult.value;
    if (!match) return fail(new MatchNotFoundError());
    if (match.creatorId !== creatorId) {
      return fail(new MatchPermissionError('Only the match creator can edit the match'));
    }

    return this.matchRepository.update(matchId, updates);
  }
}
