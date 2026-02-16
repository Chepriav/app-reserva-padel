import { CreateReservation } from '../../src/domain/useCases/CreateReservation';
import type { ReservationRepository } from '../../src/domain/ports/repositories/ReservationRepository';
import type { CreateReservationData, Reservation } from '../../src/domain/entities/Reservation';
import { ok, fail } from '../../src/shared/types/Result';
import {
  DisplacementRequiredError,
  ReservationLimitExceededError,
  RpcNotFoundError,
} from '../../src/domain/errors/DomainErrors';
import { GetAvailability } from '../../src/domain/useCases/GetAvailability';
import { GetActiveApartmentReservations } from '../../src/domain/useCases/GetActiveApartmentReservations';
import { DisplaceReservation } from '../../src/domain/useCases/DisplaceReservation';

// Use a date 3 days from today — within the 7-day booking window
const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const makeReservation = (overrides?: Partial<Reservation>): Reservation => ({
  id: 'r-1',
  courtId: 'court-1',
  courtName: 'Pista 1',
  userId: 'user-1',
  userName: 'Other User',
  apartment: '2-1-A',
  date: futureDate,
  startTime: '10:00',
  endTime: '11:00',
  duration: 60,
  status: 'confirmed',
  priority: 'provisional',
  players: [],
  conversionTimestamp: null,
  conversionRule: null,
  convertedAt: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

const validData: CreateReservationData = {
  courtId: 'court-1',
  userId: 'user-1',
  userName: 'Test User',
  apartment: '1-3-B',
  date: futureDate,
  startTime: '09:00',
  endTime: '10:00',
};

const mockReservationRepository: jest.Mocked<ReservationRepository> = {
  findById: jest.fn(),
  findByApartment: jest.fn(),
  findByUserId: jest.fn(),
  findByDateAndCourt: jest.fn(),
  findByDate: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  cancel: jest.fn(),
  updatePriority: jest.fn(),
  getStatistics: jest.fn(),
  getConversionInfo: jest.fn(),
  createWithRpc: jest.fn(),
  displaceThenCreate: jest.fn(),
  recalculateConversions: jest.fn(),
};

const mockGetAvailability = { execute: jest.fn() } as unknown as GetAvailability;
const mockGetActiveReservations = { execute: jest.fn() } as unknown as GetActiveApartmentReservations;
const mockDisplaceReservation = { execute: jest.fn() } as unknown as DisplaceReservation;

describe('CreateReservation', () => {
  let useCase: CreateReservation;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateReservation(
      mockReservationRepository,
      mockGetAvailability,
      mockGetActiveReservations,
      mockDisplaceReservation,
    );
  });

  it('succeeds via RPC when available', async () => {
    const newReservation = makeReservation({ id: 'new-1', apartment: '1-3-B' });
    (mockReservationRepository.createWithRpc as jest.Mock).mockResolvedValue(ok(newReservation));

    const result = await useCase.execute(validData);

    expect(result.success).toBe(true);
    expect(mockReservationRepository.createWithRpc).toHaveBeenCalled();
    expect(mockGetAvailability.execute).not.toHaveBeenCalled();
  });

  it('falls back to manual flow when RPC not found', async () => {
    (mockReservationRepository.createWithRpc as jest.Mock).mockResolvedValue(
      fail(new RpcNotFoundError()),
    );
    // Availability: all slots free
    (mockGetAvailability.execute as jest.Mock).mockResolvedValue(ok([
      { startTime: '09:00', endTime: '09:30', available: true, blocked: false, blockoutId: null, blockoutReason: null, existingReservation: null, priority: null, isDisplaceable: false, isProtected: false },
      { startTime: '09:30', endTime: '10:00', available: true, blocked: false, blockoutId: null, blockoutReason: null, existingReservation: null, priority: null, isDisplaceable: false, isProtected: false },
    ]));
    // No active reservations → guaranteed priority
    (mockGetActiveReservations.execute as jest.Mock).mockResolvedValue(ok([]));

    const newReservation = makeReservation({ id: 'new-1', apartment: '1-3-B' });
    (mockReservationRepository.create as jest.Mock).mockResolvedValue(ok(newReservation));

    const result = await useCase.execute(validData);

    expect(result.success).toBe(true);
    expect(mockGetAvailability.execute).toHaveBeenCalledWith(validData.courtId, validData.date);
    expect(mockReservationRepository.create).toHaveBeenCalled();
  });

  it('returns DisplacementRequiredError when slot has displaceable reservation', async () => {
    const provisionalReservation = makeReservation({ priority: 'provisional' });
    (mockReservationRepository.createWithRpc as jest.Mock).mockResolvedValue(
      fail(new RpcNotFoundError()),
    );
    (mockGetAvailability.execute as jest.Mock).mockResolvedValue(ok([
      {
        startTime: '09:00',
        endTime: '09:30',
        available: false,
        blocked: false,
        blockoutId: null,
        blockoutReason: null,
        existingReservation: provisionalReservation,
        priority: 'provisional',
        isDisplaceable: true,
        isProtected: false,
      },
    ]));

    const result = await useCase.execute(validData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DISPLACEMENT_REQUIRED');
      expect((result.error as DisplacementRequiredError).reservationToDisplace.id).toBe('r-1');
    }
  });

  it('returns ReservationLimitExceededError when apartment already has max reservations', async () => {
    (mockReservationRepository.createWithRpc as jest.Mock).mockResolvedValue(
      fail(new RpcNotFoundError()),
    );
    (mockGetAvailability.execute as jest.Mock).mockResolvedValue(ok([
      { startTime: '09:00', endTime: '09:30', available: true, blocked: false, blockoutId: null, blockoutReason: null, existingReservation: null, priority: null, isDisplaceable: false, isProtected: false },
    ]));
    // 1 active reservation → next would be 2nd, but limit is 1
    const existingReservation = makeReservation({ apartment: '1-3-B', status: 'confirmed' });
    (mockGetActiveReservations.execute as jest.Mock).mockResolvedValue(ok([existingReservation]));

    const result = await useCase.execute({ ...validData, endTime: '09:30' });

    // Note: limit of 1 means provisional slot (2nd) — but with MAX_ACTIVE_RESERVATIONS=1
    // DetermineReservationPriority returns null when count >= 1
    // Actually: count === 1 → provisional; count >= 2 → null
    // So for count === 1 this should still succeed with provisional priority
    // Let's test the actual limit exceeded case (count >= 2)
    const existing2 = makeReservation({ id: 'r-2', apartment: '1-3-B', status: 'confirmed' });
    (mockGetActiveReservations.execute as jest.Mock).mockResolvedValue(ok([existingReservation, existing2]));

    const result2 = await useCase.execute({ ...validData, endTime: '09:30' });
    expect(result2.success).toBe(false);
    if (!result2.success) {
      expect(result2.error.code).toBe('RESERVATION_LIMIT_EXCEEDED');
    }
  });
});
