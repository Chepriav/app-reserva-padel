import type { Result } from '@shared/types/Result';
import type { BlockoutRepository } from '@domain/ports/repositories/BlockoutRepository';

export class DeleteBlockout {
  constructor(private readonly blockoutRepository: BlockoutRepository) {}

  execute(id: string): Promise<Result<void>> {
    return this.blockoutRepository.delete(id);
  }
}
