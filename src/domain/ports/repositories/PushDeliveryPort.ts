import type { Result } from '@shared/types/Result';

export interface PushDeliveryPort {
  sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<Result<void>>;
}
