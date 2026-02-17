import { CreateMatch } from '@domain/useCases/CreateMatch';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { MatchNotifier } from '@domain/ports/repositories/MatchNotifier';
import type { Match } from '@domain/entities/Match';
import { ok, fail } from '@shared/types/Result';
import { InfrastructureError } from '@domain/errors/DomainErrors';

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'match-1',
  creatorId: 'user-1',
  creatorName: 'Alice',
  creatorApartment: '1A',
  creatorPhoto: null,
  creatorLevel: null,
  reservationId: null,
  date: '2027-01-10',
  startTime: '10:00',
  endTime: '11:30',
  courtName: 'Pista 1',
  type: 'open',
  message: 'Looking for players',
  preferredLevel: null,
  status: 'searching',
  isClass: false,
  levels: null,
  minParticipants: 4,
  maxParticipants: 4,
  studentPrice: null,
  groupPrice: null,
  players: [],
  createdAt: '2027-01-01T10:00:00Z',
  updatedAt: '2027-01-01T10:00:00Z',
  ...overrides,
});

const makeMatchRepository = (overrides: Partial<MatchRepository> = {}): MatchRepository => ({
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
  ...overrides,
});

const makeNotifier = (): MatchNotifier => ({
  scheduleReminders: jest.fn(),
  notifyJoinRequest: jest.fn(),
  notifyRequestAccepted: jest.fn(),
  notifyMatchFull: jest.fn(),
  notifyMatchCancelled: jest.fn(),
  notifyMatchCancelledByReservation: jest.fn(),
});

describe('CreateMatch', () => {
  it('creates match and schedules reminders for creator', async () => {
    const match = makeMatch();
    const repo = makeMatchRepository({ create: jest.fn().mockResolvedValue(ok(match)) });
    const notifier = makeNotifier();
    const useCase = new CreateMatch(repo, notifier);

    const result = await useCase.execute({
      creatorId: 'user-1',
      creatorName: 'Alice',
      creatorApartment: '1A',
      date: '2027-01-10',
      startTime: '10:00',
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.value.id).toBe('match-1');
    expect(notifier.scheduleReminders).toHaveBeenCalledWith('user-1', expect.objectContaining({ id: 'match-1' }));
  });

  it('returns error when repository fails', async () => {
    const repo = makeMatchRepository({
      create: jest.fn().mockResolvedValue(fail(new InfrastructureError('DB error'))),
    });
    const useCase = new CreateMatch(repo, makeNotifier());

    const result = await useCase.execute({
      creatorId: 'user-1',
      creatorName: 'Alice',
      creatorApartment: '1A',
    });

    expect(result.success).toBe(false);
  });

  it('schedules reminders for initial internal players', async () => {
    const player = {
      id: 'player-1',
      matchId: 'match-1',
      userId: 'user-2',
      userName: 'Bob',
      userApartment: '2B',
      userPhoto: null,
      skillLevel: null as null,
      isExternal: false,
      status: 'confirmed' as const,
      createdAt: '2027-01-01T10:00:00Z',
    };
    const match = makeMatch({ players: [player] });
    const repo = makeMatchRepository({ create: jest.fn().mockResolvedValue(ok(match)) });
    const notifier = makeNotifier();
    const useCase = new CreateMatch(repo, notifier);

    await useCase.execute({
      creatorId: 'user-1',
      creatorName: 'Alice',
      creatorApartment: '1A',
      initialPlayers: [player],
    });

    expect(notifier.scheduleReminders).toHaveBeenCalledWith('user-2', expect.objectContaining({ id: 'match-1' }));
  });

  it('does not schedule reminders for external players', async () => {
    const externalPlayer = {
      id: 'player-1',
      matchId: 'match-1',
      userId: null,
      userName: 'External Bob',
      userApartment: null,
      userPhoto: null,
      skillLevel: null as null,
      isExternal: true,
      status: 'confirmed' as const,
      createdAt: '2027-01-01T10:00:00Z',
    };
    const match = makeMatch({ players: [externalPlayer] });
    const repo = makeMatchRepository({ create: jest.fn().mockResolvedValue(ok(match)) });
    const notifier = makeNotifier();
    const useCase = new CreateMatch(repo, notifier);

    await useCase.execute({
      creatorId: 'user-1',
      creatorName: 'Alice',
      creatorApartment: '1A',
      initialPlayers: [externalPlayer],
    });

    // Only creator gets reminded, not external player
    expect(notifier.scheduleReminders).toHaveBeenCalledTimes(1);
    expect(notifier.scheduleReminders).toHaveBeenCalledWith('user-1', expect.anything());
  });
});
