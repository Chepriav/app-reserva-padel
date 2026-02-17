import type { Result } from '@shared/types/Result';
import type { UserNotificationRepository } from '@domain/ports/repositories/UserNotificationRepository';
import type { UserNotification } from '@domain/entities/UserNotification';

export class GetUserNotifications {
  constructor(private readonly repository: UserNotificationRepository) {}

  execute(userId: string): Promise<Result<UserNotification[]>> {
    return this.repository.findByUser(userId);
  }
}
