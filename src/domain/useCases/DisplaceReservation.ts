import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { ReservationRepository } from '@domain/ports/repositories/ReservationRepository';
import type { DisplacementNotificationRepository } from '@domain/ports/repositories/DisplacementNotificationRepository';
import type { DisplacementNotifier } from '@domain/ports/repositories/DisplacementNotifier';
import type { MatchCancellationPort } from '@domain/ports/repositories/MatchCancellationPort';
import type { Reservation } from '@domain/entities/Reservation';
import { DisplacementFailedError } from '@domain/errors/DomainErrors';

/**
 * Cancels a provisional reservation and notifies the affected apartment.
 * Used as a sub-step inside CreateReservation when forceDisplacement is true.
 */
export class DisplaceReservation {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly notificationRepository: DisplacementNotificationRepository,
    private readonly notifier: DisplacementNotifier,
    private readonly matchCancellation: MatchCancellationPort,
  ) {}

  async execute(
    reservationToDisplace: Reservation,
    displacingApartment: string,
  ): Promise<Result<void>> {
    // 1. Cancel the reservation
    const cancelResult = await this.reservationRepository.cancel(reservationToDisplace.id);
    if (!cancelResult.success) {
      return fail(
        new DisplacementFailedError(
          'Could not cancel displaced reservation',
          cancelResult.error,
        ),
      );
    }

    // 2. Create displacement notification record
    await this.notificationRepository.create(reservationToDisplace.userId, {
      reservationDate: reservationToDisplace.date,
      startTime: reservationToDisplace.startTime,
      endTime: reservationToDisplace.endTime,
      courtName: reservationToDisplace.courtName,
      displacedByApartment: displacingApartment,
    });

    // 3. Send push notification (fire-and-forget)
    this.notifier.notifyApartmentDisplacement(
      reservationToDisplace.apartment,
      reservationToDisplace.date,
      reservationToDisplace.startTime,
      reservationToDisplace.endTime,
      reservationToDisplace.courtName,
      displacingApartment,
    );

    // 4. Cancel linked match (fire-and-forget)
    this.matchCancellation.cancelMatchByReservation(reservationToDisplace.id);

    return ok(undefined);
  }
}
