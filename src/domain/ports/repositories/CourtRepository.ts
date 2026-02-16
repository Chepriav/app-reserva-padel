import type { Result } from '@shared/types/Result';
import type { Court } from '@domain/entities/Court';

export interface CourtRepository {
  findAll(): Promise<Result<Court[]>>;
  findById(id: string): Promise<Result<Court | null>>;
}
