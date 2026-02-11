import type { UserRepository } from '@domain/ports/repositories/UserRepository';
import type { AuthProvider } from '@domain/ports/repositories/AuthProvider';
import type { Result } from '@shared/types/Result';
import { ok } from '@shared/types/Result';

export class DeleteOwnAccount {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authProvider: AuthProvider,
  ) {}

  async execute(userId: string): Promise<Result<void>> {
    const deleteResult = await this.userRepository.deleteWithRelations(userId);
    if (!deleteResult.success) return deleteResult;

    await this.authProvider.signOut();
    return ok(undefined);
  }
}
