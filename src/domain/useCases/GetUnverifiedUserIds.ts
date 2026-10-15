import type { UserAdminRepository } from '@domain/ports/repositories/UserAdminRepository';
import type { Result } from '@shared/types/Result';

/** Admin: ids of users who haven't verified their email yet. */
export class GetUnverifiedUserIds {
  constructor(private readonly repository: UserAdminRepository) {}

  execute(): Promise<Result<string[]>> {
    return this.repository.findUnverifiedUserIds();
  }
}
