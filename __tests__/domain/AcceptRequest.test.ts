import { AcceptRequest } from '../../src/domain/useCases/AcceptRequest';
import type { MatchRepository } from '../../src/domain/ports/repositories/MatchRepository';
import type { PlayerRepository } from '../../src/domain/ports/repositories/PlayerRepository';
import type { MatchNotifier } from '../../src/domain/ports/repositories/MatchNotifier';
import type { Match, Player } from '../../src/domain/entities/Match';
import { ok, fail } from '../../src/shared/types/Result';
import {
  MatchNotFoundError,
  MatchPermissionError,
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

const mockNotifier: jest.Mocked<MatchNotifier> = {
  scheduleReminders: jest.fn(),
  notifyJoinRequest: jest.fn(),
  notifyRequestAccepted: jest.fn(),
  notifyMatchFull: jest.fn(),
  notifyMatchCancelled: jest.fn(),
  notifyMatchCancelledByReservation: jest.fn(),
};

describe('AcceptRequest', () => {
  let useCase: AcceptRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new AcceptRequest(mockMatchRepository, mockPlayerRepository, mockNotifier);
    mockNotifier.notifyRequestAccepted.mockResolvedValue(ok(undefined));
    mockNotifier.scheduleReminders.mockResolvedValue(ok(undefined));
    mockNotifier.notifyMatchFull.mockResolvedValue(ok(undefined));
  });

  it('succeeds and notifies the accepted player', async () => {
    const match = makeMatch();
    const player = makePlayer();

    mockMatchRepository.findById
      .mockResolvedValueOnce(ok(match))     // first call: permission check
      .mockResolvedValueOnce(ok(           // second call: check if full
        makeMatch({ players: [player] }),
      ));
    mockPlayerRepository.updateStatus.mockResolvedValue(ok(player));

    const result = await useCase.execute('p-1', 'm-1', 'creator-1');

    expect(result.success).toBe(true);
    expect(mockPlayerRepository.updateStatus).toHaveBeenCalledWith('p-1', 'confirmed');
    expect(mockNotifier.notifyRequestAccepted).toHaveBeenCalledWith('user-2', 'Ana García', 'm-1', false);
    expect(mockNotifier.scheduleReminders).toHaveBeenCalled();
  });

  it('notifies match full when confirmed count reaches maxParticipants', async () => {
    const confirmedPlayers = [
      makePlayer({ id: 'p-1', userId: 'user-2' }),
      makePlayer({ id: 'p-2', userId: 'user-3' }),
      makePlayer({ id: 'p-3', userId: 'user-4' }),
      makePlayer({ id: 'p-4', userId: 'user-5' }),
    ];
    const fullMatch = makeMatch({ maxParticipants: 4, players: confirmedPlayers });

    mockMatchRepository.findById
      .mockResolvedValueOnce(ok(makeMatch()))
      .mockResolvedValueOnce(ok(fullMatch));
    mockPlayerRepository.updateStatus.mockResolvedValue(ok(makePlayer()));

    const result = await useCase.execute('p-1', 'm-1', 'creator-1');

    expect(result.success).toBe(true);
    expect(mockNotifier.notifyMatchFull).toHaveBeenCalled();
  });

  it('returns MatchNotFoundError when match does not exist', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(null));

    const result = await useCase.execute('p-1', 'm-1', 'creator-1');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('MATCH_NOT_FOUND');
  });

  it('returns MatchPermissionError when requester is not the creator', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(makeMatch()));

    const result = await useCase.execute('p-1', 'm-1', 'impostor-user');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('MATCH_PERMISSION_ERROR');
    expect(mockPlayerRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('propagates error from updateStatus', async () => {
    mockMatchRepository.findById.mockResolvedValue(ok(makeMatch()));
    mockPlayerRepository.updateStatus.mockResolvedValue(
      fail(new InfrastructureError('DB error')),
    );

    const result = await useCase.execute('p-1', 'm-1', 'creator-1');

    expect(result.success).toBe(false);
  });
});
