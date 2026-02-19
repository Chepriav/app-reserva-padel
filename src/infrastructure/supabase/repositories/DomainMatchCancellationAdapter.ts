import { ok } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { MatchCancellationPort } from '@domain/ports/repositories/MatchCancellationPort';
import type { CancelMatchByReservation } from '@domain/useCases/CancelMatchByReservation';

/**
 * Implements MatchCancellationPort using the domain CancelMatchByReservation use case.
 * Replaces LegacyMatchCancellationAdapter after Phase 4 match domain migration.
 */
export class DomainMatchCancellationAdapter implements MatchCancellationPort {
  constructor(private readonly cancelMatchByReservationUseCase: CancelMatchByReservation) {}

  async cancelMatchByReservation(reservationId: string): Promise<Result<void>> {
    // Fire-and-forget: errors are ignored so reservation cancellation proceeds
    try {
      await this.cancelMatchByReservationUseCase.execute(reservationId, 'reserva_cancelada');
    } catch {
      // Non-critical: ignore errors
    }
    return ok(undefined);
  }
}
