import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { PlayerRepository } from '@domain/ports/repositories/PlayerRepository';
import type { MatchNotifier } from '@domain/ports/repositories/MatchNotifier';
import { MatchNotFoundError, MatchPermissionError } from '@domain/errors/DomainErrors';

export class AcceptRequest {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly playerRepository: PlayerRepository,
    private readonly notifier: MatchNotifier,
  ) {}

  async execute(playerId: string, matchId: string, requesterId: string): Promise<Result<void>> {
    const matchResult = await this.matchRepository.findById(matchId);
    if (!matchResult.success) return matchResult;

    const match = matchResult.value;
    if (!match) return fail(new MatchNotFoundError());
    if (match.creatorId !== requesterId) {
      return fail(new MatchPermissionError('Only the match creator can accept requests'));
    }

    const updateResult = await this.playerRepository.updateStatus(playerId, 'confirmed');
    if (!updateResult.success) return updateResult;

    const player = updateResult.value;

    // Notify accepted player (fire-and-forget)
    if (player.userId) {
      this.notifier.notifyRequestAccepted(player.userId, match.creatorName, matchId, match.isClass);
      this.notifier.scheduleReminders(player.userId, {
        id: match.id,
        date: match.date,
        startTime: match.startTime,
        courtName: match.courtName,
      });
    }

    // Re-fetch to check if now full
    const refreshed = await this.matchRepository.findById(matchId);
    if (refreshed.success && refreshed.value) {
      const confirmedCount = refreshed.value.players.filter((p) => p.status === 'confirmed').length;
      if (confirmedCount >= refreshed.value.maxParticipants) {
        const playerIds = refreshed.value.players
          .filter((p) => p.status === 'confirmed' && p.userId)
          .map((p) => p.userId!);
        this.notifier.notifyMatchFull(playerIds, match.creatorName, matchId, match.isClass);
      }
    }

    return ok(undefined);
  }
}
