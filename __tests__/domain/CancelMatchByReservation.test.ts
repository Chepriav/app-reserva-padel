import { CancelMatchByReservation } from '@domain/useCases/CancelMatchByReservation';
import type { MatchRepository } from '@domain/ports/repositories/MatchRepository';
import type { MatchNotifier } from '@domain/ports/repositories/MatchNotifier';
import type { Match } from '@domain/entities/Match';
import { ok, fail } from '@shared/types/Result';
import { InfrastructureError } from '@domain/errors/DomainErrors';

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'match-1',
  creatorId: 'creator-1',
  creatorName: 'Alice',
  creatorApartment: '1A',
  creatorPhoto: null,
  creatorLevel: null,
  reservationId: 'res-1',
  date: '2027-01-10',
  startTime: '10:00',
  endTime: '11:30',
  courtName: 'Pista 1',
  type: 'with_reservation',
  message: null,
  preferredLevel: null,
  status: 'cancelled',
  isClass: false,
  levels: null,
  minParticipants: 4,
  maxParticipants: 4,
  studentPrice: null,
  groupPrice: null,
  players: [
    {
      id: 'player-1',
      matchId: 'match-1',
      userId: 'user-2',
      userName: 'Bob',
      userApartment: '2B',
      userPhoto: null,
      skillLevel: null,
      isExternal: false,
      status: 'confirmed',
      createdAt: '2027-01-01T10:00:00Z',
    },
  ],
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

describe('CancelMatchByReservation', () => {
  it('returns hadMatch: false when no match linked to reservation', async () => {
    const repo = makeMatchRepository({
      cancelByReservationId: jest.fn().mockResolvedValue(ok(null)),
    });
    const useCase = new CancelMatchByReservation(repo, makeNotifier());

    const result = await useCase.execute('res-999');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.hadMatch).toBe(false);
      expect(result.value.matchId).toBeUndefined();
    }
  });

  it('cancels match and notifies all players', async () => {
    const match = makeMatch();
    const repo = makeMatchRepository({
      cancelByReservationId: jest.fn().mockResolvedValue(ok({ matchId: 'match-1', match })),
    });
    const notifier = makeNotifier();
    const useCase = new CancelMatchByReservation(repo, notifier);

    const result = await useCase.execute('res-1', 'reserva_cancelada');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.hadMatch).toBe(true);
      expect(result.value.matchId).toBe('match-1');
    }
    expect(notifier.notifyMatchCancelledByReservation).toHaveBeenCalledWith(
      ['creator-1', 'user-2'],
      'Alice',
      '2027-01-10',
      '10:00',
      false,
      'reserva_cancelada',
    );
  });

  it('returns error when repository fails', async () => {
    const repo = makeMatchRepository({
      cancelByReservationId: jest.fn().mockResolvedValue(fail(new InfrastructureError('DB error'))),
    });
    const useCase = new CancelMatchByReservation(repo, makeNotifier());

    const result = await useCase.execute('res-1');
    expect(result.success).toBe(false);
  });

  it('excludes players without userId from notification', async () => {
    const match = makeMatch({
      players: [
        {
          id: 'p1',
          matchId: 'match-1',
          userId: null,       // external player, no userId
          userName: 'External',
          userApartment: null,
          userPhoto: null,
          skillLevel: null,
          isExternal: true,
          status: 'confirmed',
          createdAt: '2027-01-01T10:00:00Z',
        },
      ],
    });
    const repo = makeMatchRepository({
      cancelByReservationId: jest.fn().mockResolvedValue(ok({ matchId: 'match-1', match })),
    });
    const notifier = makeNotifier();
    const useCase = new CancelMatchByReservation(repo, notifier);

    await useCase.execute('res-1');

    // Only creator, no external player
    expect(notifier.notifyMatchCancelledByReservation).toHaveBeenCalledWith(
      ['creator-1'],
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });
});
