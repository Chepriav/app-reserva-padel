import type { Result } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { MatchNotifier } from '@domain/ports/repositories/MatchNotifier';
import type { Match, CreateMatchData } from '@domain/entities/Match';

export class CreateMatch {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly notifier: MatchNotifier,
  ) {}

  async execute(data: CreateMatchData): Promise<Result<Match>> {
    const result = await this.matchRepository.create(data);
    if (!result.success) return result;

    const match = result.value;

    // Schedule reminders for creator (fire-and-forget)
    this.notifier.scheduleReminders(match.creatorId, {
      id: match.id,
      date: match.date,
      startTime: match.startTime,
      courtName: match.courtName,
    });

    // Schedule reminders for initial players (fire-and-forget)
    for (const player of match.players) {
      if (player.userId && !player.isExternal) {
        this.notifier.scheduleReminders(player.userId, {
          id: match.id,
          date: match.date,
          startTime: match.startTime,
          courtName: match.courtName,
        });
      }
    }

    return result;
  }
}
