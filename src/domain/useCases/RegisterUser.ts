import type { RegisterData } from '@domain/entities/User';
import type { AuthProvider } from '@domain/ports/repositories/AuthProvider';
import type { UserRepository } from '@domain/ports/repositories/UserRepository';
import type { Result } from '@shared/types/Result';
import { ok } from '@shared/types/Result';

export class RegisterUser {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(data: RegisterData): Promise<Result<{ id: string }>> {
    const authResult = await this.authProvider.signUp(data.email, data.password);
    if (!authResult.success) return authResult;

    const createResult = await this.userRepository.create(authResult.value.userId, data);
    if (!createResult.success) return createResult;

    // Sign out so user waits for admin approval
    await this.authProvider.signOut();

    return ok({ id: authResult.value.userId });
  }
}
