import type { Result } from '@shared/types/Result';
import type { DisplacementNotification } from '@domain/entities/DisplacementNotification';

export interface DisplacementNotificationRepository {
  findUnreadByUser(userId: string): Promise<Result<DisplacementNotification[]>>;
  create(userId: string, notification: Omit<DisplacementNotification, 'id' | 'createdAt'>): Promise<Result<DisplacementNotification>>;
  markAllAsRead(userId: string): Promise<Result<void>>;
}
