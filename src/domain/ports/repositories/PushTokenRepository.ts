import type { Result } from '@shared/types/Result';

export interface PushTokenRepository {
  save(userId: string, token: string, platform: string): Promise<Result<void>>;
  remove(userId: string, token: string): Promise<Result<void>>;
  findByUser(userId: string): Promise<Result<string[]>>;
}
