import type { Result } from '@shared/types/Result';
import type { ReservationRepository } from '@domain/ports/repositories/ReservationRepository';
import type { ConversionInfo } from '@domain/entities/Reservation';

export class GetConversionInfo {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  execute(reservationId: string): Promise<Result<ConversionInfo | null>> {
    return this.reservationRepository.getConversionInfo(reservationId);
  }
}
