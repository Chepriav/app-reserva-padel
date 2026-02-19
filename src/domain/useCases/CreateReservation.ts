import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { ReservationRepository } from '@domain/ports/repositories/ReservationRepository';
import type { CreateReservationData, Reservation } from '@domain/entities/Reservation';
import {
  ReservationLimitExceededError,
  ReservationSlotUnavailableError,
  ReservationTooEarlyError,
  ReservationTooFarAheadError,
  DisplacementRequiredError,
  RpcNotFoundError,
} from '@domain/errors/DomainErrors';
import { GetAvailability } from './GetAvailability';
import { GetActiveApartmentReservations } from './GetActiveApartmentReservations';
import { DetermineReservationPriority } from './DetermineReservationPriority';
import { DisplaceReservation } from './DisplaceReservation';

const RESERVATION_LIMITS = {
  MIN_HOURS_ADVANCE: 0,
  MAX_DAYS_ADVANCE: 7,
  MAX_ACTIVE_RESERVATIONS: 1,
};

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const hoursUntil = (date: string, time: string): number =>
  (new Date(`${date}T${time}`).getTime() - Date.now()) / 3600000;

/**
 * Complex orchestrator: creates a reservation with all business validations.
 *
 * Flow:
 * 1. Try RPC (crear_reserva_con_prioridad) first — handles priority automatically
 * 2. If RPC unavailable (RpcNotFoundError), use fallback manual flow:
 *    a. Validate timing constraints
 *    b. Get availability and find slot conflicts
 *    c. If displaceable conflict exists → return DisplacementRequiredError (needs confirmation)
 *    d. If forceDisplacement=true → displace all provisional reservations
 *    e. Determine priority and insert
 */
export class CreateReservation {
  private readonly determinePriority = new DetermineReservationPriority();

  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly getAvailability: GetAvailability,
    private readonly getActiveReservations: GetActiveApartmentReservations,
    private readonly displaceReservation: DisplaceReservation,
  ) {}

  async execute(data: CreateReservationData): Promise<Result<Reservation>> {
    // Try RPC-based creation first (unless forced displacement, which bypasses RPC)
    if (!data.forceDisplacement) {
      const rpcResult = await this.reservationRepository.createWithRpc(data);
      if (rpcResult.success) return rpcResult;
      if (!(rpcResult.error instanceof RpcNotFoundError)) return rpcResult;
      // RPC not found — fall through to manual flow
    }

    return this._manualCreate(data);
  }

  private async _manualCreate(data: CreateReservationData): Promise<Result<Reservation>> {
    if (!data.apartment) {
      return fail(new ReservationSlotUnavailableError('Apartment is required to create reservations'));
    }

    // Timing validations
    const hoursAhead = hoursUntil(data.date, data.startTime);

    if (hoursAhead < RESERVATION_LIMITS.MIN_HOURS_ADVANCE) {
      return fail(
        new ReservationTooEarlyError(
          `Reservations must be made at least ${RESERVATION_LIMITS.MIN_HOURS_ADVANCE} hours in advance`,
        ),
      );
    }

    if (hoursAhead / 24 > RESERVATION_LIMITS.MAX_DAYS_ADVANCE) {
      return fail(
        new ReservationTooFarAheadError(
          `Cannot book more than ${RESERVATION_LIMITS.MAX_DAYS_ADVANCE} days in advance`,
        ),
      );
    }

    // Get availability to find slot conflicts
    const availabilityResult = await this.getAvailability.execute(data.courtId, data.date);
    if (!availabilityResult.success) return availabilityResult;

    const slots = availabilityResult.value;
    const startMin = timeToMinutes(data.startTime);
    const endMin = timeToMinutes(data.endTime);

    // Find all slots in the requested range
    const targetSlots = slots.filter((s) => {
      const sMin = timeToMinutes(s.startTime);
      return sMin >= startMin && sMin < endMin;
    });

    // Phase 1: Validate slots and collect unique reservations to displace
    const toDisplace = new Map<string, Reservation>();

    for (const slot of targetSlots) {
      if (slot.available) continue;

      if (!slot.isDisplaceable) {
        return fail(
          new ReservationSlotUnavailableError(
            `Slot ${slot.startTime} is unavailable (guaranteed reservation)`,
          ),
        );
      }

      if (slot.existingReservation?.apartment === data.apartment) {
        return fail(
          new ReservationSlotUnavailableError('Your apartment already has a reservation at this time'),
        );
      }

      if (slot.existingReservation && !toDisplace.has(slot.existingReservation.id)) {
        toDisplace.set(slot.existingReservation.id, slot.existingReservation);
      }

      // If displacement not confirmed yet, request confirmation
      if (!data.forceDisplacement && slot.existingReservation) {
        return fail(new DisplacementRequiredError(slot.existingReservation));
      }
    }

    // Phase 2: Execute displacements
    if (data.forceDisplacement && toDisplace.size > 0) {
      for (const [, reservation] of toDisplace) {
        const result = await this.displaceReservation.execute(reservation, data.apartment);
        if (!result.success) return result;
      }
    }

    // Determine priority
    let priority: 'guaranteed' | 'provisional';
    if (data.forceDisplacement) {
      priority = 'guaranteed'; // Displacement always results in guaranteed
    } else {
      const activeResult = await this.getActiveReservations.execute(data.apartment);
      if (!activeResult.success) return activeResult;

      const determined = this.determinePolicy(activeResult.value);
      if (determined === null) {
        return fail(
          new ReservationLimitExceededError(
            `Apartment already has ${RESERVATION_LIMITS.MAX_ACTIVE_RESERVATIONS} active reservation(s)`,
          ),
        );
      }
      priority = determined;
    }

    // Check for same-slot conflict from own apartment
    const activeResult = await this.getActiveReservations.execute(data.apartment);
    if (activeResult.success) {
      const conflict = activeResult.value.find(
        (r) => r.date === data.date && r.startTime === data.startTime,
      );
      if (conflict) {
        return fail(new ReservationSlotUnavailableError('Your apartment already has a reservation at this time'));
      }
    }

    // Insert reservation
    return this.reservationRepository.create({ ...data });
  }

  private determinePolicy(
    reservations: Reservation[],
  ): 'guaranteed' | 'provisional' | null {
    return this.determinePriority.execute(reservations);
  }
}
