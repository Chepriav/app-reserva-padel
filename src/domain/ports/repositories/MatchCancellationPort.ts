import type { Result } from '@shared/types/Result';

export interface MatchCancellationPort {
  cancelMatchByReservation(
    reservationId: string,
    options?: {
      reason?: 'reserva_cancelada' | 'reserva_desplazada';
      /** User who triggered the cancellation: not notified about their own action */
      excludeUserId?: string;
    },
  ): Promise<Result<void>>;
}
