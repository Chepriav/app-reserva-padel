import type { Result } from '@shared/types/Result';
import type { ReservationRepository } from '@domain/ports/repositories/ReservationRepository';
import type { Reservation } from '@domain/entities/Reservation';

export class GetAllReservations {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  execute(): Promise<Result<Reservation[]>> {
    return this.reservationRepository.findAll();
  }
}
