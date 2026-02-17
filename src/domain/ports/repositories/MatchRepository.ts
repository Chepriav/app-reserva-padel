import type { Result } from '@shared/types/Result';
import type { Match, CreateMatchData, UpdateMatchData } from '@domain/entities/Match';

export interface MatchRepository {
  findAll(): Promise<Result<Match[]>>;
  findByCreator(creatorId: string): Promise<Result<Match[]>>;
  findEnrolledByUser(userId: string): Promise<Result<Match[]>>;
  findByReservationId(reservationId: string): Promise<Result<Match | null>>;
  findById(id: string): Promise<Result<Match | null>>;
  create(data: CreateMatchData): Promise<Result<Match>>;
  update(id: string, data: UpdateMatchData): Promise<Result<Match>>;
  cancel(id: string): Promise<Result<void>>;
  close(id: string): Promise<Result<void>>;
  delete(id: string): Promise<Result<void>>;
  cancelByReservationId(reservationId: string): Promise<Result<{ matchId: string; match: Match } | null>>;
  findReservationIdsByCreator(creatorId: string): Promise<Result<string[]>>;
}
