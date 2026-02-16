import type { Result } from '@shared/types/Result';
import type { DisplacementNotificationRepository } from '@domain/ports/repositories/DisplacementNotificationRepository';
import type { DisplacementNotification } from '@domain/entities/DisplacementNotification';

export class GetPendingDisplacementNotifications {
  constructor(
    private readonly notificationRepository: DisplacementNotificationRepository,
  ) {}

  execute(userId: string): Promise<Result<DisplacementNotification[]>> {
    return this.notificationRepository.findUnreadByUser(userId);
  }
}
