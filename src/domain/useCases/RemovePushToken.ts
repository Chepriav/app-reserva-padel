import type { Result } from '@shared/types/Result';
import type { PushTokenRepository } from '@domain/ports/repositories/PushTokenRepository';

export class RemovePushToken {
  constructor(private readonly repository: PushTokenRepository) {}

  execute(userId: string, token: string): Promise<Result<void>> {
    return this.repository.remove(userId, token);
  }
}
