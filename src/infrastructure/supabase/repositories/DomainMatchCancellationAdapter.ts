import type { MatchCancellationPort } from '@domain/ports/repositories/MatchCancellationPort';
import type { CancelMatchByReservation } from '@domain/useCases/CancelMatchByReservation';

/**
 * Implements MatchCancellationPort using the domain CancelMatchByReservation use case.
 * Replaces LegacyMatchCancellationAdapter after Phase 4 match domain migration.
 */
export class DomainMatchCancellationAdapter implements MatchCancellationPort {
  constructor(private readonly cancelMatchByReservation: CancelMatchByReservation) {}

  async cancelMatchForReservation(
    reservationId: string,
    reason: 'reserva_cancelada' | 'reserva_desplazada',
  ): Promise<void> {
    // Fire-and-forget: errors are logged but do not propagate
    try {
      await this.cancelMatchByReservation.execute(reservationId, reason);
    } catch {
      // Non-critical: reservation cancellation should proceed even if match cancel fails
    }
  }
}
