import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import type { ReservationRepository } from '@domain/ports/repositories/ReservationRepository';
import type { BlockoutRepository } from '@domain/ports/repositories/BlockoutRepository';
import type { ScheduleConfigRepository } from '@domain/ports/repositories/ScheduleConfigRepository';
import type { AvailabilitySlot } from '@domain/entities/AvailabilitySlot';
import type { Reservation } from '@domain/entities/Reservation';
import type { ScheduleConfig } from '@domain/entities/ScheduleConfig';
import { DEFAULT_SCHEDULE_CONFIG } from '@domain/entities/ScheduleConfig';
import { CheckSlotInBreakTime } from './CheckSlotInBreakTime';
import { ApplyPriorityConversion } from './ApplyPriorityConversion';
import { GetActiveApartmentReservations } from './GetActiveApartmentReservations';
import { InfrastructureError } from '@domain/errors/DomainErrors';

/** Convert "HH:MM" to total minutes */
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const rangesOverlap = (s1: number, e1: number, s2: number, e2: number): boolean =>
  (s1 >= s2 && s1 < e2) || (e1 > s2 && e1 <= e2) || (s1 <= s2 && e1 >= e2);

/** Hours remaining from now until date+time */
const hoursUntil = (date: string, time: string): number => {
  const target = new Date(`${date}T${time}`);
  return (target.getTime() - Date.now()) / 3600000;
};

/**
 * Complex orchestrator: builds the availability slot grid for a court/date.
 *
 * Flow:
 * 1. Fetch reservations, blockouts, and schedule config in parallel
 * 2. Apply automatic P→G conversion per apartment
 * 3. Generate time slots using schedule config
 * 4. Overlay blockouts and reservations onto slots
 */
export class GetAvailability {
  private readonly checkBreakTime = new CheckSlotInBreakTime();
  private readonly applyConversion = new ApplyPriorityConversion();

  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly blockoutRepository: BlockoutRepository,
    private readonly scheduleConfigRepository: ScheduleConfigRepository,
    private readonly getActiveApartmentReservations: GetActiveApartmentReservations,
  ) {}

  async execute(courtId: string, date: string): Promise<Result<AvailabilitySlot[]>> {
    try {
      const [reservationsResult, blockoutsResult, configResult] = await Promise.all([
        this.reservationRepository.findByDateAndCourt(date, courtId),
        this.blockoutRepository.findByDateAndCourt(date, courtId),
        this.scheduleConfigRepository.getConfig(),
      ]);

      if (!reservationsResult.success) return reservationsResult;

      const blockouts = blockoutsResult.success ? blockoutsResult.value : [];
      const config: ScheduleConfig = configResult.success
        ? configResult.value
        : DEFAULT_SCHEDULE_CONFIG;

      let reservations = reservationsResult.value;

      // Apply P→G conversion per apartment
      const apartments = [...new Set(reservations.map((r) => r.apartment))];
      for (const apartment of apartments) {
        const activeResult = await this.getActiveApartmentReservations.execute(apartment);
        if (!activeResult.success) continue;

        const converted = this.applyConversion.execute(activeResult.value);

        // Apply conversion results to current slot reservations
        reservations = reservations.map((r) => {
          if (r.apartment !== apartment) return r;
          const updated = converted.find((c) => c.id === r.id);
          return updated ?? r;
        });
      }

      // Generate time slots
      const slots = this._generateSlots(date, config);

      // Build availability grid
      const slotDate = new Date(`${date}T00:00`);
      const availabilitySlots: AvailabilitySlot[] = slots.map(({ startTime, endTime }) => {
        const slotStartMin = timeToMinutes(startTime);
        const slotEndMin = timeToMinutes(endTime);

        // Check blockout overlap
        const blockoutConflict = blockouts.find((b) => {
          const bStart = timeToMinutes(b.startTime);
          const bEnd = timeToMinutes(b.endTime);
          return rangesOverlap(slotStartMin, slotEndMin, bStart, bEnd);
        });

        if (blockoutConflict) {
          return {
            startTime,
            endTime,
            available: false,
            blocked: true,
            blockoutId: blockoutConflict.id,
            blockoutReason: blockoutConflict.reason ?? 'Bloqueado por administración',
            existingReservation: null,
            priority: null,
            isDisplaceable: false,
            isProtected: true,
          };
        }

        // Check reservation conflict
        const reservationConflict = reservations.find((r) => {
          const rStart = timeToMinutes(r.startTime);
          const rEnd = timeToMinutes(r.endTime);
          return rangesOverlap(slotStartMin, slotEndMin, rStart, rEnd);
        });

        if (reservationConflict) {
          const hoursRemaining = hoursUntil(date, startTime);
          const isProtected = hoursRemaining < 24;
          const isDisplaceable =
            reservationConflict.priority === 'provisional' && !isProtected;

          return {
            startTime,
            endTime,
            available: false,
            blocked: false,
            blockoutId: null,
            blockoutReason: null,
            existingReservation: reservationConflict,
            priority: reservationConflict.priority,
            isDisplaceable,
            isProtected,
          };
        }

        return {
          startTime,
          endTime,
          available: true,
          blocked: false,
          blockoutId: null,
          blockoutReason: null,
          existingReservation: null,
          priority: null,
          isDisplaceable: false,
          isProtected: false,
        };
      });

      return ok(availabilitySlots);
    } catch (err) {
      return fail(new InfrastructureError('Error computing availability', err));
    }
  }

  private _generateSlots(date: string, config: ScheduleConfig): Array<{ startTime: string; endTime: string }> {
    const slotDate = new Date(`${date}T00:00`);
    const opening = timeToMinutes(config.openingTime);
    const closing = timeToMinutes(config.closingTime);
    const duration = 30; // 30-minute slots

    const slots: Array<{ startTime: string; endTime: string }> = [];
    let current = opening;

    while (current + duration <= closing) {
      const startTime = this._minutesToTime(current);
      const endTime = this._minutesToTime(current + duration);

      const inBreak = this.checkBreakTime.execute(
        { start: startTime, end: endTime },
        config,
        slotDate,
      );

      if (!inBreak) {
        slots.push({ startTime, endTime });
      }

      current += duration;
    }

    return slots;
  }

  private _minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
