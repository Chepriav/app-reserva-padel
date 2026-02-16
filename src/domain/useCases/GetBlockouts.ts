import type { Result } from '@shared/types/Result';
import type { BlockoutRepository } from '@domain/ports/repositories/BlockoutRepository';
import type { Blockout } from '@domain/entities/Blockout';

export class GetBlockouts {
  constructor(private readonly blockoutRepository: BlockoutRepository) {}

  execute(date: string, courtId: string): Promise<Result<Blockout[]>> {
    return this.blockoutRepository.findByDateAndCourt(date, courtId);
  }
}
