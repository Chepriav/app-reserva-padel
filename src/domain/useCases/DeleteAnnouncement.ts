import type { Result } from '@shared/types/Result';
import type { AnnouncementRepository } from '@domain/ports/repositories/AnnouncementRepository';

export class DeleteAnnouncement {
  constructor(private readonly repository: AnnouncementRepository) {}

  execute(announcementId: string): Promise<Result<void>> {
    return this.repository.delete(announcementId);
  }
}
