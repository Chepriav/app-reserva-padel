import type { Result } from '@shared/types/Result';
import type { DisplacementNotificationRepository } from '@domain/ports/repositories/DisplacementNotificationRepository';

export class MarkDisplacementNotificationsRead {
  constructor(
    private readonly notificationRepository: DisplacementNotificationRepository,
  ) {}

  execute(userId: string): Promise<Result<void>> {
    return this.notificationRepository.markAllAsRead(userId);
  }
}
