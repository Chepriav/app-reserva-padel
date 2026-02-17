import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { MatchNotifier } from '@domain/ports/repositories/MatchNotifier';
import { MatchNotFoundError, MatchPermissionError } from '@domain/errors/DomainErrors';

export class CancelMatch {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly notifier: MatchNotifier,
  ) {}

  async execute(matchId: string, creatorId: string): Promise<Result<void>> {
    const matchResult = await this.matchRepository.findById(matchId);
    if (!matchResult.success) return matchResult;

    const match = matchResult.value;
    if (!match) return fail(new MatchNotFoundError());
    if (match.creatorId !== creatorId) {
      return fail(new MatchPermissionError('Only the match creator can cancel the match'));
    }

    const cancelResult = await this.matchRepository.cancel(matchId);
    if (!cancelResult.success) return cancelResult;

    // Notify all confirmed players (fire-and-forget)
    const playerIds = match.players
      .filter((p) => p.status === 'confirmed' && p.userId && p.userId !== creatorId)
      .map((p) => p.userId!);

    if (playerIds.length > 0) {
      this.notifier.notifyMatchCancelled(playerIds, match.creatorName, matchId, match.isClass);
    }

    return ok(undefined);
  }
}
