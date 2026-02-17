import type { Result } from '@shared/types/Result';
import type { UserNotificationRepository } from '@domain/ports/repositories/UserNotificationRepository';

export class MarkAllNotificationsAsRead {
  constructor(private readonly repository: UserNotificationRepository) {}

  execute(userId: string): Promise<Result<void>> {
    return this.repository.markAllAsRead(userId);
  }
}
