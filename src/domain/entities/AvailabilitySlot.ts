import type { ReservationPriority, Reservation } from './Reservation';

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
  blocked: boolean;
  blockoutId: string | null;
  blockoutReason: string | null;
  existingReservation: Reservation | null;
  priority: ReservationPriority | null;
  isDisplaceable: boolean;
  isProtected: boolean;
}
