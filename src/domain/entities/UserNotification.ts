export type NotificationType =
  | 'displacement'
  | 'blockout_cancellation'
  | 'match_request'
  | 'class_request'
  | 'match_accepted'
  | 'class_accepted'
  | 'match_full'
  | 'match_cancelled'
  | 'class_cancelled'
  | 'match_cancelled_by_reservation'
  | 'class_cancelled_by_reservation';

export interface UserNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface CreateUserNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}
