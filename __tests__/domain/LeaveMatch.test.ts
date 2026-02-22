import { LeaveMatch } from '../../src/domain/useCases/LeaveMatch';
import type { MatchRepository } from '../../src/domain/ports/repositories/MatchRepository';
import type { PlayerRepository } from '../../src/domain/ports/repositories/PlayerRepository';
import type { Match, Player } from '../../src/domain/entities/Match';
import { ok, fail } from '../../src/shared/types/Result';
import {
  MatchNotFoundError,
  InfrastructureError,
} from '../../src/domain/errors/DomainErrors';

const makeMatch = (overrides?: Partial<Match>): Match => ({
  id: 'm-1',
  creatorId: 'creator-1',
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

const makePlayer = (overrides?: Partial<Player>): Player => ({
  id: 'p-1',
  matchId: 'm-1',
  userId: 'user-2',
  userName: 'Bob',
  userApartment: '2-4-C',
  userPhoto: null,
  skillLevel: null,
  isExternal: false,
  status: 'confirmed',
  createdAt: '2025-01-01T00:00:00Z',
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

const mockPlayerRepository: jest.Mocked<PlayerRepository> = {
  findByMatch: jest.fn(),
  findByMatchAndUser: jest.fn(),
  add: jest.fn(),
  updateStatus: jest.fn(),
  remove: jest.fn(),
  recalculateMatchStatus: jest.fn(),
};

describe('LeaveMatch', () => {
  let useCase: LeaveMatch;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LeaveMatch(mockMatchRepository, mockPlayerRepository);
    mockPlayerRepository.recalculateMatchStatus.mockResolvedValue(ok(undefined));
  });

  it('succeeds and removes player then recalculates status', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(makeMatch()));
    mockPlayerRepository.findByMatchAndUser.mockResolvedValue(ok(makePlayer()));
    mockPlayerRepository.remove.mockResolvedValue(ok(undefined));

    const result = await useCase.execute('m-1', 'user-2');

    expect(result.success).toBe(true);
    expect(mockPlayerRepository.remove).toHaveBeenCalledWith('p-1');
    expect(mockPlayerRepository.recalculateMatchStatus).toHaveBeenCalledWith('m-1');
  });

  it('is a no-op (ok) when user is not in the match', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(makeMatch()));
    mockPlayerRepository.findByMatchAndUser.mockResolvedValue(ok(null));

    const result = await useCase.execute('m-1', 'user-not-in-match');

    expect(result.success).toBe(true);
    expect(mockPlayerRepository.remove).not.toHaveBeenCalled();
    expect(mockPlayerRepository.recalculateMatchStatus).not.toHaveBeenCalled();
  });

  it('returns MatchNotFoundError when match does not exist', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(null));

    const result = await useCase.execute('m-1', 'user-2');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('MATCH_NOT_FOUND');
  });

  it('propagates repository error from findById', async () => {
    mockMatchRepository.findById.mockResolvedValue(
      fail(new InfrastructureError('DB error')),
    );

    const result = await useCase.execute('m-1', 'user-2');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('INFRASTRUCTURE_ERROR');
  });

  it('propagates error from playerRepository.remove', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(makeMatch()));
    mockPlayerRepository.findByMatchAndUser.mockResolvedValue(ok(makePlayer()));
    mockPlayerRepository.remove.mockResolvedValue(
      fail(new InfrastructureError('DB error')),
    );

    const result = await useCase.execute('m-1', 'user-2');

    expect(result.success).toBe(false);
    expect(mockPlayerRepository.recalculateMatchStatus).not.toHaveBeenCalled();
  });
});
