import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { PlayerRepository } from '@domain/ports/repositories/PlayerRepository';
import { MatchNotFoundError } from '@domain/errors/DomainErrors';

export class LeaveMatch {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly playerRepository: PlayerRepository,
  ) {}

  async execute(matchId: string, userId: string): Promise<Result<void>> {
    const matchResult = await this.matchRepository.findById(matchId);
    if (!matchResult.success) return matchResult;
    if (!matchResult.value) return fail(new MatchNotFoundError());

    const playerResult = await this.playerRepository.findByMatchAndUser(matchId, userId);
    if (!playerResult.success) return playerResult;
    if (!playerResult.value) return ok(undefined); // Not in match, no-op

    const removeResult = await this.playerRepository.remove(playerResult.value.id);
    if (!removeResult.success) return removeResult;

    // Recalculate match status (may go back to 'searching')
    await this.playerRepository.recalculateMatchStatus(matchId);
    return ok(undefined);
  }
}
