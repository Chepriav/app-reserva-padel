import type { Result } from '@shared/types/Result';
import type { UserNotificationRepository } from '@domain/ports/repositories/UserNotificationRepository';

export class MarkNotificationAsRead {
  constructor(private readonly repository: UserNotificationRepository) {}

  execute(notificationId: string): Promise<Result<void>> {
    return this.repository.markAsRead(notificationId);
  }
}
