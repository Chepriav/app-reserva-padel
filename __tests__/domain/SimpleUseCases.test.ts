/**
 * Tests for simple delegate use cases (1-liner execute() methods).
 * Verifies each use case delegates correctly to its port/repository.
 */
import { LogoutUser } from '../../src/domain/useCases/LogoutUser';
import { UpdateProfile } from '../../src/domain/useCases/UpdateProfile';
import { GetUserReservations } from '../../src/domain/useCases/GetUserReservations';
import { GetAllAnnouncements } from '../../src/domain/useCases/GetAllAnnouncements';
import { DeleteAnnouncement } from '../../src/domain/useCases/DeleteAnnouncement';
import { MarkAnnouncementAsRead } from '../../src/domain/useCases/MarkAnnouncementAsRead';
import type { AuthProvider } from '../../src/domain/ports/repositories/AuthProvider';
import type { UserRepository } from '../../src/domain/ports/repositories/UserRepository';
import type { ReservationRepository } from '../../src/domain/ports/repositories/ReservationRepository';
import type { AnnouncementRepository } from '../../src/domain/ports/repositories/AnnouncementRepository';
import type { User } from '../../src/domain/entities/User';
import type { Announcement } from '../../src/domain/entities/Announcement';
import { ok } from '../../src/shared/types/Result';

// ─── Shared mock factories ───────────────────────────────────────────────────

const mockAuthProvider: jest.Mocked<Pick<AuthProvider, 'signOut'>> = {
  signOut: jest.fn(),
};

const mockUserRepository: jest.Mocked<Pick<UserRepository, 'updateProfile'>> = {
  updateProfile: jest.fn(),
};

const mockReservationRepository: jest.Mocked<Pick<ReservationRepository, 'findByUserId'>> = {
  findByUserId: jest.fn(),
};

const mockAnnouncementRepository: jest.Mocked<
  Pick<AnnouncementRepository, 'findAll' | 'delete' | 'markAsRead'>
> = {
  findAll: jest.fn(),
  delete: jest.fn(),
  markAsRead: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ─── LogoutUser ──────────────────────────────────────────────────────────────

describe('LogoutUser', () => {
  it('delegates to authProvider.signOut and returns its result', async () => {
    mockAuthProvider.signOut.mockResolvedValue(ok(undefined));

    const useCase = new LogoutUser(mockAuthProvider as unknown as AuthProvider);
    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(mockAuthProvider.signOut).toHaveBeenCalledTimes(1);
  });
});

// ─── UpdateProfile ───────────────────────────────────────────────────────────

describe('UpdateProfile', () => {
  const updatedUser: User = {
    id: 'user-1',
    name: 'Updated Name',
    email: 'user@example.com',
    phone: '612345678',
    apartment: '1-3-B',
    requestedApartment: null,
    skillLevel: 'intermediate',
    profilePhoto: null,
    isAdmin: false,
    isManager: false,
    isDemo: false,
    approvalStatus: 'approved',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  };

  it('delegates to userRepository.updateProfile with userId and updates', async () => {
    mockUserRepository.updateProfile.mockResolvedValue(ok(updatedUser));

    const useCase = new UpdateProfile(mockUserRepository as unknown as UserRepository);
    const updates = { name: 'Updated Name', phone: '612345678' };
    const result = await useCase.execute('user-1', updates);

    expect(result.success).toBe(true);
    if (result.success) expect(result.value.name).toBe('Updated Name');
    expect(mockUserRepository.updateProfile).toHaveBeenCalledWith('user-1', updates);
  });
});

// ─── GetUserReservations ─────────────────────────────────────────────────────

describe('GetUserReservations', () => {
  it('delegates to reservationRepository.findByUserId', async () => {
    mockReservationRepository.findByUserId.mockResolvedValue(ok([]));

    const useCase = new GetUserReservations(
      mockReservationRepository as unknown as ReservationRepository,
    );
    const result = await useCase.execute('user-1');

    expect(result.success).toBe(true);
    if (result.success) expect(result.value).toEqual([]);
    expect(mockReservationRepository.findByUserId).toHaveBeenCalledWith('user-1');
  });
});

// ─── GetAllAnnouncements ─────────────────────────────────────────────────────

describe('GetAllAnnouncements', () => {
  const announcements: Announcement[] = [
    {
      id: 'a-1',
      title: 'Mantenimiento',
      message: 'Piscina cerrada el lunes',
      type: 'maintenance',
      creatorId: 'admin-1',
      creatorName: 'Admin',
      recipients: 'all',
      expiresAt: '2026-01-01T00:00:00Z',
      isRead: false,
      createdAt: '2025-01-01T00:00:00Z',
    },
  ];

  it('delegates to repository.findAll and returns announcements', async () => {
    mockAnnouncementRepository.findAll.mockResolvedValue(ok(announcements));

    const useCase = new GetAllAnnouncements(
      mockAnnouncementRepository as unknown as AnnouncementRepository,
    );
    const result = await useCase.execute();

    expect(result.success).toBe(true);
    if (result.success) expect(result.value).toHaveLength(1);
    expect(mockAnnouncementRepository.findAll).toHaveBeenCalledTimes(1);
  });
});

// ─── DeleteAnnouncement ──────────────────────────────────────────────────────

describe('DeleteAnnouncement', () => {
  it('delegates to repository.delete with the announcementId', async () => {
    mockAnnouncementRepository.delete.mockResolvedValue(ok(undefined));

    const useCase = new DeleteAnnouncement(
      mockAnnouncementRepository as unknown as AnnouncementRepository,
    );
    const result = await useCase.execute('a-1');

    expect(result.success).toBe(true);
    expect(mockAnnouncementRepository.delete).toHaveBeenCalledWith('a-1');
  });
});

// ─── MarkAnnouncementAsRead ──────────────────────────────────────────────────

describe('MarkAnnouncementAsRead', () => {
  it('delegates to repository.markAsRead with announcementId and userId', async () => {
    mockAnnouncementRepository.markAsRead.mockResolvedValue(ok(undefined));

    const useCase = new MarkAnnouncementAsRead(
      mockAnnouncementRepository as unknown as AnnouncementRepository,
    );
    const result = await useCase.execute('a-1', 'user-1');

    expect(result.success).toBe(true);
    expect(mockAnnouncementRepository.markAsRead).toHaveBeenCalledWith('a-1', 'user-1');
  });
});
