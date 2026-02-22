import { DetermineReservationPriority } from '../../src/domain/useCases/DetermineReservationPriority';
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

describe('DetermineReservationPriority', () => {
  const useCase = new DetermineReservationPriority();

  it('returns "guaranteed" when there are no existing reservations', () => {
    expect(useCase.execute([])).toBe('guaranteed');
  });

  it('returns "provisional" when there is 1 active reservation', () => {
    const reservations = [makeReservation()];
    expect(useCase.execute(reservations)).toBe('provisional');
  });

  it('returns null when there are 2 active reservations (limit exceeded)', () => {
    const reservations = [
      makeReservation({ id: 'r-1' }),
      makeReservation({ id: 'r-2' }),
    ];
    expect(useCase.execute(reservations)).toBeNull();
  });

  it('returns null when there are 3 or more active reservations', () => {
    const reservations = [
      makeReservation({ id: 'r-1' }),
      makeReservation({ id: 'r-2' }),
      makeReservation({ id: 'r-3' }),
    ];
    expect(useCase.execute(reservations)).toBeNull();
  });

  it('ignores cancelled reservations when counting', () => {
    const reservations = [
      makeReservation({ id: 'r-1', status: 'cancelled' }),
      makeReservation({ id: 'r-2', status: 'cancelled' }),
    ];
    // 0 active → guaranteed
    expect(useCase.execute(reservations)).toBe('guaranteed');
  });

  it('counts only confirmed reservations (cancelled ignored)', () => {
    const reservations = [
      makeReservation({ id: 'r-1', status: 'confirmed' }),
      makeReservation({ id: 'r-2', status: 'cancelled' }),
    ];
    // 1 active → provisional
    expect(useCase.execute(reservations)).toBe('provisional');
  });
});
