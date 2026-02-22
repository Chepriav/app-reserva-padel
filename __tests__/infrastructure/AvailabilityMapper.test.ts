import { toLegacyFormat } from '../../src/infrastructure/supabase/mappers/availabilityMapper';
import type { AvailabilitySlot } from '../../src/domain/entities/AvailabilitySlot';
import type { Reservation } from '../../src/domain/entities/Reservation';

const makeReservation = (overrides?: Partial<Reservation>): Reservation => ({
  id: 'r-1',
  courtId: 'court-1',
  courtName: 'Pista 1',
  userId: 'user-1',
  userName: 'Test User',
  apartment: '1-3-B',
  date: '2025-12-01',
  startTime: '10:00',
  endTime: '10:30',
  duration: 30,
  status: 'confirmed',
  priority: 'guaranteed',
  players: [],
  conversionTimestamp: null,
  conversionRule: null,
  convertedAt: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

const freeSlot: AvailabilitySlot = {
  startTime: '10:00',
  endTime: '10:30',
  available: true,
  blocked: false,
  blockoutId: null,
  blockoutReason: null,
  existingReservation: null,
  priority: null,
  isDisplaceable: false,
  isProtected: false,
};

describe('availabilityMapper — toLegacyFormat', () => {
  it('maps a free slot with no existing reservation', () => {
    const legacy = toLegacyFormat(freeSlot);
    expect(legacy.startTime).toBe('10:00');
    expect(legacy.endTime).toBe('10:30');
    expect(legacy.available).toBe(true);
    expect(legacy.blocked).toBe(false);
    expect(legacy.blockoutId).toBeNull();
    expect(legacy.blockoutReason).toBeNull();
    expect(legacy.existingReservation).toBeNull();
    expect(legacy.priority).toBeNull();
    expect(legacy.isDisplaceable).toBe(false);
    expect(legacy.isProtected).toBe(false);
  });

  it('maps a taken slot with an existing reservation', () => {
    const reservation = makeReservation();
    const slot: AvailabilitySlot = {
      ...freeSlot,
      available: false,
      existingReservation: reservation,
      priority: 'guaranteed',
      isDisplaceable: false,
      isProtected: true,
    };
    const legacy = toLegacyFormat(slot);
    expect(legacy.available).toBe(false);
    expect(legacy.priority).toBe('guaranteed');
    expect(legacy.isProtected).toBe(true);
    expect(legacy.existingReservation).not.toBeNull();
    const r = legacy.existingReservation as Record<string, unknown>;
    expect(r.id).toBe('r-1');
    expect(r.apartment).toBe('1-3-B');
    expect(r.status).toBe('confirmed');
  });

  it('maps a blocked slot', () => {
    const slot: AvailabilitySlot = {
      ...freeSlot,
      available: false,
      blocked: true,
      blockoutId: 'b-99',
      blockoutReason: 'Mantenimiento',
    };
    const legacy = toLegacyFormat(slot);
    expect(legacy.blocked).toBe(true);
    expect(legacy.blockoutId).toBe('b-99');
    expect(legacy.blockoutReason).toBe('Mantenimiento');
  });

  it('maps a displaceable provisional reservation slot', () => {
    const slot: AvailabilitySlot = {
      ...freeSlot,
      available: false,
      existingReservation: makeReservation({ priority: 'provisional' }),
      priority: 'provisional',
      isDisplaceable: true,
      isProtected: false,
    };
    const legacy = toLegacyFormat(slot);
    expect(legacy.isDisplaceable).toBe(true);
    expect(legacy.isProtected).toBe(false);
    expect(legacy.priority).toBe('provisional');
  });
});
