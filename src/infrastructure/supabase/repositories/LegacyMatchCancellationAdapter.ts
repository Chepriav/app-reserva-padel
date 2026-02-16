import { ok } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { MatchCancellationPort } from '@domain/ports/repositories/MatchCancellationPort';

/**
 * Temporary adapter: wraps the legacy matchesService (not yet migrated).
 * Will be replaced in Phase 4 (Matches domain migration).
 */
export class LegacyMatchCancellationAdapter implements MatchCancellationPort {
  async cancelMatchByReservation(reservationId: string): Promise<Result<void>> {
    try {
      const { partidasService } = await import('../../../services/matchesService');
      await partidasService.cancelarPartidaPorReserva(reservationId, 'reserva_cancelada');
    } catch {
      // Non-critical — match cancellation failure should not block reservation flow
    }
    return ok(undefined);
  }
}
