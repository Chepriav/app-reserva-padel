import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { PlayerRepository } from '@domain/ports/repositories/PlayerRepository';
import { MatchNotFoundError, MatchPermissionError } from '@domain/errors/DomainErrors';

export class RemovePlayer {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly playerRepository: PlayerRepository,
  ) {}

  async execute(playerId: string, matchId: string, creatorId: string): Promise<Result<void>> {
    const matchResult = await this.matchRepository.findById(matchId);
    if (!matchResult.success) return matchResult;

    const match = matchResult.value;
    if (!match) return fail(new MatchNotFoundError());
    if (match.creatorId !== creatorId) {
      return fail(new MatchPermissionError('Only the match creator can remove players'));
    }

    const removeResult = await this.playerRepository.remove(playerId);
    if (!removeResult.success) return removeResult;

    // Recalculate match status
    await this.playerRepository.recalculateMatchStatus(matchId);
    return ok(undefined);
  }
}
