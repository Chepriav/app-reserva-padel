import type { User } from '@domain/entities/User';
import type { AuthProvider } from '@domain/ports/repositories/AuthProvider';
import type { UserRepository } from '@domain/ports/repositories/UserRepository';
import type { Result } from '@shared/types/Result';
import { ok } from '@shared/types/Result';

export class GetCurrentUser {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(): Promise<Result<User | null>> {
    const sessionResult = await this.authProvider.getSession();
    if (!sessionResult.success) return sessionResult;
    if (!sessionResult.value) return ok(null);

    return this.userRepository.findById(sessionResult.value.userId);
  }
}
