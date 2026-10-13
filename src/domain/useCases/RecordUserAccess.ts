import type { UserRepository } from '@domain/ports/repositories/UserRepository';
import type { Result } from '@shared/types/Result';

/** Records that the signed-in user opened the app (for Admin → last access). */
export class RecordUserAccess {
  constructor(private readonly repository: UserRepository) {}

  execute(): Promise<Result<void>> {
    return this.repository.recordAccess();
  }
}
