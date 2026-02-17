import type { Result } from '@shared/types/Result';
import type { AnnouncementRepository } from '@domain/ports/repositories/AnnouncementRepository';
import type { Announcement } from '@domain/entities/Announcement';

export class GetAnnouncementsForUser {
  constructor(private readonly repository: AnnouncementRepository) {}

  execute(userId: string): Promise<Result<Announcement[]>> {
    return this.repository.findForUser(userId);
  }
}
