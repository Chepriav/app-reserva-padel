import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { PlayerRepository } from '@domain/ports/repositories/PlayerRepository';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import { MatchNotFoundError, MatchPermissionError } from '@domain/errors/DomainErrors';

export class RejectRequest {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly playerRepository: PlayerRepository,
  ) {}

  async execute(playerId: string, matchId: string, requesterId: string): Promise<Result<void>> {
    const matchResult = await this.matchRepository.findById(matchId);
    if (!matchResult.success) return matchResult;

    const match = matchResult.value;
    if (!match) return fail(new MatchNotFoundError());
    if (match.creatorId !== requesterId) {
      return fail(new MatchPermissionError('Only the match creator can reject requests'));
    }

    await this.playerRepository.remove(playerId);
    return ok(undefined);
  }
}
