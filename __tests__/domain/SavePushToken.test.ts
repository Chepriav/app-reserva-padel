import { SavePushToken } from '@domain/useCases/SavePushToken';
import { RemovePushToken } from '@domain/useCases/RemovePushToken';
import type { PushTokenRepository } from '@domain/ports/repositories/PushTokenRepository';
import { ok, fail } from '@shared/types/Result';
import { InfrastructureError } from '@domain/errors/DomainErrors';

const makeRepo = (overrides: Partial<PushTokenRepository> = {}): PushTokenRepository => ({
  save: jest.fn().mockResolvedValue(ok(undefined)),
  remove: jest.fn().mockResolvedValue(ok(undefined)),
  findByUser: jest.fn().mockResolvedValue(ok([])),
  ...overrides,
});

describe('SavePushToken', () => {
  it('delegates to repository.save', async () => {
    const repo = makeRepo();
    const useCase = new SavePushToken(repo);

    const result = await useCase.execute('user-1', 'expo-token-abc', 'ios');

    expect(result.success).toBe(true);
    expect(repo.save).toHaveBeenCalledWith('user-1', 'expo-token-abc', 'ios');
  });

  it('returns error when repository fails', async () => {
    const repo = makeRepo({
      save: jest.fn().mockResolvedValue(fail(new InfrastructureError('DB error'))),
    });
    const useCase = new SavePushToken(repo);

    const result = await useCase.execute('user-1', 'token', 'android');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INFRASTRUCTURE_ERROR');
    }
  });
});

describe('RemovePushToken', () => {
  it('delegates to repository.remove', async () => {
    const repo = makeRepo();
    const useCase = new RemovePushToken(repo);

    const result = await useCase.execute('user-1', 'expo-token-abc');

    expect(result.success).toBe(true);
    expect(repo.remove).toHaveBeenCalledWith('user-1', 'expo-token-abc');
  });

  it('returns error when repository fails', async () => {
    const repo = makeRepo({
      remove: jest.fn().mockResolvedValue(fail(new InfrastructureError('DB error'))),
    });
    const useCase = new RemovePushToken(repo);

    const result = await useCase.execute('user-1', 'token');

    expect(result.success).toBe(false);
  });
});
