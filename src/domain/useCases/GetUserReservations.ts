import type { Result } from '@shared/types/Result';
import type { ReservationRepository } from '@domain/ports/repositories/ReservationRepository';
import type { Reservation } from '@domain/entities/Reservation';

export class GetUserReservations {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  execute(userId: string): Promise<Result<Reservation[]>> {
    return this.reservationRepository.findByUserId(userId);
  }
}
