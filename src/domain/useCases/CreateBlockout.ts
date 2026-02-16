import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { BlockoutRepository } from '@domain/ports/repositories/BlockoutRepository';
import type { Blockout, CreateBlockoutData } from '@domain/entities/Blockout';
import type { DisplacementNotifier } from '@domain/ports/repositories/DisplacementNotifier';
import { InfrastructureError } from '@domain/errors/DomainErrors';
import { GetAvailability } from './GetAvailability';
import { CancelReservation } from './CancelReservation';

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Complex orchestrator: creates an admin schedule blockout.
 *
 * 1. Fetch current availability to find conflicting confirmed reservations
 * 2. Cancel each conflicting reservation
 * 3. Notify each displaced apartment (fire-and-forget)
 * 4. Insert the blockout record
 */
export class CreateBlockout {
  constructor(
    private readonly blockoutRepository: BlockoutRepository,
    private readonly getAvailability: GetAvailability,
    private readonly cancelReservation: CancelReservation,
    private readonly notifier: DisplacementNotifier,
  ) {}

  async execute(data: CreateBlockoutData): Promise<Result<Blockout>> {
    try {
      // Find conflicting reservations via availability
      const availabilityResult = await this.getAvailability.execute(data.courtId, data.date);
      if (availabilityResult.success) {
        const blockoutStartMin = timeToMinutes(data.startTime);
        const blockoutEndMin = timeToMinutes(data.endTime);

        const conflictingSlots = availabilityResult.value.filter((slot) => {
          if (slot.available || slot.blocked) return false;
          const sMin = timeToMinutes(slot.startTime);
          return sMin >= blockoutStartMin && sMin < blockoutEndMin;
        });

        // Deduplicate by reservation id before cancelling
        const toCancel = new Map<string, { userId: string; reservation: NonNullable<typeof conflictingSlots[number]['existingReservation']> }>();
        for (const slot of conflictingSlots) {
          const r = slot.existingReservation;
          if (r && !toCancel.has(r.id)) {
            toCancel.set(r.id, { userId: r.userId, reservation: r });
          }
        }

        for (const [, { userId, reservation }] of toCancel) {
          await this.cancelReservation.execute(reservation.id, userId);

          // Notify displaced apartment (fire-and-forget)
          this.notifier.notifyApartmentBlockoutCancellation(
            reservation.apartment,
            reservation.date,
            reservation.startTime,
            reservation.endTime,
            reservation.courtName,
          );
        }
      }

      return this.blockoutRepository.create(data);
    } catch (err) {
      return fail(new InfrastructureError('Error creating blockout', err));
    }
  }
}
