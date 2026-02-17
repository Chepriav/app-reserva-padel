import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { PlayerRepository } from '@domain/ports/repositories/PlayerRepository';
import type { MatchNotifier } from '@domain/ports/repositories/MatchNotifier';
import type { AddPlayerData } from '@domain/entities/Match';
import {
  MatchNotFoundError,
  MatchAlreadyCancelledError,
  MatchFullError,
  PlayerAlreadyJoinedError,
} from '@domain/errors/DomainErrors';

export class RequestToJoin {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly playerRepository: PlayerRepository,
    private readonly notifier: MatchNotifier,
  ) {}

  async execute(matchId: string, playerData: AddPlayerData): Promise<Result<void>> {
    const matchResult = await this.matchRepository.findById(matchId);
    if (!matchResult.success) return matchResult;

    const match = matchResult.value;
    if (!match) return fail(new MatchNotFoundError());
    if (match.status === 'cancelled') return fail(new MatchAlreadyCancelledError());
    if (match.status === 'full') return fail(new MatchFullError());

    // Check if already joined
    if (playerData.userId) {
      const existing = await this.playerRepository.findByMatchAndUser(matchId, playerData.userId);
      if (existing.success && existing.value) return fail(new PlayerAlreadyJoinedError());
    }

    const addResult = await this.playerRepository.add(matchId, playerData, 'pending');
    if (!addResult.success) return addResult;

    // Notify creator (fire-and-forget)
    this.notifier.notifyJoinRequest(
      match.creatorId,
      playerData.userName,
      matchId,
      match.isClass,
    );

    return ok(undefined);
  }
}
