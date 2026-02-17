import { SupabaseDisplacementNotifier } from '@infrastructure/supabase/repositories/SupabaseDisplacementNotifier';
import { SupabaseMatchNotifier } from '@infrastructure/supabase/repositories/SupabaseMatchNotifier';
import type { UserRepository } from '@domain/ports/repositories/UserRepository';
import type { ApartmentUser } from '@domain/entities/User';
import type { CreateUserNotification } from '@domain/useCases/CreateUserNotification';
import type { PushDeliveryPort } from '@domain/ports/repositories/PushDeliveryPort';
import type { LocalSchedulerPort } from '@domain/ports/repositories/LocalSchedulerPort';
import { ok } from '@shared/types/Result';

const makeApartmentUser = (id: string): ApartmentUser => ({
  id,
  name: `User ${id}`,
  email: `${id}@test.com`,
  profilePhoto: null,
  skillLevel: null,
});

const makeUserRepo = (users: ApartmentUser[] = []): UserRepository =>
  ({
    findByApartment: jest.fn().mockResolvedValue(ok(users)),
    findById: jest.fn(),
    create: jest.fn(),
    updateProfile: jest.fn(),
    deleteWithRelations: jest.fn(),
  }) as unknown as UserRepository;

const makeCreateNotification = (): CreateUserNotification =>
  ({ execute: jest.fn().mockResolvedValue(ok(undefined)) }) as unknown as CreateUserNotification;

const makePushDelivery = (): PushDeliveryPort => ({
  sendToUser: jest.fn().mockResolvedValue(ok(undefined)),
});

const makeLocalScheduler = (): LocalSchedulerPort => ({
  scheduleMatchReminders: jest.fn().mockResolvedValue(ok({ matchDayId: null, tenMinId: null })),
  cancelReminder: jest.fn().mockResolvedValue(undefined),
});

// ============================================================
// SupabaseDisplacementNotifier
// ============================================================

describe('SupabaseDisplacementNotifier — notifyApartmentDisplacement', () => {
  it('creates bulletin notification and sends push to each apartment user', async () => {
    const users = [makeApartmentUser('u1'), makeApartmentUser('u2')];
    const userRepo = makeUserRepo(users);
    const createNotif = makeCreateNotification();
    const pushDelivery = makePushDelivery();

    const notifier = new SupabaseDisplacementNotifier(userRepo, createNotif, pushDelivery);
    const result = await notifier.notifyApartmentDisplacement(
      '1A', '2027-03-01', '10:00', '11:30', 'Pista 1', '2B',
    );

    expect(result.success).toBe(true);
    expect(createNotif.execute).toHaveBeenCalledTimes(2);
    expect(pushDelivery.sendToUser).toHaveBeenCalledTimes(2);
    expect(pushDelivery.sendToUser).toHaveBeenCalledWith(
      'u1',
      'Reserva desplazada',
      expect.stringContaining('2027-03-01'),
      expect.any(Object),
    );
  });

  it('does nothing when apartment has no users', async () => {
    const userRepo = makeUserRepo([]);
    const createNotif = makeCreateNotification();
    const pushDelivery = makePushDelivery();

    const notifier = new SupabaseDisplacementNotifier(userRepo, createNotif, pushDelivery);
    const result = await notifier.notifyApartmentDisplacement(
      '9Z', '2027-03-01', '10:00', '11:30', 'Pista 1', '2B',
    );

    expect(result.success).toBe(true);
    expect(createNotif.execute).not.toHaveBeenCalled();
    expect(pushDelivery.sendToUser).not.toHaveBeenCalled();
  });
});

describe('SupabaseDisplacementNotifier — notifyApartmentBlockoutCancellation', () => {
  it('creates bulletin notification with blockout_cancellation type', async () => {
    const users = [makeApartmentUser('u1')];
    const userRepo = makeUserRepo(users);
    const createNotif = makeCreateNotification();
    const pushDelivery = makePushDelivery();

    const notifier = new SupabaseDisplacementNotifier(userRepo, createNotif, pushDelivery);
    await notifier.notifyApartmentBlockoutCancellation('1A', '2027-03-01', '10:00', '11:30', 'Pista 1');

    expect(createNotif.execute).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'blockout_cancellation', userId: 'u1' }),
    );
    expect(pushDelivery.sendToUser).toHaveBeenCalledWith(
      'u1',
      'Reserva cancelada por bloqueo',
      expect.stringContaining('administrador'),
      expect.any(Object),
    );
  });
});

// ============================================================
// SupabaseMatchNotifier
// ============================================================

describe('SupabaseMatchNotifier — notifyJoinRequest', () => {
  it('creates match_request notification and sends push to creator', async () => {
    const createNotif = makeCreateNotification();
    const pushDelivery = makePushDelivery();
    const scheduler = makeLocalScheduler();

    const notifier = new SupabaseMatchNotifier(createNotif, pushDelivery, scheduler);
    const result = await notifier.notifyJoinRequest('creator-1', 'Alice', 'match-1', false);

    expect(result.success).toBe(true);
    expect(createNotif.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'creator-1', type: 'match_request' }),
    );
    expect(pushDelivery.sendToUser).toHaveBeenCalledWith(
      'creator-1',
      'Nueva solicitud de partida',
      expect.stringContaining('Alice'),
      expect.any(Object),
    );
  });

  it('uses class_request type for class matches', async () => {
    const createNotif = makeCreateNotification();
    const pushDelivery = makePushDelivery();
    const notifier = new SupabaseMatchNotifier(createNotif, pushDelivery, makeLocalScheduler());

    await notifier.notifyJoinRequest('creator-1', 'Bob', 'match-1', true);

    expect(createNotif.execute).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'class_request' }),
    );
  });
});

describe('SupabaseMatchNotifier — notifyMatchFull', () => {
  it('notifies all players', async () => {
    const createNotif = makeCreateNotification();
    const pushDelivery = makePushDelivery();
    const notifier = new SupabaseMatchNotifier(createNotif, pushDelivery, makeLocalScheduler());

    await notifier.notifyMatchFull(['p1', 'p2', 'p3'], 'Alice', 'match-1', false);

    expect(createNotif.execute).toHaveBeenCalledTimes(3);
    expect(pushDelivery.sendToUser).toHaveBeenCalledTimes(3);
    expect(createNotif.execute).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'match_full' }),
    );
  });
});

describe('SupabaseMatchNotifier — notifyMatchCancelledByReservation', () => {
  it('sends displacement reason message', async () => {
    const createNotif = makeCreateNotification();
    const pushDelivery = makePushDelivery();
    const notifier = new SupabaseMatchNotifier(createNotif, pushDelivery, makeLocalScheduler());

    await notifier.notifyMatchCancelledByReservation(
      ['p1'],
      'Alice',
      '2027-03-01',
      '10:00',
      false,
      'reserva_desplazada',
    );

    expect(pushDelivery.sendToUser).toHaveBeenCalledWith(
      'p1',
      expect.stringContaining('cancelada'),
      expect.stringContaining('desplazada'),
      expect.any(Object),
    );
    expect(createNotif.execute).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'match_cancelled_by_reservation' }),
    );
  });
});

describe('SupabaseMatchNotifier — scheduleReminders', () => {
  it('delegates to localScheduler', async () => {
    const scheduler = makeLocalScheduler();
    const notifier = new SupabaseMatchNotifier(
      makeCreateNotification(),
      makePushDelivery(),
      scheduler,
    );

    const result = await notifier.scheduleReminders('user-1', {
      id: 'match-1',
      date: '2027-03-01',
      startTime: '10:00',
      courtName: 'Pista 1',
    });

    expect(result.success).toBe(true);
    expect(scheduler.scheduleMatchReminders).toHaveBeenCalledWith(
      'match-1', '2027-03-01', '10:00', 'Pista 1',
    );
  });
});
