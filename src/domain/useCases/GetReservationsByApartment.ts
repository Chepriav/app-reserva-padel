import type { Result } from '@shared/types/Result';
import type { ReservationRepository } from '@domain/ports/repositories/ReservationRepository';
import type { Reservation } from '@domain/entities/Reservation';

export class GetReservationsByApartment {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  execute(apartment: string): Promise<Result<Reservation[]>> {
    return this.reservationRepository.findByApartment(apartment);
  }
}
