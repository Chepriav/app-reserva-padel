import type { AvailabilitySlot } from '@domain/entities/AvailabilitySlot';
import { toLegacyFormat as reservationToLegacy } from './reservationMapper';

export function toLegacyFormat(slot: AvailabilitySlot): Record<string, unknown> {
  return {
    startTime: slot.startTime,
    endTime: slot.endTime,
    available: slot.available,
    blocked: slot.blocked,
    blockoutId: slot.blockoutId,
    blockoutReason: slot.blockoutReason,
    existingReservation: slot.existingReservation
      ? reservationToLegacy(slot.existingReservation)
      : null,
    priority: slot.priority ?? null,
    isDisplaceable: slot.isDisplaceable,
    isProtected: slot.isProtected,
  };
}
