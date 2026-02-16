import type { Reservation } from '@domain/entities/Reservation';

/**
 * Pure use case: applies P→G (Provisional → Guaranteed) auto-conversion algorithm
 * for a set of apartment reservations on a given date/court context.
 *
 * Rules:
 * - 1 future confirmed reservation → guaranteed
 * - 2+ future confirmed reservations with no guaranteed → earliest becomes guaranteed
 * - Already-guaranteed reservations remain guaranteed
 */
export class ApplyPriorityConversion {
  execute(reservations: Reservation[]): Reservation[] {
    const future = reservations.filter(
      (r) => r.status === 'confirmed',
    );

    if (future.length === 0) return reservations;

    const hasGuaranteed = future.some((r) => r.priority === 'guaranteed');

    if (hasGuaranteed) {
      return reservations;
    }

    // Find earliest reservation by date + startTime
    const earliest = future.reduce((a, b) => {
      const aKey = `${a.date}T${a.startTime}`;
      const bKey = `${b.date}T${b.startTime}`;
      return aKey <= bKey ? a : b;
    });

    return reservations.map((r) =>
      r.id === earliest.id
        ? { ...r, priority: 'guaranteed' as const }
        : r,
    );
  }
}
