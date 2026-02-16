import type { Result } from '@shared/types/Result';

export interface MatchCancellationPort {
  cancelMatchByReservation(reservationId: string): Promise<Result<void>>;
}
