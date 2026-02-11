import { RegisterUser } from '../../src/domain/useCases/RegisterUser';
import type { AuthProvider } from '../../src/domain/ports/repositories/AuthProvider';
import type { UserRepository } from '../../src/domain/ports/repositories/UserRepository';
import type { RegisterData } from '../../src/domain/entities/User';
import { ok, fail } from '../../src/shared/types/Result';
import { AuthenticationError, InfrastructureError } from '../../src/domain/errors/DomainErrors';

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

describe('RegisterUser', () => {
  const useCase = new RegisterUser(mockAuthProvider, mockUserRepository);

  const validData: RegisterData = {
    name: 'New User',
    email: 'new@example.com',
    password: 'password123',
    phone: '123456789',
    apartment: '2-1-A',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockAuthProvider.signOut as jest.Mock).mockResolvedValue(ok(undefined));
  });

  it('creates auth user, profile, and signs out', async () => {
    (mockAuthProvider.signUp as jest.Mock).mockResolvedValue(ok({ userId: 'new-id' }));
    (mockUserRepository.create as jest.Mock).mockResolvedValue(ok(undefined));

    const result = await useCase.execute(validData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe('new-id');
    }
    expect(mockAuthProvider.signUp).toHaveBeenCalledWith('new@example.com', 'password123');
    expect(mockUserRepository.create).toHaveBeenCalledWith('new-id', validData);
    expect(mockAuthProvider.signOut).toHaveBeenCalled();
  });

  it('returns error when auth signup fails', async () => {
    (mockAuthProvider.signUp as jest.Mock).mockResolvedValue(
      fail(new AuthenticationError('User already registered')),
    );

    const result = await useCase.execute(validData);

    expect(result.success).toBe(false);
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });

  it('returns error when profile creation fails', async () => {
    (mockAuthProvider.signUp as jest.Mock).mockResolvedValue(ok({ userId: 'new-id' }));
    (mockUserRepository.create as jest.Mock).mockResolvedValue(
      fail(new InfrastructureError('Insert failed')),
    );

    const result = await useCase.execute(validData);

    expect(result.success).toBe(false);
  });
});
