import { GetAvailability } from '../../src/domain/useCases/GetAvailability';
import { GetActiveApartmentReservations } from '../../src/domain/useCases/GetActiveApartmentReservations';
import type { ReservationRepository } from '../../src/domain/ports/repositories/ReservationRepository';
import type { BlockoutRepository } from '../../src/domain/ports/repositories/BlockoutRepository';
import type { ScheduleConfigRepository } from '../../src/domain/ports/repositories/ScheduleConfigRepository';
import type { Reservation } from '../../src/domain/entities/Reservation';
import { DEFAULT_SCHEDULE_CONFIG } from '../../src/domain/entities/ScheduleConfig';
import { ok } from '../../src/shared/types/Result';

const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const makeReservation = (overrides?: Partial<Reservation>): Reservation => ({
  id: 'r-1',
  courtId: 'court-1',
  courtName: 'Pista 1',
  userId: 'user-1',
  userName: 'Vecino',
  apartment: '1-1-A',
  date: futureDate,
  startTime: '10:00',
  endTime: '11:00',
  duration: 60,
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

function setup(dayReservations: Reservation[], byApartment: Record<string, Reservation[]> = {}) {
  const reservationRepo = {
    findByDateAndCourt: jest.fn().mockResolvedValue(ok(dayReservations)),
    findByApartment: jest.fn((apartment: string) => Promise.resolve(ok(byApartment[apartment] ?? []))),
  } as unknown as ReservationRepository;
  const blockoutRepo = {
    findByDateAndCourt: jest.fn().mockResolvedValue(ok([])),
  } as unknown as BlockoutRepository;
  const configRepo = {
    getConfig: jest.fn().mockResolvedValue(ok(DEFAULT_SCHEDULE_CONFIG)),
  } as unknown as ScheduleConfigRepository;

  const useCase = new GetAvailability(
    reservationRepo,
    blockoutRepo,
    configRepo,
    new GetActiveApartmentReservations(reservationRepo),
  );
  return { useCase, reservationRepo };
}

describe('GetAvailability', () => {
  it('does not query apartments when every reservation is already guaranteed', async () => {
    const { useCase, reservationRepo } = setup([
      makeReservation({ id: 'a', apartment: '1-1-A' }),
      makeReservation({ id: 'b', apartment: '2-2-B', startTime: '12:00', endTime: '13:00' }),
    ]);

    const result = await useCase.execute('court-1', futureDate);

    expect(result.success).toBe(true);
    expect(reservationRepo.findByApartment).not.toHaveBeenCalled();
    if (!result.success) return;
    const slot = result.value.find((s) => s.startTime === '10:00');
    expect(slot?.available).toBe(false);
    expect(slot?.priority).toBe('guaranteed');
  });

  it('converts a lone provisional reservation to guaranteed', async () => {
    const provisional = makeReservation({ id: 'p', apartment: '3-3-C', priority: 'provisional' });
    const { useCase, reservationRepo } = setup([provisional], { '3-3-C': [provisional] });

    const result = await useCase.execute('court-1', futureDate);

    expect(reservationRepo.findByApartment).toHaveBeenCalledTimes(1);
    expect(reservationRepo.findByApartment).toHaveBeenCalledWith('3-3-C');
    if (!result.success) throw new Error('expected success');
    expect(result.value.find((s) => s.startTime === '10:00')?.priority).toBe('guaranteed');
  });

  it('keeps provisional when the apartment already has a guaranteed reservation', async () => {
    const guaranteed = makeReservation({ id: 'g', apartment: '3-3-C', startTime: '08:00', endTime: '09:00' });
    const provisional = makeReservation({ id: 'p', apartment: '3-3-C', priority: 'provisional' });
    const { useCase } = setup([provisional], { '3-3-C': [guaranteed, provisional] });

    const result = await useCase.execute('court-1', futureDate);

    if (!result.success) throw new Error('expected success');
    const slot = result.value.find((s) => s.startTime === '10:00');
    expect(slot?.priority).toBe('provisional');
    expect(slot?.isDisplaceable).toBe(true);
  });
});
