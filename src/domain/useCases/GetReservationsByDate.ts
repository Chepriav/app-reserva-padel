import type { Result } from '@shared/types/Result';
import type { ReservationRepository } from '@domain/ports/repositories/ReservationRepository';
import type { Reservation } from '@domain/entities/Reservation';

export class GetReservationsByDate {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  execute(date: string): Promise<Result<Reservation[]>> {
    return this.reservationRepository.findByDate(date);
  }
}
