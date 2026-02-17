import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { MatchNotifier } from '@domain/ports/repositories/MatchNotifier';
import { MatchNotFoundError, MatchPermissionError } from '@domain/errors/DomainErrors';

export class CloseClass {
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
      return fail(new MatchPermissionError('Only the class creator can close it'));
    }

    const closeResult = await this.matchRepository.close(matchId);
    if (!closeResult.success) return closeResult;

    // Notify all confirmed players (fire-and-forget)
    const playerIds = [
      match.creatorId,
      ...match.players
        .filter((p) => p.status === 'confirmed' && p.userId)
        .map((p) => p.userId!),
    ];
    this.notifier.notifyMatchFull(playerIds, match.creatorName, matchId, true);

    return ok(undefined);
  }
}
