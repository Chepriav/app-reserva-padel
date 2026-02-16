import type { Reservation, ReservationPriority } from '@domain/entities/Reservation';

/**
 * Pure use case: determines the priority for a new reservation based on
 * the apartment's existing active (confirmed) reservations.
 *
 * Rules:
 * - 0 active reservations → 'guaranteed'
 * - 1 active reservation → 'provisional'
 * - 2+ active reservations → null (limit exceeded, should not be created)
 */
export class DetermineReservationPriority {
  execute(existingReservations: Reservation[]): ReservationPriority | null {
    const active = existingReservations.filter((r) => r.status === 'confirmed');

    if (active.length === 0) return 'guaranteed';
    if (active.length === 1) return 'provisional';
    return null;
  }
}
