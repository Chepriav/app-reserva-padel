import type { User } from '@domain/entities/User';
import type { UserAdminRepository } from '@domain/ports/repositories/UserAdminRepository';
import type { Result } from '@shared/types/Result';

export class GetPendingUsers {
  constructor(private readonly repository: UserAdminRepository) {}

  execute(): Promise<Result<User[]>> {
    return this.repository.findPendingUsers();
  }
}
