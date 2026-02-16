import type { Result } from '@shared/types/Result';
import { ok } from '@shared/types/Result';
import type { ReservationRepository } from '@domain/ports/repositories/ReservationRepository';
import type { Reservation } from '@domain/entities/Reservation';

/**
 * Returns future confirmed reservations for an apartment.
 * Used by GetAvailability and CreateReservation to assess priority.
 */
export class GetActiveApartmentReservations {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async execute(apartment: string): Promise<Result<Reservation[]>> {
    const result = await this.reservationRepository.findByApartment(apartment);
    if (!result.success) return result;

    const now = new Date();
    const active = result.value.filter((r) => {
      if (r.status !== 'confirmed') return false;
      const reservationDate = new Date(`${r.date}T${r.startTime}`);
      return reservationDate > now;
    });

    return ok(active);
  }
}
