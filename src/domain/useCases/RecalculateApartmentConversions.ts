import type { Result } from '@shared/types/Result';
import type { ReservationRepository } from '@domain/ports/repositories/ReservationRepository';

export class RecalculateApartmentConversions {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  execute(apartment: string): Promise<Result<void>> {
    return this.reservationRepository.recalculateConversions(apartment);
  }
}
