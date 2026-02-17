import type { Result } from '@shared/types/Result';
import type { UserNotification, CreateUserNotificationData } from '@domain/entities/UserNotification';

export interface UserNotificationRepository {
  findByUser(userId: string): Promise<Result<UserNotification[]>>;
  create(data: CreateUserNotificationData): Promise<Result<UserNotification>>;
  markAsRead(notificationId: string): Promise<Result<void>>;
  markAllAsRead(userId: string): Promise<Result<void>>;
  delete(notificationId: string): Promise<Result<void>>;
}
