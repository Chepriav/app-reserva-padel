import { CancelMatch } from '../../src/domain/useCases/CancelMatch';
import type { MatchRepository } from '../../src/domain/ports/repositories/MatchRepository';
import type { MatchNotifier } from '../../src/domain/ports/repositories/MatchNotifier';
import type { Match } from '../../src/domain/entities/Match';
import { ok, fail } from '../../src/shared/types/Result';
import {
  MatchNotFoundError,
  MatchPermissionError,
  InfrastructureError,
} from '../../src/domain/errors/DomainErrors';

const makeMatch = (overrides?: Partial<Match>): Match => ({
  id: 'm-1',
  creatorId: 'user-1',
  creatorName: 'Ana García',
  creatorApartment: '1-3-B',
  creatorPhoto: null,
  creatorLevel: null,
  reservationId: null,
  date: '2025-12-15',
  startTime: '10:00',
  endTime: '11:30',
  courtName: 'Pista 1',
  type: 'open',
  message: null,
  preferredLevel: null,
  status: 'searching',
  isClass: false,
  levels: null,
  minParticipants: 2,
  maxParticipants: 4,
  studentPrice: null,
  groupPrice: null,
  players: [],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

const mockMatchRepository: jest.Mocked<MatchRepository> = {
  findAll: jest.fn(),
  findByCreator: jest.fn(),
  findEnrolledByUser: jest.fn(),
  findByReservationId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  cancel: jest.fn(),
  close: jest.fn(),
  delete: jest.fn(),
  cancelByReservationId: jest.fn(),
  findReservationIdsByCreator: jest.fn(),
};

const mockNotifier: jest.Mocked<MatchNotifier> = {
  scheduleReminders: jest.fn(),
  notifyJoinRequest: jest.fn(),
  notifyRequestAccepted: jest.fn(),
  notifyMatchFull: jest.fn(),
  notifyMatchCancelled: jest.fn(),
  notifyMatchCancelledByReservation: jest.fn(),
};

describe('CancelMatch', () => {
  let useCase: CancelMatch;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CancelMatch(mockMatchRepository, mockNotifier);
  });

  it('succeeds and notifies players', async () => {
    const match = makeMatch({
      players: [
        { id: 'p-1', matchId: 'm-1', userId: 'user-2', userName: 'Bob', userApartment: '2-4-C', userPhoto: null, skillLevel: null, isExternal: false, status: 'confirmed', createdAt: '2025-01-01T00:00:00Z' },
      ],
    });
    mockMatchRepository.findById.mockResolvedValue(ok(match));
    mockMatchRepository.cancel.mockResolvedValue(ok(undefined));
    mockNotifier.notifyMatchCancelled.mockResolvedValue(ok(undefined));

    const result = await useCase.execute('m-1', 'user-1');

    expect(result.success).toBe(true);
    expect(mockMatchRepository.cancel).toHaveBeenCalledWith('m-1');
    expect(mockNotifier.notifyMatchCancelled).toHaveBeenCalledWith(
      ['user-2'],
      'Ana García',
      'm-1',
      false,
    );
  });

  it('succeeds without notification when no players', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(makeMatch({ players: [] })));
    mockMatchRepository.cancel.mockResolvedValue(ok(undefined));

    const result = await useCase.execute('m-1', 'user-1');

    expect(result.success).toBe(true);
    expect(mockNotifier.notifyMatchCancelled).not.toHaveBeenCalled();
  });

  it('does not notify creator themselves', async () => {
    const match = makeMatch({
      players: [
        { id: 'p-1', matchId: 'm-1', userId: 'user-1', userName: 'Ana', userApartment: '1-3-B', userPhoto: null, skillLevel: null, isExternal: false, status: 'confirmed', createdAt: '2025-01-01T00:00:00Z' },
      ],
    });
    mockMatchRepository.findById.mockResolvedValue(ok(match));
    mockMatchRepository.cancel.mockResolvedValue(ok(undefined));

    await useCase.execute('m-1', 'user-1');

    expect(mockNotifier.notifyMatchCancelled).not.toHaveBeenCalled();
  });

  it('returns MatchNotFoundError when match does not exist', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(null));

    const result = await useCase.execute('m-1', 'user-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('MATCH_NOT_FOUND');
    }
  });

  it('returns MatchPermissionError when user is not the creator', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(makeMatch()));

    const result = await useCase.execute('m-1', 'other-user');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('MATCH_PERMISSION_ERROR');
    }
    expect(mockMatchRepository.cancel).not.toHaveBeenCalled();
  });

  it('propagates repository error from findById', async () => {
    mockMatchRepository.findById.mockResolvedValue(
      fail(new InfrastructureError('DB error')),
    );

    const result = await useCase.execute('m-1', 'user-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INFRASTRUCTURE_ERROR');
    }
  });
});
