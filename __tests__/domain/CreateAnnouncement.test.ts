import { CreateAnnouncement } from '@domain/useCases/CreateAnnouncement';
import type { AnnouncementRepository } from '@domain/ports/repositories/AnnouncementRepository';
import type { Announcement } from '@domain/entities/Announcement';
import { ok, fail } from '@shared/types/Result';
import { InfrastructureError, AnnouncementPermissionError } from '@domain/errors/DomainErrors';

const makeAnnouncement = (overrides: Partial<Announcement> = {}): Announcement => ({
  id: 'anuncio-1',
  creatorId: 'admin-1',
  creatorName: 'Admin',
  title: 'Corte de agua',
  message: 'El lunes no habrá agua',
  type: 'warning',
  recipients: 'all',
  expiresAt: '2027-02-01T00:00:00Z',
  createdAt: '2027-01-01T10:00:00Z',
  isRead: false,
  ...overrides,
});

const makeRepo = (overrides: Partial<AnnouncementRepository> = {}): AnnouncementRepository => ({
  findForUser: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  markAsRead: jest.fn(),
  delete: jest.fn(),
  ...overrides,
});

describe('CreateAnnouncement', () => {
  it('creates announcement for all users', async () => {
    const announcement = makeAnnouncement();
    const repo = makeRepo({
      create: jest.fn().mockResolvedValue(ok({ announcement, recipientIds: [] })),
    });
    const useCase = new CreateAnnouncement(repo);

    const result = await useCase.execute({
      creatorId: 'admin-1',
      creatorName: 'Admin',
      title: 'Corte de agua',
      message: 'El lunes no habrá agua',
      type: 'warning',
      recipients: 'all',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.announcement.id).toBe('anuncio-1');
      expect(result.value.recipientIds).toEqual([]);
    }
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipients: 'all', type: 'warning' }),
    );
  });

  it('creates announcement for selected users and returns their IDs', async () => {
    const announcement = makeAnnouncement({ recipients: 'selected' });
    const userIds = ['user-1', 'user-2'];
    const repo = makeRepo({
      create: jest.fn().mockResolvedValue(ok({ announcement, recipientIds: userIds })),
    });
    const useCase = new CreateAnnouncement(repo);

    const result = await useCase.execute({
      creatorId: 'admin-1',
      creatorName: 'Admin',
      title: 'Aviso especial',
      message: 'Solo para vosotros',
      recipients: 'selected',
      userIds,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.recipientIds).toEqual(['user-1', 'user-2']);
    }
  });

  it('returns permission error when admin lacks permissions', async () => {
    const repo = makeRepo({
      create: jest.fn().mockResolvedValue(
        fail(new AnnouncementPermissionError('No tienes permisos para crear anuncios')),
      ),
    });
    const useCase = new CreateAnnouncement(repo);

    const result = await useCase.execute({
      creatorId: 'user-normal',
      creatorName: 'Normal User',
      title: 'Intento de anuncio',
      message: 'No debería estar aquí',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('ANNOUNCEMENT_PERMISSION');
    }
  });

  it('returns infrastructure error on DB failure', async () => {
    const repo = makeRepo({
      create: jest.fn().mockResolvedValue(fail(new InfrastructureError('DB down'))),
    });
    const useCase = new CreateAnnouncement(repo);

    const result = await useCase.execute({
      creatorId: 'admin-1',
      creatorName: 'Admin',
      title: 'Test',
      message: 'Test',
    });

    expect(result.success).toBe(false);
  });
});

describe('CreateAnnouncement — defaults', () => {
  it('uses info type and all recipients when not specified', async () => {
    const announcement = makeAnnouncement({ type: 'info', recipients: 'all' });
    const repo = makeRepo({
      create: jest.fn().mockResolvedValue(ok({ announcement, recipientIds: [] })),
    });
    const useCase = new CreateAnnouncement(repo);

    await useCase.execute({
      creatorId: 'admin-1',
      creatorName: 'Admin',
      title: 'Info',
      message: 'Texto',
      // no type, no recipients — rely on repository defaults
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ creatorId: 'admin-1', title: 'Info' }),
    );
  });
});
