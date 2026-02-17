import type { Result } from '@shared/types/Result';
import type { Announcement, CreateAnnouncementData } from '@domain/entities/Announcement';

export interface AnnouncementRepository {
  findForUser(userId: string): Promise<Result<Announcement[]>>;
  findAll(): Promise<Result<Announcement[]>>;
  create(data: CreateAnnouncementData): Promise<Result<{ announcement: Announcement; recipientIds: string[] }>>;
  markAsRead(announcementId: string, userId: string): Promise<Result<void>>;
  delete(announcementId: string): Promise<Result<void>>;
}
