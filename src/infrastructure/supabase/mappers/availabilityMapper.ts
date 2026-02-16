import type { AvailabilitySlot } from '@domain/entities/AvailabilitySlot';
import { toLegacyFormat as reservationToLegacy } from './reservationMapper';
import { priorityToDb } from './reservationMapper';

export function toLegacyFormat(slot: AvailabilitySlot): Record<string, unknown> {
  return {
    horaInicio: slot.startTime,
    horaFin: slot.endTime,
    disponible: slot.available,
    bloqueado: slot.blocked,
    bloqueoId: slot.blockoutId,
    motivoBloqueo: slot.blockoutReason,
    reservaExistente: slot.existingReservation
      ? reservationToLegacy(slot.existingReservation)
      : null,
    prioridad: slot.priority ? priorityToDb(slot.priority) : null,
    esDesplazable: slot.isDisplaceable,
    estaProtegida: slot.isProtected,
  };
}
