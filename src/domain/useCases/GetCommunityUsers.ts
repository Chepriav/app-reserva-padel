import type { PublicUserProfile } from '@domain/entities/User';
import type { UserRepository } from '@domain/ports/repositories/UserRepository';
import type { Result } from '@shared/types/Result';

/** Approved residents with public fields only (for adding players to a match). */
export class GetCommunityUsers {
  constructor(private readonly repository: UserRepository) {}

  execute(): Promise<Result<PublicUserProfile[]>> {
    return this.repository.findPublicProfiles();
  }
}
