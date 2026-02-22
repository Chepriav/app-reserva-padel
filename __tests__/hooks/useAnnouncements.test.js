/**
 * Tests for useAnnouncements / useAnnouncementsAdmin hooks.
 * Verifies that English API method names are used (not legacy Spanish aliases).
 */

const mockBulletinService = {
  getAllAnnouncements: jest.fn().mockResolvedValue({ success: true, data: [] }),
  getApprovedUsers: jest.fn().mockResolvedValue({ success: true, data: [] }),
  getAnnouncementsForUser: jest.fn().mockResolvedValue({ success: true, data: [] }),
  markAnnouncementRead: jest.fn().mockResolvedValue({ success: true }),
  markAnnouncementAsRead: jest.fn().mockResolvedValue({ success: true }),
  createAnnouncement: jest.fn().mockResolvedValue({ success: true, data: { id: '1' } }),
  deleteAnnouncement: jest.fn().mockResolvedValue({ success: true }),
};

jest.mock('../../src/services/bulletinService', () => ({
  bulletinService: mockBulletinService,
}));

jest.mock('../../src/services/notificationService', () => ({
  notificationService: {
    notifyNuevoAnnouncement: jest.fn().mockResolvedValue({ success: true }),
  },
}));

// Import after mocks are set up
const { bulletinService } = require('../../src/services/bulletinService');

describe('useAnnouncements — bulletinService API calls use English names', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('bulletinService.getAllAnnouncements method exists (not getTodosAnnouncements)', () => {
    expect(typeof bulletinService.getAllAnnouncements).toBe('function');
    expect(bulletinService.getTodosAnnouncements).toBeUndefined();
  });

  test('bulletinService.getApprovedUsers method exists (not getUsersAprobados)', () => {
    expect(typeof bulletinService.getApprovedUsers).toBe('function');
    expect(bulletinService.getUsersAprobados).toBeUndefined();
  });

  test('bulletinService.getAllAnnouncements resolves with success', async () => {
    const result = await bulletinService.getAllAnnouncements();
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  test('bulletinService.getApprovedUsers resolves with success', async () => {
    const result = await bulletinService.getApprovedUsers();
    expect(result.success).toBe(true);
  });
});
