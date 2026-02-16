import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { ReservationRepository } from '@domain/ports/repositories/ReservationRepository';
import type { MatchCancellationPort } from '@domain/ports/repositories/MatchCancellationPort';
import {
  ReservationNotFoundError,
  ReservationAlreadyCancelledError,
  ReservationPermissionError,
} from '@domain/errors/DomainErrors';

export class CancelReservation {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly matchCancellation: MatchCancellationPort,
  ) {}

  /**
   * @param apartment - When provided, validates by apartment (any apartment member can cancel).
   *                    When not provided, validates by userId (backwards-compatible).
   */
  async execute(
    reservationId: string,
    userId: string,
    apartment?: string,
  ): Promise<Result<void>> {
    const findResult = await this.reservationRepository.findById(reservationId);
    if (!findResult.success) return findResult;

    const reservation = findResult.value;
    if (!reservation) return fail(new ReservationNotFoundError());

    // Permission check
    if (apartment) {
      if (reservation.apartment !== apartment) {
        return fail(new ReservationPermissionError('Can only cancel reservations from your own apartment'));
      }
    } else if (reservation.userId !== userId) {
      return fail(new ReservationPermissionError('Can only cancel your own reservations'));
    }

    if (reservation.status !== 'confirmed') {
      return fail(new ReservationAlreadyCancelledError());
    }

    const cancelResult = await this.reservationRepository.cancel(reservationId);
    if (!cancelResult.success) return cancelResult;

    // Cancel linked match (fire-and-forget)
    this.matchCancellation.cancelMatchByReservation(reservationId);

    return ok(undefined);
  }
}
