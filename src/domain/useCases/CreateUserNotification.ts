import type { Result } from '@shared/types/Result';
import type { UserNotificationRepository } from '@domain/ports/repositories/UserNotificationRepository';
import type { UserNotification, CreateUserNotificationData } from '@domain/entities/UserNotification';

export class CreateUserNotification {
  constructor(private readonly repository: UserNotificationRepository) {}

  execute(data: CreateUserNotificationData): Promise<Result<UserNotification>> {
    return this.repository.create(data);
  }
}
