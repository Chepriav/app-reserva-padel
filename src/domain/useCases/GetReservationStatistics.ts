import type { Result } from '@shared/types/Result';
import type { ReservationRepository } from '@domain/ports/repositories/ReservationRepository';
import type { ReservationStatistics } from '@domain/entities/Reservation';

export class GetReservationStatistics {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  execute(): Promise<Result<ReservationStatistics>> {
    return this.reservationRepository.getStatistics();
  }
}
