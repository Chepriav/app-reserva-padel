import type { UserAdminRepository } from '@domain/ports/repositories/UserAdminRepository';
import type { Result } from '@shared/types/Result';

export class DeleteUser {
  constructor(private readonly repository: UserAdminRepository) {}

  execute(userId: string): Promise<Result<void>> {
    return this.repository.deleteUserWithRelations(userId);
  }
}
