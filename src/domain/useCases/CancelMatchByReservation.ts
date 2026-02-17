import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { MatchNotifier } from '@domain/ports/repositories/MatchNotifier';
import { InfrastructureError } from '@domain/errors/DomainErrors';

export type CancelMatchByReservationResult = {
  hadMatch: boolean;
  matchId?: string;
};

export class CancelMatchByReservation {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly notifier: MatchNotifier,
  ) {}

  async execute(
    reservationId: string,
    reason: 'reserva_cancelada' | 'reserva_desplazada' = 'reserva_cancelada',
  ): Promise<Result<CancelMatchByReservationResult>> {
    const result = await this.matchRepository.cancelByReservationId(reservationId);
    if (!result.success) return result;

    if (!result.value) return ok({ hadMatch: false });

    const { matchId, match } = result.value;

    // Notify all players (fire-and-forget)
    const allPlayerIds = [
      match.creatorId,
      ...match.players
        .filter((p) => p.userId && p.userId !== match.creatorId)
        .map((p) => p.userId!),
    ];

    this.notifier.notifyMatchCancelledByReservation(
      allPlayerIds,
      match.creatorName,
      match.date,
      match.startTime,
      match.isClass,
      reason,
    );

    return ok({ hadMatch: true, matchId });
  }
}
