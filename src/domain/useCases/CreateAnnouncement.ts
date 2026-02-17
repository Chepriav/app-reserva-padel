import type { Result } from '@shared/types/Result';
import type { AnnouncementRepository } from '@domain/ports/repositories/AnnouncementRepository';
import type { Announcement, CreateAnnouncementData } from '@domain/entities/Announcement';

export class CreateAnnouncement {
  constructor(private readonly repository: AnnouncementRepository) {}

  execute(
    data: CreateAnnouncementData,
  ): Promise<Result<{ announcement: Announcement; recipientIds: string[] }>> {
    return this.repository.create(data);
  }
}
