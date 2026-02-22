import { RequestToJoin } from '../../src/domain/useCases/RequestToJoin';
import type { MatchRepository } from '../../src/domain/ports/repositories/MatchRepository';
import type { PlayerRepository } from '../../src/domain/ports/repositories/PlayerRepository';
import type { MatchNotifier } from '../../src/domain/ports/repositories/MatchNotifier';
import type { Match, Player } from '../../src/domain/entities/Match';
import { ok, fail } from '../../src/shared/types/Result';
import {
  MatchNotFoundError,
  MatchAlreadyCancelledError,
  MatchFullError,
  PlayerAlreadyJoinedError,
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
  status: 'pending',
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

const mockNotifier: jest.Mocked<MatchNotifier> = {
  scheduleReminders: jest.fn(),
  notifyJoinRequest: jest.fn(),
  notifyRequestAccepted: jest.fn(),
  notifyMatchFull: jest.fn(),
  notifyMatchCancelled: jest.fn(),
  notifyMatchCancelledByReservation: jest.fn(),
};

describe('RequestToJoin', () => {
  let useCase: RequestToJoin;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RequestToJoin(mockMatchRepository, mockPlayerRepository, mockNotifier);
  });

  it('succeeds and notifies creator', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(makeMatch()));
    mockPlayerRepository.findByMatchAndUser.mockResolvedValue(ok(null)); // not yet in match
    mockPlayerRepository.add.mockResolvedValue(ok(makePlayer()));
    mockNotifier.notifyJoinRequest.mockResolvedValue(ok(undefined));

    const result = await useCase.execute('m-1', { userId: 'user-2', userName: 'Bob' });

    expect(result.success).toBe(true);
    expect(mockPlayerRepository.add).toHaveBeenCalledWith('m-1', { userId: 'user-2', userName: 'Bob' }, 'pending');
    expect(mockNotifier.notifyJoinRequest).toHaveBeenCalledWith('creator-1', 'Bob', 'm-1', false);
  });

  it('returns MatchNotFoundError when match does not exist', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(null));

    const result = await useCase.execute('m-1', { userId: 'user-2', userName: 'Bob' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('MATCH_NOT_FOUND');
  });

  it('returns MatchAlreadyCancelledError when match is cancelled', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(makeMatch({ status: 'cancelled' })));

    const result = await useCase.execute('m-1', { userId: 'user-2', userName: 'Bob' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('MATCH_ALREADY_CANCELLED');
  });

  it('returns MatchFullError when match is full', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(makeMatch({ status: 'full' })));

    const result = await useCase.execute('m-1', { userId: 'user-2', userName: 'Bob' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('MATCH_FULL');
  });

  it('returns PlayerAlreadyJoinedError when user is already in match', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(makeMatch()));
    mockPlayerRepository.findByMatchAndUser.mockResolvedValue(ok(makePlayer()));

    const result = await useCase.execute('m-1', { userId: 'user-2', userName: 'Bob' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('PLAYER_ALREADY_JOINED');
  });

  it('skips duplicate check when no userId provided (external player)', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(makeMatch()));
    mockPlayerRepository.add.mockResolvedValue(ok(makePlayer({ userId: null })));
    mockNotifier.notifyJoinRequest.mockResolvedValue(ok(undefined));

    const result = await useCase.execute('m-1', { userName: 'External Player' });

    expect(result.success).toBe(true);
    expect(mockPlayerRepository.findByMatchAndUser).not.toHaveBeenCalled();
  });
});
