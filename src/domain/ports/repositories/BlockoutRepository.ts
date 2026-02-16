import type { Result } from '@shared/types/Result';
import type { Blockout, CreateBlockoutData } from '@domain/entities/Blockout';

export interface BlockoutRepository {
  findByDateAndCourt(date: string, courtId: string): Promise<Result<Blockout[]>>;
  create(data: CreateBlockoutData): Promise<Result<Blockout>>;
  delete(id: string): Promise<Result<void>>;
}
