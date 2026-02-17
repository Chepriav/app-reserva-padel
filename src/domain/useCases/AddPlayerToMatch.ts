import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { PlayerRepository } from '@domain/ports/repositories/PlayerRepository';
import type { MatchNotifier } from '@domain/ports/repositories/MatchNotifier';
import type { AddPlayerData, Player } from '@domain/entities/Match';
import { MatchNotFoundError, MatchPermissionError, MatchFullError } from '@domain/errors/DomainErrors';

export class AddPlayerToMatch {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly playerRepository: PlayerRepository,
    private readonly notifier: MatchNotifier,
  ) {}

  async execute(matchId: string, creatorId: string, playerData: AddPlayerData): Promise<Result<Player>> {
    const matchResult = await this.matchRepository.findById(matchId);
    if (!matchResult.success) return matchResult;

    const match = matchResult.value;
    if (!match) return fail(new MatchNotFoundError());
    if (match.creatorId !== creatorId) {
      return fail(new MatchPermissionError('Only the match creator can add players'));
    }

    const confirmed = match.players.filter((p) => p.status === 'confirmed').length;
    if (confirmed >= match.maxParticipants) return fail(new MatchFullError());

    const addResult = await this.playerRepository.add(matchId, playerData, 'confirmed');
    if (!addResult.success) return addResult;

    // Schedule reminders for the new player (fire-and-forget, non-external only)
    if (playerData.userId && !playerData.isExternal) {
      this.notifier.scheduleReminders(playerData.userId, {
        id: match.id,
        date: match.date,
        startTime: match.startTime,
        courtName: match.courtName,
      });
    }

    // Update match status if now full
    const newConfirmed = confirmed + 1;
    if (newConfirmed >= match.maxParticipants) {
      await this.matchRepository.update(matchId, {}); // triggers re-fetch
    }

    return addResult;
  }
}
