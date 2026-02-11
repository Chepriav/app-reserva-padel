import type { User } from '@domain/entities/User';
import type { UserAdminRepository } from '@domain/ports/repositories/UserAdminRepository';
import type { Result } from '@shared/types/Result';

export class ToggleAdminRole {
  constructor(private readonly repository: UserAdminRepository) {}

  execute(userId: string, isAdmin: boolean): Promise<Result<User>> {
    return this.repository.toggleAdminRole(userId, isAdmin);
  }
}
