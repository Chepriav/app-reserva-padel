import type { Result } from '@shared/types/Result';
import type { PushTokenRepository } from '@domain/ports/repositories/PushTokenRepository';

export class SavePushToken {
  constructor(private readonly repository: PushTokenRepository) {}

  execute(userId: string, token: string, platform: string): Promise<Result<void>> {
    return this.repository.save(userId, token, platform);
  }
}
