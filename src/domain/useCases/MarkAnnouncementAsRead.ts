import type { Result } from '@shared/types/Result';
import type { AnnouncementRepository } from '@domain/ports/repositories/AnnouncementRepository';

export class MarkAnnouncementAsRead {
  constructor(private readonly repository: AnnouncementRepository) {}

  execute(announcementId: string, userId: string): Promise<Result<void>> {
    return this.repository.markAsRead(announcementId, userId);
  }
}
