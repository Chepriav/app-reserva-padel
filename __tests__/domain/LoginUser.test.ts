import { LoginUser } from '../../src/domain/useCases/LoginUser';
import type { AuthProvider } from '../../src/domain/ports/repositories/AuthProvider';
import type { UserRepository } from '../../src/domain/ports/repositories/UserRepository';
import type { User } from '../../src/domain/entities/User';
import { ok, fail } from '../../src/shared/types/Result';
import { AuthenticationError, UserNotFoundError, UserNotApprovedError } from '../../src/domain/errors/DomainErrors';

const approvedUser: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  phone: '123456789',
  apartment: '1-3-B',
  requestedApartment: null,
  skillLevel: 'intermediate',
  profilePhoto: null,
  isAdmin: false,
  isManager: false,
  isDemo: false,
  approvalStatus: 'approved',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockAuthProvider: AuthProvider = {
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn().mockResolvedValue(ok(undefined)),
  clearLocalSession: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
  getSession: jest.fn(),
  exchangeCodeForSession: jest.fn(),
  setSession: jest.fn(),
};

const mockUserRepository: UserRepository = {
  findById: jest.fn(),
  findByApartment: jest.fn(),
  create: jest.fn(),
  updateProfile: jest.fn(),
  deleteWithRelations: jest.fn(),
};

describe('LoginUser', () => {
  const useCase = new LoginUser(mockAuthProvider, mockUserRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    (mockAuthProvider.signOut as jest.Mock).mockResolvedValue(ok(undefined));
  });

  it('returns user on successful login with approved status', async () => {
    (mockAuthProvider.signIn as jest.Mock).mockResolvedValue(ok({ userId: 'user-1' }));
    (mockUserRepository.findById as jest.Mock).mockResolvedValue(ok(approvedUser));

    const result = await useCase.execute('test@example.com', 'password');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe('user-1');
      expect(result.value.name).toBe('Test User');
    }
    expect(mockAuthProvider.signOut).not.toHaveBeenCalled();
  });

  it('returns error on invalid credentials', async () => {
    (mockAuthProvider.signIn as jest.Mock).mockResolvedValue(
      fail(new AuthenticationError('Invalid login credentials')),
    );

    const result = await useCase.execute('test@example.com', 'wrong');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('AUTHENTICATION_ERROR');
    }
  });

  it('signs out and returns error when user not found', async () => {
    (mockAuthProvider.signIn as jest.Mock).mockResolvedValue(ok({ userId: 'user-1' }));
    (mockUserRepository.findById as jest.Mock).mockResolvedValue(ok(null));

    const result = await useCase.execute('test@example.com', 'password');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('USER_NOT_FOUND');
    }
    expect(mockAuthProvider.signOut).toHaveBeenCalled();
  });

  it('signs out and returns error when user is pending approval', async () => {
    const pendingUser: User = { ...approvedUser, approvalStatus: 'pending' };
    (mockAuthProvider.signIn as jest.Mock).mockResolvedValue(ok({ userId: 'user-1' }));
    (mockUserRepository.findById as jest.Mock).mockResolvedValue(ok(pendingUser));

    const result = await useCase.execute('test@example.com', 'password');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('USER_NOT_APPROVED');
      expect(result.error.message).toContain('pending');
    }
    expect(mockAuthProvider.signOut).toHaveBeenCalled();
  });

  it('signs out and returns error when user is rejected', async () => {
    const rejectedUser: User = { ...approvedUser, approvalStatus: 'rejected' };
    (mockAuthProvider.signIn as jest.Mock).mockResolvedValue(ok({ userId: 'user-1' }));
    (mockUserRepository.findById as jest.Mock).mockResolvedValue(ok(rejectedUser));

    const result = await useCase.execute('test@example.com', 'password');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('USER_NOT_APPROVED');
      expect(result.error.message).toContain('rejected');
    }
    expect(mockAuthProvider.signOut).toHaveBeenCalled();
  });
});
