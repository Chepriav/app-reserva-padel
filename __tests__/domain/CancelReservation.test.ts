import { CancelReservation } from '../../src/domain/useCases/CancelReservation';
import type { ReservationRepository } from '../../src/domain/ports/repositories/ReservationRepository';
import type { MatchCancellationPort } from '../../src/domain/ports/repositories/MatchCancellationPort';
import type { Reservation } from '../../src/domain/entities/Reservation';
import { ok, fail } from '../../src/shared/types/Result';
import {
  ReservationNotFoundError,
  ReservationAlreadyCancelledError,
  ReservationPermissionError,
  InfrastructureError,
} from '../../src/domain/errors/DomainErrors';

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

const mockMatchCancellation: jest.Mocked<MatchCancellationPort> = {
  cancelMatchByReservation: jest.fn(),
};

describe('CancelReservation', () => {
  let useCase: CancelReservation;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CancelReservation(mockReservationRepository, mockMatchCancellation);
    mockMatchCancellation.cancelMatchByReservation.mockResolvedValue(ok(undefined));
  });

  describe('by userId', () => {
    it('succeeds when userId matches', async () => {
      const reservation = makeReservation();
      mockReservationRepository.findById.mockResolvedValue(ok(reservation));
      mockReservationRepository.cancel.mockResolvedValue(ok(undefined));

      const result = await useCase.execute('r-1', 'user-1');

      expect(result.success).toBe(true);
      expect(mockReservationRepository.cancel).toHaveBeenCalledWith('r-1');
      expect(mockMatchCancellation.cancelMatchByReservation).toHaveBeenCalledWith('r-1');
    });

    it('fails when userId does not match', async () => {
      mockReservationRepository.findById.mockResolvedValue(ok(makeReservation()));

      const result = await useCase.execute('r-1', 'other-user');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('RESERVATION_PERMISSION_ERROR');
      }
    });
  });

  describe('by apartment', () => {
    it('succeeds when apartment matches', async () => {
      const reservation = makeReservation();
      mockReservationRepository.findById.mockResolvedValue(ok(reservation));
      mockReservationRepository.cancel.mockResolvedValue(ok(undefined));

      const result = await useCase.execute('r-1', 'any-user', '1-3-B');

      expect(result.success).toBe(true);
      expect(mockReservationRepository.cancel).toHaveBeenCalledWith('r-1');
    });

    it('fails when apartment does not match', async () => {
      mockReservationRepository.findById.mockResolvedValue(ok(makeReservation()));

      const result = await useCase.execute('r-1', 'any-user', '2-4-C');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('RESERVATION_PERMISSION_ERROR');
      }
    });
  });

  it('returns ReservationNotFoundError when reservation does not exist', async () => {
    mockReservationRepository.findById.mockResolvedValue(ok(null));

    const result = await useCase.execute('r-1', 'user-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('RESERVATION_NOT_FOUND');
    }
  });

  it('returns ReservationAlreadyCancelledError when status is not confirmed', async () => {
    mockReservationRepository.findById.mockResolvedValue(
      ok(makeReservation({ status: 'cancelled' })),
    );

    const result = await useCase.execute('r-1', 'user-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('RESERVATION_ALREADY_CANCELLED');
    }
  });

  it('propagates repository error from findById', async () => {
    mockReservationRepository.findById.mockResolvedValue(
      fail(new InfrastructureError('DB error')),
    );

    const result = await useCase.execute('r-1', 'user-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INFRASTRUCTURE_ERROR');
    }
  });

  it('does not call matchCancellation when cancel fails', async () => {
    mockReservationRepository.findById.mockResolvedValue(ok(makeReservation()));
    mockReservationRepository.cancel.mockResolvedValue(
      fail(new InfrastructureError('DB error')),
    );

    await useCase.execute('r-1', 'user-1');

    expect(mockMatchCancellation.cancelMatchByReservation).not.toHaveBeenCalled();
  });
});
